import {expect, test} from '@playwright/test';
import * as THREE from 'three';
import {createP186ECaptionLayout} from '../../src/scripts/privateModelP186ECaptionLayout.mjs';

test('hidden source-proof captions do no scene/camera/layout work and fully restore on visibility', () => {
  // The canvas metrics are a stub: this checks actual Three transforms and
  // unnecessary scene work, not rendered glyphs or authenticated source bytes.
  const context = {font: '', fillStyle: '', textAlign: '', textBaseline: '',
    fillRect: () => {}, fillText: () => {}, measureText: (text: string) => ({width: text.length * 12})};
  const textureCanvas = {width: 640, height: 96, getContext: () => context};
  const root = new THREE.Group();
  // A nontrivial scene makes accidental hidden-frame traversal observable.
  for (let i = 0; i < 1100; i++) root.add(new THREE.Object3D());
  const source = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-.08, 0, 0), new THREE.Vector3(.08, 0, 0),
    new THREE.Vector3(0, 0, -.08), new THREE.Vector3(0, 0, .08),
  ]), new THREE.LineBasicMaterial());
  source.userData = {p186eReviewVariant: 'D1F', p186eReviewRole: 'QUESTION_TARGET_80',
    representationKind: 'electricalGroupSourceLabelAnchor', annotationStableKey: 'D1F_GROUP_1', sourceGroupKey: '10.2'};
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: new THREE.CanvasTexture(textureCanvas as any)}));
  sprite.userData = {p186eViewerSourceCaption: true}; source.add(sprite); root.add(source);
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 100);
  camera.position.set(0, 10, 0); camera.up.set(0, 0, -1); camera.lookAt(0, 0, 0);
  let rootUpdates = 0, cameraUpdates = 0, rectReads = 0;
  const updateRoot = root.updateMatrixWorld.bind(root), updateCamera = camera.updateMatrixWorld.bind(camera);
  root.updateMatrixWorld = (force?: boolean) => {rootUpdates++; updateRoot(force);};
  camera.updateMatrixWorld = (force?: boolean) => {cameraUpdates++; updateCamera(force);};
  const canvas = {dataset: {} as Record<string, string>, getBoundingClientRect: () => {rectReads++; return {width: 1000, height: 1000};}};
  const controller = createP186ECaptionLayout({THREE, root, canvas, floor: 'D1F'});
  controller.update(camera);
  const shown = JSON.parse(canvas.dataset.p186eCaptionLayout);
  expect(shown).toMatchObject({state: 'READABLE', laidOutCount: 1, allSourceCaptionsInView: true});
  const geometry = Array.from(source.geometry.attributes.position.array), pose = source.matrixWorld.toArray();
  const before = {rootUpdates, cameraUpdates, rectReads};
  sprite.visible = false;
  for (let i = 0; i < 100; i++) controller.update(camera);
  expect({rootUpdates, cameraUpdates, rectReads}).toEqual(before);
  expect(JSON.parse(canvas.dataset.p186eCaptionLayout)).toMatchObject({
    state: 'CAPTIONS_TEMPORARILY_HIDDEN', laidOutCount: 0, allSourceCaptionsInView: false, pixelsVerified: false,
  });
  sprite.visible = true;
  controller.update(camera);
  expect(JSON.parse(canvas.dataset.p186eCaptionLayout)).toEqual(shown);
  expect(rootUpdates).toBeGreaterThan(before.rootUpdates);
  expect(Array.from(source.geometry.attributes.position.array)).toEqual(geometry);
  expect(source.matrixWorld.toArray()).toEqual(pose);
});
