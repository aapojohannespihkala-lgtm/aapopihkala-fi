import test from 'node:test';
import assert from 'node:assert/strict';
import { V69P12R1_SOURCE_SHA256, V69P12R1_FLOORS, resolveV69P12R1FloorBridge } from '../src/scripts/privateModelV69P12R1FloorGate.mjs';

const fixture = () => {
  const scenes = Array.from({ length: 295 }, (_, n) => ({ name: 'C80R2_WORK_TEST_' + n, nodes: [n] }));
  const rendered = scenes.map((scene) => ({ name: scene.name }));
  const gltf = {
    scene: rendered[292], scenes: rendered,
    parser: { json: { scene: 292, scenes,
      asset: { extras: { current: false, asBuilt: false, viewerFloorScenes: { ...V69P12R1_FLOORS } } } } },
  };
  const resolved = { indices: { ...V69P12R1_FLOORS }, scenes: { '1F': rendered[290], '2F': rendered[293], BOTH: rendered[294] } };
  return { gltf, resolved };
};

test('explicit 294 BOTH scene is accepted for the one immutable source, not default 292', () => {
  const { gltf, resolved } = fixture();
  assert.notEqual(gltf.scene, gltf.scenes[294]);
  assert.equal(resolveV69P12R1FloorBridge({ gltf, loadedSourceSha256: V69P12R1_SOURCE_SHA256,
    sourceKind: 'work-test', resolveChainScenes: () => resolved }), resolved);
});

test('invalid SHA, CURRENT, wrong scene map or legacy preview fail closed', () => {
  for (const change of ['sha', 'current', 'map', 'preview', 'source']) {
    const { gltf, resolved } = fixture();
    const args = { gltf, loadedSourceSha256: V69P12R1_SOURCE_SHA256,
      sourceKind: 'work-test', resolveChainScenes: () => resolved };
    if (change === 'sha') args.loadedSourceSha256 = '0'.repeat(64);
    if (change === 'current') gltf.parser.json.asset.extras.current = true;
    if (change === 'map') gltf.parser.json.asset.extras.viewerFloorScenes.BOTH = 292;
    if (change === 'preview') args.hasC70Preview = true;
    if (change === 'source') args.sourceKind = 'current';
    assert.equal(resolveV69P12R1FloorBridge(args), null, change);
  }
});

test('unverified source-scene resolution and mismatched counts fail closed', () => {
  const { gltf, resolved } = fixture();
  const args = { gltf, loadedSourceSha256: V69P12R1_SOURCE_SHA256,
    sourceKind: 'work-test', resolveChainScenes: () => resolved };
  assert.equal(resolveV69P12R1FloorBridge({ ...args, resolveChainScenes: () => null }), null);
  gltf.parser.json.scenes.pop();
  assert.equal(resolveV69P12R1FloorBridge(args), null);
});
