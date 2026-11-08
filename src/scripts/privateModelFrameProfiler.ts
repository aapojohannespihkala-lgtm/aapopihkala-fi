/**
 * WP1: opt-in CPU-side frame breakdown for the existing protected viewer.
 * No network, global renderer handles, source geometry or visual changes.
 * Timing renderer.render measures CPU submission, NOT asynchronous GPU time.
 */
export const viewerFrameProfilerStages = [
  'scope', 'corrections', 'layers', 'resize', 'controls',
  'pixelPins', 'selection', 'labels', 'gizmo', 'latePins', 'render',
] as const;

export type ViewerFrameProfilerStage = typeof viewerFrameProfilerStages[number];

export type ViewerFrameRenderCounters = {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
};

type Frame = {
  startedAt: number;
  previousMark: number;
  stages: Record<ViewerFrameProfilerStage, number>;
};

type Sample = {
  elapsedMs: number;
  moving: boolean;
  stages: Record<ViewerFrameProfilerStage, number>;
  counters: ViewerFrameRenderCounters;
};

export type ViewerFrameProfilerSnapshot = {
  samples: number;
  view: string;
  frameMs: { mean: number; p95: number; max: number };
  idle: { samples: number; meanMs: number | null; p95Ms: number | null };
  moving: { samples: number; meanMs: number | null; p95Ms: number | null };
  stageMeanMs: Record<ViewerFrameProfilerStage, number>;
  drawCallsMean: number;
  trianglesMean: number;
  memory: { geometries: number; textures: number };
};

const blankStages = (): Record<ViewerFrameProfilerStage, number> => {
  const out = {} as Record<ViewerFrameProfilerStage, number>;
  for (const stage of viewerFrameProfilerStages) out[stage] = 0;
  return out;
};

const rounded = (value: number) => Math.round(value * 1000) / 1000;
const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const percentile95 = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
};
const motionStats = (frames: readonly Sample[]) => ({
  samples: frames.length,
  meanMs: frames.length ? rounded(mean(frames.map(f => f.elapsedMs))) : null,
  p95Ms: frames.length ? rounded(percentile95(frames.map(f => f.elapsedMs))) : null,
});

export const createViewerFrameProfiler = (config: {
  onSample: (snapshot: ViewerFrameProfilerSnapshot) => void;
  sampleSize?: number;
}) => {
  const sampleSize = Math.max(2, Math.min(600, Math.floor(config.sampleSize ?? 180)));
  const samples: Sample[] = [];
  let current: Frame | null = null;
  let sampleView: string | null = null;

  const begin = (time: number) => {
    current = Number.isFinite(time)
      ? { startedAt: time, previousMark: time, stages: blankStages() }
      : null;
  };

  const mark = (stage: ViewerFrameProfilerStage, time: number) => {
    if (!current) return;
    if (!Number.isFinite(time) || time < current.previousMark) {
      current = null;
      return;
    }
    current.stages[stage] += time - current.previousMark;
    current.previousMark = time;
  };

  const end = (time: number, counters: ViewerFrameRenderCounters,
    moving: boolean, view: string) => {
    if (!current) return;
    if (!Number.isFinite(time) || time < current.previousMark) {
      current = null;
      return;
    }
    const elapsedMs = time - current.startedAt;
    if (elapsedMs < 0) {
      current = null;
      return;
    }
    // Never label a mixed 1F/2F/BOTH window as the last selected view.
    // Partial windows are intentionally dropped when the view changes.
    if (sampleView !== view) {
      samples.length = 0;
      sampleView = view;
    }
    samples.push({
      elapsedMs,
      moving,
      stages: current.stages,
      counters: { ...counters },
    });
    current = null;
    if (samples.length < sampleSize) return;

    const frameTimes = samples.map(sample => sample.elapsedMs);
    const stageMeanMs = blankStages();
    for (const stage of viewerFrameProfilerStages) {
      stageMeanMs[stage] = rounded(mean(samples.map(sample => sample.stages[stage])));
    }
    const last = samples[samples.length - 1].counters;
    const snapshot: ViewerFrameProfilerSnapshot = {
      samples: samples.length,
      view,
      frameMs: {
        mean: rounded(mean(frameTimes)),
        p95: rounded(percentile95(frameTimes)),
        max: rounded(Math.max(...frameTimes)),
      },
      idle: motionStats(samples.filter(sample => !sample.moving)),
      moving: motionStats(samples.filter(sample => sample.moving)),
      stageMeanMs,
      drawCallsMean: rounded(mean(samples.map(sample => sample.counters.drawCalls))),
      trianglesMean: rounded(mean(samples.map(sample => sample.counters.triangles))),
      memory: { geometries: last.geometries, textures: last.textures },
    };
    samples.length = 0;
    config.onSample(snapshot);
  };

  return { begin, mark, end };
};
