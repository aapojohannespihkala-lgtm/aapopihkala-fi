import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import { resolveC80R2ChainFloorScenes } from '../../src/scripts/privateModelC80R2ChainScenes.mjs';
import { TATE3_SOURCE_SHA256 as SHA, TATE3_FLOORS as FLOORS, TATE3_BUILDING_SCENES as SCENES,
  TATE3_TECHNICAL_NODES as TECH, resolveTate3TechnicalNode } from '../../src/scripts/privateModelC80TateThreeDeltaLayerSourceProfile.mjs';
const receipt=JSON.parse(fs.readFileSync(new URL('../fixtures/c80-tate-three-delta-source-receipt.json',import.meta.url)));
const fixture=()=>{
 const scenes=Array.from({length:350},(_,i)=>({name:'C80R2_HISTORY_'+i,nodes:[0]}));
 for(const [i,s] of Object.entries(receipt.scenes))scenes[i]={name:s.name,nodes:[...s.nodes]};
 return {asset:structuredClone(receipt.asset),scenes,nodes:structuredClone(receipt.nodes)};
};
test('three deltas have independent SHA-bound identities in 1F/2F/BOTH',()=>{
 assert.equal(SHA,receipt.sourceSha256);assert.equal(receipt.defaultScene,292);
 assert.deepEqual(FLOORS,{'1F':347,'2F':348,BOTH:349});
 const selected=resolveC80R2ChainFloorScenes(fixture());
 for(const [floor,i] of Object.entries(FLOORS)){
  assert.equal(selected[floor],i);assert.deepEqual(SCENES[i].rootNodes,receipt.scenes[i].nodes);
  const ids=receipt.anchors.filter(n=>TECH[i][n]);
  assert.equal(ids.filter(n=>n<=11906).length,floor==='2F'?0:7);
  assert.equal(ids.filter(n=>n===11907).length,floor==='1F'?0:1);
  assert.ok(ids.includes(11909));
  for(const n of ids)assert.equal(resolveTate3TechnicalNode(fixture(),i,n)?.id,n===11909?'technical-electrical':'technical-drainage');
  for(const n of receipt.excluded)assert.equal(TECH[i][n],undefined);
 }
 assert.equal(TECH[349][11909].path[0],11908);assert.equal(TECH[349][11829].id,'technical-electrical');
});
test('branch-local node11900 and colliding scenes cannot impersonate another delta',()=>{
 for(const mutate of [
  j=>j.nodes[11900].mesh=receipt.nodes[11907].mesh,
  j=>j.nodes[11909].extras.sourceLinks=[],
  j=>j.nodes[11908].children=[],
  j=>j.scenes[349].nodes.reverse(),
  j=>j.scenes[349].name=receipt.scenes[348].name,
  j=>j.asset.extras.current=true,
 ]){
  const j=fixture();mutate(j);
  const node=j.nodes[11900].mesh!==receipt.nodes[11900].mesh?11900:11909;
  assert.equal(resolveTate3TechnicalNode(j,349,node),null);
 }
});
test('new source never borrows predecessor SHA approval',()=>{
 const result=resolveBuildingPartLayerBindings({gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:'69b7adf599d63aa954b5dd93d64ae65baca5c41df7ff3d555bf3236560d9d3b4',sceneIndex:347,activeSceneRoot:null,area:'D',floor:'1F'});
 assert.equal(result.sourceVerified,false);
});
