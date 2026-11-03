import { expect, test } from '@playwright/test';

import { hasVisibleMaterial } from '../../src/scripts/privateModelObjectVisibility';
import { pickSelectableObjectAtClientPoint } from '../../src/scripts/privateModelSelectionPicking';

type FakeHit = { object: any; face?: { materialIndex?: number } | null };

const pick = (hits: FakeHit[], mode = 'select') => {
  const canvas = {
    dataset: { interactionMode: mode },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  };
  const modelRoot = { children: hits.map((hit) => hit.object) };
  return pickSelectableObjectAtClientPoint({
    canvas,
    camera: {},
    modelRoot,
    raycaster: {
      setFromCamera: () => {},
      intersectObjects: () => hits,
    },
    pointer: { x: 0, y: 0 },
    clientX: 50,
    clientY: 50,
    isEffectivelyVisible: (object) => object.visible !== false,
    hasVisibleMaterial,
  });
};

test('selection skips a hidden multimaterial face even when a sibling face is visible', () => {
  const front = {
    isMesh: true,
    visible: true,
    material: [{ opacity: 0 }, { opacity: 1 }],
  };
  const wall = { isMesh: true, visible: true, material: { opacity: 1 } };

  expect(pick([{ object: front, face: { materialIndex: 0 } }, { object: wall }])).toBe(wall);
  expect(pick([{ object: front, face: { materialIndex: 1 } }, { object: wall }])).toBe(front);
});

test('invalid material-group indices do not steal a hit from the visible object behind', () => {
  const front = {
    isMesh: true,
    visible: true,
    material: [{ opacity: 1 }, { opacity: 1 }],
  };
  const wall = { isMesh: true, visible: true, material: { opacity: 1 } };

  expect(pick([{ object: front, face: { materialIndex: -1 } }, { object: wall }])).toBe(wall);
  expect(pick([{ object: front, face: { materialIndex: 2 } }, { object: wall }])).toBe(wall);
  expect(pick([{ object: front, face: { materialIndex: 0.5 } }, { object: wall }])).toBe(wall);
});

test('single-material, line, missing-face and select-mode legacy paths remain available', () => {
  const line = { isLineSegments: true, visible: true, material: [{ opacity: 0 }, { opacity: 1 }] };
  const mesh = { isMesh: true, visible: true, material: { opacity: 1 } };
  const multi = { isMesh: true, visible: true, material: [{ opacity: 0 }, { opacity: 1 }] };

  expect(pick([{ object: line }])).toBe(line);
  expect(pick([{ object: mesh }])).toBe(mesh);
  expect(pick([{ object: multi }])).toBe(multi);
  expect(pick([{ object: mesh }], 'orbit')).toBeNull();
});
