import {
  createTargetBoundReviewAnchor,
  createTargetBoundReviewObservation,
  formatReviewCoordinateText,
  resolveTargetBoundReviewAnchor,
  type ApprovedReviewWallHost,
  type ReviewCoordinateValue,
  type ReviewPlacementFloor,
  type ReviewPlacementResolution,
  type TargetBoundReviewAnchor,
  type TargetBoundReviewObservation,
} from './privateModelReviewCoordinates';

/**
 * UI adapter for the existing P137E D-floor review grid. This module is NOT
 * mounted in private-model/index.astro until the Themo + drainage release gate.
 * No new coordinate system or new permanent review registry is introduced.
 */
export type PlacementReviewContext = {
  targetId: string;
  floor: ReviewPlacementFloor;
  /** Only approved and floor-matching G2 host geometry may be provided. */
  approvedWallHosts: ReadonlyArray<ApprovedReviewWallHost>;
};

export type PlacementReviewHandoff = {
  kind: 'P137E_G2_REVIEW_OBSERVATION';
  stage: 'WORK_TEST_ONLY';
  anchor: TargetBoundReviewAnchor;
  observation: TargetBoundReviewObservation;
  resolution: ReviewPlacementResolution;
  persisted: false;
  humanReview: 'NOT_RUN';
  currentGeometry: false;
  canonical: false;
  asBuilt: false;
};

export type PlacementReviewDraftResult =
  | { status: 'MISSING_ANCHOR'; payload: null }
  | { status: 'INVALID_INPUT'; payload: null }
  | { status: 'READY_FOR_G2_HANDOFF'; payload: PlacementReviewHandoff };

/**
 * Pure, deterministic mapping. The original clicked XY and free note survive
 * unchanged even when the proposed wall host is corrected/snap-projected.
 * The note may parse a floor-relative height, but absolute Z remains unknown.
 */
export const buildPlacementReviewDraft = ({
  context,
  coordinate,
  noteRaw,
}: {
  context: PlacementReviewContext;
  coordinate: ReviewCoordinateValue | null;
  noteRaw: string;
}): PlacementReviewDraftResult => {
  if (!coordinate) return { status: 'MISSING_ANCHOR', payload: null };
  const anchor = createTargetBoundReviewAnchor({
    targetId: context.targetId,
    floor: context.floor,
    coordinate,
  });
  const observation = anchor ? createTargetBoundReviewObservation(anchor, noteRaw) : null;
  if (!anchor || !observation || !Array.isArray(context.approvedWallHosts)) {
    return { status: 'INVALID_INPUT', payload: null };
  }
  return {
    status: 'READY_FOR_G2_HANDOFF',
    payload: {
      kind: 'P137E_G2_REVIEW_OBSERVATION',
      stage: 'WORK_TEST_ONLY',
      anchor,
      observation,
      resolution: resolveTargetBoundReviewAnchor(anchor, context.approvedWallHosts),
      persisted: false,
      humanReview: 'NOT_RUN',
      currentGeometry: false,
      canonical: false,
      asBuilt: false,
    },
  };
};

export type PersistedPlacementReviewAck = {
  status: 'PERSISTED_TO_EXISTING_G2';
  recordId: string;
};

/**
 * A real persistence adapter must acknowledge a durable G2 write. Returning a
 * handoff or clicking the button by itself is not a successful save.
 */
export type PersistPlacementReview = (
  payload: PlacementReviewHandoff,
) => Promise<PersistedPlacementReviewAck>;

export const createPlacementReviewPanel = ({
  mount,
  persist,
}: {
  mount: HTMLElement;
  persist: PersistPlacementReview;
}) => {
  const panel = document.createElement('section');
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Sijoita kohde');
  panel.dataset.reviewPlacementStatus = 'inactive';

  const heading = document.createElement('h3');
  heading.textContent = 'Sijoita kohde';

  const explanation = document.createElement('p');
  explanation.textContent = 'Rasti osoittaa kohteen keskipistettä. Lisää halutessasi korkeus lattiasta ja muu huomio.';

  const targetLabel = document.createElement('p');
  const locationLabel = document.createElement('p');
  locationLabel.setAttribute('aria-live', 'polite');

  const form = document.createElement('form');
  const noteLabel = document.createElement('label');
  noteLabel.textContent = 'Huomio ja korkeus';
  const note = document.createElement('textarea');
  note.id = 'p137e-review-placement-note';
  note.rows = 3;
  note.maxLength = 2000;
  note.placeholder = 'Esim. 120 cm lattiasta. Themo on Bedroomin puolella.';
  note.setAttribute('aria-label', 'Huomio ja korkeus');
  noteLabel.append(note);

  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Tallenna havainto';
  save.disabled = true;
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Peruuta';

  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  form.append(noteLabel, save, cancel, status);
  panel.append(heading, explanation, targetLabel, locationLabel, form);
  mount.append(panel);

  let currentContext: PlacementReviewContext | null = null;
  let clicked: ReviewCoordinateValue | null = null;
  let busy = false;

  const reset = () => {
    currentContext = null;
    clicked = null;
    busy = false;
    note.value = '';
    status.textContent = '';
    locationLabel.textContent = '';
    targetLabel.textContent = '';
    save.disabled = true;
    panel.hidden = true;
    panel.dataset.reviewPlacementStatus = 'inactive';
  };

  const open = (context: PlacementReviewContext) => {
    reset();
    currentContext = context;
    panel.hidden = false;
    panel.dataset.reviewPlacementStatus = 'awaiting-click';
    targetLabel.textContent = `Kohde: ${context.targetId}, D ${context.floor}`;
    locationLabel.textContent = 'Osoita kohteen keskipiste rastilla pohjakuvasta.';
  };

  const setClickedCoordinate = (coordinate: ReviewCoordinateValue, floor: ReviewPlacementFloor) => {
    if (!currentContext || busy || floor !== currentContext.floor) return false;
    if (!Number.isFinite(coordinate.xM) || !Number.isFinite(coordinate.yM)) return false;
    clicked = { xM: coordinate.xM, yM: coordinate.yM };
    locationLabel.textContent = `D ${floor} / YLIS-G1-LOCAL / ${formatReviewCoordinateText(clicked)}`;
    save.disabled = false;
    panel.dataset.reviewPlacementStatus = 'draft';
    status.textContent = '';
    return true;
  };

  cancel.addEventListener('click', reset);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentContext || !clicked || busy) return;

    const result = buildPlacementReviewDraft({
      context: currentContext,
      coordinate: clicked,
      noteRaw: note.value,
    });
    if (result.status !== 'READY_FOR_G2_HANDOFF') {
      status.textContent = 'Kohteen sijainti on epäselvä. Havaintoa ei tallennettu.';
      return;
    }

    busy = true;
    save.disabled = true;
    panel.dataset.reviewPlacementStatus = 'persisting';
    status.textContent = 'Tallennusta tarkistetaan...';
    try {
      const receipt = await persist(result.payload);
      if (receipt?.status !== 'PERSISTED_TO_EXISTING_G2' || !receipt.recordId?.trim()) {
        throw new Error('G2 persistence readback not confirmed');
      }
      status.textContent = 'Havainto tallennettu G2:een.';
      panel.dataset.reviewPlacementStatus = 'persisted';
    } catch {
      status.textContent = 'Tallennus ei varmistunut. Havainto säilyy tässä lomakkeessa.';
      panel.dataset.reviewPlacementStatus = 'draft';
    } finally {
      busy = false;
      if (panel.dataset.reviewPlacementStatus !== 'persisted') save.disabled = false;
    }
  });

  return {
    element: panel,
    open,
    setClickedCoordinate,
    cancel: reset,
    destroy: () => { reset(); panel.remove(); },
  };
};
