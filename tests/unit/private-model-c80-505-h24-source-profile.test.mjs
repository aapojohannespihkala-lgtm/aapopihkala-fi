import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_505_GLB_BYTES,C80_505_GLB_SHA256,C80_505_PARENT_SHA256,
 C80_505_H24_OLD_ROOT,C80_505_H24_NEW_ROOT,C80_505_NEW_PARENT_SCENES,
 C80_505_VIEWER_ROLES,isC80505H24SourceScene,
 resolveC80505H24Scenes,resolveC80505H24SceneIndex,
} from '../../src/scripts/privateModelC80505H24SourceProfile.mjs';
const roles=[[500,'1F','CLOSED',false],[488,'2F','CLOSED',false],
 [501,'BOTH','CLOSED',false],[490,'2F','ONE_OPEN',false],
 [502,'BOTH','ONE_OPEN',false],[492,'2F','STACKED',false],
 [503,'BOTH','STACKED',false],[504,'BOTH','CLOSED',true]];
test('505 maps five opt-in H24 scenes plus three unchanged 2F roles',()=>{
 assert.equal(Object.keys(C80_505_VIEWER_ROLES).length,8);
 assert.deepEqual(Object.keys(C80_505_NEW_PARENT_SCENES).map(Number),[500,501,502,503,504]);
 for(const [i,f,g,c] of roles)assert.equal(resolveC80505H24SceneIndex(f,g,c),i);
 assert.equal(resolveC80505H24SceneIndex('1F','ONE_OPEN'),null);
 assert.equal(resolveC80505H24SceneIndex('2F','CLOSED',true),null);
});
test('wrong source or incomplete scene always fails closed',()=>{
 assert.equal(isC80505H24SourceScene({},C80_505_GLB_SHA256,501),false);
 assert.equal(isC80505H24SourceScene({},'wrong',501),false);
 assert.equal(resolveC80505H24Scenes(null,C80_505_GLB_SHA256),null);
 assert.equal(resolveC80505H24Scenes({parser:{json:{}},scenes:[]},C80_505_GLB_SHA256),null);
});
const fixture=process.env.C80_505_GLB_PATH;
test('authenticated original C80 505: scene/root/metadata and negative mutations',{skip:!fixture},()=>{
 const buf=readFileSync(fixture);
 assert.equal(buf.length,C80_505_GLB_BYTES);
 assert.equal(createHash('sha256').update(buf).digest('hex'),C80_505_GLB_SHA256);
 assert.equal(buf.toString('utf8',0,4),'glTF');
 const len=buf.readUInt32LE(12),json=JSON.parse(buf.subarray(20,20+len).toString('utf8'));
 const gltf={parser:{json},scenes:json.scenes.map(s=>({name:s.name,children:s.nodes.map(i=>({name:json.nodes[i].name}))}))};
 assert.ok(resolveC80505H24Scenes(gltf,C80_505_GLB_SHA256));
 for(const [i,f] of roles){
   assert.equal(isC80505H24SourceScene(json,C80_505_GLB_SHA256,i),true);
   assert.equal(json.scenes[i].nodes.includes(C80_505_H24_NEW_ROOT),f!=='2F');
   assert.equal(json.scenes[i].nodes.includes(C80_505_H24_OLD_ROOT),false);
 }
 for(const [iStr,p] of Object.entries(C80_505_NEW_PARENT_SCENES)){
   const i=Number(iStr),original=json.scenes[p].nodes;
   assert.ok(original.includes(C80_505_H24_OLD_ROOT));
   const expected=original.map(n=>n===C80_505_H24_OLD_ROOT?C80_505_H24_NEW_ROOT:n);
   assert.deepEqual(json.scenes[i].nodes,expected);
   const bad=structuredClone(json);bad.scenes[i].nodes[0]=-1;
   assert.equal(isC80505H24SourceScene(bad,C80_505_GLB_SHA256,i),false);
   const badHost=structuredClone(json);badHost.scenes[i].extras.h24FrameCofit.sourceLinksBound=true;
   assert.equal(isC80505H24SourceScene(badHost,C80_505_GLB_SHA256,i),false);
 }
 const bad=structuredClone(json);bad.nodes[C80_505_H24_NEW_ROOT].extras.current=true;
 assert.equal(isC80505H24SourceScene(bad,C80_505_GLB_SHA256,501),false);
 const badShift=structuredClone(json);badShift.nodes[C80_505_H24_NEW_ROOT].translation[2]=0;
 assert.equal(isC80505H24SourceScene(badShift,C80_505_GLB_SHA256,501),false);
 assert.equal(json.nodes[C80_505_H24_NEW_ROOT].extras.sourceParentGlbSha256,C80_505_PARENT_SHA256);
});

test('synthetic loader names: sanitized/repeated scene and node names are accepted, false identities rejected',()=>{
 const nodes=Array.from({length:12239},(_,i)=>({name:'N'+i}));
 nodes[C80_505_H24_OLD_ROOT]={name:'H24 Old',mesh:4417};
 nodes[C80_505_H24_NEW_ROOT]={
  name:'C80_505_H24_WC_FRAME_4MM_Z_CLEARANCE_TEST_FROM_n12116_WORK_TEST_HOST_HOLD',
  mesh:4417,translation:[0,0,0.004],
  extras:{sourceRootNode:C80_505_H24_OLD_ROOT,sourceParentGlbSha256:C80_505_PARENT_SHA256,
   cofitShiftWorldGlbYUpZ_m:[0,0,0.004],current:false,asBuilt:false,hostHold:true,
   sourceLinksBoundForNewSHA:false,productionWebGLVerified:false},
 };
 nodes[12228]={name:'Sewer: Main'};
 nodes[12230]={name:'Savo Root'};
 nodes[12237]={name:'ABC Root'};
 const scenes=Array.from({length:505},(_,i)=>({name:'History_'+i,nodes:[]}));
 for(const [indexText,parent] of Object.entries(C80_505_NEW_PARENT_SCENES)){
  const index=Number(indexText);
  const old=[C80_505_H24_OLD_ROOT,12228,12230,12237];
  scenes[parent]={name:'Parent_'+parent,nodes:old};
  scenes[index]={
   name:'C80_505_H24_FRAME_CLEARANCE_FROM_SCENE_'+parent+'_WORK_TEST_HOST_HOLD',
   nodes:[C80_505_H24_NEW_ROOT,12228,12230,12237],
   extras:{stage:'WORK_TEST_HOST_HOLD',asBuilt:false,sourceLinksBindingVerified:false,
    h24FrameCofit:{sourceScene:parent,oldNode:C80_505_H24_OLD_ROOT,
     newNode:C80_505_H24_NEW_ROOT,shiftWorldGLB_Z_m:0.004,
     sourceGLBSHA256:C80_505_PARENT_SHA256,sourceLinksBound:false,
     current:false,asBuilt:false,stage:'WORK_TEST_HOST_HOLD'}},
  };
 }
 for(const i of [488,490,492])scenes[i]={
  name:'C80_495_WW74_L150_SAVO_OWNERPHOTO_UV_COFIT_'+i,
  nodes:[12230],extras:{stage:'WORK_TEST_HOST_HOLD',sourceLinksBoundForNewSHA:false},
 };
 const json={scene:292,scenes,nodes,meshes:Array(4611).fill(null),materials:Array(739).fill(null)};
 const loaderName=name=>String(name).replaceAll(' ','_').replaceAll(':','')+'_1';
 const gltf={parser:{json},scenes:scenes.map(s=>({
  name:loaderName(s.name),children:s.nodes.map(n=>({name:loaderName(nodes[n].name)})),
 }))};
 const accepted=resolveC80505H24Scenes(gltf,C80_505_GLB_SHA256);
 assert.equal(Object.keys(accepted??{}).length,8);
 assert.equal(accepted[501],gltf.scenes[501]);
 gltf.scenes[501].children[0].name='DIFFERENT_UNTRUSTED_NODE';
 assert.equal(resolveC80505H24Scenes(gltf,C80_505_GLB_SHA256),null);
});
