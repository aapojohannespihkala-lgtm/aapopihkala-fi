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
const indices=(j,bin,node)=>{
 const a=j.accessors[j.meshes[j.nodes[node].mesh].primitives[0].indices],v=j.bufferViews[a.bufferView],start=(v.byteOffset??0)+(a.byteOffset??0);
 const size={5121:1,5123:2,5125:4}[a.componentType];assert.ok(size);
 return Array.from({length:a.count},(_,i)=>size===1?bin.readUInt8(start+i):size===2?bin.readUInt16LE(start+2*i):bin.readUInt32LE(start+4*i));
};
const edgeCounts=ids=>{const edges=new Map();for(let i=0;i<ids.length;i+=3)for(const[a,b]of[[ids[i],ids[i+1]],[ids[i+1],ids[i+2]],[ids[i+2],ids[i]]]){const key=[Math.min(a,b),Math.max(a,b)].join(',');edges.set(key,(edges.get(key)??0)+1);}return [...edges.values()];};
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
 const v75=+Object.keys(BACK).find(n=>BACK[n]===12866),v87=+Object.keys(BACK).find(n=>BACK[n]===12947);
 assert.ok(edgeCounts(indices(j,bin,v75)).every(n=>n===2),'K1 V75 capped mesh has no new open or non-manifold edges');
 assert.deepEqual(indices(j,bin,v87),indices(p,pb,12947),'K1 V87 keeps the source index topology');
 for(const [s,spec] of Object.entries(SPECS)){
  assert.ok(isC80620R22SourceScene(j,SHA,+s,spec.floor));assert.ok(resolveC80437SuccessorReceiptScene(j,SHA,+s));
  assert.equal(isC80620R22SourceScene(j,PARENT_SHA,+s),false);
  const before=bindings(p,PARENT_SHA,spec.parent),now=bindings(j,SHA,+s),mapped=new Map([...now].map(([n,v])=>[BACK[n]??n,v]));
  assert.deepEqual([...before].filter(([n,v])=>![1718,12035].includes(n)&&mapped.get(n)!==v),[],'lost/changed layer bindings '+s);
  const removed=[...before.keys()].filter(n=>n===1718||n===12035).length;assert.ok(now.size>=before.size-removed,'binding count '+s);
  const active=[];const visit=n=>{active.push(n);for(const c of j.nodes[n].children??[])visit(c);};for(const r of j.scenes[s].nodes)visit(r);
  for(const n of [1718,1719,12035])assert.equal(active.includes(n),false,'removed original '+n);
  assert.equal(active.filter(n=>n===13168).length,spec.floor==='2F'?0:1,'one S2 handset');
  assert.equal(active.filter(n=>n===13176).length,spec.floor==='1F'?0:1,'one K5 socket');
  for(const n of [12565,12567,12931,12932,12933,12934])assert.equal(active.filter(i=>(BACK[i]??i)===n).length,spec.floor==='2F'?0:1,'VM20 once '+n);
  if(spec.floor==='1F')assert.ok(active.includes(12138),'concealed VP1 pipe retained');
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
test('R22 opt-in scenes are rehydrated from the source graph before root validation',()=>{
 const src=readFileSync(new URL('../../src/scripts/privateModelSourceCards.ts',import.meta.url),'utf8');
 assert.match(src,/if \(digest === C80_620R22_GLB_SHA256\) \{\s*const indexes = Object\.keys\(C80_620R22_SCENES\)/);
 assert.match(src,/\(digest === C80_620R22_GLB_SHA256 && \(C80_620R22_SCENES as Record<number, unknown>\)\[sceneIndex\] !== undefined\)/);
});
