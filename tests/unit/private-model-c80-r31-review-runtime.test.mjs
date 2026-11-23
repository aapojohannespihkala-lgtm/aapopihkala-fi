import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_R31_REVIEW_ROLES as ROLES,
 resolveC80R31ReviewScene as resolve,
 c80R31AtomicReviewMount as atomicMount,
 createC80R31ReviewRuntime as create,
 prepareC80R31R300ReviewScenes as prepareR300,
 createC80R31R300ViewSwitch as createR300Switch,
 r300WorkTestSource,
 C80_R31_R300_WORK_TEST_ID,
 C80_R31_9E0B_WORK_TEST_ID,
 C80_R31_9E0B_SOURCE,
 C80_R31_9E0B_VIEWS,
 C80_R32H_VIEWS,
 C80_R33_VIEWS,
 isC80R31Scene769770Source,
 r31WorkTestReview,
 r31ViewerLayerSceneReceipt,
 prepareC80R31ReviewScenes,
} from '../../src/scripts/privateModelC80R31ReviewRuntime.mjs';

const NORMAL_R300='R300_VISIBLE_COPPER_NORMAL_SCREEN_ON';
const SERVICE_R300='R300_VISIBLE_COPPER_SERVICE_SCREEN_OFF';

test('R31 opt-in runtime binds the R31 roles plus the R32H family views',()=>{
 assert.deepEqual(Object.keys(ROLES),[
  'K5_PINK_OFF','RAIN5','RAIN5_K5_OFF',
  'RAIN5_K5_OFF_H18116_VISUAL','L16_CURVE_KIV_CASE_COMBINED',
  NORMAL_R300,SERVICE_R300,
  ...Object.values(C80_R31_9E0B_VIEWS).map(v=>v.role),
  ...Object.values(C80_R32H_VIEWS).map(v=>v.role),
  ...Object.values(C80_R33_VIEWS).map(v=>v.role),
 ]);
 assert.equal(ROLES.K5_PINK_OFF.spec.sceneIndex,752);
 assert.equal(ROLES.RAIN5.spec.sceneIndex,752);
 assert.equal(ROLES.RAIN5_K5_OFF.spec.sceneIndex,753);
 assert.equal(ROLES.RAIN5_K5_OFF_H18116_VISUAL.spec.sceneIndex,754);
 assert.equal(ROLES.L16_CURVE_KIV_CASE_COMBINED.spec.sceneIndex,756);
 assert.equal(ROLES.L16_CURVE_KIV_CASE_COMBINED.spec.parentScene,755);
 assert.notEqual(ROLES.L16_CURVE_KIV_CASE_COMBINED.spec.curveDonorGlbSha256,
  ROLES.L16_CURVE_KIV_CASE_COMBINED.spec.caseDonorGlbSha256);
 const hashes=Object.values(ROLES).map(r=>r.spec.glbSha256);
 assert.equal(new Set(hashes).size,9);
 assert.equal(ROLES[NORMAL_R300].spec.glbSha256,ROLES[SERVICE_R300].spec.glbSha256);
 assert.equal(ROLES[NORMAL_R300].spec.sceneIndex,759);
 assert.equal(ROLES[SERVICE_R300].spec.sceneIndex,760);
 assert.equal(ROLES[NORMAL_R300].spec.screenVisible,true);
 assert.equal(ROLES[SERVICE_R300].spec.screenVisible,false);
 assert.equal(resolve(null,hashes[0],'K5_PINK_OFF'),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},hashes[0],'K5_PINK_OFF'),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},hashes[1],'K5_PINK_OFF'),null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},hashes[0],'unknown'),null);
 for(const role of ['__proto__','constructor','toString'])
  assert.equal(resolve({parser:{json:{}},scenes:[]},hashes[0],role),null);
 assert.throws(()=>create({mount:null,mounted:()=>null}),
  /C80_R31_REVIEW_MOUNT_CONTRACT/);
 assert.throws(()=>create({gltf:{},authenticatedSha:hashes[0],
  role:'K5_PINK_OFF',mount:()=>{},mounted:()=>null}),
  /C80_R31_REVIEW_SOURCE_MISMATCH/);
});

test('R300 uses only its exact protected catalog entry',()=>{
 const id=C80_R31_R300_WORK_TEST_ID;
 const path=`/private-model/work-test/${id}.glb`;
 assert.equal(r300WorkTestSource({id,path}).glbSha256,ROLES[NORMAL_R300].spec.glbSha256);
 assert.equal(r300WorkTestSource({id:'default',path}),undefined);
 for(const value of [path+'?revision=old','/private-model/model.glb','https://example.test'+path])
  assert.throws(()=>r300WorkTestSource({id,path:value}),/CANDIDATE_PATH_MISMATCH/);
});

test('R300 preparation requires both exact same-file source receipts before any rebuild',async()=>{
 const spec=ROLES[NORMAL_R300].spec;
 let attempted=false;
 const gltf={scenes:Array(spec.sceneCount),parser:{json:{scenes:[]},
  getDependency(){attempted=true;throw new Error('unexpected read');}}};
 await assert.rejects(prepareR300(gltf,spec.glbSha256),/C80_R31_REVIEW_SOURCE_MISMATCH/);
 assert.equal(attempted,false);
});

test('R31 single-GLB atomic mount verifies target and previous identity',()=>{
 let previous={name:'R22'},target={name:'WORK_TEST'},current=previous;
 const ok=atomicMount({previous,target,
  mount(x){current=x;},mounted(){return current;},
  verifyTarget(){return current===target;}});
 assert.deepEqual(ok,{ok:true});
 current=previous;
 const forged={name:'FORGED'};
 const bad=atomicMount({previous,target,
  mount(x){current=x===target?forged:x;},mounted(){return current;}});
 assert.equal(bad.ok,false);
 assert.equal(bad.restored,true);
 assert.match(bad.error.message,/MOUNT_MISMATCH/);
 assert.equal(current,previous);
});

test('R31 source tree mutation during mount requires verified rollback',()=>{
 const previous={},target={};let current=previous;
 const sourceChanged=atomicMount({previous,target,
  mount(x){current=x;},mounted(){return current;},
  verifyTarget(){return false;}});
 assert.equal(sourceChanged.ok,false);
 assert.equal(sourceChanged.restored,true);
 assert.match(sourceChanged.error.message,/MOUNT_MISMATCH/);
 assert.equal(current,previous);
 const targetThrows=atomicMount({previous,target,
  mount(x){current=x;if(x===target)throw new Error('PARTIAL');},
  mounted(){return current;}});
 assert.equal(targetThrows.ok,false);
 assert.equal(targetThrows.restored,true);
 assert.match(targetThrows.error.message,/PARTIAL/);
 assert.equal(current,previous);
});

test('R31 failed or forged rollback never counts as safe',()=>{
 const previous={},target={};let current=previous;
 const noRestore=atomicMount({previous,target,
  mount(x){current=x;throw new Error(x===target?'PARTIAL':'RESTORE_FAIL');},
  mounted(){return current;}});
 assert.equal(noRestore.ok,false);
 assert.equal(noRestore.restored,false);
 assert.match(noRestore.rollbackError.message,/RESTORE_FAIL/);
 const forged=atomicMount({previous,target,
  mount(x){current={forged:x};},
  mounted(){return current;}});
 assert.equal(forged.ok,false);
 assert.equal(forged.restored,false);
 assert.match(forged.rollbackError.message,/ROLLBACK_MISMATCH/);
 assert.throws(()=>atomicMount({mount:123,mounted:()=>{}}),
  /C80_R31_REVIEW_MOUNT_CONTRACT/);
});

const paths={
 K5_PINK_OFF:process.env.C80_R31_K5_SCENE752_GLB_PATH,
 RAIN5:process.env.C80_R31_RAIN5_SCENE752_GLB_PATH,
 RAIN5_K5_OFF:process.env.C80_R31_ROOF5K5_SCENE753_GLB_PATH,
 RAIN5_K5_OFF_H18116_VISUAL:process.env.C80_R31_H18116_SCENE754_GLB_PATH,
 L16_CURVE_KIV_CASE_COMBINED:process.env.C80_R31_L16_SCENE756_GLB_PATH,
};
function originalGltf(bytes,sceneIndex){
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
 const node=(id,depth=0)=>{
  if(depth>256)throw new Error('SOURCE_DEPTH');
  const def=json.nodes[id];
  if(!def)throw new Error('SOURCE_NODE');
  return {name:def.name??'',children:(def.children??[]).map(x=>node(x,depth+1)),
   isMesh:Number.isInteger(def.mesh)};
 };
 const scenes=json.scenes.map(s=>({name:s.name,children:[]}));
 scenes[sceneIndex]={name:json.scenes[sceneIndex].name,
  children:json.scenes[sceneIndex].nodes.map(id=>node(id)),
  traverse(fn){const visit=o=>{fn(o);o.children.forEach(visit);};
    this.children.forEach(visit);}
 };
 return {parser:{json,associations:new Map()},scenes};
}
// Private original GLBs are NOT committed to CI. Local fixture is optional.
for(const [role,path] of Object.entries(paths)){
 test('R31 real authenticated rendered scene and atomic review: '+role,
  {skip:!path},()=>{
   const spec=ROLES[role].spec,bytes=readFileSync(path);
   assert.equal(bytes.length,spec.glbBytes);
   const sha=createHash('sha256').update(bytes).digest('hex');
   assert.equal(sha,spec.glbSha256);
   const gltf=originalGltf(bytes,spec.sceneIndex);
   const proof=resolve(gltf,sha,role);
   assert.ok(proof);
   assert.equal(resolve(gltf,'0'.repeat(64),role),null);
   for(const other of Object.keys(ROLES).filter(r=>r!==role))
    assert.equal(resolve(gltf,sha,other),null);
   const previous={name:'R22_BASELINE'};
   let current=previous;
   const runtime=create({gltf,authenticatedSha:sha,role,
    mount(x){current=x;},mounted(){return current;}});
   assert.equal(runtime.stage,'WORK_TEST_HOST_HOLD');
   assert.equal(runtime.sourceLinksBound,false);
   assert.equal(runtime.publicationAllowed,false);
   assert.equal(runtime.productionWebGLVerified,false);
   assert.equal(runtime.humanReview,'NOT_RUN');
   assert.equal(runtime.current,false);
   assert.equal(runtime.asBuilt,false);
   assert.equal(runtime.preview()?.sceneIndex,spec.sceneIndex);
   assert.equal(current,proof.scene);
   assert.equal(runtime.preview(),null);
   assert.equal(runtime.restore(),true);
   assert.equal(current,previous);
   assert.equal(runtime.active,false);
   const root=proof.scene.children[0],bad={name:'TAMPER',children:[]};
   root.children.push(bad);
   assert.equal(runtime.preview(),null);
   root.children.pop();
   assert.ok(runtime.preview());
   assert.equal(runtime.restore(),true);
   runtime.dispose();
   assert.equal(runtime.available,false);
   assert.equal(runtime.preview(),null);
  });
}


test('R31 mount reader exceptions trigger verified rollback, never acceptance',()=>{
 const previous={},target={};let current=previous;
 const r=atomicMount({previous,target,
  mount(x){current=x;},
  mounted(){
   if(current===target)throw new Error('MOUNT_READ_FAILED');
   return current;
  }});
 assert.equal(r.ok,false);
 assert.equal(r.restored,true);
 assert.match(r.error.message,/MOUNT_READ_FAILED/);
 assert.equal(current,previous);
 const v=atomicMount({previous,target,
  mount(x){current=x;},
  mounted(){return current;},
  verifyTarget(){throw new Error('SOURCE_TREE_CHANGED');}});
 assert.equal(v.ok,false);
 assert.equal(v.restored,true);
 assert.match(v.error.message,/SOURCE_TREE_CHANGED/);
 assert.equal(current,previous);
});


test('R31 combined scene756 review rejects collided scene755 donor hashes',()=>{
 const spec=ROLES.L16_CURVE_KIV_CASE_COMBINED.spec;
 assert.equal(spec.sceneIndex,756);
 assert.equal(spec.sceneCount,757);
 assert.equal(spec.parentRootFnv32,'106be574');
 assert.equal(spec.rootFnv32,'2bebfdbd');
 for(const wrong of [
  spec.curveDonorGlbSha256,
  spec.caseDonorGlbSha256,
  spec.sharedParentGlbSha256,
  ROLES.RAIN5_K5_OFF_H18116_VISUAL.spec.glbSha256,
  '0'.repeat(64),
 ]){
  assert.notEqual(wrong,spec.glbSha256);
  assert.equal(resolve({parser:{json:{}},scenes:[]},wrong,
   'L16_CURVE_KIV_CASE_COMBINED'),null);
 }
 const r=resolve({parser:{json:{}},scenes:Array(spec.sceneCount)},
  spec.glbSha256,'L16_CURVE_KIV_CASE_COMBINED');
 assert.equal(r,null);
 assert.equal(resolve({parser:{json:{}},scenes:[]},spec.glbSha256,
  '__proto__'),null);
});


test('R31 source-collision roles must not be interchangeable',()=>{
 const k5=ROLES.K5_PINK_OFF.spec;
 const rain=ROLES.RAIN5.spec;
 const combined=ROLES.L16_CURVE_KIV_CASE_COMBINED.spec;
 assert.equal(k5.sceneIndex,752);
 assert.equal(rain.sceneIndex,752);
 assert.notEqual(k5.glbSha256,rain.glbSha256);
 assert.equal(combined.sceneIndex,756);
 assert.equal(combined.parentScene,755);
 assert.notEqual(combined.curveDonorGlbSha256,combined.caseDonorGlbSha256);
 assert.notEqual(combined.glbSha256,combined.curveDonorGlbSha256);
 assert.notEqual(combined.glbSha256,combined.caseDonorGlbSha256);
 assert.equal(combined.glbBytes,63556632);
 assert.match(combined.sceneName,/__scene756$/);
 assert.match(combined.parentName,/__scene755$/);
});

const r300Fixture=process.env.C80_R31_R300_SCENE760_GLB_PATH;
test('R300 real GLTFLoader restores shared nodes and mounts both modes from one SHA',
 {skip:!r300Fixture}, async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const data=readFileSync(r300Fixture);
 const sha=createHash('sha256').update(data).digest('hex');
 assert.equal(sha,ROLES[NORMAL_R300].spec.glbSha256);
 const originalSelf=globalThis.self,originalBitmap=globalThis.createImageBitmap;
 globalThis.self=globalThis;
 // Node fixture checks the actual Object3D and geometry, with no image or pixel assertions.
 globalThis.createImageBitmap=async()=>({width:1,height:1});
 let gltf;
 try{
  gltf=await new GLTFLoader().parseAsync(
   data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
 }finally{
  if(originalSelf===undefined)delete globalThis.self;
  else globalThis.self=originalSelf;
  if(originalBitmap===undefined)delete globalThis.createImageBitmap;
  else globalThis.createImageBitmap=originalBitmap;
 }
 const spec=ROLES[NORMAL_R300].spec;
 const normal=gltf.scenes[spec.sceneIndex],service=gltf.scenes[ROLES[SERVICE_R300].spec.sceneIndex];
 const parent=gltf.scenes[spec.parentSceneIndex],parentRoots=[...parent.children];
 await assert.rejects(prepareR300(gltf,'0'.repeat(64)),/SOURCE_MISMATCH/);
 await prepareR300(gltf,sha);
 assert.equal(parent.children.length,parentRoots.length);
 assert.ok(parentRoots.every((root,i)=>parent.children[i]===root));
 assert.equal(resolve(gltf,sha,NORMAL_R300)?.scene,normal);
 assert.equal(resolve(gltf,sha,SERVICE_R300)?.scene,service);
 assert.equal(resolve(gltf,ROLES.K5_PINK_OFF.spec.glbSha256,SERVICE_R300),null);
 const serviceRoots=[...service.children];
 await prepareR300(gltf,sha);
 assert.ok(serviceRoots.every((root,i)=>service.children[i]===root));

 const rootIds=gltf.parser.json.scenes[spec.sceneIndex].nodes;
 const screen=normal.children[rootIds.indexOf(spec.screenRoot)];
 assert.ok(screen?.isObject3D);
 const forgedScreen=screen.clone();
 service.add(forgedScreen);
 assert.equal(resolve(gltf,sha,SERVICE_R300),null);
 service.remove(forgedScreen);

 const baseline={name:'R22_BASELINE'};
 let current=baseline;
 const mount=target=>{current=target;};
 const mounted=()=>current;
 const normalView=create({gltf,authenticatedSha:sha,role:NORMAL_R300,mount,mounted});
 const serviceView=create({gltf,authenticatedSha:sha,role:SERVICE_R300,mount,mounted});
 assert.equal(normalView.preview()?.sceneIndex,759);
 assert.equal(current,normal);
 assert.equal(serviceView.preview()?.sceneIndex,760);
 assert.equal(current,service);
 assert.equal(serviceView.restore(),true);
 assert.equal(current,normal);
 assert.equal(normalView.restore(),true);
 assert.equal(current,baseline);

 let failMount=false;
 const switcher=await createR300Switch({
  gltf,authenticatedSha:sha,mounted,
  mount(target){
   current=target;
   if(failMount&&target===service)throw new Error('PARTIAL_MOUNT');
  },
 });
 assert.equal(switcher.normalScene,normal);
 assert.equal(switcher.activeView(),null);
 assert.equal(switcher.select('service'),false);
 mount(normal);
 assert.equal(switcher.activeView(),'normal');
 assert.equal(switcher.select('unknown'),false);
 failMount=true;
 assert.equal(switcher.select('service'),false);
 assert.equal(current,normal);
 failMount=false;
 assert.equal(switcher.select('service'),true);
 assert.equal(switcher.activeView(),'service');
 assert.equal(switcher.select('normal'),true);
 assert.equal(current,normal);
 service.add(forgedScreen);
 assert.equal(switcher.select('service'),false);
 assert.equal(switcher.activeView(),'normal');
 service.remove(forgedScreen);
 mount(baseline);
 assert.equal(switcher.activeView(),null);
 });


// ---- R31 9e0bf34f: whole D 769/770 + 2F 771/772 in ONE authenticated GLB
const receiptTest=readFileSync(new URL('./private-model-c80-r31-scene752-source-receipt.test.mjs',import.meta.url),'utf8');
const DONOR769=JSON.parse(receiptTest.match(/const donor769_771772=(\[[0-9,]+\]);/)[1]);
function json9e0b(){
 const s=C80_R31_9E0B_SOURCE;
 const json={scene:s.defaultScene,asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
  scenes:Array.from({length:s.sceneCount},()=>({nodes:[]})),nodes:Array(s.nodeCount),meshes:Array(s.meshCount),
  materials:Array(s.materialCount),accessors:Array(s.accessorCount),bufferViews:Array(s.bufferViewCount)};
 json.scenes[769]={name:'D normal',nodes:[...DONOR769],extras:{stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false}};
 json.scenes[770]={name:'D service',nodes:DONOR769.filter(n=>n!==11625),extras:{stage:'WORK_TEST_HOST_HOLD'}};
 return json;
}

test('R31 Layerit opt-in is source-locked to four authentic WORK_TEST view roles',()=>{
 const sha=C80_R31_9E0B_SOURCE.glbSha256,json=json9e0b();
 for(const [index,key] of [[769,'dNormal'],[770,'dService']]) {
  const proof=r31ViewerLayerSceneReceipt(json,sha,index);
  assert.ok(proof);
  assert.equal(proof.sourceSha256,sha);
  assert.equal(proof.sceneIndex,index);
  assert.equal(proof.role,C80_R31_9E0B_VIEWS[key].role);
  assert.equal(proof.floor,'BOTH');
  assert.equal(Object.isFrozen(proof),true);
 }
 // This standalone fixture does not authenticate the 2F node roots.
 assert.equal(r31ViewerLayerSceneReceipt(json,sha,771),null);
 assert.equal(r31ViewerLayerSceneReceipt(json,sha,772),null);
 for(const index of [-1,0,758,768,773,774,292])
  assert.equal(r31ViewerLayerSceneReceipt(json,sha,index),null);
 assert.equal(r31ViewerLayerSceneReceipt(json,'0'.repeat(64),769),null);
 assert.equal(r31ViewerLayerSceneReceipt(json,null,769),null);
 assert.equal(r31ViewerLayerSceneReceipt({},sha,769),null);
 const badStage=json9e0b();badStage.asset.extras.ModelStage='CURRENT';
 assert.equal(r31ViewerLayerSceneReceipt(badStage,sha,769),null);
 const reenabledPlexi=json9e0b();reenabledPlexi.scenes[770].nodes.push(11625);
 assert.equal(r31ViewerLayerSceneReceipt(reenabledPlexi,sha,770),null);
 const tampered=json9e0b();tampered.scenes[769].nodes.reverse();
 assert.equal(r31ViewerLayerSceneReceipt(tampered,sha,769),null);
});

test('9e0bf34f catalog entry maps to one exact source and four named views',()=>{
 const id=C80_R31_9E0B_WORK_TEST_ID,path=`/private-model/work-test/${id}.glb`;
 const r=r31WorkTestReview({id,path});
 assert.equal(r.source.glbSha256,'9e0bf34fd838ddc92be12007412176a8ea449f66644f8876395ac6f659804ec3');
 assert.equal(r.source.glbBytes,63833692);
 assert.equal(r.source.zipDriveId,'1EmsMz5AyyWQwoRdZf2NVOvnndvMfHLb7');
 assert.deepEqual(Object.keys(r.views),['dNormal','dService','upperNormal','upperService']);
 assert.deepEqual(Object.values(r.views).map(v=>v.sceneIndex),[769,770,771,772]);
 for(const v of Object.values(r.views))assert.equal(ROLES[v.role].spec.glbSha256,r.source.glbSha256);
 assert.equal(r31WorkTestReview({id:C80_R31_R300_WORK_TEST_ID,path:`/private-model/work-test/${C80_R31_R300_WORK_TEST_ID}.glb`}).source.glbSha256,
  ROLES[NORMAL_R300].spec.glbSha256);
 assert.equal(r31WorkTestReview({id:'default',path}),undefined);
 assert.throws(()=>r31WorkTestReview({id,path:path+'?x=1'}),/CANDIDATE_PATH_MISMATCH/);
});

test('whole-D 769/770 gate requires exact SHA, counts, root FNV and the plexi-only difference',()=>{
 const sha=C80_R31_9E0B_SOURCE.glbSha256,{dNormal,dService}=C80_R31_9E0B_VIEWS;
 const json=json9e0b();
 assert.equal(DONOR769.length,dNormal.rootCount);
 assert.equal(isC80R31Scene769770Source(json,sha,769,dNormal.role,'BOTH'),true);
 assert.equal(isC80R31Scene769770Source(json,sha,770,dService.role,'BOTH'),true);
 assert.equal(isC80R31Scene769770Source(json,sha,770,dNormal.role,'BOTH'),false);
 assert.equal(isC80R31Scene769770Source(json,sha,769,dNormal.role,'2F'),false);
 assert.equal(isC80R31Scene769770Source(json,'0'.repeat(64),769,dNormal.role),false);
 const plexiBack=json9e0b();plexiBack.scenes[770].nodes.push(11625);
 assert.equal(isC80R31Scene769770Source(plexiBack,sha,770,dService.role),false);
 const reordered=json9e0b();reordered.scenes[769].nodes.reverse();
 assert.equal(isC80R31Scene769770Source(reordered,sha,769,dNormal.role),false);
 const claimed=json9e0b();claimed.scenes[769].extras.current=true;
 assert.equal(isC80R31Scene769770Source(claimed,sha,769,dNormal.role),false);
 const staged=json9e0b();staged.asset.extras.asBuilt=true;
 assert.equal(isC80R31Scene769770Source(staged,sha,769,dNormal.role),false);
 const counted=json9e0b();counted.nodes.push({});
 assert.equal(isC80R31Scene769770Source(counted,sha,769,dNormal.role),false);
});

test('9e0bf34f preparation rejects the set before any rebuild when 2F roles are not exact',async()=>{
 let attempted=false;
 const json=json9e0b();
 const gltf={scenes:Array(C80_R31_9E0B_SOURCE.sceneCount),parser:{json,
  getDependency(){attempted=true;throw new Error('unexpected read');}}};
 await assert.rejects(prepareC80R31ReviewScenes(gltf,C80_R31_9E0B_SOURCE.glbSha256,C80_R31_9E0B_VIEWS),
  /C80_R31_REVIEW_SOURCE_MISMATCH/);
 assert.equal(attempted,false);
});
