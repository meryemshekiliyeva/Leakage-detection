// ---------------------------------------------------------------------------
// aiService — anomaly-detection / analysis API boundary.
//
// The mock implementation delegates to the local simulation "model". A real
// deployment would call the model running on the Raspberry Pi here.
// ---------------------------------------------------------------------------

import type { AIAnalysis, SensorData, SystemSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/data/mockData';
import { analyze } from './simulationService';

/** Run anomaly detection over a window of readings and return the analysis. */
export async function getAIAnalysis(
  window: SensorData[],
  settings: SystemSettings = DEFAULT_SETTINGS,
): Promise<AIAnalysis> {
  return Promise.resolve(analyze(window, settings));
}

/** The AI processing pipeline, used to render the workflow visualization. */
export interface PipelineStage {
  key: string;
  title: string;
  description: string;
}

export const AI_PIPELINE: PipelineStage[] = [
  {
    key: 'collect',
    title: 'Data Collection',
    description: 'Continuous sensor readings from Arduino.',
  },
  {
    key: 'preprocess',
    title: 'Pre-processing',
    description: 'Filter and normalize sensor data.',
  },
  {
    key: 'features',
    title: 'Feature Extraction',
    description: 'Analyze trend, change, and variance.',
  },
  {
    key: 'detect',
    title: 'Anomaly Detection',
    description: 'Identify unusual patterns.',
  },
  {
    key: 'alert',
    title: 'Alert Generation',
    description: 'Display and communicate warnings.',
  },
];
