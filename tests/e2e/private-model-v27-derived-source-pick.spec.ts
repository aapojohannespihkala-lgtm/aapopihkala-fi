import { expect, test } from '@playwright/test';
import { pickSelectableObjectAtClientPoint } from '../../src/scripts/privateModelSelectionPicking';

// V27: a review overlay may be rendered in front of a real C80 source mesh.
// It must not become the selected mesh/source card. This is a synthetic
// pointer/raycast contract, NOT authenticated C80 530 WebGL or sourceLinks QA.
type FakeHit = { object: any; point: { x: number; y: number; z: number }; distance: number; face: { materialIndex: number } };

const choose = (build: (root: any) => FakeHit[]) => {
  const root: any = { children: [{}], visible: true, userData: {}, parent: null };
  const hits = build(root);
  const pointer = { x: 99, y: 99 };
  let raycasts = 0;
  const selected = pickSelectableObjectAtClientPoint({
    canvas: {
      dataset: { interactionMode: 'select' } as DOMStringMap,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    },
    camera: {},
    modelRoot: root,
    raycaster: {
      setFromCamera: () => {},
      intersectObjects: () => { raycasts++; return hits; },
    },
    pointer,
    clientX: 50,
    clientY: 50,
    isEffectivelyVisible: () => true,
    hasVisibleMaterial: () => true,
  });
  expect(raycasts).toBe(1);
  expect(pointer).toEqual({ x: 0, y: 0 });
  return selected;
};

const mesh = (root: any, name: string, userData: Record<string, unknown> = {}) =>
  ({ name, isMesh: true, visible: true, material: { visible: true }, parent: root, userData });
const hit = (object: any, distance: number): FakeHit =>
  ({ object, distance, point: { x: 0, y: 0, z: 0 }, face: { materialIndex: 0 } });

test('V27: a viewerDerived foreground does not steal source-mesh selection', () => {
  const selected = choose(root => {
    const annotation = mesh(root, 'VIEWER_ANNOTATION', { viewerDerived: true });
    const source = mesh(root, 'C80_SOURCE_SOIL', { PresentationOnly: true });
    return [hit(annotation, 1), hit(source, 2)];
  });
  expect(selected?.name).toBe('C80_SOURCE_SOIL');
});

test('V27: an ancestor viewerDerived flag is also excluded', () => {
  const selected = choose(root => {
    const overlayParent: any = { parent: root, userData: { viewerDerived: true } };
    const annotation = mesh(overlayParent, 'NESTED_VIEWER_ANNOTATION');
    const source = mesh(root, 'C80_SOURCE_PLINTH');
    return [hit(annotation, 1), hit(source, 2)];
  });
  expect(selected?.name).toBe('C80_SOURCE_PLINTH');
});

test('V27: no source hit fails closed instead of selecting a review overlay', () => {
  const selected = choose(root => [
    hit(mesh(root, 'VIEWER_ONLY', { viewerDerived: true }), 1),
  ]);
  expect(selected).toBeNull();
});

test('V27: actual frontmost source soil is not replaced with an invented wall hit', () => {
  const selected = choose(root => [
    hit(mesh(root, 'C80_SOURCE_SOIL', { presentationOnly: true }), 1),
    hit(mesh(root, 'C80_SOURCE_WALL'), 2),
  ]);
  expect(selected?.name).toBe('C80_SOURCE_SOIL');
});
