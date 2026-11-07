import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTechnicalReviewPresentation,
  resolveTechnicalReviewRoots,
} from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';
import {
  V71_SOURCE_SHA256, V71_SOURCE_SCENE_COUNT, V71_FLOORS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V71LayerSourceProfile.mjs';
import { V69P12R1_BUILDING_SCENES } from '../../src/scripts/privateModelC80R2V69P12R1LayerSourceProfile.mjs';

const node = (name, extra = {}) => {
  const object = { name, parent: null, children: [], ...extra };
  object.add = (child) => { child.parent = object; object.children.push(child); return object; };
  object.traverse = (visit) => { visit(object); for (const child of object.children) child.traverse(visit); };
  return object;
};
const disposable = (label) => ({ label, disposed: false, dispose() { this.disposed = true; } });

test('V71 profile inherits V69P12R1 scenes for the three new floor scenes', () => {
  assert.equal(V71_SOURCE_SCENE_COUNT, 298);
  assert.deepEqual({ ...V71_FLOORS }, { '1F': 295, '2F': 296, BOTH: 297 });
  for (const [index, old, floor] of [[295, 290, '1F'], [296, 293, '2F'], [297, 294, 'BOTH']]) {
    const scene = V71_BUILDING_SCENES[index];
    assert.equal(scene.floor, floor);
    assert.ok(!scene.rootNodes.includes(2506), 'IV KIV proxy root removed');
    for (const [nodeIndex, routes] of Object.entries(scene.paths)) {
      assert.ok(routes.every(path => scene.rootNodes.includes(path[0])), `path root kept for ${nodeIndex}`);
      assert.ok(V69P12R1_BUILDING_SCENES[old].paths[nodeIndex], 'only inherited V69P12R1 paths');
    }
    for (const { node: root } of V71_TECHNICAL_REVIEW_ROOTS[index]) assert.ok(scene.rootNodes.includes(root));
  }
});

test('review greys only non-technical renderables and restores originals', () => {
  const root = node('scene');
  const wallMaterial = disposable('wall');
  const wall = node('wall', { isMesh: true, material: wallMaterial });
  const edge = node('edge', { isLineSegments: true, material: disposable('edge') });
  const tech = node('M5_ROOT');
  const pipeMaterial = disposable('pipe');
  const pipe = node('pipe', { isMesh: true, material: pipeMaterial });
  const multi = node('multi', { isMesh: true, material: [disposable('a'), disposable('b')] });
  root.add(wall).add(edge).add(tech).add(multi);
  tech.add(pipe);
  const created = [];
  const review = createTechnicalReviewPresentation(root, [tech], () => {
    const materials = { surface: disposable('grey'), line: disposable('greyLine') };
    created.push(materials);
    return materials;
  });

  assert.equal(review.apply(true), true);
  assert.equal(wall.material.label, 'grey');
  assert.equal(edge.material.label, 'greyLine');
  assert.deepEqual(multi.material.map(item => item.label), ['grey', 'grey']);
  assert.equal(pipe.material, pipeMaterial, 'technical subtree keeps its material');
  assert.equal(review.changedCount, 3);

  assert.equal(review.apply(false), false);
  assert.equal(wall.material, wallMaterial);
  assert.equal(pipe.material, pipeMaterial);
  assert.deepEqual(multi.material.map(item => item.label), ['a', 'b']);

  review.apply(true);
  review.dispose();
  assert.equal(wall.material, wallMaterial, 'dispose restores first');
  assert.equal(created.length, 1, 'shared materials created once');
  assert.ok(created[0].surface.disposed && created[0].line.disposed);
  assert.equal(review.apply(true), false, 'disposed presentation does nothing');
  assert.equal(wall.material, wallMaterial);
});

test('technical roots resolve only for the exact V71 source scene', () => {
  const sceneIndex = 297;
  const scene = node('Scene');
  const associations = new Map();
  const nodes = [];
  const jsonScenes = Array.from({ length: V71_SOURCE_SCENE_COUNT }, () => ({ nodes: [] }));
  jsonScenes[sceneIndex] = { name: V71_BUILDING_SCENES[sceneIndex].name, nodes: [] };
  for (const { node: index, name } of V71_TECHNICAL_REVIEW_ROOTS[sceneIndex]) {
    nodes[index] = { name };
    jsonScenes[sceneIndex].nodes.push(index);
    const object = node(name);
    scene.add(object);
    associations.set(object, { nodes: index });
  }
  const gltf = {
    scenes: Object.assign([], { [sceneIndex]: scene }),
    parser: {
      associations,
      json: {
        scenes: jsonScenes, nodes,
        asset: { extras: { current: false, asBuilt: false, viewerFloorScenes: { ...V71_FLOORS } } },
      },
    },
  };
  const roots = resolveTechnicalReviewRoots(gltf, scene, sceneIndex, V71_SOURCE_SHA256, V71_SOURCE_SHA256);
  assert.equal(roots?.length, V71_TECHNICAL_REVIEW_ROOTS[sceneIndex].length);
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, sceneIndex, V71_SOURCE_SHA256, '0'.repeat(64)), null);
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, 294, V71_SOURCE_SHA256, V71_SOURCE_SHA256), null);
  gltf.parser.json.asset.extras.current = true;
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, sceneIndex, V71_SOURCE_SHA256, V71_SOURCE_SHA256), null);
});
