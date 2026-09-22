// ---------------------------------------------------------------------------
// Simulation engine.
//
// Produces the next sensor reading from the previous one, driven by the active
// scenario. This is the ONLY place that "invents" data. When a real backend is
// connected, the sensorService stops calling this and streams hardware data
// instead — the rest of the app is unaffected.
// ---------------------------------------------------------------------------

import type { AIAnalysis, Scenario, SensorData, SystemSettings } from '@/types';
import {
  ANOMALY_POSSIBLE_CAUSES,
  BASELINE_LEVEL,
  clamp,
  levelToDistance,
  makeReading,
  randomBetween,
  round,
} from '@/data/mockData';

/**
 * Generate the next reading based on the previous one and the active scenario.
 * `tick` lets scenarios evolve deterministically (e.g. a leak drains over time).
 */
export function nextReading(
  prev: SensorData,
  scenario: Scenario,
  settings: SystemSettings,
  tick: number,
): SensorData {
  const tank = settings.tankHeight;
  const offset = settings.ultrasonicOffset;

  switch (scenario) {
    case 'LEAK': {
      // Water drains quickly and the leak sensor is wet.
      const drop = randomBetween(2.5, 5.5);
      const level = clamp(prev.waterLevel - drop, 3, 100);
      return {
        timestamp: new Date().toISOString(),
        waterLevel: round(level, 1),
        distance: levelToDistance(level, tank, offset),
        leakDetected: true,
        aiStatus: 'ANOMALY',
        anomalyScore: round(randomBetween(0.78, 0.97), 3),
      };
    }

    case 'ANOMALY': {
      // Leak sensor stays dry, but ultrasonic readings become erratic:
      // large, physically implausible jumps between samples.
      const jitter = randomBetween(-14, 9);
      const level = clamp(prev.waterLevel + jitter, 8, 96);
      return {
        timestamp: new Date().toISOString(),
        waterLevel: round(level, 1),
        distance: levelToDistance(level, tank, offset),
        leakDetected: false,
        aiStatus: 'ANOMALY',
        anomalyScore: round(randomBetween(0.6, 0.9), 3),
      };
    }

    case 'NORMAL':
    default: {
      // Gentle drift back toward the baseline with small noise.
      const pull = (BASELINE_LEVEL - prev.waterLevel) * 0.04;
      const drift = Math.sin(tick / 9) * 0.5;
      const level = clamp(
        prev.waterLevel + pull + drift + randomBetween(-0.5, 0.5),
        66,
        80,
      );
      return makeReading(
        {
          waterLevel: level,
          anomalyScore: round(randomBetween(0.05, 0.16), 3),
          aiStatus: 'NORMAL',
          leakDetected: false,
        },
        tank,
      );
    }
  }
}

/**
 * Run the "AI" analysis stage over a recent window of readings.
 * In this prototype the verdict is derived from simple signal statistics
 * (trend + variance) blended with the latest reading's score. A real model
 * on the Raspberry Pi would replace this function's body only.
 */
export function analyze(
  window: SensorData[],
  settings: SystemSettings,
): AIAnalysis {
  const latest = window[window.length - 1];
  const nowIso = new Date().toISOString();

  if (!latest) {
    return {
      status: 'NORMAL',
      anomalyScore: 0,
      confidence: 0.9,
      pattern: 'Awaiting sensor data',
      lastAnalysis: nowIso,
      possibleCauses: [],
    };
  }

  // Signal statistics over the recent window.
  const recent = window.slice(-8);
  const levels = recent.map((r) => r.waterLevel);
  const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
  const variance =
    levels.reduce((a, b) => a + (b - mean) ** 2, 0) / levels.length;
  const trend = levels.length > 1 ? levels[levels.length - 1] - levels[0] : 0;

  const status = latest.aiStatus;
  const anomalyScore = latest.anomalyScore;

  // Confidence: high when the signal is coherent (either clearly stable or
  // clearly disrupted); modestly reduced by borderline variance.
  const sensitivity = settings.anomalySensitivity / 100;
  const coherence = clamp(1 - Math.abs(variance - 4) / 40, 0, 1);
  const confidence = round(
    clamp(0.82 + coherence * 0.14 - (1 - sensitivity) * 0.02, 0.75, 0.98),
    2,
  );

  let pattern: string;
  const possibleCauses: string[] = [];

  if (status === 'ANOMALY') {
    if (latest.leakDetected) {
      pattern = 'Rapid water-level drop with wet leak sensor';
    } else if (variance > 25) {
      pattern = 'Irregular ultrasonic readings — unstable signal';
    } else if (trend < -10) {
      pattern = 'Rapid decrease in water-level measurements';
    } else {
      pattern = 'Unusual sensor pattern detected';
    }
    possibleCauses.push(...ANOMALY_POSSIBLE_CAUSES);
  } else {
    pattern =
      variance < 2
        ? 'Stable water-level behavior'
        : 'Normal water-level behavior with minor variation';
  }

  return {
    status,
    anomalyScore,
    confidence,
    pattern,
    lastAnalysis: nowIso,
    possibleCauses,
  };
}
