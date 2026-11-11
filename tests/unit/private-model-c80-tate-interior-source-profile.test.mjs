import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TATE4_SOURCE_SHA256 as SHA,TATE4_FLOORS as FLOORS,TATE4_TECHNICAL_NODES as TECH,TATE4_CARD_NODES as CARDS,
 resolveTate4TechnicalNode,resolveTate4CardNode} from '../../src/scripts/privateModelC80TateInteriorLayerSourceProfile.mjs';
import {resolveBuildingPartLayerBindings} from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import {createSourceCardResolver} from '../../src/scripts/privateModelSourceCards.ts';
const receipt=JSON.parse(fs.readFileSync(new URL('../fixtures/c80-tate-interior-source-receipt.json',import.meta.url)));
const fixture=()=>({asset:structuredClone(receipt.asset),nodes:structuredClone(receipt.nodes),
 scenes:Array.from({length:receipt.sceneCount},(_,i)=>structuredClone(receipt.scenes[i]??{name:'HISTORY_'+i,nodes:[0]}))});
test('published deltas and three donor branches have independently remapped identities',()=>{
 assert.equal(SHA,receipt.sourceSha256);assert.deepEqual(FLOORS,{'1F':350,'2F':351,BOTH:352});assert.equal(receipt.defaultScene,292);
 for(const [floor,si] of Object.entries(FLOORS)){
  const j=fixture();
  for(const [n,expected] of Object.entries(TECH[si]))assert.deepEqual(resolveTate4TechnicalNode(j,si,Number(n)),expected);
  for(const [n,expected] of Object.entries(CARDS[si]))assert.deepEqual(resolveTate4CardNode(j,si,Number(n)),expected);
  assert.equal(TECH[si][receipt.adapter]?.id,floor==='2F'?undefined:'technical-drainage');
  for(const old of receipt.oldD4)assert.equal(TECH[si][old],undefined);
 }
 assert.equal(TECH[352][11904].id,'technical-drainage');assert.equal(TECH[352][11907].id,'technical-drainage');
 assert.equal(TECH[352][11909].id,'technical-electrical');assert.equal(TECH[352][12053].id,'technical-ventilation');
});
test('selection cards use the actual scene parent path and exact copied source links',()=>{
 const j=fixture(),si=352,objectMap=new Map(),associations=new Map();
 const scene={name:j.scenes[si].name,parent:null};
 const walk=(i,parent)=>{
  if(!j.nodes[i]) return;
  const d=j.nodes[i],o={name:d.name,parent,userData:structuredClone(d.extras??{})};objectMap.set(i,o);associations.set(o,{nodes:i});
  for(const c of d.children??[])walk(c,o);
 };
 for(const i of j.scenes[si].nodes)if(j.nodes[i])walk(i,scene);
 const scenes=Array.from({length:353},()=>({name:'history',parent:null}));scenes[si]=scene;
 const gltf={scenes,parser:{json:j,associations}};const resolver=createSourceCardResolver(gltf,SHA,null);
 for(const i of [11904,11907,11909,receipt.adapter,12057]){
  const result=resolver(objectMap.get(i));assert.equal(result.state,'matched');assert.ok(result.cards[0].sources.length>0);assert.match(result.cards[0].status,/WORK_TEST/);
 }
 const selected=objectMap.get(receipt.adapter);selected.parent=objectMap.get(11908);
 assert.equal(resolver(selected).state,'mismatch');
 assert.equal(createSourceCardResolver(gltf,receipt.sourceSHA256.base,null)(objectMap.get(11904)).state,'unavailable');
});
test('wrong mesh, parent, source links, scene order and old source identity fail closed',()=>{
 for(const mutate of [j=>j.nodes[11904].mesh++,j=>j.nodes[11904].extras.sourceLinks=[],
  j=>j.scenes[352].nodes.reverse(),j=>j.asset.extras.viewerFloorScenes.BOTH=349,
  j=>j.nodes[11908].children=[],j=>j.nodes[11908].name+='stale']){
  const j=fixture();mutate(j);
  const a=resolveTate4TechnicalNode(j,352,11904);const b=resolveTate4TechnicalNode(j,352,11909);
  assert.ok(a===null||b===null);
 }
 const result=resolveBuildingPartLayerBindings({gltf:{},expectedSourceSha256:SHA,loadedSourceSha256:receipt.sourceSHA256.base,sceneIndex:350,activeSceneRoot:null,area:'D',floor:'1F'});
 assert.equal(result.sourceVerified,false);
 const j=fixture();const c=CARDS[352][receipt.adapter];j.nodes[c.linkNode].extras.sourceLinks=[];assert.equal(resolveTate4CardNode(j,352,receipt.adapter),null);
});
