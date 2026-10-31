import test from 'node:test';
import assert from 'node:assert/strict';
import {createHi20C020WhiteSideWallPresentation,C020_SOURCE_SHA} from '../../src/scripts/privateModelHi20C020WhiteSideWallPresentation.mjs';

function material(name){
  return {name,color:{name},transparent:false,opacity:1,depthWrite:true,
    clone(){return {...this,color:{...this.color},dispose(){this.disposed=true;}};}};
}
function fixture(){
  const nodes=Array.from({length:6438},()=>({}));
  const meshes=Array.from({length:1850},()=>({}));
  const scenes=Array.from({length:52},()=>({traverse(){}}));
  const associations=new Map(),targets=[];
  const blue=material('beige'),white=material('white');
  meshes[1791]={name:'HI20_WP3_C80-020_X0_ENDWALL_220MM_OUTERFACE_FIXED_COW',
    primitives:[{material:284}],extras:{ownerMeasuredThicknessMm:220,physicalHost:'HOST_HOLD',sourceLinks:[{},{}]}};
  meshes[1849]={primitives:[{material:340}]};
  [5880,5882].forEach((id,i)=>{
    const sc=i?51:48,ref=i?6437:6431;
    const name='HI20_WP3_C80-020_X0_WEST_ENDWALL_220MM_OPTIN_'+(i?25:24);
    nodes[id]={mesh:1791,name,extras:{measuredX0EnvelopeM:0.22,physicalHost:'HOST_HOLD',current:false,asBuilt:false}};
    nodes[ref]={mesh:1849};
    const a={isMesh:true,material:blue},b={isMesh:true,material:white};
    associations.set(a,{nodes:id});associations.set(b,{nodes:ref});
    scenes[sc].traverse=cb=>{cb(a);cb(b);};
    targets.push(a);
  });
  const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},scene:0,
    nodes,meshes,scenes:Array.from({length:52},()=>({})),
    materials:Array.from({length:341},(_,i)=>i===284?{
      name:'C80_020_BALCONY_SIDE_VISUAL_WORK_ASSUMPTION',
      pbrMetallicRoughness:{baseColorFactor:[0.87,0.86,0.82,1]}}:i===340?{
      name:'C80-043_OWNER_UNIFIED_WHITE_PHYSICAL_2F_WALL_WORK_TEST',
      pbrMetallicRoughness:{baseColorFactor:[0.93,0.93,0.93,1]}}:{})};
  return {gltf:{scenes,parser:{json,associations}},targets,blue,white};
}
test('2F/BOTH original wall geometry kept, only reversible white material clones',()=>{
  const {gltf,targets,blue,white}=fixture();
  const before=JSON.stringify(gltf.parser.json);
  const c=createHi20C020WhiteSideWallPresentation(gltf,C020_SOURCE_SHA);
  assert.equal(c.available,true,c.reason);
  assert.equal(c.count,2);
  assert.equal(c.setEnabled(true),true);
  targets.forEach(t=>{assert.notEqual(t.material,white);assert.equal(t.material.color.name,'white');});
  assert.equal(c.setEnabled(true),true);
  c.dispose();
  targets.forEach(t=>assert.equal(t.material,blue));
  assert.equal(JSON.stringify(gltf.parser.json),before);
});
test('incorrect SHA or missing source target fails closed',()=>{
  const {gltf,targets,blue}=fixture();
  assert.equal(createHi20C020WhiteSideWallPresentation(gltf,'wrong').available,false);
  gltf.scenes[51].traverse=()=>{};
  assert.equal(createHi20C020WhiteSideWallPresentation(gltf,C020_SOURCE_SHA).available,false);
  targets.forEach(t=>assert.equal(t.material,blue));
});
test('guard prevents wrong source link count or changed owner white reference',()=>{
  const {gltf}=fixture();
  gltf.parser.json.meshes[1791].extras.sourceLinks=[];
  assert.equal(createHi20C020WhiteSideWallPresentation(gltf,C020_SOURCE_SHA).available,false);
  gltf.parser.json.meshes[1791].extras.sourceLinks=[{},{}];
  gltf.parser.json.materials[340].pbrMetallicRoughness.baseColorFactor[0]=0.8;
  assert.equal(createHi20C020WhiteSideWallPresentation(gltf,C020_SOURCE_SHA).available,false);
});
