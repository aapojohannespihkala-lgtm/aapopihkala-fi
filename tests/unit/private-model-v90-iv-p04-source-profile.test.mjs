import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V90_IV_P04_SOURCE_SHA256, V90_IV_P04_PARENT_SHA256,
  V90_IV_P04_SCENE_COUNT, V90_IV_P04_FLOORS, V90_IV_P04_OPTIN_SCENES,
  V90_IV_P04_ROOT_IDS, V90_IV_P04_BUILDING_SCENES,
  V90_IV_P04_BUILDING_PARTS, V90_IV_P04_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V90IVP04LayerSourceProfile.mjs';
import {
  V90_SOURCE_SHA256, V90_FLOORS, V90_BUILDING_PARTS, V90_BUILDING_SCENES,
  V90_TECHNICAL_REVIEW_ROOTS,
} from '../../src/scripts/privateModelC80R2V90LayerSourceProfile.mjs';
import { resolveTechnicalReviewRoots } from '../../src/scripts/privateModelTechnicalReviewPresentation.mjs';

const SHA='e41d5c77527e708fe4ed7dcf3b417c1b9eb2bee7867e59e1b77dad0f02cc4382';
test('IV focus keeps V90 identity, excludes invented building parts and old scene mutations',()=>{
  assert.equal(V90_IV_P04_SOURCE_SHA256,SHA);
  assert.equal(V90_IV_P04_PARENT_SHA256,V90_SOURCE_SHA256);
  assert.notEqual(SHA,V90_SOURCE_SHA256);
  assert.equal(V90_IV_P04_SCENE_COUNT,301);
  assert.strictEqual(V90_IV_P04_FLOORS,V90_FLOORS);
  assert.strictEqual(V90_IV_P04_BUILDING_PARTS,V90_BUILDING_PARTS);
  assert.deepEqual(V90_IV_P04_OPTIN_SCENES,{'1F':298,'2F':299,BOTH:300});
  for(const index of [295,296,297]){
    assert.strictEqual(V90_IV_P04_BUILDING_SCENES[index],V90_BUILDING_SCENES[index]);
    assert.strictEqual(V90_IV_P04_TECHNICAL_REVIEW_ROOTS[index],V90_TECHNICAL_REVIEW_ROOTS[index]);
  }
  for(const [index,size] of [[298,11],[299,30],[300,40]]){
    const scene=V90_IV_P04_BUILDING_SCENES[index];
    assert.equal(scene.rootNodes.length,size);
    assert.deepEqual(scene.rootNodes,V90_IV_P04_ROOT_IDS[index]);
    assert.equal(new Set(scene.rootNodes).size,size);
    assert.deepEqual(scene.paths,{});
    assert.equal(V90_IV_P04_TECHNICAL_REVIEW_ROOTS[index].length,size);
    assert.ok(scene.name.includes('OPTIN_WORK_TEST'));
  }
});

const fixture=(index)=>{
  const roots=V90_IV_P04_ROOT_IDS[index];
  const s={children:[]};
  const associations=new Map();
  const nodes=[];
  for(const node of roots){
    const name='SOURCE_EXACT_IV_NODE_'+node;
    nodes[node]={name};
    const o={name,parent:s};s.children.push(o);associations.set(o,{nodes:node});
  }
  const scenes=Array.from({length:301},()=>({name:'other',nodes:[]}));
  scenes[index]={name:V90_IV_P04_BUILDING_SCENES[index].name,nodes:[...roots]};
  const extras={current:false,asBuilt:false,viewerFloorScenes:{'1F':295,'2F':296,BOTH:297}};
  return {gltf:{parser:{json:{scenes,nodes,asset:{extras}},associations},scenes:Object.assign([],{[index]:s})},scene:s};
};
test('IV focus resolves complete source-exact SHA and rejects modified scene or non-current guard',()=>{
  for(const index of [298,299,300]){
    const {gltf,scene}=fixture(index);
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,SHA,SHA)?.length,V90_IV_P04_ROOT_IDS[index].length);
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,'0'.repeat(64),SHA),null);
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,SHA,'0'.repeat(64)),null);
    gltf.parser.json.scenes[index].nodes.reverse();
    assert.equal(resolveTechnicalReviewRoots(gltf,scene,index,SHA,SHA),null);
  }
  const {gltf,scene}=fixture(300);
  gltf.parser.json.asset.extras.current=true;
  assert.equal(resolveTechnicalReviewRoots(gltf,scene,300,SHA,SHA),null);
});
test('no missing scene root may be presented as a verified IV source',()=>{
  const {gltf,scene}=fixture(298);
  scene.children.pop();
  assert.equal(resolveTechnicalReviewRoots(gltf,scene,298,SHA,SHA),null);
});
