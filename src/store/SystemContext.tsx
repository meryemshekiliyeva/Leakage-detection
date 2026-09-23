// ---------------------------------------------------------------------------
// SystemContext — the single source of truth + the real-time data pipeline.
//
// Data on screen comes from ONE of two sources, both feeding applyReading():
//   1. Arduino  — real readings over USB (Web Serial), from "Connect Arduino"
//   2. Demo Mode — the built-in simulation, for presentations without hardware
//
// If NEITHER is active the app shows a "Waiting for Arduino…" state with no
// values — it never invents random numbers. So: connect the Arduino to see real
// data, or turn on Demo Mode to run a scripted scenario.
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
  DEFAULT_SETTINGS,
  round,
  seedHistory,
} from '@/data/mockData';
import { analyze, computeAnomaly, nextReading } from '@/services/simulationService';
import { evaluateAlert } from '@/services/alertService';
import { deriveSystemStatus } from '@/services/systemService';
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

/** A neutral placeholder reading used while there is no live data. */
function emptyReading(settings: SystemSettings): SensorData {
  return {
    timestamp: new Date().toISOString(),
    waterLevel: 0,
    distance: settings.tankHeight,
    leakDetected: false,
    aiStatus: 'NORMAL',
    anomalyScore: 0,
  };
}

/** The "no data yet — waiting for the Arduino" slice of state. */
function awaitingReset(
  settings: SystemSettings,
): Pick<State, 'history' | 'currentReading' | 'aiAnalysis' | 'systemStatus'> {
  const now = new Date().toISOString();
  return {
    history: [],
    currentReading: emptyReading(settings),
    aiAnalysis: {
      status: 'NORMAL',
      anomalyScore: 0,
      confidence: 0,
      pattern: 'Waiting for Arduino…',
      lastAnalysis: now,
      possibleCauses: [],
    },
    systemStatus: {
      system: 'OFFLINE',
      arduino: 'DISCONNECTED',
      raspberryPi: 'DISCONNECTED',
      wifi: 'CONNECTED',
      lastUpdated: now,
    },
  };
}

/** Fresh slice used right after the Arduino connects, before the first reading. */
function connectingReset(
  settings: SystemSettings,
): Pick<State, 'history' | 'currentReading' | 'aiAnalysis' | 'systemStatus'> {
  const now = new Date().toISOString();
  return {
    history: [],
    currentReading: emptyReading(settings),
    aiAnalysis: {
      status: 'NORMAL',
      anomalyScore: 0,
      confidence: 0,
      pattern: 'Connected — waiting for first reading…',
      lastAnalysis: now,
      possibleCauses: [],
    },
    systemStatus: {
      system: 'OPERATIONAL',
      ...ALL_CONNECTED,
      lastUpdated: now,
    },
  };
}

/** A lively starting slice for Demo Mode, so a demo looks real immediately. */
function demoSeed(
  settings: SystemSettings,
): Pick<State, 'history' | 'currentReading' | 'aiAnalysis' | 'systemStatus'> {
  const history = seedHistory(40, settings.samplingInterval, settings.tankHeight);
  const currentReading = history[history.length - 1];
  return {
    history,
    currentReading,
    aiAnalysis: analyze(history, settings),
    systemStatus: {
      system: 'OPERATIONAL',
      ...ALL_CONNECTED,
      lastUpdated: currentReading.timestamp,
    },
  };
}

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
  /** True when no data is flowing (no Arduino, no Demo) — show placeholders. */
  awaitingData: boolean;
  /** True once there is at least one reading to display. */
  hasData: boolean;
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
  serialConnected: boolean;
  serialError: string | null;
}

const SystemContext = createContext<SystemContextValue | null>(null);

function buildInitialState(): State {
  const settings = DEFAULT_SETTINGS;
  // Start empty: no random data. Values appear once the Arduino connects or
  // Demo Mode is turned on.
  return {
    ...awaitingReset(settings),
    alerts: [],
    leakEvents: [],
    settings,
    demoMode: false,
    scenario: 'NORMAL',
    paused: false,
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
  const settingsRef = useRef(state.settings);
  useEffect(() => {
    demoRef.current = state.demoMode;
  }, [state.demoMode]);
  useEffect(() => {
    pausedRef.current = state.paused;
  }, [state.paused]);
  useEffect(() => {
    settingsRef.current = state.settings;
  }, [state.settings]);

  const tickRef = useRef(0);

  // Direct Arduino (Web Serial) refs.
  const serialSupported = useMemo(() => isWebSerialSupported(), []);
  const serialHandleRef = useRef<SerialHandle | null>(null);
  const lastSerialApplyRef = useRef(0);
  const serialReceivedRef = useRef(false); // any bytes parsed since connecting
  const serialWarnTimerRef = useRef<number | undefined>(undefined);

  // --- Simulation loop (Demo Mode only) ------------------------------------
  // The simulation runs ONLY while Demo Mode is on. When it's off, data comes
  // from the Arduino (or nothing — the "waiting" state). This is why the app
  // never shows random numbers unless you explicitly start a demo.

  const tick = useCallback(() => {
    if (pausedRef.current) return;
    if (!demoRef.current) return; // no demo -> no simulated data

    const prev = stateRef.current;
    const reading = nextReading(
      prev.currentReading,
      prev.scenario,
      prev.settings,
      tickRef.current++,
    );
    const ns = applyReading(prev, reading, ALL_CONNECTED);
    stateRef.current = ns;
    setState(ns);
  }, []);

  useEffect(() => {
    const intervalMs = Math.max(500, state.settings.samplingInterval * 1000);
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [state.settings.samplingInterval, tick]);

  // --- Direct Arduino (Web Serial) ----------------------------------------

  const handleSerialLine = useCallback((line: string) => {
    const parsed = parseSerialLine(line);
    if (!parsed) return;

    // We got valid data — cancel the "no data" warning.
    serialReceivedRef.current = true;
    if (serialWarnTimerRef.current !== undefined) {
      window.clearTimeout(serialWarnTimerRef.current);
      serialWarnTimerRef.current = undefined;
    }

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
      return { ...applyReading(p, reading, ALL_CONNECTED), serialError: null };
    });
  }, []);

  const handleSerialClose = useCallback((err?: string) => {
    serialHandleRef.current = null;
    if (serialWarnTimerRef.current !== undefined) {
      window.clearTimeout(serialWarnTimerRef.current);
      serialWarnTimerRef.current = undefined;
    }
    setState((p) => ({
      ...p,
      serialConnected: false,
      serialError: err ? 'Arduino disconnected unexpectedly.' : null,
      ...(p.demoMode ? {} : awaitingReset(p.settings)),
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
      lastSerialApplyRef.current = 0;
      setState((p) => ({
        ...p,
        serialConnected: true,
        serialError: null,
        // Start fresh so real readings aren't mixed with previous data.
        ...(p.demoMode ? {} : connectingReset(p.settings)),
      }));

      // If no data arrives soon after connecting, tell the user why.
      serialReceivedRef.current = false;
      if (serialWarnTimerRef.current !== undefined) {
        window.clearTimeout(serialWarnTimerRef.current);
      }
      serialWarnTimerRef.current = window.setTimeout(() => {
        if (!serialReceivedRef.current) {
          setState((p) =>
            p.serialConnected
              ? {
                  ...p,
                  serialError:
                    'Connected, but no data is coming from the Arduino. Close the Arduino IDE Serial Monitor (only one program can use the port at a time), check the USB cable, and make sure the sketch prints at 9600 baud.',
                }
              : p,
          );
        }
      }, 5000);
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
    if (serialWarnTimerRef.current !== undefined) {
      window.clearTimeout(serialWarnTimerRef.current);
      serialWarnTimerRef.current = undefined;
    }
    setState((p) => ({
      ...p,
      serialConnected: false,
      serialError: null,
      ...(p.demoMode ? {} : awaitingReset(p.settings)),
    }));
    await handle?.disconnect();
  }, []);

  // Release the port if the provider unmounts while still connected.
  useEffect(() => {
    return () => {
      if (serialWarnTimerRef.current !== undefined) {
        window.clearTimeout(serialWarnTimerRef.current);
      }
      void serialHandleRef.current?.disconnect();
    };
  }, []);

  // --- Actions -------------------------------------------------------------

  const setDemoMode = useCallback((on: boolean) => {
    setState((prev) =>
      on
        ? { ...prev, demoMode: true, ...demoSeed(prev.settings) }
        : {
            ...prev,
            demoMode: false,
            scenario: 'NORMAL',
            // Turning demo off returns to live: real data if connected, else wait.
            ...(prev.serialConnected ? {} : awaitingReset(prev.settings)),
          },
    );
  }, []);

  const setScenario = useCallback((s: Scenario) => {
    setState((prev) => ({
      ...prev,
      scenario: s,
      demoMode: true,
      ...(prev.demoMode ? {} : demoSeed(prev.settings)),
    }));
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
    !state.demoMode && state.serialConnected ? 'HARDWARE' : 'SIMULATED';
  const awaitingData = !state.demoMode && !state.serialConnected;
  const hasData = state.history.length > 0;

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
      awaitingData,
      hasData,
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
      awaitingData,
      hasData,
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
