import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTechnicalReviewPresentation,
  technicalReviewSystemOf,
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

test('kept technical meshes get their system highlight and are restored', () => {
  const root = node('scene');
  const tech = node('M5_ROOT');
  const cableMaterial = disposable('cable');
  const cable = node('cable', { isMesh: true, material: cableMaterial, userData: { m5System: 'SAHKO' } });
  const device = node('device', { isMesh: true, material: disposable('device'), userData: {} });
  tech.userData = {};
  root.add(tech).add(device);
  tech.add(cable);
  const review = createTechnicalReviewPresentation(root, [tech, device], () => ({
    surface: disposable('grey'), line: disposable('greyLine'), systems: { SAHKO: disposable('orange') },
  }), object => technicalReviewSystemOf(object, root));
  review.apply(true);
  assert.equal(cable.material.label, 'orange');
  assert.equal(device.material.label, 'device', 'unclassified kept device keeps its own material');
  review.apply(false);
  assert.equal(cable.material, cableMaterial);
});

test('V72 reuses V71 scene roots under renamed scenes and resolves its exact technical roots', async () => {
  const v72 = await import('../../src/scripts/privateModelC80R2V72LayerSourceProfile.mjs');
  assert.equal(v72.V72_SOURCE_SCENE_COUNT, V71_SOURCE_SCENE_COUNT);
  assert.deepEqual({ ...v72.V72_FLOORS }, { ...V71_FLOORS });
  for (const index of [295, 296, 297]) {
    assert.deepEqual(v72.V72_BUILDING_SCENES[index].rootNodes, V71_BUILDING_SCENES[index].rootNodes);
    assert.match(v72.V72_BUILDING_SCENES[index].name, /^C80R2_V72_M5_CONCEALED_ROUTES_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
  }
  const sceneIndex = 296;
  const scene = node('Scene');
  const associations = new Map();
  const nodes = [];
  const jsonScenes = Array.from({ length: 298 }, () => ({ nodes: [] }));
  jsonScenes[sceneIndex] = { name: v72.V72_BUILDING_SCENES[sceneIndex].name, nodes: [] };
  for (const { node: index, name } of v72.V72_TECHNICAL_REVIEW_ROOTS[sceneIndex]) {
    nodes[index] = { name };
    jsonScenes[sceneIndex].nodes.push(index);
    const object = node(name);
    scene.add(object);
    associations.set(object, { nodes: index });
  }
  const gltf = { scenes: Object.assign([], { [sceneIndex]: scene }), parser: { associations, json: {
    scenes: jsonScenes, nodes, asset: { extras: { current: false, asBuilt: false, viewerFloorScenes: { ...v72.V72_FLOORS } } } } } };
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, sceneIndex, v72.V72_SOURCE_SHA256, v72.V72_SOURCE_SHA256)?.length, 1);
  assert.equal(resolveTechnicalReviewRoots(gltf, scene, sceneIndex, V71_SOURCE_SHA256, V71_SOURCE_SHA256), null, 'V71 scene name does not match V72 scene');
});

test('V73 profile keeps V71 roots under its own scene names and SHA', async () => {
  const v73 = await import('../../src/scripts/privateModelC80R2V73LayerSourceProfile.mjs');
  assert.equal(v73.V73_SOURCE_SHA256, 'c84f087b8a5f8db0cd9dfb9a0eefec7e13328ca3dc84d46c5bbde1bf996e6e35');
  for (const index of [295, 296, 297]) {
    assert.deepEqual(v73.V73_BUILDING_SCENES[index].rootNodes, V71_BUILDING_SCENES[index].rootNodes);
    assert.match(v73.V73_BUILDING_SCENES[index].name, /^C80R2_V73_M5_ANCHORED_ROUTES_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
  }
});

test('V74 profile keeps V71 roots under its own scene names and SHA', async () => {
  const v74 = await import('../../src/scripts/privateModelC80R2V74LayerSourceProfile.mjs');
  assert.equal(v74.V74_SOURCE_SHA256, '76e737678c3c2d25484459eb7f192becfb1084fbdfc4ed1830ea852e8834ea1d');
  for (const index of [295, 296, 297]) {
    assert.deepEqual(v74.V74_BUILDING_SCENES[index].rootNodes, V71_BUILDING_SCENES[index].rootNodes);
    assert.match(v74.V74_BUILDING_SCENES[index].name, /^C80R2_V74_M5_HOSTED_ROUTES_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
  }
});

test('V75 profile keeps V71 roots under its own scene names and SHA', async () => {
  const v75 = await import('../../src/scripts/privateModelC80R2V75LayerSourceProfile.mjs');
  assert.equal(v75.V75_SOURCE_SHA256, '2377e02d8843b07665a819965217ae20053be9ab82e02d9aad05cf1cc8e69070');
  for (const index of [295, 296, 297]) {
    assert.deepEqual(v75.V75_BUILDING_SCENES[index].rootNodes, V71_BUILDING_SCENES[index].rootNodes);
    assert.match(v75.V75_BUILDING_SCENES[index].name, /^C80R2_V75_M5_CONNECTED_SYSTEMS_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
  }
});

test('V76 profile replaces only the old stair roots with the K17 900 mm stair and rail', async () => {
  const v76 = await import('../../src/scripts/privateModelC80R2V76LayerSourceProfile.mjs');
  assert.equal(v76.V76_SOURCE_SHA256, '3ef900c1f5e88d65df99d2875022c152116d2a8a9b14dd52b53d4de4394a0971');
  const removed = new Set([9841, 9842, 9843, 9800, 9801, 9802, 9803, 9844, 9805]);
  for (const index of [295, 296, 297]) {
    const scene = v76.V76_BUILDING_SCENES[index];
    assert.ok(!scene.rootNodes.some(n => removed.has(n)), 'old 950 mm stair roots removed');
    assert.match(scene.name, /^C80R2_V76_M5_SYSTEMS_K17_STAIR900_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    assert.deepEqual(scene.rootNodes.filter(n => n < 10518), V71_BUILDING_SCENES[index].rootNodes.filter(n => !removed.has(n)));
    assert.ok(scene.rootNodes.includes(10538), 'fitted K17 handrail root present');
    for (const [node, paths] of Object.entries(scene.paths)) {
      assert.ok(v76.V76_BUILDING_PARTS[node], `part ${node} has profile`);
      for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
    }
  }
  assert.equal(v76.V76_BUILDING_PARTS[10538].name, 'K17_RAIL_HANDRAIL_FITTED_TO_900MM_STAIR');
});

test('V77 profile reuses V76 roots and paths under its own scene names and SHA', async () => {
  const v76 = await import('../../src/scripts/privateModelC80R2V76LayerSourceProfile.mjs');
  const v77 = await import('../../src/scripts/privateModelC80R2V77LayerSourceProfile.mjs');
  assert.equal(v77.V77_SOURCE_SHA256, 'f2332d26637187871b20e52b6d4251b80325db47df87b82f39c5e382312aa9df');
  for (const index of [295, 296, 297]) {
    assert.deepEqual(v77.V77_BUILDING_SCENES[index].rootNodes, v76.V76_BUILDING_SCENES[index].rootNodes);
    assert.deepEqual(v77.V77_BUILDING_SCENES[index].paths, v76.V76_BUILDING_SCENES[index].paths);
    assert.match(v77.V77_BUILDING_SCENES[index].name, /^C80R2_V77_K17_STAIR900_NWALL110_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
  }
});

test('V78 profile reuses V77 roots and paths under its own scene names and SHA', async () => {
  const v77 = await import('../../src/scripts/privateModelC80R2V77LayerSourceProfile.mjs');
  const v78 = await import('../../src/scripts/privateModelC80R2V78LayerSourceProfile.mjs');
  assert.equal(v78.V78_SOURCE_SHA256, '63e4764e4c60c412497376e8ac41978d00fa0f7c84d85ad5088e206479e4cefa');
  for (const index of [295, 296, 297]) {
    assert.deepEqual(v78.V78_BUILDING_SCENES[index].rootNodes, v77.V77_BUILDING_SCENES[index].rootNodes);
    assert.deepEqual(v78.V78_BUILDING_SCENES[index].paths, v77.V77_BUILDING_SCENES[index].paths);
    assert.match(v78.V78_BUILDING_SCENES[index].name, /^C80R2_V78_ZFIGHT_CEIL_FIX_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
  }
});

test('V79 profile drops old kitchen duplicates and the NE eave closure, adds balcony glass roots', async () => {
  const v79 = await import('../../src/scripts/privateModelC80R2V79LayerSourceProfile.mjs');
  assert.equal(v79.V79_SOURCE_SHA256, '77cfe743ff8a190944bdf91c0e4e6ee6b81384cbecad6bb17882326a0f890cc4');
  for (const index of [295, 296, 297]) {
    const scene = v79.V79_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V79_OWNER_FIXES_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const removed of [7748, 7766, 9259]) assert.ok(!scene.rootNodes.includes(removed));
    for (const [node, paths] of Object.entries(scene.paths)) {
      assert.ok(v79.V79_BUILDING_PARTS[node]);
      for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
    }
  }
  for (const index of [296, 297]) assert.ok(v79.V79_BUILDING_SCENES[index].rootNodes.includes(10555));
});

test('V80 profile swaps the legacy terrace window roots for the C80-012 V4 window', async () => {
  const v80 = await import('../../src/scripts/privateModelC80R2V80LayerSourceProfile.mjs');
  assert.equal(v80.V80_SOURCE_SHA256, '3b2916a1d439b88878685b035121f6ad3aeee85e55ef74dab20e80a943ebaeab');
  for (const index of [295, 297]) {
    const scene = v80.V80_BUILDING_SCENES[index];
    for (const legacy of [7649, 7650, 7659]) assert.ok(!scene.rootNodes.includes(legacy));
    assert.ok(scene.rootNodes.includes(10563) && scene.rootNodes.includes(8843));
  }
  for (const index of [295, 296, 297]) {
    const scene = v80.V80_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V80_GPT_FIXES_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});
