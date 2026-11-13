import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveC80R2ChainFloorScenes } from '../../src/scripts/privateModelC80R2ChainScenes.mjs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import { P02_SOURCE_SHA256 as SHA, P02_SOURCE_SCENE_COUNT as COUNT, P02_FLOORS as FLOORS,
  P02_BUILDING_SCENES as SCENES, P02_TECHNICAL_NODES as TECH, resolveP02TechnicalNode,
} from '../../src/scripts/privateModelC80P02WaterLayerSourceProfile.mjs';

// Source identity and ordered-root hashes were independently captured from the RAW GLB.
const receipt = JSON.parse(fs.readFileSync(new URL('../fixtures/c80-p02-water-source-receipt.json',import.meta.url)));
const fnv = ids => ids.reduce((h,i)=>Math.imul(h^i,16777619)>>>0,2166136261).toString(16).padStart(8,'0');
const fixture = () => {
  const scenes=Array.from({length:receipt.sceneCount},(_,i)=>({name:'C80R2_HISTORY_'+i,nodes:[0]}));
  for(const [i,s]of Object.entries(receipt.scenes))scenes[i]={name:s.name,nodes:[...s.nodes]};
  return {asset:structuredClone(receipt.asset),scenes,nodes:structuredClone(receipt.nodes)};
};
test('P02 exact source selects complete 1F/2F/BOTH while retaining historical default292',()=>{
  assert.equal(SHA,'db5ce3d7ef4c0bc8910de7f46df80029617b37d38ff4ddccd330cf70a2818a2a');
  assert.equal(SHA,receipt.sourceSha256);assert.equal(COUNT,341);assert.equal(receipt.defaultScene,292);
  assert.deepEqual(FLOORS,{'1F':338,'2F':339,BOTH:340});
  const actual=resolveC80R2ChainFloorScenes(fixture());
  for(const [floor,i]of Object.entries(FLOORS)){
    assert.equal(actual[floor],i);assert.equal(SCENES[i].floor,floor);
    assert.equal(fnv(SCENES[i].rootNodes),receipt.scenes[i].fnv);
    assert.deepEqual(SCENES[i].rootNodes,receipt.scenes[i].nodes);
  }
});
test('P02 KV/LV connections bind to water with their actual new parent paths',()=>{
  for(const [name,node]of Object.entries(receipt.anchors)){
    const scene=name.includes('2F')||name.includes('PA1')?339:338;
    const r=resolveP02TechnicalNode(fixture(),scene,node);
    assert.ok(r,name);assert.equal(r.id,'technical-water');assert.equal(r.mesh,receipt.nodes[node].mesh);
    assert.ok(r.path.length>=3,'KV/LV subgroup parent must remain bound');
    assert.equal(resolveP02TechnicalNode(fixture(),292,node),null);
  }
});
test('P02 rejects source-root reorder, wrong mesh, renamed node and changed parent',()=>{
  const node=receipt.anchors.S1_COLD_FROM_MANIFOLD;
  const mutations=[
    j=>j.scenes[338].nodes.reverse(),
    j=>j.nodes[node].mesh++,
    j=>j.nodes[node].name='other-source',
    j=>j.nodes[TECH[338][node].path.at(-2)].children=[],
  ];
  for(const mutate of mutations){const j=fixture();mutate(j);assert.equal(resolveP02TechnicalNode(j,338,node),null);}
});
test('P02 building inventory fails closed on a different loaded GLB SHA',()=>{
  const r=resolveBuildingPartLayerBindings({gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:'a01025bd91cbff6e83c2bdaea954e77333368e2f40f356a6672ea0dc2c09246a',sceneIndex:338,activeSceneRoot:null,area:'D',floor:'1F'});
  assert.equal(r.sourceVerified,false);
});
