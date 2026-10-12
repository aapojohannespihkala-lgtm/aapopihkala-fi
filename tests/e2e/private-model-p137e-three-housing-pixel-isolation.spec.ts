import { expect, test } from '@playwright/test';
// @ts-ignore untyped ESM helper is used by Node and future production workflows.
import {
  inspectP137EThreeHousingPixelIsolation,
  P137E_HOUSING_CANDIDATE_ID,
  P137E_HOUSING_REVIEW_ID,
  P137E_HOUSING_EXPECTED_SHA256,
  P137E_HOUSING_EXPECTED_BYTES,
  P137E_HOUSING_IDS,
} from '../../src/scripts/privateModelP137EThreeHousingPixelIsolation.mjs';

// SYNTHETIC, decoded RGBA fixtures: test fail-closed isolation math only.
// They are NOT screenshots of a real GLB, Chromium or authenticated production.
const w = 256, h = 256;
const allIds = [...P137E_HOUSING_IDS.NORTH, ...P137E_HOUSING_IDS.SOUTH];
const rgba = () => {
  const frame = new Uint8Array(w * h * 4);
  for (let i = 0; i < frame.length; i += 4) {
    frame[i] = 235; frame[i + 1] = 235; frame[i + 2] = 235; frame[i + 3] = 255;
  }
  return frame;
};
const paint = (frame: Uint8Array, x: number, y: number) => {
  for (let yy = y - 5; yy <= y + 5; yy++) {
    for (let xx = x - 5; xx <= x + 5; xx++) {
      const k = (yy * w + xx) * 4;
      frame[k] = 40; frame[k + 1] = 50; frame[k + 2] = 75;
    }
  }
};
const scene = () => ({
  reviewId: P137E_HOUSING_REVIEW_ID,
  candidateId: P137E_HOUSING_CANDIDATE_ID,
  glbSha256: P137E_HOUSING_EXPECTED_SHA256,
  glbBytes: P137E_HOUSING_EXPECTED_BYTES,
  sceneIndex: 67, wallNode: 798, wallMesh: 406,
  workTestOnly: true, presentationOnly: true,
  current: false, canonical: false, asBuilt: false,
  humanReview: 'NOT_RUN',
});
function fixture() {
  const centers = {
    [P137E_HOUSING_IDS.NORTH[0]]: { x: 80, y: 115, radius: 17 },
    [P137E_HOUSING_IDS.SOUTH[0]]: { x: 75, y: 130, radius: 17 },
    [P137E_HOUSING_IDS.SOUTH[1]]: { x: 181, y: 130, radius: 17 },
  };
  const faces = (['NORTH', 'SOUTH'] as const).map(side => {
    const selected = [...P137E_HOUSING_IDS[side]];
    const baseline = rgba();
    const hidden = allIds.map(id => {
      const image = new Uint8Array(baseline);
      const target = centers[id];
      if (selected.includes(id)) paint(image, target.x, target.y);
      return { hiddenLogicalDeviceId: id, rgba: image };
    });
    return {
      side, cameraKey: 'P137E_SCENE67_P123C_' + side,
      width: w, height: h, visibleDeviceIds: selected,
      regions: selected.map(id => ({ logicalDeviceId: id, ...centers[id] })),
      baseline, hidden,
    };
  });
  return { ...scene(), faces };
}

test('three separate visible housing deltas and all wrong-face negatives pass math only', () => {
  const result = inspectP137EThreeHousingPixelIsolation(fixture());
  expect(result).toMatchObject({
    independentVisibleHousingPixelCount: 3,
    rgbaIsolationMathPassed: true,
    authenticatedProductionBrowserVerified: false,
    originalGlbLoadedInThatBrowserVerified: false,
    humanReview: 'NOT_RUN', publishToCURRENT: false, releaseHumanReview: false,
  });
  const n = result.north, s = result.south;
  expect(n[allIds[0]].inside).toBe(121);
  expect(n[allIds[1]].total).toBe(0);
  expect(n[allIds[2]].total).toBe(0);
  expect(s[allIds[0]].total).toBe(0);
  expect(s[allIds[1]].inside).toBe(121);
  expect(s[allIds[2]].inside).toBe(121);
});

test('each real-face Themo must change independently, not just another housing', () => {
  for (const [faceIndex, targetIndex] of [[0,0],[1,1],[1,2]]) {
    const f = fixture();
    f.faces[faceIndex].hidden[targetIndex].rgba =
      new Uint8Array(f.faces[faceIndex].baseline);
    expect(() => inspectP137EThreeHousingPixelIsolation(f))
      .toThrow(/missing\/isolation-failed visible housing pixels/);
  }
});

test('wrong-wall source devices must produce zero significant pixels', () => {
  for (const [faceIndex, variantIndex] of [[0,1],[0,2],[1,0]]) {
    const f = fixture();
    paint(f.faces[faceIndex].hidden[variantIndex].rgba, 140, 90);
    expect(() => inspectP137EThreeHousingPixelIsolation(f))
      .toThrow(/wrong-face ghost pixels/);
  }
});

test('a changed overlay pixel outside the one housing ROI is rejected', () => {
  const f = fixture();
  paint(f.faces[1].hidden[1].rgba, 140, 30);
  expect(() => inspectP137EThreeHousingPixelIsolation(f))
    .toThrow(/missing\/isolation-failed visible housing pixels/);
});

test('source ID, camera, crop, order, cardinality and bytes fail shut', () => {
  const tamper = [
    (f: any) => { f.reviewId += '-other'; },
    (f: any) => { f.candidateId = 'other'; },
    (f: any) => { f.glbSha256 = '0'.repeat(64); },
    (f: any) => { f.glbBytes -= 1; },
    (f: any) => { f.sceneIndex = 68; },
    (f: any) => { f.wallMesh = 405; },
    (f: any) => { f.faces[0].cameraKey = 'ORTHO_INFERRED'; },
    (f: any) => { f.faces.reverse(); },
    (f: any) => { f.faces[1].visibleDeviceIds.reverse(); },
    (f: any) => { f.faces[1].regions[0].x = 1; },
    (f: any) => { f.faces[1].regions[1].x = 85; },
    (f: any) => { f.faces[1].hidden.pop(); },
    (f: any) => { f.faces[0].hidden[0].hiddenLogicalDeviceId = allIds[2]; },
    (f: any) => { f.faces[0].hidden[0].rgba = new Uint8Array(123); },
    (f: any) => { f.faces[0].baseline = null; },
  ];
  for (const mutate of tamper) {
    const input = fixture();
    mutate(input);
    expect(() => inspectP137EThreeHousingPixelIsolation(input)).toThrow();
  }
});

test('no synthetic RGBA array can ever promote WORK_TEST or HUMAN_REVIEW', () => {
  for (const key of ['current','canonical','asBuilt','humanReview','workTestOnly'] as const) {
    const f: any = fixture();
    f[key] = key === 'humanReview' ? 'PASS' : key === 'workTestOnly' ? false : true;
    expect(() => inspectP137EThreeHousingPixelIsolation(f))
      .toThrow(/no-promotion/);
  }
});
