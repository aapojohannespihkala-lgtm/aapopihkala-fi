export const workTestLoadFailurePhases = [
  'catalog-missing',
  'gltf-load-failed',
  'm5a-z2-presentation-guard-failed',
  'review-runtime-failed',
] as const;

export type WorkTestLoadFailurePhase = (typeof workTestLoadFailurePhases)[number];

export const workTestLoadFailureStatusText: Record<WorkTestLoadFailurePhase, string> =
  Object.freeze({
    'catalog-missing': 'WORK_TEST-kandidaattia ei löytynyt katalogista',
    'gltf-load-failed': 'WORK_TEST-kandidaatin GLB:tä ei voitu avata',
    'm5a-z2-presentation-guard-failed':
      'M5A-Z2 WORK_TEST-katselupresentaatio ei läpäissyt vartijaa',
    'review-runtime-failed': 'WORK_TEST-katselun runtime kaatui ennen valmista näkymää',
  });

const maxWorkTestLoadErrorLength = 240;

export const formatWorkTestLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, maxWorkTestLoadErrorLength);
};

export type WorkTestLoadFailureDataset = Readonly<{
  workTestLoadState: 'failed';
  workTestLoadFailurePhase: WorkTestLoadFailurePhase;
  workTestLoadCandidate?: string;
  workTestLoadError: string;
}>;

export const createWorkTestLoadFailureDataset = (
  phase: WorkTestLoadFailurePhase,
  candidateId: string | null,
  error: unknown,
): WorkTestLoadFailureDataset => {
  const dataset: {
    workTestLoadState: 'failed';
    workTestLoadFailurePhase: WorkTestLoadFailurePhase;
    workTestLoadCandidate?: string;
    workTestLoadError: string;
  } = {
    workTestLoadState: 'failed',
    workTestLoadFailurePhase: phase,
    workTestLoadError: formatWorkTestLoadError(error),
  };

  if (candidateId) dataset.workTestLoadCandidate = candidateId;
  return dataset;
};
