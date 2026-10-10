import { expect, test } from '@playwright/test';
import {
  buildPlacementReviewDraft,
  type PlacementReviewContext,
} from '../../src/scripts/privateModelReviewPlacementDraft';

const d1f: PlacementReviewContext = {
  targetId: 'D_THEMO_BEDROOM',
  floor: '1F',
  approvedWallHosts: [{
    g2Id: 'D_WALL_I04',
    floor: '1F',
    coordinateFrame: 'YLIS-G1-LOCAL',
    approvalEvidenceId: 'APPROVED_D1F_WALL_I04',
    approved: true,
    axis: 'Y_FIXED',
    fixedM: 5.072,
    startM: 0.231,
    endM: 6.306,
    openingsComplete: true,
    openings: [],
  }],
};

test('P137E drafts are bound to D-floor target, original click, exact note and centre height', () => {
  const result = buildPlacementReviewDraft({
    context: d1f,
    coordinate: { xM: 3.235, yM: 5.063 },
    noteRaw: '120 cm lattiasta. Themo on Bedroomin puolella.',
  });
  expect(result.status).toBe('READY_FOR_G2_HANDOFF');
  expect(result.payload).toMatchObject({
    kind: 'P137E_G2_REVIEW_OBSERVATION',
    stage: 'WORK_TEST_ONLY',
    persisted: false,
    humanReview: 'NOT_RUN',
    currentGeometry: false,
    canonical: false,
    asBuilt: false,
    anchor: {
      targetId: 'D_THEMO_BEDROOM',
      floor: '1F',
      coordinateFrame: 'YLIS-G1-LOCAL',
      targetPoint: 'OBJECT_CENTER',
      xM: 3.235,
      yM: 5.063,
      exactXY: false,
    },
    observation: {
      noteRaw: '120 cm lattiasta. Themo on Bedroomin puolella.',
      targetPoint: 'OBJECT_CENTER',
      verifiedWallSide: false,
      exactZ: false,
      height: { status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.2, zM: null },
    },
    resolution: {
      status: 'HOST_PROPOSED_WORK_TEST',
      proposal: {
        hostG2Id: 'D_WALL_I04',
        xM: 3.235,
        yM: 5.072,
        wallSideHint: 'Y_NEGATIVE',
        currentGeometry: false,
      },
    },
  });
});

test('P137E refuses missing XY or an invalid target and never invents them', () => {
  expect(buildPlacementReviewDraft({
    context: d1f,
    coordinate: null,
    noteRaw: '120 cm',
  })).toEqual({ status: 'MISSING_ANCHOR', payload: null });
  expect(buildPlacementReviewDraft({
    context: { ...d1f, targetId: '' },
    coordinate: { xM: 3, yM: 5 },
    noteRaw: '120 cm',
  })).toEqual({ status: 'INVALID_INPUT', payload: null });
  expect(buildPlacementReviewDraft({
    context: d1f,
    coordinate: { xM: NaN, yM: 5 },
    noteRaw: '120 cm',
  })).toEqual({ status: 'INVALID_INPUT', payload: null });
});

test('P137E allows a mapped click observation without fabricating an approved wall', () => {
  const result = buildPlacementReviewDraft({
    context: { ...d1f, floor: '2F' },
    coordinate: { xM: 3.235, yM: 5.063 },
    noteRaw: 'Kohde näkyy yläkerrassa.',
  });
  expect(result).toMatchObject({
    status: 'READY_FOR_G2_HANDOFF',
    payload: {
      anchor: { floor: '2F', xM: 3.235, yM: 5.063 },
      resolution: { status: 'UNMAPPED', reason: 'NO_APPROVED_HOST', proposal: null },
      observation: {
        noteRaw: 'Kohde näkyy yläkerrassa.',
        height: { status: 'NOT_SPECIFIED', zM: null },
      },
    },
  });
});

test('P137E keeps an opening-overlap as review evidence but never snaps it into a solid wall', () => {
  const result = buildPlacementReviewDraft({
    context: {
      ...d1f,
      approvedWallHosts: [{ ...d1f.approvedWallHosts[0], openings: [{ startM: 3, endM: 3.5 }] }],
    },
    coordinate: { xM: 3.235, yM: 5.063 },
    noteRaw: 'Oviverhon kohdalla, korkeus 1,4 m',
  });
  expect(result).toMatchObject({
    status: 'READY_FOR_G2_HANDOFF',
    payload: {
      resolution: { status: 'UNMAPPED', reason: 'OPENING_OVERLAP' },
      observation: {
        height: { status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.4, zM: null },
      },
    },
  });
});

test('P137E refuses oversized free notes rather than truncating review evidence silently', () => {
  const result = buildPlacementReviewDraft({
    context: d1f,
    coordinate: { xM: 3, yM: 5 },
    noteRaw: 'a'.repeat(2001),
  });
  expect(result).toEqual({ status: 'INVALID_INPUT', payload: null });
});
