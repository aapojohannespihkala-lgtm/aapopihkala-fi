export type HslGpsPassageSample = {
  distanceMeters: number | null;
  updatedAt: string | null;
};

export type HslGpsPassageState = {
  closestDistanceMeters: number;
  lastDistanceMeters: number;
  lastUpdatedAtMs: number;
  awaySamples: number;
  passed: boolean;
};

const MIN_AWAY_STEP_METERS = 35;
const MIN_RISE_FROM_CLOSEST_METERS = 120;
const REQUIRED_AWAY_SAMPLES = 2;

const timestampOf = (value: string | null) => {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const updateHslGpsPassageState = (
  previous: HslGpsPassageState | undefined,
  sample: HslGpsPassageSample
): HslGpsPassageState | undefined => {
  if (sample.distanceMeters === null || !Number.isFinite(sample.distanceMeters)) return previous;
  const updatedAtMs = timestampOf(sample.updatedAt);
  if (updatedAtMs === null) return previous;

  if (!previous) {
    return {
      closestDistanceMeters: sample.distanceMeters,
      lastDistanceMeters: sample.distanceMeters,
      lastUpdatedAtMs: updatedAtMs,
      awaySamples: 0,
      passed: false,
    };
  }

  if (updatedAtMs <= previous.lastUpdatedAtMs || previous.passed) return previous;

  const closestDistanceMeters = Math.min(previous.closestDistanceMeters, sample.distanceMeters);
  const stepMeters = sample.distanceMeters - previous.lastDistanceMeters;
  const riseFromClosestMeters = sample.distanceMeters - closestDistanceMeters;

  let awaySamples = previous.awaySamples;
  if (stepMeters >= MIN_AWAY_STEP_METERS && riseFromClosestMeters >= MIN_RISE_FROM_CLOSEST_METERS) {
    awaySamples += 1;
  } else if (stepMeters <= 0) {
    awaySamples = 0;
  }

  return {
    closestDistanceMeters,
    lastDistanceMeters: sample.distanceMeters,
    lastUpdatedAtMs: updatedAtMs,
    awaySamples,
    passed: awaySamples >= REQUIRED_AWAY_SAMPLES,
  };
};
