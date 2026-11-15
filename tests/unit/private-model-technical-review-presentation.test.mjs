import test from 'node:test';
// Keep the hit-through source/pixel regression in the existing required CI test set.
import './private-model-technical-review-hit-priority.test.mjs';
import '../../src/scripts/privateModelKORJ7TechnicalReviewCompositeRoots.test.mjs';
import assert from 'node:assert/strict';
import {
  createTechnicalReviewPresentation,
  technicalReviewSystemOf,
  resolveTechnicalReviewRoots,
  appendSourceExactH24Children,
} from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';
import { SUCCESSOR_R1_SHA256 } from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
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
  const originalDeviceMaterial = disposable('device');
  const device = node('device', { isMesh: true, material: originalDeviceMaterial, userData: {} });
  tech.userData = {};
  root.add(tech).add(device);
  tech.add(cable);
  const review = createTechnicalReviewPresentation(root, [tech, device], () => ({
    surface: disposable('grey'), line: disposable('greyLine'), systems: { SAHKO: disposable('orange') },
  }), object => technicalReviewSystemOf(object, root));
  review.apply(true);
  assert.equal(cable.material.label, 'orange');
  assert.equal(device.material.label, 'grey', 'unknown mesh inside technical root must be grey');
  review.apply(false);
  assert.equal(cable.material, cableMaterial);
  assert.equal(device.material, originalDeviceMaterial, 'material restored after toggle off');
});

test('explicit visual descendants block inherited technical palette and restore originals', () => {
  const root = node('scene');
  const mixed = node('mixed fixture root', { userData: { m5System: 'VESI' } });
  const visualWrapper = node('WC cabinet wrapper', { userData: { presentationOnly: true } });
  const panelSource = disposable('cabinet-original');
  const coverSource = disposable('cover-original');
  const pipeSource = disposable('pipe-original');
  const panel = node('cabinet face', { isMesh: true, material: panelSource, userData: {} });
  const cover = node('service cover', { isMesh: true, material: coverSource, userData: { m5System: null } });
  const pipe = node('verified water line', { isMesh: true, material: pipeSource, userData: { m5System: 'VESI' } });
  root.add(mixed);
  mixed.add(visualWrapper).add(cover).add(pipe);
  visualWrapper.add(panel);
  const review = createTechnicalReviewPresentation(root, [mixed], () => ({
    surface: disposable('grey'), line: disposable('greyLine'),
    systems: { VESI: disposable('blue') },
  }), object => technicalReviewSystemOf(object, root));
  assert.equal(technicalReviewSystemOf(panel, root), null, 'visual wrapper stops inherited water role');
  assert.equal(technicalReviewSystemOf(cover, root), null, 'explicitly neutral leaf stops inherited water role');
  assert.equal(technicalReviewSystemOf(pipe, root), 'VESI', 'exact child role retains system color');
  assert.equal(review.apply(true), true);
  assert.equal(panel.material.label, 'grey');
  assert.equal(cover.material.label, 'grey');
  assert.equal(pipe.material.label, 'blue');
  assert.equal(review.apply(false), false);
  assert.equal(panel.material, panelSource);
  assert.equal(cover.material, coverSource);
  assert.equal(pipe.material, pipeSource);
  review.dispose();
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

test('V81 profile carries the owner fixes: stairwell infill, balcony slab, 1F reference soffit, no hidden BOTH posts', async () => {
  const v81 = await import('../../src/scripts/privateModelC80R2V81LayerSourceProfile.mjs');
  assert.equal(v81.V81_SOURCE_SHA256, 'f57a11cb2dab3b92dc02e11842821c4b940e9225bc9133fe7e7a6979198d5ccd');
  assert.equal(v81.V81_BUILDING_PARTS[10658].id, 'architecture-walls-interior');
  assert.equal(v81.V81_BUILDING_PARTS[10659].id, 'architecture-floors');
  for (const index of [295, 296, 297]) assert.ok(v81.V81_BUILDING_SCENES[index].rootNodes.includes(10658));
  assert.ok(v81.V81_BUILDING_SCENES[295].rootNodes.includes(10660) && !v81.V81_BUILDING_SCENES[295].rootNodes.includes(9276));
  assert.ok(v81.V81_BUILDING_SCENES[297].rootNodes.includes(9276) && !v81.V81_BUILDING_SCENES[297].rootNodes.includes(6727));
  for (const post of [9357, 9359, 9361, 9363]) assert.ok(!v81.V81_BUILDING_SCENES[297].rootNodes.includes(post));
  for (const index of [295, 296, 297]) {
    const scene = v81.V81_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V81_OWNER_FIXES2_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V82 profile keeps V81 parts and renames the sauna scenes', async () => {
  const v82 = await import('../../src/scripts/privateModelC80R2V82LayerSourceProfile.mjs');
  const v81 = await import('../../src/scripts/privateModelC80R2V81LayerSourceProfile.mjs');
  assert.equal(v82.V82_SOURCE_SHA256, 'd027eb4689f3dfda5a401dbb510253dbc197cf3b11dfbba5cadd1eca180ea8b8');
  assert.equal(v82.V82_BUILDING_PARTS, v81.V81_BUILDING_PARTS);
  for (const index of [295, 297]) for (const root of [10755, 10761]) assert.ok(v82.V82_BUILDING_SCENES[index].rootNodes.includes(root));
  for (const index of [295, 296, 297]) {
    const scene = v82.V82_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V82_SAUNA_V29U_V35_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V83 profile re-keys mesh-drifted parts and renames the owner fixes 3 scenes', async () => {
  const v83 = await import('../../src/scripts/privateModelC80R2V83LayerSourceProfile.mjs');
  const v82 = await import('../../src/scripts/privateModelC80R2V82LayerSourceProfile.mjs');
  assert.equal(v83.V83_SOURCE_SHA256, '4a724a1840e87cc54d1a23fc77ff3638754364c1109b86ca2f44738f1de50db9');
  assert.equal(Object.keys(v83.V83_BUILDING_PARTS).length, Object.keys(v82.V82_BUILDING_PARTS).length + 1);
  assert.equal(v83.V83_BUILDING_PARTS[6376].mesh, 4135);
  assert.equal(v83.V83_BUILDING_PARTS[10763].id, 'architecture-walls-interior');
  for (const index of [296, 297]) for (const gone of [9766, 9767, 10658]) assert.equal(v83.V83_BUILDING_SCENES[index].paths[gone], undefined);
  for (const index of [295, 296, 297]) {
    const scene = v83.V83_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V83_OWNER_FIXES3_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V84 profile maps the D2F kitchen COW copies and keeps technical roots in scene', async () => {
  const v84 = await import('../../src/scripts/privateModelC80R2V84LayerSourceProfile.mjs');
  assert.equal(v84.V84_SOURCE_SHA256, '6cac4a3b91323043e1a700678c95ac19aa602b783b77f4c1426e613312f55e51');
  assert.equal(Object.keys(v84.V84_NEW_PARTS).length, 172);
  assert.equal(v84.V84_BUILDING_PARTS[10793].id, 'architecture-walls-interior');
  assert.equal(v84.V84_BUILDING_PARTS[10770].id, 'architecture-fixtures');
  for (const index of [296, 297]) for (const gone of [7222, 9258, 9415]) assert.equal(v84.V84_BUILDING_SCENES[index].paths[gone], undefined);
  for (const index of [295, 296, 297]) {
    const scene = v84.V84_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V84_D2F_KITCHEN_MEAS_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V85 profile keeps V84 part meshes and adds the restored ROOM3 wardrobe and island plinth', async () => {
  const v85 = await import('../../src/scripts/privateModelC80R2V85LayerSourceProfile.mjs');
  assert.equal(v85.V85_SOURCE_SHA256, 'a2e5e2d12574cbb4312ce829cb1ad6e50477e51c7d422bf7464e013b223b3ccb');
  assert.deepEqual(Object.keys(v85.V85_NEW_PARTS).map(Number), [11298, 11299, 11300, 11301, 11302, 11303]);
  for (const index of [296, 297]) for (const added of [11298, 11299, 11303]) assert.ok(v85.V85_BUILDING_SCENES[index].paths[added]);
  assert.equal(v85.V85_BUILDING_SCENES[295].paths[11299], undefined);
  for (const index of [295, 296, 297]) {
    const scene = v85.V85_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V85_OWNER_FIXES4_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V86 profile keeps V85 part meshes, adds stair fills, terrace plinth, Harvia PC90 and bathroom ceiling, drops fill 9765', async () => {
  const v86 = await import('../../src/scripts/privateModelC80R2V86LayerSourceProfile.mjs');
  assert.equal(v86.V86_SOURCE_SHA256, 'fdcae4643adb54c63b7292206aa9029d3e35286dbd3e908644f72ba4aefb5a43');
  assert.deepEqual(Object.keys(v86.V86_NEW_PARTS).map(Number), [11309, 11310, 11311, 11316]);
  for (const index of [295, 297]) for (const added of [11309, 11310, 11311, 11316]) assert.ok(v86.V86_BUILDING_SCENES[index].paths[added]);
  for (const index of [296, 297]) assert.equal(v86.V86_BUILDING_SCENES[index].paths[9765], undefined);
  for (const index of [295, 296, 297]) {
    const scene = v86.V86_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V86_OWNER_FIXES5_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V87 profile keeps V86 part meshes and adds the 2F IV riser shaft boxing', async () => {
  const v87 = await import('../../src/scripts/privateModelC80R2V87LayerSourceProfile.mjs');
  const v86 = await import('../../src/scripts/privateModelC80R2V86LayerSourceProfile.mjs');
  assert.equal(v87.V87_SOURCE_SHA256, '438d5bcace7b66a2ca08100ff56e56989b11139035696258900aa5043d988c1e');
  assert.deepEqual(Object.keys(v87.V87_NEW_PARTS).map(Number), [11319]);
  for (const [node, part] of Object.entries(v86.V86_BUILDING_PARTS)) assert.deepEqual(v87.V87_BUILDING_PARTS[node], part);
  for (const index of [296, 297]) assert.ok(v87.V87_BUILDING_SCENES[index].paths[11319]);
  assert.equal(v87.V87_BUILDING_SCENES[295].paths[11319], undefined);
  for (const index of [295, 296, 297]) {
    const scene = v87.V87_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V87_TATE_CONTINUITY_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V88 profile keeps V87 parts and swaps the WC1/PA1 and HPC1 roots', async () => {
  const v88 = await import('../../src/scripts/privateModelC80R2V88LayerSourceProfile.mjs');
  const v87 = await import('../../src/scripts/privateModelC80R2V87LayerSourceProfile.mjs');
  assert.equal(v88.V88_SOURCE_SHA256, '08a8de2b254df2934d4f2baa81452324a36f3d509e0970624257f2a37238c40d');
  assert.equal(v88.V88_BUILDING_PARTS, v87.V87_BUILDING_PARTS);
  for (const index of [296, 297]) for (const gone of [9303, 5837, 5838, 6515]) assert.ok(!v88.V88_BUILDING_SCENES[index].rootNodes.includes(gone));
  for (const index of [295, 297]) { assert.ok(!v88.V88_BUILDING_SCENES[index].rootNodes.includes(11306)); assert.ok(v88.V88_BUILDING_SCENES[index].rootNodes.includes(11362)); }
  for (const index of [295, 296, 297]) {
    const scene = v88.V88_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V88_INTEGRATION_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V89 profile keeps V88 parts and activates the NIBE roots in 2F/BOTH', async () => {
  const v89 = await import('../../src/scripts/privateModelC80R2V89LayerSourceProfile.mjs');
  const v88 = await import('../../src/scripts/privateModelC80R2V88LayerSourceProfile.mjs');
  assert.equal(v89.V89_SOURCE_SHA256, '718163b76b46aee51193e059c5790d0e22c84a364d82d8d58bc2084776902a2c');
  assert.equal(v89.V89_BUILDING_PARTS, v88.V88_BUILDING_PARTS);
  for (const index of [296, 297]) for (const added of [5839, 5840, 5841]) assert.ok(v89.V89_BUILDING_SCENES[index].rootNodes.includes(added));
  assert.ok(!v89.V89_BUILDING_SCENES[295].rootNodes.includes(5839));
  for (const index of [295, 296, 297]) {
    const scene = v89.V89_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V89_PHOTO_TATE_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V90 profile keeps V89 parts and adds the High H21-H25 roots to the floor scenes', async () => {
  const v90 = await import('../../src/scripts/privateModelC80R2V90LayerSourceProfile.mjs');
  const v89 = await import('../../src/scripts/privateModelC80R2V89LayerSourceProfile.mjs');
  assert.equal(v90.V90_SOURCE_SHA256, 'af5f50094df66c88022b1f0feca285aa4fef2360a55f6aab665fc1e35a83ae1e');
  assert.equal(v90.V90_BUILDING_PARTS, v89.V89_BUILDING_PARTS);
  for (const added of [11399, 11400, 11403, 11427, 11428, 11429]) assert.ok(v90.V90_BUILDING_SCENES[295].rootNodes.includes(added));
  for (const added of [11368, 11430, 11431]) assert.ok(v90.V90_BUILDING_SCENES[296].rootNodes.includes(added));
  for (const added of [11368, 11401, 11402, 11403, 11427, 11428, 11429, 11430, 11431]) assert.ok(v90.V90_BUILDING_SCENES[297].rootNodes.includes(added));
  for (const index of [295, 296, 297]) {
    const scene = v90.V90_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V90_HIGH_INTEGRATION_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('V91 profile keeps V90 parts and drops the owner-rejected V90 roots', async () => {
  const v91 = await import('../../src/scripts/privateModelC80R2V91LayerSourceProfile.mjs');
  const v90 = await import('../../src/scripts/privateModelC80R2V90LayerSourceProfile.mjs');
  assert.equal(v91.V91_SOURCE_SHA256, '9750917717a51b743f5f1f8a1b1691eb851836ec5a2555aee052d44774ea556a');
  assert.equal(v91.V91_BUILDING_PARTS, v90.V90_BUILDING_PARTS);
  for (const index of [295, 296, 297]) {
    const scene = v91.V91_BUILDING_SCENES[index];
    for (const removed of [11368, 11399, 11400, 11401, 11402, 11429, 11430, 11431]) assert.ok(!scene.rootNodes.includes(removed));
    assert.match(scene.name, /^C80R2_V91_OWNER_REVIEW_FIX_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
  assert.ok(v91.V91_BUILDING_SCENES[295].rootNodes.includes(11403));
});

test('V92 profile keeps V91 parts and adds the three H30 smoke detector roots', async () => {
  const v92 = await import('../../src/scripts/privateModelC80R2V92LayerSourceProfile.mjs');
  const v91 = await import('../../src/scripts/privateModelC80R2V91LayerSourceProfile.mjs');
  assert.equal(v92.V92_SOURCE_SHA256, 'a027108cf1a08be377b060143f40580359c029d8cc1f77f3122a6ba46cc931af');
  assert.equal(v92.V92_BUILDING_PARTS, v91.V91_BUILDING_PARTS);
  assert.ok(v92.V92_BUILDING_SCENES[295].rootNodes.includes(11432));
  for (const added of [11433, 11434]) assert.ok(v92.V92_BUILDING_SCENES[296].rootNodes.includes(added));
  for (const added of [11432, 11433, 11434]) assert.ok(v92.V92_BUILDING_SCENES[297].rootNodes.includes(added));
  for (const index of [295, 296, 297]) {
    const scene = v92.V92_BUILDING_SCENES[index];
    assert.match(scene.name, /^C80R2_V92_H30_SMOKE_(1F|2F|BOTH)_WORK_TEST_HOST_HOLD_20261108$/);
    for (const [node, paths] of Object.entries(scene.paths)) for (const path of paths) assert.ok(scene.rootNodes.includes(path[0]) && path.at(-1) === Number(node));
  }
});

test('drain-named technical nodes get their own VIEMARI color, also under a water wrapper', () => {
  const root = { name: 'scene', parent: null, userData: {} };
  const wrapper = { name: 'M5_INTEGRATION_CLAUDE_WW_ROOT', parent: root, userData: { m5System: 'VESI' } };
  const drain = { name: 'WW1974_L150_COMMON_MAIN_UNDER_BUILDING_DRAIN_WORK_TEST_HOST_HOLD', parent: wrapper, userData: {} };
  const water = { name: 'KV22_WATER_PIPE', parent: wrapper, userData: {} };
  assert.equal(technicalReviewSystemOf(drain, root), 'VIEMARI');
  assert.equal(technicalReviewSystemOf(water, root), 'VESI');
  const fixture = { name: 'V110_DRAIN_COVER', parent: wrapper, userData: { presentationOnly: true } };
  assert.equal(technicalReviewSystemOf(fixture, root), null);
});

test('viewer suppresses outline edges on drains and on system-colored meshes in technical review', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /isEdgeMeshCandidate\([\s\S]{0,400}?\}\) && !suppressTechnicalPipeEdges\(object, root\)/);
  assert.match(page, /system === 'VIEMARI' \|\| \(system !== null && technicalReviewColorsActive\(\)\)/);
  assert.match(page, /technicalReviewColorsActive = \(\) => technicalReviewOn && technicalReview\?\.applied === true;/);
});

test('technical review grey shell stays see-through over stacked walls', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  const surface = page.match(/surface: new THREE\.MeshStandardMaterial\(\{[\s\S]*?\}\),/)?.[0] ?? '';
  const opacity = Number(surface.match(/opacity: ([0-9.]+)/)?.[1]);
  assert.ok(opacity > 0 && 1 - (1 - opacity) ** 4 <= 0.2 && 1 - (1 - opacity) ** 11 <= 0.45, `stacked wall faces stay see-through (opacity ${opacity})`);
  assert.match(surface, /side: THREE\.FrontSide/);
});

test('architectural outline edges are dimmed while technical review colors are shown', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /const makeEdgeMaterial = \(depthTest: boolean\) =>[\s\S]{0,200}opacity: technicalReviewColorsActive\(\) \? 0\.2 : 0\.72,/);
  assert.ok(page.indexOf('let technicalReviewColorsActive') < page.indexOf('const refreshEdgeRendering'));
});

test('drain classifier covers V75/WASTE collectors but not wrappers, water sleeves or cisterns', () => {
  const root = { name: 'scene', parent: null, userData: {} };
  const wrap = { name: 'V93_ELECTRICAL4_H38_1F_RK121_OPEN_CABLE_HIDDEN_ROOT_WORK_TEST_PA2_D4_LEGACY_INACTIVE_COFIT_P02_COW_P03_ONE_V75_COW', parent: root, userData: {} };
  const at = (name, parent = wrap, userData = {}) => ({ name, parent, userData });
  assert.equal(technicalReviewSystemOf(at('P02_P03_1F_WASTE_COLLECTOR_ACTIVE_COW'), root), 'VIEMARI');
  assert.equal(technicalReviewSystemOf(at('P02_P03_KITCHEN_V75_DOWN_ACTIVE_1F_BOTH_COW'), root), 'VIEMARI');
  assert.equal(technicalReviewSystemOf(at('N_P185C_X2_BOARD_N_OPEN_CIRCUIT_9_1'), root), null, 'wrapper with V75 in its name does not color its electrical children');
  const water = { name: 'V93_D2F_KITCHEN_KVLV_CLEARANCE_V75_R2_ROOT', parent: root, userData: { m5System: 'VESI' } };
  assert.equal(technicalReviewSystemOf(at('V93_D2F_KITCHEN_KV_V75_CLEARANCE_R2_CONCEALED_WORK_TEST', water), root), 'VESI');
  const vesi = { name: 'wc', parent: root, userData: { m5System: 'VESI' } };
  assert.equal(technicalReviewSystemOf(at('V75_W5_D2F_WC1_BASIN_CISTERN', vesi), root), 'VESI');
});

test('kept meshes without a source system take their Sisältö technical layer color', async () => {
  const { technicalReviewLayerSystemOf, TECHNICAL_REVIEW_LAYER_SYSTEMS } = await import('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
  assert.deepEqual({ ...TECHNICAL_REVIEW_LAYER_SYSTEMS }, {
    'technical-electrical': 'SAHKO', 'technical-water': 'VESI', 'technical-drainage': 'VIEMARI', 'technical-ventilation': 'IV',
  });
  const root = { name: 'scene', parent: null, userData: {} };
  const switchRoot = { name: 'D1F-SW-01_2026_GREEN_SWITCH_OWNER_WORKTEST_ROOT', parent: root, userData: {} };
  const rocker = { name: 'D1F-SW-01_ROCKER_SCHEMATIC_FROM_GREEN_MARK', parent: switchRoot, userData: {} };
  const duct = { name: 'P04_D1F_ABOVE_SUSPENDED_CEILING_D100_BRANCH_EASTWEST', parent: root, userData: {} };
  const heater = { name: 'radiator', parent: root, userData: {} };
  const proxy = { name: 'OWNER_1F-SM-01_SMOKE_DETECTOR_PROXY', parent: switchRoot, userData: { presentationOnly: true } };
  const map = new Map([[switchRoot, 'technical-electrical'], [duct, 'technical-ventilation'], [heater, 'technical-heating']]);
  assert.equal(technicalReviewLayerSystemOf(rocker, root, map), 'SAHKO');
  assert.equal(technicalReviewLayerSystemOf(duct, root, map), 'IV');
  assert.equal(technicalReviewLayerSystemOf(heater, root, map), null, 'heating has no review color yet');
  assert.equal(technicalReviewLayerSystemOf(proxy, root, map), null, 'presentation-only stays grey');
  assert.equal(technicalReviewLayerSystemOf({ name: 'x', parent: root, userData: {} }, root, map), null);
});

test('technical review reports kept meshes per system for production checks', () => {
  const root = { name: 'scene', parent: null, userData: {}, traverse(fn) { fn(this); for (const c of kids) fn(c); } };
  const mk = (name, system) => ({ name, parent: root, isMesh: true, material: { name }, userData: system ? { m5System: system } : {} });
  const kids = [mk('a', 'SAHKO'), mk('b', 'VESI'), mk('c', null)];
  const disposable = () => ({ dispose() {} });
  const review = createTechnicalReviewPresentation(root, kids, () => ({
    surface: disposable(), line: disposable(), systems: { SAHKO: disposable(), VESI: disposable() },
  }), object => technicalReviewSystemOf(object, root));
  review.apply(true);
  assert.deepEqual(review.systemCounts, { SAHKO: 1, VESI: 1, GREY: 1 });
  review.dispose();
});

test('technical review system colors stay readable on unlit faces (emissive share)', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../../src/pages/private-model/index.astro', import.meta.url), 'utf8');
  assert.match(page, /\['VIEMARI', 0x8e44ad\]\] as const\)[\s\S]{0,400}emissive: color, emissiveIntensity: 0\.45,[\s\S]{0,260}side: THREE\.DoubleSide,/);
});


test('source-exact nested H24 leaves respect explicit presentation-only and architecture flags', () => {
  // Bind the same 15 named nested leaves as the exact-SHA successor scene.
  // This exercises the WeakMap precedence, not only a generic m5System role.
  const sourceName='V93_H24_WC_OPEN_HATCH_CLONE_OF_n8011_NO_n1729';
  const specs=[
    ...Array.from({length:6},(_,i)=>({id:1669+i,mesh:773+i,system:'SAHKO'})),
    ...Array.from({length:8},(_,i)=>({id:1704+i,mesh:808+i,system:'IV'})),
    {id:1730,mesh:4015,system:'IV'},
  ];
  const sourceNodes=Array.from({length:11614},()=>({}));
  sourceNodes[11613]={name:sourceName,children:specs.map(s=>s.id)};
  const scene=node('SCENE');
  const composite=node(sourceName);
  scene.add(composite);
  const associations=new Map([[composite,{nodes:11613}]]);
  const objects=new Map();
  for (const spec of specs) {
    const name='H24_SOURCE_CHILD_'+spec.id;
    sourceNodes[spec.id]={name,mesh:spec.mesh};
    const object=node(name,{isMesh:true,material:{label:'original-'+spec.id},userData:{}});
    composite.add(object);
    associations.set(object,{nodes:spec.id});
    objects.set(spec.id,object);
  }
  const json={nodes:sourceNodes,scenes:[{nodes:[11613]}]};
  const leaves=appendSourceExactH24Children(
    json,scene,0,SUCCESSOR_R1_SHA256,associations,[]);
  assert.equal(leaves?.length,15,'all source-exact H24 systems match first');
  const electrical=objects.get(1669),architecture=objects.get(1704);
  const normalElectrical=objects.get(1670),normalIv=objects.get(1705);
  assert.equal(technicalReviewSystemOf(electrical,scene),'SAHKO');
  assert.equal(technicalReviewSystemOf(architecture,scene),'IV');
  electrical.userData.presentationOnly=true;
  architecture.userData.m5PresentationRole='ARCHITECTURE';
  assert.equal(technicalReviewSystemOf(electrical,scene),null,
    'explicit presentation flag must override cached exact H24 technical role');
  assert.equal(technicalReviewSystemOf(architecture,scene),null,
    'architectural child must not acquire ventilation highlight');
  assert.equal(technicalReviewSystemOf(normalElectrical,scene),'SAHKO');
  assert.equal(technicalReviewSystemOf(normalIv,scene),'IV');
  const original=electrical.material;
  const review=createTechnicalReviewPresentation(scene,leaves,()=>({
    surface:disposable('grey'),line:disposable('grey-line'),
    systems:{SAHKO:disposable('orange'),IV:disposable('blue')},
  }),o=>technicalReviewSystemOf(o,scene));
  assert.equal(review.apply(true),true);
  assert.equal(electrical.material.label,'grey');
  assert.equal(architecture.material.label,'grey');
  assert.equal(normalElectrical.material.label,'orange');
  assert.equal(normalIv.material.label,'blue');
  assert.equal(review.apply(false),false);
  assert.equal(electrical.material,original,'original GLB material restored');
  review.dispose();
});

test('C80 524/530: H24 floor wrapper and Bosch washer are grey, other roots kept (owner 15.11.2026)', async () => {
  const { filterCompositePresentationRoots } = await import('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
  const { C80_530_V27_GLB_SHA256 } = await import('../../src/scripts/privateModelC80530V27SourceProfile.mjs');
  const { C80_524_RAIN_GLB_SHA256 } = await import('../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs');
  const entries = [2220, 11613, 11945, 11996, 11728, 12048, 12239].map((node) => ({ node, name: `n${node}` }));
  for (const sha of [C80_530_V27_GLB_SHA256, C80_524_RAIN_GLB_SHA256]) {
    assert.deepEqual(filterCompositePresentationRoots(entries, sha).map((e) => e.node), [11728, 12048, 12239]);
  }
  // Unrelated hashes remain unchanged.
  assert.equal(filterCompositePresentationRoots(entries, 'f'.repeat(64)), entries);
});

test('C80 524/530: Sisältö-bound KPH floor clones and Bosch washer are not technically coloured', async () => {
  const { filterNonTechnicalBoundObjects } = await import('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
  const { C80_530_V27_GLB_SHA256 } = await import('../../src/scripts/privateModelC80530V27SourceProfile.mjs');
  const items = [
    'K11_XMIRROR_R989_FLOOR_INTEGRATION_DERIVED_CLONE_2898_PRESENTATION_CLONE_2440_KPH_FLOOR_WEST_ANCHOR_',
    'MJ54_BOSCH_WNG254ABSN_CORRECT_PUMP_FRONT_RIGHT',
    'K11_XMIRROR_KPH09_PHOTO_ROTARY_BEZEL',
    'PH_WASHER_OPEN_2015_CANDIDATE_P185C_HOST',
  ].map((name) => ({ object: { name } }));
  assert.deepEqual(filterNonTechnicalBoundObjects(items, C80_530_V27_GLB_SHA256).map((i) => i.object.name),
    ['K11_XMIRROR_KPH09_PHOTO_ROTARY_BEZEL', 'PH_WASHER_OPEN_2015_CANDIDATE_P185C_HOST']);
  assert.equal(filterNonTechnicalBoundObjects(items, 'f'.repeat(64)), items);
  // Bound washer child meshes are excluded through their exact source root.
  const washerRoot = { name: 'MJ54_BOSCH_WNG254ABSN_CORRECT_PUMP_FRONT_RIGHT', parent: null };
  const child = { object: { name: 'C80-037_BOSCH_1_MAIN_CABINET', parent: washerRoot } };
  assert.deepEqual(filterNonTechnicalBoundObjects([child], C80_530_V27_GLB_SHA256), []);
});

// Perf 15.11.2026: single-pass DoubleSide highlights. A normal-less mesh would
// render black in one DOUBLE_SIDED pass, so it gets a flat-shaded twin of the
// same shared highlight; meshes with normals keep the shared material.
test('single-pass highlight uses a flat twin only for normal-less meshes', () => {
  const root = node('scene');
  const tech = node('tech root', { userData: { m5System: 'SAHKO' } });
  const singlePass = (label) => {
    const material = { ...disposable(label), forceSinglePass: true, flatShading: false, userData: { role: label } };
    material.clone = () => ({ ...singlePass(label + '-twin'), userData: { ...material.userData } });
    return material;
  };
  const withNormals = node('cable', { isMesh: true, material: disposable('cable-src'),
    geometry: { attributes: { position: {}, normal: {} } }, userData: { m5System: 'SAHKO' } });
  const noNormalsA = node('heater', { isMesh: true, material: disposable('heater-src'),
    geometry: { attributes: { position: {}, color: {} } }, userData: { m5System: 'SAHKO' } });
  const noNormalsB = node('box', { isMesh: true, material: disposable('box-src'),
    geometry: { attributes: { position: {} } }, userData: { m5System: 'SAHKO' } });
  root.add(tech); tech.add(withNormals).add(noNormalsA).add(noNormalsB);
  const orange = singlePass('orange');
  const review = createTechnicalReviewPresentation(root, [tech], () => ({
    surface: disposable('grey'), line: disposable('greyLine'), systems: { SAHKO: orange },
  }), object => technicalReviewSystemOf(object, root));
  review.apply(true);
  assert.equal(withNormals.material, orange);
  assert.equal(noNormalsA.material.label, 'orange-twin');
  assert.equal(noNormalsA.material.flatShading, true);
  assert.equal(noNormalsA.material, noNormalsB.material, 'one shared twin per highlight material');
  assert.equal(noNormalsA.material.userData.role, 'orange', 'pick role metadata kept on the twin');
  const twin = noNormalsA.material;
  review.apply(false);
  assert.equal(noNormalsA.material.label, 'heater-src');
  review.dispose();
  assert.equal(twin.disposed, true);
  assert.equal(orange.disposed, true);
});
