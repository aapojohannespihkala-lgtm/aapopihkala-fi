export type WorkTestCandidate = {
  id: string;
  label: string;
  path: string;
};

export const p139nCandidateId = 'p139n-federated-kvv-review';
export const p139abCandidateId = 'p139ab-z-credible-wastewater-review';

export const p143aCandidateId = 'p143a-scalgo-terrain';
export const p143aReviewId = 'p143a-scalgo-terrain-review';
export const p143dReviewId = 'p143d-scalgo-infra-review';

export const p143fCandidateId = 'p143f-scalgo-contours';
export const p143fReviewId = 'p143f-scalgo-contours-review';

export const p143gCandidateId = 'p143g-scalgo-cartography';
export const p143gReviewId = 'p143g-scalgo-cartography-review';

export const p143hCandidateId = 'p143h-scalgo-label-axis';
export const p143hReviewId = 'p143h-scalgo-label-axis-review';

export const p143jCandidateId = 'p143j-scalgo-label-flow';
export const p143jReviewId = 'p143j-scalgo-label-flow-review';

export const p144cCandidateId = 'p144c-g3-1974-iv-on-p143h';
export const p144cReviewId = 'p144c-g3-1974-iv-review';

export const p145bCandidateId = 'p145b-1974-iv-section-worktargets';
export const p145bReviewId = 'p145b-1974-iv-section-worktargets-review';

export const p155cbCandidateId = 'p155cb-d-storage-roof';
export const p155cbReviewId = 'p155cb-d-storage-roof-review';

export const p151cCandidateId = 'p151c-whole-building-carrier';
export const p151cReviewId = 'p151c-whole-building-review';

export const p150frCandidateId = 'p150fr-whole-building-substructure';
export const p150frReviewId = 'p150fr-whole-building-substructure-review';

export const p150gCandidateId = 'p150g-whole-building-end-plinth';
export const p150gReviewId = 'p150g-whole-building-end-plinth-review';

export const p156iCandidateId = 'p156i-2017-kvv-main-presentation';
export const p156iReviewId = 'p156i-2017-kvv-main-review';

export const p161CandidateId = 'p161-multisource-systems-carrier';
export const p161ReviewId = 'p161-multisource-systems-review';

export const p170aCandidateId = 'p170a-p161-review-visibility';
export const p170aReviewId = 'p170a-p161-review-visibility-review';

export const p170dCandidateId = 'p170d-p161-review-visibility-correction';
export const p170dReviewId = 'p170d-p161-review-visibility-correction-review';

export const p164bCandidateId = 'p164b-d-corrected-stair';
export const p164bReviewId = 'p164b-d-corrected-stair-review';

export const p167fCandidateId = 'p167f-whole-building-precise-stair';
export const p167fReviewId = 'p167f-whole-building-precise-stair-review';

export const p168aCandidateId = 'p168a-whole-building-roof-eave-correction';
export const p168aReviewId = 'p168a-whole-building-roof-eave-correction-review';

export const p169aCandidateId = 'p169a-whole-building-ac-storage-visible';
export const p169aReviewId = 'p169a-whole-building-ac-storage-visible-review';

export const p169fCandidateId = 'p169f-whole-building-ac-storage-doors';
export const p169fReviewId = 'p169f-whole-building-ac-storage-doors-review';

export const p159CandidateId = 'p159-whole-building-storage-context';
export const p159ReviewId = 'p159-whole-building-storage-context-review';

export const p160CandidateId = 'p160-d-composite-architecture';
export const p160ReviewId = 'p160-d-composite-architecture-review';

export const p154cCandidateId = 'p154c-d-wall-cutouts';
export const p154cReviewId = 'p154c-d-wall-cutouts-review';

export const p153cCandidateId = 'p153c-d-stair-guard-lowwall';
export const p153cReviewId = 'p153c-d-stair-review';

export const p139acReviewId = 'p139ac-ground-infra-review';
export const p139adReviewId = 'p139ad-locus-work-z-review';

const reviewQueryKey = 'review';

const reviewCandidateById: Readonly<Record<string, string>> = Object.freeze({
  [p153cReviewId]: p153cCandidateId,
  [p154cReviewId]: p154cCandidateId,
  [p161ReviewId]: p161CandidateId,
  [p170aReviewId]: p170aCandidateId,
  [p170dReviewId]: p170dCandidateId,
  [p164bReviewId]: p164bCandidateId,
  [p167fReviewId]: p167fCandidateId,
  [p168aReviewId]: p168aCandidateId,
  [p169aReviewId]: p169aCandidateId,
  [p169fReviewId]: p169fCandidateId,
  [p159ReviewId]: p159CandidateId,
  [p160ReviewId]: p160CandidateId,
  [p156iReviewId]: p156iCandidateId,
  [p150gReviewId]: p150gCandidateId,
  [p150frReviewId]: p150frCandidateId,
  [p151cReviewId]: p151cCandidateId,
  [p155cbReviewId]: p155cbCandidateId,
  [p145bReviewId]: p145bCandidateId,
  [p144cReviewId]: p144cCandidateId,
  [p143jReviewId]: p143jCandidateId,
  [p143hReviewId]: p143hCandidateId,
  [p143gReviewId]: p143gCandidateId,
  [p143fReviewId]: p143fCandidateId,
  [p143aReviewId]: p143aCandidateId,
  [p143dReviewId]: p143aCandidateId,
  [p139acReviewId]: p139abCandidateId,
  [p139adReviewId]: p139abCandidateId,
});

export const isPrivateModelReviewRequested = (search: string, reviewId: string) =>
  new URLSearchParams(search).get(reviewQueryKey) === reviewId;

export const getRequestedReviewCandidateId = (search: string) => {
  const reviewId = new URLSearchParams(search).get(reviewQueryKey);
  return reviewId ? (reviewCandidateById[reviewId] ?? null) : null;
};

export const isWorkTestCandidate = (value: unknown): value is WorkTestCandidate => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    /^[a-z0-9-]+$/.test(candidate.id) &&
    typeof candidate.label === 'string' &&
    candidate.label.trim().length > 0 &&
    typeof candidate.path === 'string' &&
    /^\/private-model\/work-test\/[a-z0-9-]+\.glb$/.test(candidate.path)
  );
};
