import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C042Kiv003Presentation,C042_KIV003_SOURCE_SHA} from '../../src/scripts/privateModelHi20C042Kiv003Presentation.mjs';
const NAME='K10_R3_WORLD10_SC19_K10_R3_D1F_KIV100_ANCHOR_003_WORK_TEST_SLEEVE_COVER_ORIENT';
function fixture(){
  const nodes=Array.from({length:6058},()=>({}));
  const scenes=Array.from({length:52},()=>({nodes:[]}));
  const world=Array.from({length:52},()=>({children:[]})), assoc=new Map(), objects=[];
  for(const [scene,parent,target,parentCount] of [[50,1663,1622,5],[51,6057,616,10]]){
    const ids=Array.from({length:19},(_,i)=>target-19+i);
    nodes[target]={name:NAME,children:ids,extras:{realWallHostVerified:false,
      sourceAnchorCoverNode:1151,sourceAnchorSleeveNode:1150,
      C78SourceNode:{sourceScene:77,sourceNode:20509}}};
    const children=Array.from({length:parentCount},(_,i)=>i+9000);
    children[1]=target;
    nodes[parent]={name:'K10_SC25_KIV100x10_WORLD_YUP_AXIS_REPLACEMENT_RX_MINUS90_WORK_TEST',
      children,extras:{modelStage:'WORK_TEST',physicalWallCuts:'NOT_VERIFIED'}};
    const parentObj={name:nodes[parent].name,children:[]};
    const targetObj={name:NAME,children:[],visible:true};
    for(const id of ids){
      nodes[id]={name:NAME+'__part_'+id,mesh:id};
      const o={name:nodes[id].name};
      targetObj.children.push(o);assoc.set(o,{nodes:id});
    }
    parentObj.children.push(targetObj);
    assoc.set(parentObj,{nodes:parent});assoc.set(targetObj,{nodes:target});
    for(let i=2;i<parentCount;i++)parentObj.children.push({name:'OTHER_KIV'+i,visible:true});
    world[scene].children.push(parentObj);scenes[scene].nodes.push(parent);
    objects.push({targetObj,parentObj});
  }
  const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,scenes,nodes};
  return {gltf:{parser:{json,associations:assoc},scenes:world},objects};
}
test('exact 1F/BOTH hide is reversible and other KIV objects stay intact',()=>{
  const {gltf,objects}=fixture();
  const other=objects.map(({parentObj})=>parentObj.children.slice(1));
  const result=createHi20C042Kiv003Presentation(gltf,C042_KIV003_SOURCE_SHA);
  assert.equal(result.available,true);assert.equal(result.count,2);
  assert.equal(result.setEnabled(true),true);assert.equal(result.enabled,true);
  objects.forEach(({targetObj,parentObj},i)=>{
    assert.equal(targetObj.visible,false);
    assert.deepEqual(parentObj.children.slice(1),other[i]);
    assert.equal(targetObj.children.length,19);
  });
  assert.equal(result.setEnabled(false),true);
  objects.forEach(({targetObj})=>assert.equal(targetObj.visible,true));
  result.setEnabled(true);result.dispose();
  objects.forEach(({targetObj})=>assert.equal(targetObj.visible,true));
});
test('wrong SHA or verified host fails closed',()=>{
  const {gltf,objects}=fixture();
  assert.equal(createHi20C042Kiv003Presentation(gltf,'badsha').available,false);
  gltf.parser.json.nodes[1622].extras.realWallHostVerified=true;
  assert.equal(createHi20C042Kiv003Presentation(gltf,C042_KIV003_SOURCE_SHA).available,false);
  objects.forEach(({targetObj})=>assert.equal(targetObj.visible,true));
});
test('wrong scene, parent, child mesh or source provenance fails closed',()=>{
  for (const tweak of [
    g=>g.parser.json.scenes[51].nodes=[],
    g=>g.parser.json.nodes[6057].children=[616],
    g=>g.parser.json.nodes[1622].children.pop(),
    g=>g.parser.json.nodes[616].extras.C78SourceNode.sourceNode=20000,
    g=>g.scenes[50].children[0].children=[],
  ]){
    const {gltf,objects}=fixture();tweak(gltf);
    assert.equal(createHi20C042Kiv003Presentation(gltf,C042_KIV003_SOURCE_SHA).available,false);
    objects.forEach(({targetObj})=>assert.equal(targetObj.visible,true));
  }
});

test('C80-042 actual 52-scene viewer lifecycle enables source-locked hide and restores on disposal', async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../../src/scripts/privateModelHi20K17WhitePresentation.mjs',import.meta.url),'utf8');
  assert.match(source,/createHi20C042Kiv003Presentation\(gltf,verifiedSha\)/);
  assert.match(source,/kiv003\.available && kiv003\.setEnabled\(true\)/);
  assert.match(source,/kiv003\.dispose\(\)/);
});

test('source-locked KIV003 hide toggles are idempotent in BOTH scene and preserve other vent objects',()=>{
  const {gltf,objects}=fixture();
  const original=objects.map(x=>x.targetObj.visible);
  const api=createHi20C042Kiv003Presentation(gltf,C042_KIV003_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.setEnabled(true),true);
  assert.equal(api.setEnabled(true),true);
  assert.equal(api.enabled,true);
  for(const {targetObj,parentObj} of objects){
    assert.equal(targetObj.visible,false);
    assert.equal(parentObj.children.filter(x=>x!==targetObj).every(x=>x.visible!==false),true);
  }
  assert.equal(api.setEnabled(false),true);
  assert.equal(api.setEnabled(false),true);
  objects.forEach((x,i)=>assert.equal(x.targetObj.visible,original[i]));
  api.dispose();
});

test('KIV003 opt-in presentation never mutates source node and sourceLinks JSON',()=>{
  const {gltf}=fixture();
  const sourceBefore=JSON.stringify(gltf.parser.json);
  const api=createHi20C042Kiv003Presentation(gltf,C042_KIV003_SOURCE_SHA);
  assert.equal(api.available,true);
  assert.equal(api.setEnabled(true),true);
  assert.equal(JSON.stringify(gltf.parser.json),sourceBefore);
  assert.equal(api.setEnabled(false),true);
  api.dispose();
  assert.equal(JSON.stringify(gltf.parser.json),sourceBefore);
});
