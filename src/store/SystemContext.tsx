// ---------------------------------------------------------------------------
// SystemContext — the single source of truth + the real-time data pipeline.
//
// Two data sources feed the SAME pipeline (applyReading):
//   1. Simulation  — the built-in mock stream (default, no hardware needed)
//   2. Live bridge — real Arduino readings via the Raspberry Pi bridge, used
//                    automatically when VITE_LIVE_API_URL is configured and the
//                    bridge is reachable (see src/services/liveService.ts).
//
// When the live bridge is connected (and Demo Mode is off) it drives the app
// and the simulation idles. Otherwise the simulation runs. Demo Mode always
// uses the simulation so presentations work with or without hardware.
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
  ConnectionState,
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
  round,
  seedAlerts,
  seedHistory,
  seedLeakEvents,
} from '@/data/mockData';
import { analyze, computeAnomaly, nextReading } from '@/services/simulationService';
import { evaluateAlert } from '@/services/alertService';
import { deriveSystemStatus } from '@/services/systemService';
import {
  createLiveConnection,
  getLiveApiUrl,
  type LiveConnection,
} from '@/services/liveService';
import {
  connectArduino as openArduinoPort,
  isUserCancel,
  isWebSerialSupported,
  parseSerialLine,
  type SerialHandle,
} from '@/services/serialService';

const MAX_HISTORY = 150;

interface Connections {
  arduino: ConnectionState;
  raspberryPi: ConnectionState;
  wifi: ConnectionState;
}

const ALL_CONNECTED: Connections = {
  arduino: 'CONNECTED',
  raspberryPi: 'CONNECTED',
  wifi: 'CONNECTED',
};

interface SystemContextValue {
  currentReading: SensorData;
  history: SensorData[];
  aiAnalysis: AIAnalysis;
  systemStatus: SystemStatus;
  alerts: Alert[];
  leakEvents: LeakEvent[];
  settings: SystemSettings;
  // Mode / source
  dataSource: DataSource;
  demoMode: boolean;
  scenario: Scenario;
  paused: boolean;
  liveConnected: boolean;
  liveSource: 'hardware' | 'mock' | null;
  // Direct Arduino (Web Serial / USB)
  serialSupported: boolean;
  serialConnected: boolean;
  serialError: string | null;
  // Actions
  setDemoMode: (on: boolean) => void;
  setScenario: (s: Scenario) => void;
  setPaused: (p: boolean) => void;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  resolveAlert: (id: string) => void;
  resolveAllAlerts: () => void;
  connectArduino: () => Promise<void>;
  disconnectArduino: () => Promise<void>;
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
  liveConnected: boolean;
  liveSource: 'hardware' | 'mock' | null;
  serialConnected: boolean;
  serialError: string | null;
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
    ...ALL_CONNECTED,
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
    liveConnected: false,
    liveSource: null,
    serialConnected: false,
    serialError: null,
  };
}

/**
 * Shared reading pipeline. Given the previous state, a new reading, and the
 * current connection states, produce the next state: rolling history, AI
 * analysis, alert transitions, leak-event bookkeeping and system status.
 *
 * Used identically by the simulation loop and the live bridge — so both data
 * sources behave the same and no UI depends on where the data came from.
 */
function applyReading(
  prev: State,
  reading: SensorData,
  conn: Connections,
): State {
  const { settings } = prev;
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

  // Leak-event timeline (rising / falling edges).
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
        return { ...e, end: reading.timestamp, resolved: true, durationMinutes: dur };
      }
      return e;
    });
  }

  const base: SystemStatus = {
    system: prev.systemStatus.system,
    arduino: conn.arduino,
    raspberryPi: conn.raspberryPi,
    wifi: conn.wifi,
    lastUpdated: prev.systemStatus.lastUpdated,
  };
  const systemStatus = deriveSystemStatus(reading, base);

  return {
    ...prev,
    currentReading: reading,
    history,
    aiAnalysis,
    alerts,
    leakEvents,
    systemStatus,
  };
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(buildInitialState);

  // Mirror of state for the simulation interval to read the latest values.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Refs the async handlers read without re-subscribing.
  const demoRef = useRef(state.demoMode);
  const pausedRef = useRef(state.paused);
  const liveConnectedRef = useRef(state.liveConnected);
  const settingsRef = useRef(state.settings);
  useEffect(() => {
    demoRef.current = state.demoMode;
  }, [state.demoMode]);
  useEffect(() => {
    pausedRef.current = state.paused;
  }, [state.paused]);
  useEffect(() => {
    liveConnectedRef.current = state.liveConnected;
  }, [state.liveConnected]);
  useEffect(() => {
    settingsRef.current = state.settings;
  }, [state.settings]);

  const tickRef = useRef(0);
  const spontaneousRef = useRef(0); // remaining spontaneous-anomaly ticks (sim)
  const connRef = useRef<Connections>(ALL_CONNECTED);
  const lastLiveApplyRef = useRef(0);

  // Direct Arduino (Web Serial) refs.
  const serialSupported = useMemo(() => isWebSerialSupported(), []);
  const serialConnectedRef = useRef(state.serialConnected);
  useEffect(() => {
    serialConnectedRef.current = state.serialConnected;
  }, [state.serialConnected]);
  const serialHandleRef = useRef<SerialHandle | null>(null);
  const lastSerialApplyRef = useRef(0);

  // --- Simulation loop -----------------------------------------------------

  const tick = useCallback(() => {
    if (pausedRef.current) return;
    // When real hardware drives the app (and we're not demoing), idle the sim.
    if (
      !demoRef.current &&
      (serialConnectedRef.current || liveConnectedRef.current)
    ) {
      return;
    }

    const prev = stateRef.current;
    const { settings, demoMode, scenario } = prev;

    let effective: Scenario = scenario;
    if (!demoMode) {
      if (spontaneousRef.current > 0) {
        effective = 'ANOMALY';
        spontaneousRef.current -= 1;
      } else {
        effective = 'NORMAL';
        if (Math.random() < 0.012) spontaneousRef.current = 3;
      }
    }

    const reading = nextReading(
      prev.currentReading,
      effective,
      settings,
      tickRef.current++,
    );
    // Simulation assumes all links are up.
    connRef.current = ALL_CONNECTED;
    const ns = applyReading(prev, reading, ALL_CONNECTED);
    stateRef.current = ns;
    setState(ns);
  }, []);

  useEffect(() => {
    const intervalMs = Math.max(500, state.settings.samplingInterval * 1000);
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [state.settings.samplingInterval, tick]);

  // --- Live bridge connection ---------------------------------------------

  useEffect(() => {
    const url = getLiveApiUrl();
    if (!url) return; // No backend configured -> pure simulation.

    let conn: LiveConnection | null = null;
    conn = createLiveConnection(url, {
      onOpen: () => {
        setState((p) => ({ ...p, liveConnected: true }));
      },
      onClose: () => {
        connRef.current = ALL_CONNECTED;
        setState((p) => ({ ...p, liveConnected: false, liveSource: null }));
      },
      onReading: (reading, meta) => {
        connRef.current =
          meta.source === 'hardware'
            ? {
                arduino: meta.arduinoConnected ? 'CONNECTED' : 'DISCONNECTED',
                raspberryPi: 'CONNECTED',
                wifi: 'CONNECTED',
              }
            : ALL_CONNECTED;

        // Throttle ingestion to roughly the sampling interval so the UI cadence
        // matches the dashboard rather than the Arduino's raw ~10 Hz output.
        const gap = settingsRef.current.samplingInterval * 1000 * 0.85;
        const nowMs = Date.now();
        const applyNow = nowMs - lastLiveApplyRef.current >= gap;

        setState((p) => {
          const sourceChanged = p.liveSource !== meta.source;
          // Demo Mode / pause: don't ingest hardware, just track connection.
          if (demoRef.current || pausedRef.current || !applyNow) {
            if (sourceChanged || !p.liveConnected) {
              return { ...p, liveSource: meta.source, liveConnected: true };
            }
            return p;
          }
          lastLiveApplyRef.current = nowMs;
          const ns = applyReading(p, reading, connRef.current);
          return { ...ns, liveSource: meta.source, liveConnected: true };
        });
      },
    });

    return () => conn?.close();
  }, []);

  // --- Direct Arduino (Web Serial) ----------------------------------------

  const handleSerialLine = useCallback((line: string) => {
    const parsed = parseSerialLine(line);
    if (!parsed) return;
    // Throttle the Arduino's ~10 Hz output to the dashboard's sampling cadence.
    const gap = settingsRef.current.samplingInterval * 1000 * 0.85;
    const nowMs = Date.now();
    if (nowMs - lastSerialApplyRef.current < gap) return;
    lastSerialApplyRef.current = nowMs;

    setState((p) => {
      if (demoRef.current || pausedRef.current) return p;
      const levels = p.history.map((r) => r.waterLevel);
      levels.push(parsed.waterLevel);
      const { aiStatus, anomalyScore } = computeAnomaly(
        levels,
        parsed.leakDetected,
        p.settings.anomalySensitivity / 100,
      );
      const reading: SensorData = {
        timestamp: new Date().toISOString(),
        waterLevel: round(parsed.waterLevel, 1),
        distance: round(parsed.distance, 1),
        leakDetected: parsed.leakDetected,
        aiStatus,
        anomalyScore,
      };
      return applyReading(p, reading, ALL_CONNECTED);
    });
  }, []);

  const handleSerialClose = useCallback((err?: string) => {
    serialHandleRef.current = null;
    connRef.current = ALL_CONNECTED;
    setState((p) => ({
      ...p,
      serialConnected: false,
      serialError: err ? 'Arduino disconnected unexpectedly.' : null,
    }));
  }, []);

  const connectArduino = useCallback(async () => {
    if (!serialSupported) {
      setState((p) => ({
        ...p,
        serialError:
          'Web Serial is not supported in this browser. Use Chrome or Edge on desktop (over localhost or https).',
      }));
      return;
    }
    try {
      const handle = await openArduinoPort({
        baudRate: 9600,
        onLine: handleSerialLine,
        onClose: handleSerialClose,
      });
      serialHandleRef.current = handle;
      connRef.current = ALL_CONNECTED;
      lastSerialApplyRef.current = 0;
      setState((p) => ({ ...p, serialConnected: true, serialError: null }));
    } catch (err) {
      if (isUserCancel(err)) return; // user dismissed the port picker
      setState((p) => ({
        ...p,
        serialConnected: false,
        serialError:
          err instanceof Error
            ? `Could not open the Arduino: ${err.message}`
            : 'Could not open the Arduino serial port.',
      }));
    }
  }, [serialSupported, handleSerialLine, handleSerialClose]);

  const disconnectArduino = useCallback(async () => {
    const handle = serialHandleRef.current;
    serialHandleRef.current = null;
    setState((p) => ({ ...p, serialConnected: false, serialError: null }));
    await handle?.disconnect();
  }, []);

  // Release the port if the provider unmounts while still connected.
  useEffect(() => {
    return () => {
      void serialHandleRef.current?.disconnect();
    };
  }, []);

  // --- Actions -------------------------------------------------------------

  const setDemoMode = useCallback((on: boolean) => {
    spontaneousRef.current = 0;
    setState((prev) => ({
      ...prev,
      demoMode: on,
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

  const dataSource: DataSource =
    !state.demoMode &&
    (state.serialConnected ||
      (state.liveConnected && state.liveSource === 'hardware'))
      ? 'HARDWARE'
      : 'SIMULATED';

  const value = useMemo<SystemContextValue>(
    () => ({
      currentReading: state.currentReading,
      history: state.history,
      aiAnalysis: state.aiAnalysis,
      systemStatus: state.systemStatus,
      alerts: state.alerts,
      leakEvents: state.leakEvents,
      settings: state.settings,
      dataSource,
      demoMode: state.demoMode,
      scenario: state.scenario,
      paused: state.paused,
      liveConnected: state.liveConnected,
      liveSource: state.liveSource,
      serialSupported,
      serialConnected: state.serialConnected,
      serialError: state.serialError,
      setDemoMode,
      setScenario,
      setPaused,
      updateSettings,
      resolveAlert,
      resolveAllAlerts,
      connectArduino,
      disconnectArduino,
    }),
    [
      state,
      dataSource,
      serialSupported,
      setDemoMode,
      setScenario,
      setPaused,
      updateSettings,
      resolveAlert,
      resolveAllAlerts,
      connectArduino,
      disconnectArduino,
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
