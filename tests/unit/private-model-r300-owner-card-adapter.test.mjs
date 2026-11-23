import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  R300_OWNER_GLB_SHA256, R300_OWNER_R31_772_GLB_SHA256, R300_OWNER_R31_774_GLB_SHA256, R300_OWNER_R33_GLB_SHA256, R300_OWNER_CARD_REF,
  isR300OwnerCardNode, resolveR300OwnerCardSelection,
} from '../../src/scripts/privateModelR300OwnerCardAdapter.mjs';

const names = [
  'WHITE_CASING_ABOVE_OPEN_SERVICE_SPACE', 'LOWER_REAR_DARK_SERVICE_ZONE',
  'LOWER_FRONT_GALVANIZED_RAIL', 'LOWER_SIDE_SUPPORT_-1',
  'LOWER_SIDE_SUPPORT_1', 'TOP_DARK_18MM', 'FOOT_-1_-1',
  'FOOT_-1_1', 'FOOT_1_-1', 'FOOT_1_1',
];
const sceneNames = {
  759: 'Ylisrinne_C80_R31_R300_NAKYVAT_YLAKUPARIT_WORK_TEST_HOST_HOLD__scene759',
  760: 'Ylisrinne_C80_R31_R300_HUOLTONAKYMA_PLEKSI_POIS_WORK_TEST_HOST_HOLD__scene760',
};
const mockJson = () => {
  const nodes = Array.from({ length: 13495 }, () => ({}));
  names.forEach((part, i) => {
    nodes[13415 + i] = { name: 'R300_OWNER_OPTION__H32_NIBE_R300_' + part + '_WORK_TEST', mesh: 4368 + i };
  });
  nodes[13487] = { name: 'R300_CASING_TURNED_180_TO_FACE_WC',
    children: Array.from({ length: 10 }, (_, i) => 13415 + i) };
  nodes[13488] = { name: 'NIBE_COMPACT_R300_FRONT_NORTH_WC_WORK_TEST_HOST_HOLD',
    children: [13487, 13429, 13430] };
  const scenes = Array.from({ length: 761 }, () => ({ name: 'other', nodes: [] }));
  for (const sceneIndex of [759, 760]) {
    scenes[sceneIndex] = { name: sceneNames[sceneIndex],
      nodes: [13488, ...Array.from({ length: sceneIndex === 759 ? 494 : 493 }, (_, i) => i)] };
  }
  return { scene: 292, scenes, nodes, meshes: Array.from({ length: 5165 }, () => ({})),
    asset: { extras: { ModelStage: 'WORK_TEST', current: false,
      asBuilt: false, HUMAN_REVIEW: 'NOT_RUN' } } };
};
const context = (json, sceneIndex, nodeIndex = 13415) => ({
  json, loadedGlbSha256: R300_OWNER_GLB_SHA256, sceneIndex, nodeIndex,
  meshIndex: 4368 + nodeIndex - 13415, sourcePath: [13488, 13487, nodeIndex],
});
const card = {
  id: R300_OWNER_CARD_REF, title: 'Authorized protected card',
  status: 'WORK_TEST / PROBABLE_ONLY',
  facts: [
    { label: 'Viimeinen dokumentoitu huolto', value: 'Ei tiedossa', kind: 'unverified', evidence: 'NOT_VERIFIED' },
    { label: 'Asennus', value: '2015 muutossuunnitelma', kind: 'plan', evidence: 'HISTORICAL_PLAN' },
  ],
  sources: [{ title: 'Protected source', url: 'https://drive.google.com/file/d/EXAMPLE/view',
    role: 'owner_photos', supports: [], limits: ['Ei as-built'] }],
  notes: ['Tilavuus ei tyyppikilvellä vahvistettu'], conflicts: [],
};
const provider = key => key === R300_OWNER_CARD_REF ? card : null;

test('10 exact device leaves in both normal and service scenes use one protected card', () => {
  const json = mockJson();
  for (const sceneIndex of [759, 760]) for (let nodeIndex = 13415; nodeIndex <= 13424; nodeIndex++) {
    const selected = context(json, sceneIndex, nodeIndex);
    assert.equal(isR300OwnerCardNode(selected), true);
    const result = resolveR300OwnerCardSelection(selected, provider);
    assert.equal(result.state, 'matched');
    assert.equal(result.cards[0], card);
    assert.equal(result.cards[0].facts[0].value, 'Ei tiedossa');
  }
});

test('wrong SHA, scene, stale roots or claimed current state fail closed', () => {
  const json = mockJson(), selected = context(json, 759);
  assert.equal(resolveR300OwnerCardSelection({ ...selected, loadedGlbSha256: '0'.repeat(64) }, provider).state, 'mismatch');
  assert.equal(resolveR300OwnerCardSelection({ ...selected, sceneIndex: 769 }, provider).state, 'unbound');
  const duplicate = mockJson(); duplicate.scenes[759].nodes.push(13488);
  assert.equal(isR300OwnerCardNode(context(duplicate, 759)), false);
  const current = mockJson(); current.asset.extras.current = true;
  assert.equal(isR300OwnerCardNode(context(current, 760)), false);
});

test('wrong parent or mesh and copper/plexi/wall nodes are not card owners', () => {
  const json = mockJson(), selected = context(json, 759);
  assert.equal(isR300OwnerCardNode({ ...selected, meshIndex: 4424 }), false);
  assert.equal(isR300OwnerCardNode({ ...selected, sourcePath: [13488, 13429, 13415] }), false);
  assert.equal(isR300OwnerCardNode({ ...selected, sourcePath: [13488, 13415] }), false);
  for (const n of [13429, 13430, 13492, 13493, 13494, 11625, 5887, 5888, 12437]) {
    assert.equal(isR300OwnerCardNode(context(json, 759, n)), false);
  }
  const wrongParent = mockJson(); wrongParent.nodes[13487].children[0] = 13430;
  assert.equal(isR300OwnerCardNode(context(wrongParent, 759)), false);
});

test('missing or untrusted protected source never substitutes public owner facts', () => {
  const selected = context(mockJson(), 760);
  assert.equal(resolveR300OwnerCardSelection(selected, () => null).state, 'unavailable');
  assert.equal(resolveR300OwnerCardSelection(selected,
    () => ({ ...card, id: 'WRONG' })).state, 'unavailable');
  assert.equal(resolveR300OwnerCardSelection(selected,
    () => ({ ...card, sources: [{ ...card.sources[0], url: 'https://evil.example/photo' }] })).state, 'unavailable');
});

const latestR300SceneNames = {
  769: 'Ylisrinne_C80_R31_R300_ROOF_VM20_CLOSED_2F_L12_V75V110_RK141_RK142_RK143_MJ83_BOTH_REVIEW_WORK_TEST_HOST_HOLD__scene769',
  770: 'Ylisrinne_C80_R31_BOTH_R300_KUPARIT_HUOLTO_PLEKSI_POIS_RK141_RK142_RK143_MJ83_VM20_CLOSED_WORK_TEST_HOST_HOLD__scene770',
  771: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_NORMAL_WORK_TEST_HOST_HOLD__scene771',
  772: 'Ylisrinne_C80_R31_2F_R300_COPPER_RK141_RK142_RK143_L12_MJ83_SERVICE_WORK_TEST_HOST_HOLD__scene772',
};
const latestJson = () => {
  const json = mockJson();
  while (json.scenes.length < 773) json.scenes.push({ name: 'other', nodes: [] });
  while (json.nodes.length < 13507) json.nodes.push({});
  while (json.meshes.length < 5169) json.meshes.push({});
  const rootCounts = { 769: 499, 770: 498, 771: 204, 772: 203 };
  for (const [index, name] of Object.entries(latestR300SceneNames)) {
    const sceneIndex = Number(index);
    json.scenes[sceneIndex] = {
      name, nodes: [13488, ...Array.from({ length: rootCounts[sceneIndex] - 1 }, (_, i) => i)],
    };
  }
  return json;
};
const latestSelected = (json, sceneIndex, nodeIndex = 13415) => ({
  ...context(json, sceneIndex, nodeIndex),
  loadedGlbSha256: R300_OWNER_R31_772_GLB_SHA256,
});

test('R31 latest BOTH 769/770 and 2F 771/772 select the same ten source-exact casing leaves', () => {
  const json = latestJson();
  for (const sceneIndex of [769, 770, 771, 772]) for (let leaf = 13415; leaf <= 13424; leaf++) {
    const selected = latestSelected(json, sceneIndex, leaf);
    assert.equal(isR300OwnerCardNode(selected), true, 'scene '+sceneIndex+' leaf '+leaf);
    const result = resolveR300OwnerCardSelection(selected, provider);
    assert.equal(result.state, 'matched');
    assert.equal(result.cards[0], card);
  }
});

test('source variants cannot borrow scenes or roots from each other or impersonate R300', () => {
  const json = latestJson();
  assert.equal(isR300OwnerCardNode(latestSelected(json, 759)), false);
  assert.equal(isR300OwnerCardNode(context(json, 772)), false);
  const missing = latestJson(); missing.scenes[772].nodes.shift();
  assert.equal(isR300OwnerCardNode(latestSelected(missing, 772)), false);
  const renamed = latestJson(); renamed.scenes[769].name += '-INJECTED';
  assert.equal(isR300OwnerCardNode(latestSelected(renamed, 769)), false);
  const copper = latestSelected(json, 770, 13429);
  assert.equal(resolveR300OwnerCardSelection(copper, provider).state, 'unbound');
  const plexi = latestSelected(json, 771, 11625);
  assert.equal(resolveR300OwnerCardSelection(plexi, provider).state, 'unbound');
  assert.equal(resolveR300OwnerCardSelection(
    { ...latestSelected(json, 772), sourcePath: [13488, 13415] }, provider).state, 'unbound');
});

const sw04R300Json = () => {
  const json = latestJson();
  while (json.scenes.length < 775) json.scenes.push({ name: 'other', nodes: [] });
  while (json.nodes.length < 13510) json.nodes.push({});
  while (json.meshes.length < 5171) json.meshes.push({});
  // The SW04 successor retains every older glTF scene. Recreate real plexi
  // root membership for the 759/769/771 normal states in the synthetic fixture.
  for (const sceneIndex of [759, 769, 771]) json.scenes[sceneIndex].nodes[1] = 11625;
  json.scenes[773] = {
    name: 'Ylisrinne_C80_R31_2F_R300_K3_SW04_EXXACT_REFERENCE_NORMAL_PLEX_ON_WORK_TEST_HOST_HOLD__scene773',
    nodes: [13488, 11625, ...Array.from({ length: 202 }, (_, i) => i)],
  };
  json.scenes[774] = {
    name: 'Ylisrinne_C80_R31_2F_R300_K3_SW04_EXXACT_REFERENCE_SERVICE_PLEX_OFF_WORK_TEST_HOST_HOLD__scene774',
    nodes: [13488, ...Array.from({ length: 202 }, (_, i) => i)],
  };
  return json;
};
const sw04Selected = (json, sceneIndex, nodeIndex = 13415) => ({
  ...context(json, sceneIndex, nodeIndex),
  loadedGlbSha256: R300_OWNER_R31_774_GLB_SHA256,
});

test('SW04 latest GLB all eight NIBE scenes retain one SHA-bound card across plexi states', () => {
  const json = sw04R300Json();
  for (const sceneIndex of [759, 760, 769, 770, 771, 772, 773, 774]) for (let nodeIndex = 13415; nodeIndex <= 13424; nodeIndex++) {
    const selected = sw04Selected(json, sceneIndex, nodeIndex);
    assert.equal(isR300OwnerCardNode(selected), true, 'SW04 scene '+sceneIndex+' NIBE '+nodeIndex);
    const result = resolveR300OwnerCardSelection(selected, provider);
    assert.equal(result.state, 'matched');
    assert.equal(result.cards[0], card);
  }
});

test('SW04 card rejects swapped plexi state, other version SHA, wrong parent and copper or plexi', () => {
  const json = sw04R300Json();
  assert.equal(isR300OwnerCardNode({ ...sw04Selected(json, 773), loadedGlbSha256: R300_OWNER_R31_772_GLB_SHA256 }), false);
  assert.equal(isR300OwnerCardNode(sw04Selected(json, 768)), false);
  const lost = sw04R300Json(); lost.scenes[773].nodes.splice(lost.scenes[773].nodes.indexOf(11625), 1);
  lost.scenes[773].nodes.push(500);
  assert.equal(isR300OwnerCardNode(sw04Selected(lost, 773)), false);
  const injected = sw04R300Json(); injected.scenes[774].nodes.push(11625);
  injected.scenes[774].nodes.pop(); injected.scenes[774].nodes[1] = 11625;
  assert.equal(isR300OwnerCardNode(sw04Selected(injected, 774)), false);
  const fake = sw04Selected(json, 774);
  assert.equal(isR300OwnerCardNode({ ...fake, sourcePath: [13488, 13429, 13415] }), false);
  assert.equal(isR300OwnerCardNode(sw04Selected(json, 773, 13429)), false);
  assert.equal(isR300OwnerCardNode(sw04Selected(json, 773, 11625)), false);
  assert.equal(resolveR300OwnerCardSelection(sw04Selected(json, 774), () => null).state, 'unavailable');
});

test('original R33 scene-root source fixture retains the R300 casing but refuses stale scene and fabricated door roots',()=>{
 const source=JSON.parse(readFileSync(new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8'));
 const {scenes:countS,nodes:countN,meshes:countM}=source.counts;
 assert.deepEqual([countS,countN,countM],[822,13846,5237]);
 const j=mockJson();
 j.scenes=Array.from({length:countS},()=>({name:'other',nodes:[]}));
 j.nodes.length=countN;
 j.meshes.length=countM;
 for(const [n,def] of Object.entries(source.scenes)) j.scenes[Number(n)]={name:def.name,nodes:[...def.nodes]};
 for(const sceneIndex of [818,819,820,821]){
  const context33={...context(j,sceneIndex),loadedGlbSha256:R300_OWNER_R33_GLB_SHA256};
  assert.equal(isR300OwnerCardNode(context33),true,`R33 source scene ${sceneIndex}`);
  assert.equal(isR300OwnerCardNode({...context33,loadedGlbSha256:R300_OWNER_R31_772_GLB_SHA256}),false);
  const oldDoor=structuredClone(j);
  oldDoor.scenes[sceneIndex].nodes[oldDoor.scenes[sceneIndex].nodes.indexOf(13843)]=12643;
  assert.equal(isR300OwnerCardNode({...context33,json:oldDoor}),false);
 }
});
