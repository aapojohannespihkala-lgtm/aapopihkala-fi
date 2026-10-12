import { expect, test } from '@playwright/test';
import { THREE } from '../../src/scripts/threeRuntime';
import {
  p137eFocusedReviewSceneIndex, p137eFocusedReviewSceneName,
  p137eFocusedRootName, selectP137EScene67FocusedReview,
} from '../../src/scripts/privateModelP137EScene67Selection';

// Synthetic runtime fixture reproduces ONLY trusted manifest node metadata
// inspected from Drive source GLB d691dd75...; not a production render test.
const makeSourceFixture = () => {
  const nodes: any[] = Array.from({ length: 1108 }, () => ({}));
  const originalWall = {
    sourceNodeIndex: 798, sourceMeshIndex: 406,
    originalSourceGeometryUnmodified: true, presentationOnly: true,
  };
  nodes[798] = { name: 'P123C_D1F_WINDOW_TRANSPARENT_WALL_HELPER', mesh: 406 };
  nodes[1106] = {
    name: 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE',
    mesh: 406, extras: originalWall,
  };
  const rootExtras = {
    Pass: 'P137E', sourceSceneIndex: 66,
    sourceOriginalWallNode: 798, sourceOriginalWallMesh: 406,
    WORK_TEST_ONLY: true, oldMarkersSuppressedInNewSceneOnly: true,
    current: false, Canonical: false, asBuilt: false,
    publishToCURRENT: false, HUMAN_REVIEW: 'NOT_RUN',
  };
  nodes[1107] = {
    name: p137eFocusedRootName, children: [1106, 1091, 1096, 1101],
    extras: rootExtras,
  };
  const devices = [
    { index: 1091, room: 'LOBBY', side: 'NORTH', faceYM: 5.112 },
    { index: 1096, room: 'BEDROOM', side: 'SOUTH', faceYM: 5.032 },
    { index: 1101, room: 'BATHROOM', side: 'SOUTH', faceYM: 5.032 },
  ] as const;
  const root = new THREE.Group();
  root.name = p137eFocusedRootName;
  root.userData = { ...rootExtras };
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  wall.name = nodes[1106].name;
  wall.userData = { ...originalWall };
  root.add(wall);
  for (const device of devices) {
    const extras = {
      logicalDeviceId: `D_THEMO_CURRENT_${device.room}_01`,
      representationKind: 'photoReferencedThermostatWallMountWorkTest',
      sourceFaceMeshIndex: 406, sourceFaceNodeIndex: 798,
      sourceFaceSide: device.side, sourceFaceYM: device.faceYM,
      backplateContactYM: device.faceYM, wallBackplateAirGapM: 0,
      fitOriginalPresentationSourceWallPlanePassed: true,
      fitExactPhysicalWallHostVerified: false,
      exactXYClaim: false, exactZClaim: false,
      currentGeometryClaim: false, wallHostPhysicalAsBuiltClaim: false,
      presentationOnly: true, Canonical: false, asBuilt: false,
      publishToCURRENT: false, HUMAN_REVIEW: 'NOT_RUN',
    };
    const name = `P137E_THEMO_${device.room}_WALL_CONTACT_WORK_TEST`;
    nodes[device.index] = { name, extras };
    const marker = new THREE.Group();
    marker.name = name;
    marker.userData = { ...extras };
    root.add(marker);
  }
  const sourceScenes: any[] = Array.from({ length: 68 }, () => ({}));
  sourceScenes[67] = {
    name: p137eFocusedReviewSceneName,
    nodes: [1021, 1107],
    extras: {
      sourceSceneIndex: 66, sourceOriginalWallMeshIndex: 406,
      targetLogicalDeviceCount: 3, workTestOnly: true,
      noCurrentPromotion: true, HUMAN_REVIEW: 'NOT_RUN',
    },
  };
  const scenes = Array.from({ length: 68 }, () => new THREE.Group());
  const unrelatedRoot = new THREE.Group();
  unrelatedRoot.name = 'INHERITED_UNRELATED_WHOLE_BUILDING_CONTEXT';
  scenes[67].add(unrelatedRoot, root);
  const gltf = { scenes, parser: { json: { nodes, scenes: sourceScenes } } };
  return { gltf, nodes, root, wall, unrelatedRoot };
};

test('P137E selects existing scene67 source root, not unrelated inherited geometry', () => {
  const { gltf, root, wall, unrelatedRoot } = makeSourceFixture();
  const before = root.children.slice();
  const out = selectP137EScene67FocusedReview(gltf);
  expect(p137eFocusedReviewSceneIndex).toBe(67);
  expect(out.scene).toBe(root);
  expect(out.scene).not.toBe(unrelatedRoot);
  expect(out.scene.children).toEqual(before);
  expect(out.scene.children[0]).toBe(wall);
  expect(out.scene.children).toHaveLength(4);
  expect(out.logicalDeviceIds).toEqual([
    'D_THEMO_CURRENT_LOBBY_01',
    'D_THEMO_CURRENT_BEDROOM_01',
    'D_THEMO_CURRENT_BATHROOM_01',
  ]);
  expect(out).toMatchObject({
    sceneIndex: 67, sourceWallNode: 798, sourceWallMesh: 406,
    humanReview: 'NOT_RUN', currentGeometry: false, canonical: false, asBuilt: false,
  });
});

test('P137E rejects wrong scene identity or a false source provenance', () => {
  const fixture = makeSourceFixture();
  fixture.gltf.parser.json.scenes[67].name = 'P186F-X4 R1117 OLD SCENE66';
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('scene 67 identity');
  fixture.gltf.parser.json.scenes[67].name = p137eFocusedReviewSceneName;
  fixture.gltf.parser.json.scenes[67].extras.noCurrentPromotion = false;
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('provenance');
});

test('P137E rejects missing/duplicated scene root and original wall remapping', () => {
  const fixture = makeSourceFixture();
  fixture.gltf.parser.json.nodes[1106].mesh = 407;
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('original P123C wall mesh source');
  fixture.gltf.parser.json.nodes[1106].mesh = 406;
  fixture.gltf.scenes[67].add(fixture.root.clone());
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('duplicated');
  fixture.gltf.scenes[67].remove(fixture.gltf.scenes[67].children.at(-1)!);
  fixture.gltf.parser.json.scenes[67].nodes = [1021];
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('focused root');
});

test('P137E does not silently accept old marker identity or invented wall-face contact', () => {
  const fixture = makeSourceFixture();
  fixture.gltf.parser.json.nodes[1096].extras.logicalDeviceId = 'D_THEMO_BEDROOM_OLD_ALIAS';
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('Themo source/wall-face contract');
  fixture.gltf.parser.json.nodes[1096].extras.logicalDeviceId = 'D_THEMO_CURRENT_BEDROOM_01';
  fixture.gltf.parser.json.nodes[1096].extras.wallBackplateAirGapM = 0.01;
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('Themo source/wall-face contract');
});

test('P137E fails closed on future CURRENT/HUMAN_REVIEW promotion or synthetic footprint', () => {
  const fixture = makeSourceFixture();
  fixture.gltf.parser.json.nodes[1107].extras.Canonical = true;
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('focused root source metadata');
  fixture.gltf.parser.json.nodes[1107].extras.Canonical = false;
  fixture.gltf.parser.json.nodes[1091].extras.HUMAN_REVIEW = 'PASS';
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('Themo source/wall-face contract');
  fixture.gltf.parser.json.nodes[1091].extras.HUMAN_REVIEW = 'NOT_RUN';
  fixture.wall.userData.representationKind = 'referenceFootprint';
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('room footprint');
});

test('P137E rejects dropped or substituted runtime marker despite valid glTF metadata', () => {
  const fixture = makeSourceFixture();
  fixture.root.children[2].userData.logicalDeviceId = 'D_THEMO_LEGACY';
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('runtime child');
  fixture.root.children[2].userData.logicalDeviceId = 'D_THEMO_CURRENT_BEDROOM_01';
  fixture.root.remove(fixture.root.children[3]);
  expect(() => selectP137EScene67FocusedReview(fixture.gltf)).toThrow('unexpected objects');
});
