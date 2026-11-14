import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import {
  TATE4_MJ6263_SOURCE_SHA256 as SHA,resolveM6263TechnicalNode,
  resolveM6263BuildingNode,resolveM6263CardNode,m6263ReviewProfile,
} from '../../src/scripts/privateModelM6263ViewerReceipt.mjs';
import {createM6263FloorRuntime} from '../../src/scripts/privateModelM6263FloorRuntime.mjs';
import {shouldInvalidateModelSelection} from '../../src/scripts/privateModelSceneSelectionInvalidation.mjs';
const receipt=JSON.parse(readFileSync(new URL('../fixtures/m6263-viewer-source.json',import.meta.url),'utf8'));
function fixture(){
  const f=structuredClone(receipt),json={asset:f.asset,scene:f.scene,
    scenes:Array.from({length:360},()=>({nodes:[]})),nodes:Array.from({length:12097},()=>({})),meshes:Array.from({length:4549},()=>({}))};
  for(const [i,s] of Object.entries(f.scenes))json.scenes[i]=s;
  for(const [i,n] of Object.entries(f.nodes))json.nodes[i]=n;
  return json;
}
test('corrected MJ63 nodes are ventilation only in actual 1F/BOTH opt-ins',()=>{
  const j=fixture();
  for(const scene of [353,355,357,359])
    for(const node of [12092,12093,12094,12095,12096])
      assert.equal(resolveM6263TechnicalNode(j,SHA,scene,node)?.id,'technical-ventilation');
  assert.equal(resolveM6263TechnicalNode(j,SHA,354,12096),null);
  assert.equal(resolveM6263TechnicalNode(j,SHA,353,11315),null);
});
test('eight closed/open/piled upper panes and five lower bays use exact current paths',()=>{
  const j=fixture();
  for(const [scene,ids] of [[354,[10555,10556,10557,10558,10559,10560,10561,10562]],
    [356,[12077,10556,10557,10558,10559,10560,10561,10562]],
    [358,[12078,12079,12080,12081,12082,12083,12084,12085]]]){
    for(const id of [...ids,6472,6473,6474,6475,6476])assert.equal(resolveM6263BuildingNode(j,SHA,scene,id,[id])?.id,'architecture-windows');
  }
  assert.equal(resolveM6263BuildingNode(j,SHA,358,10555,[10555]),null);
  assert.equal(resolveM6263BuildingNode(j,SHA,354,12078,[12078]),null);
  assert.equal(resolveM6263BuildingNode(j,SHA,358,12078,[5,12078]),null);
});
test('existing TATE4 classifications have explicit new-SHA node/path receipts',()=>{
  const j=fixture();
  assert.equal(resolveM6263BuildingNode(j,SHA,353,7999,[7999])?.id,'architecture-walls-exterior');
  assert.equal(resolveM6263TechnicalNode(j,SHA,354,12053)?.id,'technical-ventilation');
  assert.equal(resolveM6263TechnicalNode(j,'0'.repeat(64),354,12053),null);
  j.nodes[12053].mesh++;
  assert.equal(resolveM6263TechnicalNode(j,SHA,354,12053),null);
});
test('the real technical classifier reaches M6263 before legacy scene-family guards',()=>{
  const file=readFileSync(new URL('../../src/scripts/privateModelTechnicalSystemsLayers.ts',import.meta.url),'utf8');
  const block=file.match(/const v26Device = [\s\S]*?\n};/)?.[0];
  assert.ok(block);
  const classify=new Function('resolveM6263TechnicalNode','TATE4_MJ6263_SOURCE_SHA256',
    stripTypeScriptTypes(block,{mode:'strip'})+'\nreturn v26Device;')(resolveM6263TechnicalNode,SHA);
  const j=fixture(),ctx={sourceJson:j,loadedGlbSha256:SHA,sourceSceneIndex:353};
  assert.deepEqual(classify(ctx,{nodeIndex:12096}),{id:'technical-ventilation',scope:{apartment:'D',storey:'1F',phase:'ACTIVE_IN_SELECTED_WORKTEST'}});
  assert.equal(classify({...ctx,sourceSceneIndex:354},{nodeIndex:12053})?.scope.storey,'2F');
  assert.equal(classify({...ctx,sourceSceneIndex:354},{nodeIndex:12096}),null);
});
test('new source card binds exact restored donor and rejects altered links or valve parent',()=>{
  const j=fixture();
  const card=resolveM6263CardNode(j,SHA,353,12096);
  assert.deepEqual(card.path,[12096]);
  assert.ok(card.links.some(x=>x.link?.includes('1v8tyPG99W-jglBnHO7VHnxEUj7Sz8S2i')));
  j.nodes[12096].extras.sourceLinks[0]={link:'https://example.invalid/wrong-source'};
  assert.equal(resolveM6263CardNode(j,SHA,353,12096),null);
  const k=fixture();k.nodes[12092].children.reverse();
  assert.equal(resolveM6263TechnicalNode(k,SHA,353,12094),null);
});
test('old parent SHA, changed name, unknown scene/node and prototype keys fail closed',()=>{
  const j=fixture();
  for(const node of [99999,-1,'__proto__',undefined])assert.equal(resolveM6263CardNode(j,SHA,353,node),null);
  assert.equal(resolveM6263CardNode(j,SHA,350,12096),null);
  assert.equal(resolveM6263CardNode(j,'ea4050b463a886ff0cb0c7d544495e6c753d9b87e76459f134c1d439e42a215b',353,12096),null);
  j.nodes[12096].name+='changed';
  assert.equal(resolveM6263CardNode(j,SHA,353,12096),null);
});
test('actual raw GLB receipts and floor/glazing lifecycle',{skip:!process.env.YLIS_M6263_GLB},()=>{
  const data=readFileSync(process.env.YLIS_M6263_GLB);
  assert.equal(createHash('sha256').update(data).digest('hex'),SHA);
  const j=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
  const scenes=j.scenes.map(s=>({name:s.name,children:(s.nodes??[]).map(i=>({name:j.nodes[i].name})),traverse(fn){for(const n of this.children)fn(n);}}));
  let mounted=scenes[355];const gltf={scenes,parser:{json:j}};
  const runtime=createM6263FloorRuntime({gltf,sha:SHA,mount:s=>{mounted=s;},mounted:()=>mounted});
  for(const [floor,state,index] of [['1F','CLOSED',353],['2F','CLOSED',354],['2F','ONE_OPEN',356],['2F','STACKED',358],['BOTH','CLOSED',355],['BOTH','ONE_OPEN',357],['BOTH','STACKED',359]]){
    assert.ok(runtime.apply(floor));assert.ok(runtime.setGlazing(state));assert.equal(runtime.sceneIndex,index);assert.equal(mounted,scenes[index]);
    assert.ok(m6263ReviewProfile(j,SHA,index));
  }
  assert.ok(runtime.apply('1F'));assert.equal(runtime.sceneIndex,353);
  assert.ok(runtime.apply('2F'));assert.equal(runtime.sceneIndex,358);
  runtime.restore();assert.equal(mounted,scenes[355]);assert.equal(runtime.active,false);
  runtime.dispose();assert.equal(runtime.apply('2F'),null);
});
test('real viewer scene owner preserves an active glazing mount without restoring it',()=>{
  const j=fixture();
  const scenes=j.scenes.map(s=>({name:s.name,children:(s.nodes??[]).map(i=>({name:j.nodes[i].name})),traverse(fn){for(const n of this.children)fn(n);}}));
  const modelRoot={children:[scenes[355]],clear(){this.children=[];},add(s){this.children.push(s);},updateMatrixWorld(){}};
  const file=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  const block=file.match(/const setModelScene = [\s\S]*?\n      };/)?.[0];assert.ok(block);
  const noop=()=>{};
  let invalidations=0;
  const owner=new Function('env',`const {modelRoot,fullModelScene,beforeLayersSceneChange,applyElectricalLayerState,syncMainViewScope,clearPickedPoint,refreshEdgeRendering,refreshLayers,queueMicrotask,shouldInvalidateModelSelection,selectedObject,clearSelection}=env;let mainViewScope;let clearPointMeasureOnSceneChange=null;${stripTypeScriptTypes(block,{mode:'strip'})};return {mount:setModelScene,setScope:s=>{mainViewScope=s;}};`)({modelRoot,fullModelScene:scenes[355],beforeLayersSceneChange:noop,applyElectricalLayerState:noop,syncMainViewScope:noop,clearPickedPoint:noop,refreshEdgeRendering:noop,refreshLayers:noop,queueMicrotask:noop,shouldInvalidateModelSelection,selectedObject:{nodeIndex:12144},clearSelection:()=>{invalidations++;}});
  const runtime=createM6263FloorRuntime({gltf:{scenes,parser:{json:j}},sha:SHA,mount:owner.mount,mounted:()=>modelRoot.children[0]});
  owner.setScope(runtime);
  owner.mount(modelRoot.children[0]);
  assert.equal(invalidations,0,'same-root camera mount must preserve selection');
  assert.ok(runtime.apply('2F'));
  assert.ok(invalidations>0,'2F scene swap must invalidate stale source selection');assert.ok(runtime.active);
  assert.ok(runtime.setGlazing('STACKED'));
  assert.equal(runtime.sceneIndex,358);assert.equal(runtime.floor,'2F');assert.ok(runtime.active);
  assert.equal(modelRoot.children[0],scenes[358]);
  runtime.restore();assert.equal(modelRoot.children[0],scenes[355]);assert.equal(runtime.active,false);
  assert.ok(runtime.apply('1F','STACKED'));assert.equal(runtime.sceneIndex,353);
  runtime.restore();assert.ok(runtime.apply('2F','STACKED'));assert.equal(runtime.sceneIndex,358);
});
