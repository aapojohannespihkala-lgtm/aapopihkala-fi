import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Object3D,Group} from 'three';
import {C80_620R22_GLB_SHA256 as SHA,C80_620R22_GLB_BYTES as BYTES,C80_620R22_SCENES as SPECS,C80_620R22_BACK_MAP as BACK,C80_620R22_COW_ALIASES as ALIASES,isC80620R22SourceScene} from '../../src/scripts/privateModelC80620R22SourceProfile.mjs';
import {C80_620R21_GLB_SHA256 as PARENT_SHA} from '../../src/scripts/privateModelC80620R21SourceProfile.mjs';
import {resolveC80620R22SceneIndex,c80620R22ReviewProfile} from '../../src/scripts/privateModelC80620R22FloorRuntime.mjs';
import {resolveC80437SuccessorReceiptScene,resolveC80437SuccessorBuildingNode,resolveC80SuccessorTechnicalNode,withC80SuccessorMemo} from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
import {resolveConcealedTechnicalObjects} from '../../src/scripts/privateModelConcealedTechnicalPresentation.mjs';
const parse=p=>{const b=readFileSync(p),n=b.readUInt32LE(12);return {b,json:JSON.parse(b.subarray(20,20+n)),bin:b.subarray(28+n)};};
const bindings=(j,sha,s)=>withC80SuccessorMemo(()=>{
 const out=new Map();const walk=(n,p)=>{const path=[...p,n],nd=j.nodes[n];
  if(nd.mesh!==undefined){const b=resolveC80437SuccessorBuildingNode(j,sha,s,n,path),t=b?null:resolveC80SuccessorTechnicalNode(j,sha,s,n);if(b||t)out.set(n,(b?'B:':'T:')+(b??t).id+':'+(b??t).storey);}
  for(const c of nd.children??[])walk(c,path);
 };for(const r of j.scenes[s].nodes)walk(r,[]);return out;
});
test('R22 retains the six explicit floor and glazing roles and rejects other roles',()=>{
 assert.deepEqual(['1F','2F','BOTH'].map(f=>resolveC80620R22SceneIndex(f)),[686,687,688]);
 assert.equal(resolveC80620R22SceneIndex('BOTH','ONE_OPEN'),689);
 assert.equal(resolveC80620R22SceneIndex('BOTH','STACKED'),690);
 assert.equal(resolveC80620R22SceneIndex('BOTH','CLOSED',true),691);
 assert.equal(resolveC80620R22SceneIndex('2F','STACKED'),null);
 assert.equal(isC80620R22SourceScene({},'0'.repeat(64),688,'BOTH'),false);
 assert.deepEqual(Object.values(SPECS).map(s=>s.parent),[680,681,682,683,684,685]);
});
const real=process.env.C80_620R22_GLB_PATH&&process.env.C80_620R21_GLB_PATH;
test('authentic R22 GLB: immutable R21 tables/BIN, all source bindings and concealed routes survive COW', {skip:!real},()=>{
 const {b,json:j,bin}=parse(process.env.C80_620R22_GLB_PATH),{json:p,bin:pb}=parse(process.env.C80_620R21_GLB_PATH);
 assert.equal(b.length,BYTES);assert.equal(createHash('sha256').update(b).digest('hex'),SHA);
 for(const k of ['scenes','nodes','meshes','materials','accessors','bufferViews','textures','images','samplers'])assert.deepEqual(j[k]?.slice(0,p[k]?.length??0),p[k],'immutable '+k);
 assert.deepEqual(bin.subarray(0,pb.length),pb);assert.equal(j.scene,292);
 for(const [s,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R22SourceScene(j,SHA,+s,spec.floor));assert.ok(resolveC80437SuccessorReceiptScene(j,SHA,+s));
  assert.equal(isC80620R22SourceScene(j,PARENT_SHA,+s),false);
  const before=bindings(p,PARENT_SHA,spec.parent),now=bindings(j,SHA,+s),mapped=new Map([...now].map(([n,v])=>[BACK[n]??n,v]));
  assert.deepEqual([...before].filter(([n,v])=>mapped.get(n)!==v),[],'lost/changed layer bindings '+s);
  assert.ok(now.size>=before.size,'binding count '+s);
  const associations=new Map(),scene=new Group();scene.name=j.scenes[s].name;
  const build=n=>{const o=new Object3D(),nd=j.nodes[n];o.name=nd.name??'';o.userData=nd.extras??{};o.isMesh=nd.mesh!==undefined;associations.set(o,{nodes:n,...(o.isMesh?{meshes:nd.mesh}:{})});for(const c of nd.children??[])o.add(build(c));return o;};
  for(const n of j.scenes[s].nodes)scene.add(build(n));
  const scenes=Array(j.scenes.length);scenes[s]=scene;
  const concealed=resolveConcealedTechnicalObjects({parser:{json:j,associations},scenes},scene,+s,SHA,SHA);
  assert.ok(concealed,'concealed gate '+s);
  assert.ok(concealed.objects.length>=(spec.floor==='2F'?0:8),'concealed count '+s);
  assert.ok(c80620R22ReviewProfile(j,SHA,+s));
 }
 // A copied material/geometry must never keep a stale name or mesh in building bindings.
 for(const [n,a]of Object.entries(ALIASES))if(a.building){assert.equal(j.nodes[n].mesh??null,a.mesh??null);assert.equal(j.nodes[n].name,a.name??j.nodes[a.orig].name);}
 const mutated=structuredClone(j);mutated.scenes[688].nodes[0]++;
 assert.equal(isC80620R22SourceScene(mutated,SHA,688),false);
});
