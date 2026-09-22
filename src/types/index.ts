// ---------------------------------------------------------------------------
// Core domain types for the Smart Water AI monitoring system.
//
// These types define the contract between the (currently mock) service layer
// and the UI. When a real Raspberry Pi / Arduino backend is connected, the
// service layer implementations change but these shapes stay the same, so the
// UI never needs to be redesigned.
// ---------------------------------------------------------------------------

/** AI verdict for a single reading / window. */
export type AIStatus = 'NORMAL' | 'ANOMALY';

/** A single sensor reading, as it would arrive from the Raspberry Pi. */
export interface SensorData {
  /** ISO-8601 timestamp of the reading. */
  timestamp: string;
  /** Water level as a percentage of tank capacity (0-100). */
  waterLevel: number;
  /** Distance from the ultrasonic sensor to the water surface, in cm. */
  distance: number;
  /** Whether the water-leak sensor is currently wet. */
  leakDetected: boolean;
  /** AI classification of the current behaviour. */
  aiStatus: AIStatus;
  /** Anomaly score from the AI model (0-1). */
  anomalyScore: number;
}

export type ConnectionState = 'CONNECTED' | 'DISCONNECTED';
export type SystemState = 'OPERATIONAL' | 'WARNING' | 'OFFLINE';

/** High-level health of the system and its links. */
export interface SystemStatus {
  system: SystemState;
  arduino: ConnectionState;
  raspberryPi: ConnectionState;
  wifi: ConnectionState;
  /** ISO timestamp of the last successful data update. */
  lastUpdated: string;
}

/** Result of the AI anomaly-detection stage. */
export interface AIAnalysis {
  status: AIStatus;
  /** 0-1, higher means more anomalous. */
  anomalyScore: number;
  /** 0-1, model confidence in its verdict. */
  confidence: number;
  /** Human-readable description of the current behaviour pattern. */
  pattern: string;
  /** ISO timestamp of the last analysis run. */
  lastAnalysis: string;
  /**
   * Candidate explanations the frontend can surface WHEN an anomaly is present.
   * These are possibilities to investigate, never claims of a confirmed cause.
   */
  possibleCauses: string[];
}

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'resolved';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  sensor: string;
  status: AlertStatus;
}

/** The scenario the simulation engine is currently producing. */
export type Scenario = 'NORMAL' | 'LEAK' | 'ANOMALY';

/**
 * Where the data on screen comes from. Everything is SIMULATED in this
 * prototype; the field exists so the UI can be honest and so a real
 * HARDWARE source can be reported later without a redesign.
 */
export type DataSource = 'SIMULATED' | 'HARDWARE';

export interface SystemSettings {
  // Sensor configuration
  tankHeight: number; // cm
  samplingInterval: number; // seconds
  ultrasonicOffset: number; // cm calibration offset
  leakSensorThreshold: number; // 0-100 sensitivity
  // AI configuration
  anomalySensitivity: number; // 0-100
  analysisInterval: number; // seconds
  modelEnabled: boolean;
  // Notifications
  notifyLeak: boolean;
  notifyAnomaly: boolean;
  notifyOffline: boolean;
}

/** A single historical leak event for the leakage timeline. */
export interface LeakEvent {
  id: string;
  start: string;
  end: string | null;
  durationMinutes: number;
  resolved: boolean;
}

export type TimeRange = '1m' | '10m' | '1h' | '24h';
export type HistoryRange = 'today' | '7d' | '30d';
