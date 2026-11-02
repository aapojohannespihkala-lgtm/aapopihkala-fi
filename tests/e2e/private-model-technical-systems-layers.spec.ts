import { expect, test } from '@playwright/test';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Scene } from 'three';
import {
  createTechnicalSystemLayerInventory,
  createTechnicalSystemPresentation,
  type TechnicalSourceNode,
  type TechnicalSystemsContext,
} from '../../src/scripts/privateModelTechnicalSystemsLayers';
import { createViewerInteractionState, setViewerInteractionLayerMode } from '../../src/scripts/privateModelViewerState';

const SHA = '8ddb398d9eb981d92ed444afcfad93ceb2224b1ce9898599553ede9b4136b87d';
const makeFixture = (family: 'electric' | 'kvv' | 'iv') => {
  const scene = new Scene();
  const root = new Group(); root.name = 'source-root';
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
  mesh.name = 'verified-mesh';
  if (family === 'electric') root.userData.presentationLayer = 'MEP_ELECTRICAL';
  if (family === 'kvv') Object.assign(root.userData, {
    Pass: 'P170A', presentationVisibilityAid: true, familyRef: 'KVV_2017',
  });
  if (family === 'iv') Object.assign(root.userData, {
    Pass: 'P170D-R2', presentationVisibilityAid: true, familyRef: 'IV_1974_PLAN',
  });
  mesh.userData.ylisViewScope = {
    objectKey: 'source:test', apartmentScope: 'D',
    storeyScope: '2F', role: 'CONTENT', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST',
  };
  mesh.userData.sourceLinks = [{ title: 'Original source' }];
  root.add(mesh); scene.add(root);
  const sourceNodes: TechnicalSourceNode[] = [
    { object: root, sceneIndex: 24, nodeIndex: 1, parentNodeIndex: null, nodeName: root.name, glbSha256: SHA },
    { object: mesh, sceneIndex: 24, nodeIndex: 2, parentNodeIndex: 1, nodeName: mesh.name, glbSha256: SHA },
  ];
  const context: TechnicalSystemsContext = {
    sceneRoot: scene, sourceSceneIndex: 24, sourceNodes,
    loadedGlbSha256: SHA, expectedGlbSha256: SHA,
    viewerScope: 'd-2f', allowSourceOnly: true, allowHistoricalPlans: true,
  };
  return { scene, root, mesh, context };
};
const summary = (inventory: ReturnType<typeof createTechnicalSystemLayerInventory>, id: string) =>
  inventory.summary.find((item) => item.id === id)!;

test('HI20 scene without explicit system metadata reports six unavailable groups', () => {
  const scene = new Scene();
  const item = createTechnicalSystemLayerInventory({
    sceneRoot: scene, sourceSceneIndex: 24, sourceNodes: [],
    loadedGlbSha256: SHA, expectedGlbSha256: SHA,
    viewerScope: 'd-2f', allowSourceOnly: true, allowHistoricalPlans: true,
  });
  expect(item.bridgeBindings).toHaveLength(0);
  expect(item.summary).toHaveLength(6);
  expect(item.summary.every((entry) => entry.reason === 'NO_OBJECTS_IN_SCENE')).toBe(true);
  expect(item.summary.every((entry) => entry.currentInstallationVerified === false)).toBe(true);
});

test('2017 KVV plan binds only one exact-scene renderable and preserves its source card', () => {
  const f = makeFixture('kvv');
  const before = f.mesh.userData.sourceLinks;
  const inv = createTechnicalSystemLayerInventory(f.context);
  expect(summary(inv, 'p161-kvv-2017')).toMatchObject({
    reason: 'AVAILABLE', matchedCount: 1, boundCount: 1, sourceRole: 'HISTORICAL_PLAN',
    currentInstallationVerified: false,
  });
  expect(inv.availableNodeIds).toEqual(['p161-kvv-2017']);
  expect(inv.boundObjects[0].sourceNodeIndex).toBe(2);
  expect(inv.boundObjects[0].sourceLinks).toEqual(before);
  expect(f.mesh.userData.sourceLinks).toBe(before);
  const bridge = createTechnicalSystemPresentation(f.scene, inv);
  let state = createViewerInteractionState();
  state = setViewerInteractionLayerMode(state, 'locus', 'visible');
  state = setViewerInteractionLayerMode(state, 'p161-kvv-2017', 'ghost');
  const frame = { activeSceneRoot: f.scene, gates: inv.gates, availableNodeIds: inv.availableNodeIds };
  expect(bridge.apply(state, frame)).toEqual([{ id: 'p161-kvv-2017', mode: 'ghost' }]);
  bridge.dispose();
});

test('D 2F electrical source is classified but not exposed before Sol adds its layer ID', () => {
  const f = makeFixture('electric');
  const inv = createTechnicalSystemLayerInventory(f.context);
  expect(summary(inv, 'technical-electrical')).toMatchObject({
    reason: 'LAYER_ID_PENDING', matchedCount: 1, boundCount: 1,
    currentInstallationVerified: false,
  });
  expect(inv.bridgeBindings).toHaveLength(0);
  expect(inv.boundObjects[0].id).toBe('technical-electrical');
});

test('Historical IV is opt-in and never promoted to current by the Layer mode', () => {
  const f = makeFixture('iv');
  const off = createTechnicalSystemLayerInventory({ ...f.context, allowHistoricalPlans: false });
  expect(summary(off, 'p161-iv-1974-plan').reason).toBe('OPT_IN_REQUIRED');
  expect(off.bridgeBindings).toHaveLength(0);
  const on = createTechnicalSystemLayerInventory(f.context);
  expect(summary(on, 'p161-iv-1974-plan').sourceRole).toBe('HISTORICAL_PLAN');
  expect(on.bridgeBindings).toHaveLength(1);
  expect(f.mesh.visible).toBe(true); // inventory is read-only
});

test('Changing scene, SHA or node/parent identity fails closed', () => {
  const f = makeFixture('kvv');
  const wrongSha = createTechnicalSystemLayerInventory({ ...f.context, expectedGlbSha256: 'a'.repeat(64) });
  expect(summary(wrongSha, 'p161-kvv-2017').reason).toBe('SOURCE_MISMATCH');
  expect(wrongSha.bridgeBindings).toHaveLength(0);
  const wrongScene = createTechnicalSystemLayerInventory({ ...f.context, sourceSceneIndex: 25 });
  expect(summary(wrongScene, 'p161-kvv-2017').reason).toBe('UNVERIFIED_NODE_IDENTITY');
  const badParent = f.context.sourceNodes.map((node) =>
    node.object === f.mesh ? { ...node, parentNodeIndex: 78 } : node);
  expect(createTechnicalSystemLayerInventory({ ...f.context, sourceNodes: badParent }).bridgeBindings).toHaveLength(0);
  const badName = f.context.sourceNodes.map((node) =>
    node.object === f.mesh ? { ...node, nodeName: 'other mesh' } : node);
  expect(createTechnicalSystemLayerInventory({ ...f.context, sourceNodes: badName }).bridgeBindings).toHaveLength(0);
});

test('D 2F system mode cannot reveal D 1F or apartment A geometry', () => {
  const f = makeFixture('kvv');
  f.mesh.userData.ylisViewScope.storeyScope = '1F';
  expect(summary(createTechnicalSystemLayerInventory(f.context), 'p161-kvv-2017').reason).toBe('OUTSIDE_SCOPE');
  f.mesh.userData.ylisViewScope.storeyScope = '2F';
  f.mesh.userData.ylisViewScope.apartmentScope = 'A';
  expect(createTechnicalSystemLayerInventory(f.context).bridgeBindings).toHaveLength(0);
  f.mesh.userData.ylisViewScope.apartmentScope = 'D';
  delete f.mesh.userData.ylisViewScope;
  expect(summary(createTechnicalSystemLayerInventory(f.context), 'p161-kvv-2017').reason).toBe('UNVERIFIED_SCOPE');
});

test('Unknown family or unclassified parent never activates a technical group', () => {
  const f = makeFixture('kvv');
  f.root.userData.familyRef = 'MYSTERY';
  expect(createTechnicalSystemLayerInventory(f.context).bridgeBindings).toHaveLength(0);
  f.root.userData.familyRef = 'KVV_2017';
  f.scene.remove(f.root);
  expect(createTechnicalSystemLayerInventory(f.context).bridgeBindings).toHaveLength(0);
});

test('Locus requires both ancestor route layer and child water/wastewater subgroup', () => {
  const f = makeFixture('kvv');
  delete f.root.userData.Pass;
  delete f.root.userData.presentationVisibilityAid;
  delete f.root.userData.familyRef;
  f.root.userData.presentationLayer = 'G3_LOCUS_SITE';
  f.mesh.userData.presentationSubgroup = 'WATER';
  const inv = createTechnicalSystemLayerInventory(f.context);
  expect(summary(inv, 'locus-water')).toMatchObject({ reason: 'AVAILABLE', boundCount: 1 });
  expect(summary(inv, 'locus-wastewater').reason).toBe('NO_OBJECTS_IN_SCENE');
  delete f.root.userData.presentationLayer;
  expect(createTechnicalSystemLayerInventory(f.context).bridgeBindings).toHaveLength(0);
});
