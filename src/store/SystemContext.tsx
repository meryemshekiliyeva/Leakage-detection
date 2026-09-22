// ---------------------------------------------------------------------------
// SystemContext — the single source of truth + the real-time simulation loop.
//
// This is where the (mock) live data stream lives. It ticks on the sampling
// interval, produces a new reading via the simulation engine, runs the AI
// analysis, raises alerts on real state transitions, and tracks leak events.
//
// Every page/component reads from this context. To connect real hardware you
// replace the tick's data source with a WebSocket/MQTT subscription — the
// context shape and every consumer stay exactly the same.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AIAnalysis,
  Alert,
  DataSource,
  LeakEvent,
  Scenario,
  SensorData,
  SystemSettings,
  SystemStatus,
} from '@/types';
import {
  BASELINE_LEVEL,
  DEFAULT_SETTINGS,
  makeReading,
  seedAlerts,
  seedHistory,
  seedLeakEvents,
} from '@/data/mockData';
import { analyze, nextReading } from '@/services/simulationService';
import { evaluateAlert } from '@/services/alertService';
import { deriveSystemStatus } from '@/services/systemService';

const MAX_HISTORY = 150;

interface SystemContextValue {
  // Live data
  currentReading: SensorData;
  history: SensorData[];
  aiAnalysis: AIAnalysis;
  systemStatus: SystemStatus;
  alerts: Alert[];
  leakEvents: LeakEvent[];
  settings: SystemSettings;
  // Mode
  dataSource: DataSource;
  demoMode: boolean;
  scenario: Scenario;
  paused: boolean;
  // Actions
  setDemoMode: (on: boolean) => void;
  setScenario: (s: Scenario) => void;
  setPaused: (p: boolean) => void;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  resolveAlert: (id: string) => void;
  resolveAllAlerts: () => void;
}

interface State {
  currentReading: SensorData;
  history: SensorData[];
  aiAnalysis: AIAnalysis;
  systemStatus: SystemStatus;
  alerts: Alert[];
  leakEvents: LeakEvent[];
  settings: SystemSettings;
  demoMode: boolean;
  scenario: Scenario;
  paused: boolean;
}

const SystemContext = createContext<SystemContextValue | null>(null);

function buildInitialState(): State {
  const settings = DEFAULT_SETTINGS;
  const history = seedHistory(60, settings.samplingInterval, settings.tankHeight);
  const currentReading =
    history[history.length - 1] ??
    makeReading({ waterLevel: BASELINE_LEVEL }, settings.tankHeight);
  const aiAnalysis = analyze(history, settings);
  const systemStatus: SystemStatus = {
    system: 'OPERATIONAL',
    arduino: 'CONNECTED',
    raspberryPi: 'CONNECTED',
    wifi: 'CONNECTED',
    lastUpdated: currentReading.timestamp,
  };
  return {
    currentReading,
    history,
    aiAnalysis,
    systemStatus,
    alerts: seedAlerts(),
    leakEvents: seedLeakEvents(),
    settings,
    demoMode: false,
    scenario: 'NORMAL',
    paused: false,
  };
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(buildInitialState);

  // Mirror of state for the interval callback to read the latest values
  // without re-creating the interval on every tick.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const tickRef = useRef(0);
  const spontaneousRef = useRef(0); // remaining spontaneous-anomaly ticks (live mode)

  const tick = useCallback(() => {
    const prev = stateRef.current;
    if (prev.paused) return;

    const { settings, demoMode, scenario } = prev;

    // Determine the scenario actually driving this tick.
    let effective: Scenario = scenario;
    if (!demoMode) {
      if (spontaneousRef.current > 0) {
        effective = 'ANOMALY';
        spontaneousRef.current -= 1;
      } else {
        effective = 'NORMAL';
        // Rare, brief spontaneous anomaly so "live" mode feels real without
        // spamming alerts.
        if (Math.random() < 0.012) spontaneousRef.current = 3;
      }
    }

    const reading = nextReading(
      prev.currentReading,
      effective,
      settings,
      tickRef.current++,
    );
    const history = [...prev.history, reading].slice(-MAX_HISTORY);
    const aiAnalysis = analyze(history, settings);

    // Alerts only on real rising-edge transitions.
    const newAlert = evaluateAlert(reading, aiAnalysis, prev.currentReading);
    let alerts = prev.alerts;
    if (newAlert) {
      const notifyOk =
        (newAlert.type === 'LEAK' && settings.notifyLeak) ||
        (newAlert.type === 'AI_ANOMALY' && settings.notifyAnomaly) ||
        (newAlert.type !== 'LEAK' && newAlert.type !== 'AI_ANOMALY');
      if (notifyOk) alerts = [newAlert, ...prev.alerts].slice(0, 100);
    }

    // Leak-event timeline bookkeeping (rising/falling edges).
    let leakEvents = prev.leakEvents;
    const wasLeaking = prev.currentReading.leakDetected;
    if (reading.leakDetected && !wasLeaking) {
      leakEvents = [
        {
          id: `leak-${Date.now()}`,
          start: reading.timestamp,
          end: null,
          durationMinutes: 0,
          resolved: false,
        },
        ...prev.leakEvents,
      ];
    } else if (!reading.leakDetected && wasLeaking) {
      leakEvents = prev.leakEvents.map((e, i) => {
        if (i === 0 && !e.resolved) {
          const dur = Math.max(
            1,
            Math.round((Date.now() - new Date(e.start).getTime()) / 60000),
          );
          return {
            ...e,
            end: reading.timestamp,
            resolved: true,
            durationMinutes: dur,
          };
        }
        return e;
      });
    }

    const systemStatus = deriveSystemStatus(reading, prev.systemStatus);

    setState({
      ...prev,
      currentReading: reading,
      history,
      aiAnalysis,
      alerts,
      leakEvents,
      systemStatus,
    });
  }, []);

  // Drive the loop. Re-created only when the sampling cadence changes.
  useEffect(() => {
    const intervalMs = Math.max(500, state.settings.samplingInterval * 1000);
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [state.settings.samplingInterval, tick]);

  // --- Actions -------------------------------------------------------------

  const setDemoMode = useCallback((on: boolean) => {
    spontaneousRef.current = 0;
    setState((prev) => ({
      ...prev,
      demoMode: on,
      // Leaving demo mode returns the system to a clean live baseline.
      scenario: on ? prev.scenario : 'NORMAL',
    }));
  }, []);

  const setScenario = useCallback((s: Scenario) => {
    setState((prev) => ({ ...prev, scenario: s, demoMode: true }));
  }, []);

  const setPaused = useCallback((p: boolean) => {
    setState((prev) => ({ ...prev, paused: p }));
  }, []);

  const updateSettings = useCallback((patch: Partial<SystemSettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === id ? { ...a, status: 'resolved' } : a,
      ),
    }));
  }, []);

  const resolveAllAlerts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => ({ ...a, status: 'resolved' })),
    }));
  }, []);

  const value = useMemo<SystemContextValue>(
    () => ({
      currentReading: state.currentReading,
      history: state.history,
      aiAnalysis: state.aiAnalysis,
      systemStatus: state.systemStatus,
      alerts: state.alerts,
      leakEvents: state.leakEvents,
      settings: state.settings,
      dataSource: 'SIMULATED',
      demoMode: state.demoMode,
      scenario: state.scenario,
      paused: state.paused,
      setDemoMode,
      setScenario,
      setPaused,
      updateSettings,
      resolveAlert,
      resolveAllAlerts,
    }),
    [
      state,
      setDemoMode,
      setScenario,
      setPaused,
      updateSettings,
      resolveAlert,
      resolveAllAlerts,
    ],
  );

  return (
    <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSystem(): SystemContextValue {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within a SystemProvider');
  return ctx;
}
