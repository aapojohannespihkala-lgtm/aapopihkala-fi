import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import { resolveC80R2ChainFloorScenes } from '../../src/scripts/privateModelC80R2ChainScenes.mjs';
import { TATE_SOURCE_SHA256 as SHA,TATE_SOURCE_SCENE_COUNT as COUNT,TATE_FLOORS as FLOORS,
  TATE_BUILDING_SCENES as SCENES,TATE_TECHNICAL_NODES as TECH,resolveTateTechnicalNode,
} from '../../src/scripts/privateModelC80P02TateLayerSourceProfile.mjs';
const receipt=JSON.parse(fs.readFileSync(new URL('../fixtures/c80-p02-tate-source-receipt.json',import.meta.url)));
const fixture=()=>{
  const scenes=Array.from({length:receipt.sceneCount},(_,i)=>({name:'C80R2_HISTORY_'+i,nodes:[0]}));
  for(const [i,s] of Object.entries(receipt.scenes)) scenes[i]={name:s.name,nodes:[...s.nodes]};
  return {asset:structuredClone(receipt.asset),scenes,nodes:structuredClone(receipt.nodes)};
};
const fnv=ids=>ids.reduce((h,i)=>Math.imul(h^i,16777619)>>>0,2166136261).toString(16).padStart(8,'0');
test('TATE remapped source selects distinct 1F/2F/BOTH, preserving historical default292',()=>{
  assert.equal(SHA,receipt.sourceSha256);assert.equal(COUNT,347);assert.equal(receipt.defaultScene,292);
  assert.deepEqual(FLOORS,{'1F':344,'2F':345,BOTH:346});
  const selected=resolveC80R2ChainFloorScenes(fixture());
  for(const [floor,i] of Object.entries(FLOORS)){
    assert.equal(selected[floor],i);assert.equal(fnv(SCENES[i].rootNodes),receipt.scenes[i].fnv);
    assert.deepEqual(SCENES[i].rootNodes,receipt.scenes[i].nodes);
  }
});
test('TATE guards actual remapped donor paths and source links across all four systems',()=>{
  const seen=new Set();
  for(const i of Object.values(FLOORS)) for(const node of receipt.anchors){
    if(!TECH[i][node])continue;
    const part=resolveTateTechnicalNode(fixture(),i,node);
    assert.ok(part,'source anchor '+node);seen.add(part.id);
    assert.equal(part.mesh,receipt.nodes[node].mesh);
    assert.equal(resolveTateTechnicalNode(fixture(),292,node),null);
  }
  assert.deepEqual([...seen].sort(),['technical-drainage','technical-electrical','technical-ventilation','technical-water']);
  assert.equal(TECH[346][11721].id,'technical-drainage');
  assert.equal(TECH[346][11731].id,'technical-ventilation');
  assert.equal(TECH[346][11829].id,'technical-electrical');
});
test('TATE rejects branch-local node reuse, altered source links, roots, parent and mesh',()=>{
  for(const mutate of [
    j=>j.nodes[11731].mesh++,
    j=>j.nodes[11731].name='V75_BRANCH_NODE_11731',
    j=>j.nodes[11731].extras.sourceLinks=[],
    j=>j.nodes[11730].children=[],
    j=>j.scenes[346].nodes.reverse(),
    j=>j.asset.extras.current=true,
  ]){
    const j=fixture();mutate(j);assert.equal(resolveTateTechnicalNode(j,346,11731),null);
  }
});
test('TATE inherited water30 and one V75 route remain active, rejected routes are unbound',()=>{
  for(const [floor,i] of Object.entries(FLOORS)){
    assert.equal(Object.keys(TECH[i]).filter(n=>Number(n)>=11678&&Number(n)<=11707).length,floor==='BOTH'?30:15);
    for(const node of receipt.excluded) assert.equal(TECH[i][node],undefined,'rejected '+node);
    assert.equal(TECH[i][11721].id,'technical-drainage');
  }
});

test('TATE bindings fail closed for a different loaded source SHA',()=>{
  const r=resolveBuildingPartLayerBindings({gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:'db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a',sceneIndex:344,activeSceneRoot:null,area:'D',floor:'1F'});
  assert.equal(r.sourceVerified,false);
});
