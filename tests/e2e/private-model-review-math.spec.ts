import { expect, test } from '@playwright/test';

import {
  coordinateSteps,
  formatReviewCoordinate,
  heightScaleStepForSpan,
} from '../../src/scripts/privateModelReviewMath';

test('coordinateSteps keeps deterministic endpoints and decimal steps', () => {
  expect(coordinateSteps(2.5, 1)).toEqual([0, 1, 2, 2.5]);
  expect(coordinateSteps(2, 1)).toEqual([0, 1, 2]);
  expect(coordinateSteps(1, 0.25)).toEqual([0, 0.25, 0.5, 0.75, 1]);
});

test('formatReviewCoordinate uses three decimals and Finnish decimal comma', () => {
  expect(formatReviewCoordinate(12.3456)).toBe('12,346');
  expect(formatReviewCoordinate(0)).toBe('0,000');
  expect(formatReviewCoordinate(-0.125)).toBe('-0,125');
});

test('heightScaleStepForSpan preserves the exact review-scale thresholds', () => {
  expect(heightScaleStepForSpan(14)).toBe(1);
  expect(heightScaleStepForSpan(14.000001)).toBe(2);
  expect(heightScaleStepForSpan(28)).toBe(2);
  expect(heightScaleStepForSpan(28.000001)).toBe(5);
  expect(heightScaleStepForSpan(70)).toBe(5);
  expect(heightScaleStepForSpan(70.000001)).toBe(10);
});

import {
  createTargetBoundReviewAnchor,
  resolveTargetBoundReviewAnchor,
  parseReviewFreeNoteHeight,
  createTargetBoundReviewObservation,
  type ApprovedReviewWallHost,
} from '../../src/scripts/privateModelReviewCoordinates';

const approvedHost: ApprovedReviewWallHost = {
  g2Id: 'G2_WALL_D_1F_I04',
  floor: '1F',
  coordinateFrame: 'YLIS-G1-LOCAL',
  approvalEvidenceId: 'P117G_I04_USER_APPROVED',
  approved: true,
  axis: 'Y_FIXED',
  fixedM: 5.072,
  startM: 0.231,
  endM: 6.306,
  openingsComplete: true,
  openings: [{ startM: 4.1, endM: 4.85 }],
};

test('P137E target anchor preserves clicked D1F XY and remains non-current and non-exact', () => {
  const anchor = createTargetBoundReviewAnchor({
    targetId: 'D1F_USER_CURRENT_DOOR_A',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.063 },
  });
  expect(anchor).toMatchObject({
    targetId: 'D1F_USER_CURRENT_DOOR_A',
    apartment: 'D',
    floor: '1F',
    coordinateFrame: 'YLIS-G1-LOCAL',
    xM: 3.235,
    yM: 5.063,
    approximate: true,
    humanReview: 'NOT_RUN',
    exactXY: false,
    currentGeometry: false,
    canonical: false,
    asBuilt: false,
  });
  const resolved = resolveTargetBoundReviewAnchor(anchor!, [approvedHost]);
  expect(resolved.status).toBe('HOST_PROPOSED_WORK_TEST');
  expect(resolved.proposal).toMatchObject({
    hostG2Id: approvedHost.g2Id,
    hostApprovalEvidenceId: approvedHost.approvalEvidenceId,
    xM: 3.235,
    yM: 5.072,
    exactXY: false,
    currentGeometry: false,
    canonical: false,
    asBuilt: false,
  });
  expect(resolved.proposal?.perpendicularResidualM).toBeCloseTo(0.009, 6);
  expect(resolved.anchor.yM).toBe(5.063);
});

test('P137E D2F shares local XY frame but never inherits a D1F host', () => {
  const anchor = createTargetBoundReviewAnchor({
    targetId: 'D2F_DEVICE_EXAMPLE',
    floor: '2F',
    coordinate: { xM: 3.635, yM: 8 },
  })!;
  expect(resolveTargetBoundReviewAnchor(anchor, [approvedHost])).toMatchObject({
    status: 'UNMAPPED',
    reason: 'NO_APPROVED_HOST',
  });
  const upperHost: ApprovedReviewWallHost = {
    ...approvedHost,
    floor: '2F',
    g2Id: 'G2_D2F_WALL_REFERENCE',
    approvalEvidenceId: 'D2F_SCOPE_APPROVAL_EVIDENCE',
    axis: 'X_FIXED',
    fixedM: 3.635,
    startM: 7.366,
    endM: 10.82,
    openings: [],
  };
  expect(resolveTargetBoundReviewAnchor(anchor, [upperHost])).toMatchObject({
    status: 'HOST_PROPOSED_WORK_TEST',
    proposal: { hostG2Id: upperHost.g2Id, xM: 3.635, yM: 8 },
  });
});

test('P137E fail-closes unapproved/unknown hosts and invalid target identities', () => {
  expect(createTargetBoundReviewAnchor({
    targetId: '',
    floor: '1F',
    coordinate: { xM: 2, yM: 3 },
  })).toBeNull();
  expect(createTargetBoundReviewAnchor({
    targetId: 'D_DEVICE',
    floor: '1F',
    coordinate: { xM: Number.NaN, yM: 3 },
  })).toBeNull();
  const anchor = createTargetBoundReviewAnchor({
    targetId: 'D_DEVICE',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.063 },
  })!;
  expect(resolveTargetBoundReviewAnchor(anchor, [{ ...approvedHost, approved: false } as any]))
    .toMatchObject({ status: 'UNMAPPED', reason: 'NO_APPROVED_HOST' });
  expect(resolveTargetBoundReviewAnchor(anchor, [{ ...approvedHost, approvalEvidenceId: '' }]))
    .toMatchObject({ status: 'UNMAPPED', reason: 'NO_APPROVED_HOST' });
  expect(resolveTargetBoundReviewAnchor(anchor, [{ ...approvedHost, openingsComplete: false }]))
    .toMatchObject({ status: 'UNMAPPED', reason: 'NO_APPROVED_HOST' });
});

test('P137E never snaps to an opening, distant wall, or ambiguous intersecting hosts', () => {
  const doorAnchor = createTargetBoundReviewAnchor({
    targetId: 'D_DOOR',
    floor: '1F',
    coordinate: { xM: 4.4, yM: 5.072 },
  })!;
  expect(resolveTargetBoundReviewAnchor(doorAnchor, [approvedHost]))
    .toMatchObject({ status: 'UNMAPPED', reason: 'OPENING_OVERLAP' });

  const far = createTargetBoundReviewAnchor({
    targetId: 'D_DEVICE',
    floor: '1F',
    coordinate: { xM: 3, yM: 5.5 },
  })!;
  expect(resolveTargetBoundReviewAnchor(far, [approvedHost]))
    .toMatchObject({ status: 'UNMAPPED', reason: 'OUTSIDE_TOLERANCE' });

  const near = createTargetBoundReviewAnchor({
    targetId: 'D_DEVICE',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.063 },
  })!;
  const crossingHost: ApprovedReviewWallHost = {
    ...approvedHost,
    g2Id: 'G2_CROSSING',
    approvalEvidenceId: 'OTHER_APPROVAL',
    axis: 'X_FIXED',
    fixedM: 3.244,
    startM: 4.9,
    endM: 5.4,
    openings: [],
  };
  expect(resolveTargetBoundReviewAnchor(near, [approvedHost, crossingHost]))
    .toMatchObject({ status: 'UNMAPPED', reason: 'AMBIGUOUS_HOST' });
});


test('P137E anchor click defaults to OBJECT_CENTER and notes retain exact user words', () => {
  const anchor = createTargetBoundReviewAnchor({
    targetId: 'D_BEDROOM_THEMO',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.063 },
  })!;
  expect(anchor.targetPoint).toBe('OBJECT_CENTER');
  const note = '120 cm lattiasta. Bedroomin puolella seinää.';
  const observation = createTargetBoundReviewObservation(anchor, note)!;
  expect(observation).toMatchObject({
    anchor,
    noteRaw: note,
    targetPoint: 'OBJECT_CENTER',
    interpretation: 'WORK_TEST_ONLY',
    verifiedWallSide: false,
    exactZ: false,
    height: { status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.2, zM: null },
  });
});

test('P137E infers a side hint only from a safe approved wall centreline offset', () => {
  const anchor = createTargetBoundReviewAnchor({
    targetId: 'D_BEDROOM_THEMO',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.063 },
  })!;
  const west = resolveTargetBoundReviewAnchor(anchor, [approvedHost]);
  expect(west.proposal?.wallSideHint).toBe('Y_NEGATIVE');
  expect(west.anchor.yM).toBe(5.063);

  const opposite = createTargetBoundReviewAnchor({
    targetId: 'D_BEDROOM_THEMO',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.085 },
  })!;
  expect(resolveTargetBoundReviewAnchor(opposite, [approvedHost]).proposal?.wallSideHint)
    .toBe('Y_POSITIVE');

  const onCentreline = createTargetBoundReviewAnchor({
    targetId: 'D_BEDROOM_THEMO',
    floor: '1F',
    coordinate: { xM: 3.235, yM: 5.072 },
  })!;
  expect(resolveTargetBoundReviewAnchor(onCentreline, [approvedHost]).proposal?.wallSideHint)
    .toBeNull();
  expect(resolveTargetBoundReviewAnchor(anchor, []).status).toBe('UNMAPPED');
});

test('P137E extracts plain Finnish centre-height shorthand and explicit height, no fabricated Z', () => {
  expect(parseReviewFreeNoteHeight('120 cm'))
    .toEqual({ status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.2, zM: null });
  expect(parseReviewFreeNoteHeight('1,2 m valmiista lattiasta.'))
    .toEqual({ status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.2, zM: null });
  expect(parseReviewFreeNoteHeight('Korkeus 120 cm; leveys 90 cm.'))
    .toEqual({ status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.2, zM: null });
  expect(parseReviewFreeNoteHeight('2026 Themo, keskipisteen korkeus 1.25 m'))
    .toEqual({ status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 1.25, zM: null });
  expect(parseReviewFreeNoteHeight('0 cm'))
    .toEqual({ status: 'FLOOR_RELATIVE_PARSED', aboveFinishedFloorM: 0, zM: null });
});

test('P137E never guesses floor-height from underground depths, unrelated dimensions or conflicts', () => {
  expect(parseReviewFreeNoteHeight('Termostaatti seinällä'))
    .toMatchObject({ status: 'NOT_SPECIFIED', zM: null });
  expect(parseReviewFreeNoteHeight('50 cm oikealle'))
    .toMatchObject({ status: 'NOT_SPECIFIED', zM: null });
  expect(parseReviewFreeNoteHeight('Salaojaputken syvyys 120 cm maanpinnasta'))
    .toMatchObject({ status: 'NOT_SPECIFIED', zM: null });
  expect(parseReviewFreeNoteHeight('120 cm ja 150 cm lattiasta'))
    .toMatchObject({ status: 'AMBIGUOUS', zM: null });
  expect(parseReviewFreeNoteHeight('korkeus 120 cm, korkeus 130 cm'))
    .toMatchObject({ status: 'AMBIGUOUS', zM: null });
  expect(parseReviewFreeNoteHeight('-120 cm'))
    .toMatchObject({ status: 'AMBIGUOUS', zM: null });
});
