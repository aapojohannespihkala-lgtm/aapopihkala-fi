import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { checkDScene32Preview, parseSingleBufferGlb } from '../../scripts/check-d-scene32-preview-parity.mjs';

// No private GLB bytes embedded in GitHub: synthetic structures exercise
// the same strict hash/scene/resource/HOLD gates as the real verified source.
const target = [
  { index: 33, name: 'D / ALKAKERTA / WORK_TEST preview', mask: 'D_1F', count: 2 },
  { index: 34, name: 'D / YLAKERTA / WORK_TEST preview', mask: 'D_2F', count: 1 },
  { index: 35, name: 'D / MOLEMMAT / WORK_TEST preview', mask: 'D_BOTH', count: 3 },
];
const base = () => ({
  asset: { version: '2.0', extras: { ModelStage: 'WORK_TEST', canonical: false } },
  scene: 32,
  scenes: Array.from({ length: 33 }, (_, i) => ({ name: `SOURCE ${i}`, nodes: [0] })),
  nodes: [{ mesh: 0 }, { mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  accessors: [{ componentType: 5126, count: 1, type: 'VEC3', bufferView: 0 }],
  bufferViews: [{ buffer: 0, byteLength: 4 }],
  buffers: [{ byteLength: 4 }],
  materials: [{ name: 'preserve-source-material' }],
});
const previewFrom = original => {
  const copy = structuredClone(original);
  copy.scene = 35;
  copy.nodes.push({ mesh: 0 }, { mesh: 0 }, { mesh: 0 });
  const holds = { stage: 'SCENE32_WORK_TEST', unresolvedSharedCD: 'HOLD_NOT_IN_PREVIEW',
    K14UnknownGableRoof8: 'HOLD_NOT_IN_PREVIEW', K17Host: 'HOLD_NOT_IN_PREVIEW',
    browserQA: 'NOT_RUN', current: false, asBuilt: false, publishReady: false };
  const ids = [[2, 3], [4], [2, 3, 4]];
  for (let i = 0; i < 3; i++) copy.scenes.push({
    name: target[i].name, nodes: ids[i],
    extras: { ylisPreview: { ...holds, mask: target[i].mask, objectCount: target[i].count } },
  });
  return copy;
};
const glb = (j, binary = Uint8Array.from([1, 2, 3, 4])) => {
  const json = new TextEncoder().encode(JSON.stringify(j));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const out = new Uint8Array(12 + 8 + jsonLength + 8 + binary.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, out.length, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.fill(32, 20, 20 + jsonLength);
  out.set(json, 20);
  view.setUint32(20 + jsonLength, binary.length, true);
  view.setUint32(24 + jsonLength, 0x004e4942, true);
  out.set(binary, 28 + jsonLength);
  return out;
};
const hash = b => createHash('sha256').update(b).digest('hex');
const run = ({ original = base(), preview = previewFrom(original), sourceBin, previewBin } = {}) => {
  const a = glb(original, sourceBin), b = glb(preview, previewBin);
  return checkDScene32Preview(a, b, {
    sourceSha: hash(a), previewSha: hash(b), originalScenes: 33, originalNodes: 2, target,
  });
};
const mustHold = (mutate, pattern) => assert.throws(() => {
  const a = base(), b = previewFrom(a);
  mutate(a, b);
  run({ original: a, preview: b });
}, pattern);

test('valid source byte-parity, disjoint floors and three named scenes', () => {
  const r = run();
  assert.equal(r.status, 'SOURCE_PARITY_PASS_BROWSER_HOLD');
  assert.equal(r.readyForPublishQueue, false);
  assert.equal(r.browserQA, 'NOT_RUN');
  assert.deepEqual(r.previewScenes.map(x => x.count), [2, 1, 3]);
});
test('refuses wrong full original or preview SHA, even with structurally plausible JSON', () => {
  const a = glb(base()), b = glb(previewFrom(base()));
  assert.throws(() => checkDScene32Preview(a, b), /SHA256 identity mismatch/);
});
test('refuses original scene32 changed in preview', () => mustHold((a, b) => { b.scenes[32].name = 'mutated'; }, /original scenes/));
test('refuses original source node changed in preview', () => mustHold((a, b) => { b.nodes[0].mesh = 1; }, /original scenes/));
test('refuses inherited source materials changing silently', () => mustHold((a, b) => { b.materials[0].name = 'changed'; }, /resource table/));
test('refuses source vertex bytes changing despite matching counts', () => {
  assert.throws(() => run({ previewBin: Uint8Array.from([1, 2, 9, 4]) }), /BIN bytes changed/);
});
test('refuses default-scene fallback to old scene32', () => mustHold((a, b) => { b.scene = 32; }, /default scene/));
test('refuses wrong scene label', () => mustHold((a, b) => { b.scenes[34].name = 'unknown'; }, /scene 34 identity/));
test('refuses promotion to current', () => mustHold((a, b) => { b.scenes[35].extras.ylisPreview.current = true; }, /scene 35 identity/));
test('refuses browser PASS claimed from source-only QA', () => mustHold((a, b) => { b.scenes[35].extras.ylisPreview.browserQA = 'PASS'; }, /scene 35 identity/));
test('refuses suppression of K17 HOST_HOLD', () => mustHold((a, b) => { delete b.scenes[33].extras.ylisPreview.K17Host; }, /scene 33 identity/));
test('refuses duplicate floor roots', () => mustHold((a, b) => { b.scenes[33].nodes = [2, 2]; }, /scene 33 identity/));
test('refuses BOTH omitting upper floor', () => mustHold((a, b) => { b.scenes[35].nodes = [2, 3, 3]; }, /scene 35 identity/));
test('refuses floor sets overlapping', () => mustHold((a, b) => { b.scenes[34].nodes = [3]; b.scenes[35].nodes = [2, 3, 4]; }, /disjoint union/));
test('refuses extra unknown preview node', () => mustHold((a, b) => { b.nodes.push({ mesh: 0 }); }, /node-count drift/));
test('refuses nested preview mesh transform with additional descendants', () => mustHold((a, b) => { b.nodes[2].children = [0]; }, /nested objects/));
test('refuses modified source glTF bufferView', () => mustHold((a, b) => { b.bufferViews[0].byteOffset = 1; }, /resource table/));
test('refuses broken GLB2 magic and truncated chunks', () => {
  const bytes = glb(base());
  bytes[0] = 0;
  assert.throws(() => parseSingleBufferGlb(bytes), /GLB2 header/);
  const short = glb(base()).subarray(0, 30);
  assert.throws(() => parseSingleBufferGlb(short), /GLB2 header/);
});
