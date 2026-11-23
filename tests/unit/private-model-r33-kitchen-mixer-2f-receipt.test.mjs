import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { R33_MIXER_2F_COW_SOURCE as SRC, r33Mixer2FSceneReceipt as receive } from '../../src/scripts/privateModelR33KitchenMixer2FReceipt.mjs';
import { C80_R33_SOURCE } from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

// Canonical R33 fixture is extracted from original GLB, not hand-written for this COW.
const source = JSON.parse(readFileSync(new URL('../fixtures/private-model-r33-scene-roots.json', import.meta.url), 'utf8'));
const fake = (sceneIndex=822) => {
  const scenes = Array.from({ length: 824 }, () => ({ name: 'not-in-scope', nodes: [] }));
  for (const [idx, s] of Object.entries(source.scenes)) scenes[Number(idx)] = {
    name: s.name, nodes: [...s.nodes], extras: { current: false, asBuilt: false },
  };
  for (const [idx, base] of [[822, 820], [823, 821]]) scenes[idx] = {
    name: 'Ylisrinne_R33_D2F_KITCHEN_MIXER_CONNECTORS_2F_WORK_TEST_HOST_HOLD__scene' + idx,
    nodes: [...scenes[base].nodes, 13472],
    extras: { current: false, asBuilt: false },
  };
  const nodes = Array.from({length: source.counts.nodes}, () => ({}));
  nodes[13472] = { children: [13470, 13471] };
  nodes[13470] = { mesh: 5160 }; nodes[13471] = { mesh: 5161 };
  const count = n => Array.from({length:n},()=>({}));
  return { json: { scene: source.defaultScene, scenes, nodes,
    meshes: count(source.counts.meshes), materials: count(source.counts.materials),
    accessors: count(source.counts.accessors), bufferViews: count(source.counts.bufferViews),
    asset: { extras: {...source.asset} },
  }, loadedGlbSha256:SRC.glbSha256, sceneIndex };
};
test('donor identity comes from immutable verified source metadata, not inherited R33 SHA',()=>{
  assert.equal(SRC.baseGlbSha256,C80_R33_SOURCE.glbSha256);
  assert.equal(SRC.glbSha256,'dd33b283971cb039f0fc01982f5fce3e304647be331077913239e9a806fd0135');
  assert.equal(SRC.glbBytes,64701664);
  assert.equal(SRC.zipSha256,'f6baca441398aabf2ba001ec0d5248c0a11114c5be18d34d6062b00cd70b3f74');
  assert.equal(source.counts.scenes,822);
  assert.equal(source.counts.nodes,13846);
  assert.equal(source.counts.meshes,5237);
  assert.equal(SRC.sourceLinksBound,false);
  assert.equal(SRC.physicalPortVerified,false);
});
test('two D2F successors reuse the original source nodes and append only the mixer root',()=>{
  for (const sceneIndex of [822,823]) {
    const f=fake(sceneIndex), result=receive(f);
    assert.equal(result.status,'SOURCE_ONLY');
    assert.equal(result.sceneIndex,sceneIndex);
    assert.equal(result.sourceLinksBound,false);
    assert.equal(result.physicalPortVerified,false);
    assert.equal(result.humanReview,'NOT_RUN');
    assert.deepEqual(result.connectorLeaves,[13470,13471]);
    assert.equal(f.json.scenes[sceneIndex].nodes.at(-1),13472);
    const orig = f.json.scenes[sceneIndex-2].nodes;
    assert.deepEqual(f.json.scenes[sceneIndex].nodes.slice(0,-1),orig);
  }
});
test('wrong SHA, absent scene, false work stage and missing geometry all fail closed',()=>{
  const f=fake();
  assert.equal(receive({...f,loadedGlbSha256:C80_R33_SOURCE.glbSha256}),null);
  assert.equal(receive({...f,loadedGlbSha256:'0'.repeat(64)}),null);
  assert.equal(receive({...f,sceneIndex:820}),null);
  assert.equal(receive({...f,sceneIndex:824}),null);
  const q=fake(); q.json.scene=822; assert.equal(receive(q),null);
  const changed=fake(); changed.json.asset.extras.current=true; assert.equal(receive(changed),null);
  const noHuman=fake(); noHuman.json.asset.extras.HUMAN_REVIEW='APPROVED'; assert.equal(receive(noHuman),null);
  const nodeLoss=fake(); nodeLoss.json.nodes.pop(); assert.equal(receive(nodeLoss),null);
  const meshLoss=fake(); meshLoss.json.meshes.pop(); assert.equal(receive(meshLoss),null);
});
test('R33 four canonical scene roots, names, door-COW and plexi role are immutable',()=>{
  for(const bad of [
    f=>{f.json.scenes[820].nodes[0]=998;},
    f=>{f.json.scenes[818].nodes.splice(0,1);},
    f=>{f.json.scenes[821].name='fake';},
    f=>{f.json.scenes[820].nodes[0]=12643;},
    f=>{f.json.scenes[820].nodes[f.json.scenes[820].nodes.indexOf(13843)]=12643;},
    f=>{f.json.scenes[820].nodes[f.json.scenes[820].nodes.indexOf(11625)]=9999;},
  ]) {
    const f=fake();
    bad(f);
    assert.equal(receive(f),null);
  }
});
test('2F-only delta rejects missing, duplicated, moved or overwritten source mixer roots',()=>{
  for(const bad of [
    f=>{f.json.scenes[822].nodes.pop();},
    f=>{f.json.scenes[822].nodes.unshift(13472);},
    f=>{f.json.scenes[822].nodes[0]=13472;},
    f=>{f.json.scenes[822].nodes[f.json.scenes[822].nodes.length - 1]=13470;},
    f=>{f.json.scenes[822].name='wrong__scene822';},
    f=>{f.json.scenes[822].name='WORK_TEST_HOST_HOLD__scene821';},
    f=>{f.json.scenes[822].nodes[f.json.scenes[822].nodes.indexOf(11625)]=9998;},
    f=>{f.json.scenes[823].nodes.push(11625);},
  ]) {
    const f=fake();
    bad(f);
    assert.equal(receive(f),null);
  }
});
test('KV/LV source identity and parent are required; physical ports remain unapproved',()=>{
  for(const bad of [
    f=>{f.json.nodes[13472].children=[13471,13470];},
    f=>{f.json.nodes[13472].children=[13470,13470];},
    f=>{f.json.nodes[13472].children=[13470];},
    f=>{f.json.nodes[13470].mesh=4999;},
    f=>{f.json.nodes[13471].mesh=4998;},
  ]){ const f=fake(); bad(f); assert.equal(receive(f),null); }
});
