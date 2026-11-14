import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_SUCC455_ROOM3_GLB_SHA256,C80_SUCC455_ROOM3_GLB_BYTES,
 C80_SUCC455_ROOM3_ZIP_DRIVE_ID,C80_SUCC455_ROOM3_SOURCE_LINKS_BOUND,
 C80_SUCC455_ROOM3_PUBLISH_ALLOWED,C80_SUCC455_ROOM3_PRODUCTION_WEBGL_VERIFIED,
 C80_SUCC455_ROOM3_SCENES,C80_SUCC455_ROOM3_PARENT_GLB_SHA256,
 c80Succ455Room3RootFnv32,isC80Succ455Room3PhotoDoorSourceScene,
 c80Succ455Room3SourceReceipt
} from '../../src/scripts/privateModelC80Succ455Room3PhotoDoorSourceProfile.mjs';
const ids=[469,470,471,472,473,474,475];
test('seven source-only ROOM3 roles and publish fail-closed',()=>{
 assert.deepEqual(Object.keys(C80_SUCC455_ROOM3_SCENES).map(Number),ids);
 assert.equal(C80_SUCC455_ROOM3_ZIP_DRIVE_ID,'1_JB1jKLVyrwVwyKHSO368YqDPjU9Xwzl');
 assert.equal(C80_SUCC455_ROOM3_SOURCE_LINKS_BOUND,false);
 assert.equal(C80_SUCC455_ROOM3_PUBLISH_ALLOWED,false);
 assert.equal(C80_SUCC455_ROOM3_PRODUCTION_WEBGL_VERIFIED,false);
 assert.equal(new Set(ids.map(i=>C80_SUCC455_ROOM3_SCENES[i].rootFnv)).size,7);
 assert.equal(c80Succ455Room3RootFnv32([1,2,3]),'56cf37ab');
 assert.equal(c80Succ455Room3RootFnv32([1,-1]),null);
});
test('missing or wrong-SHA source cannot pass a scene gate',()=>{
 const miss='0'.repeat(64);
 for(const i of ids){
  assert.equal(isC80Succ455Room3PhotoDoorSourceScene(null,C80_SUCC455_ROOM3_GLB_SHA256,i),false);
  assert.equal(isC80Succ455Room3PhotoDoorSourceScene({scenes:[]},C80_SUCC455_ROOM3_GLB_SHA256,i),false);
  assert.equal(isC80Succ455Room3PhotoDoorSourceScene({scenes:[]},miss,i),false);
 }
 assert.deepEqual(c80Succ455Room3SourceReceipt(null,miss,469),{
  exactSource:false,sourceLinksBound:false,publishAllowed:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN',current:false,asBuilt:false,
  stage:'WORK_TEST_HOST_HOLD'
 });
 assert.equal(C80_SUCC455_ROOM3_PARENT_GLB_SHA256.length,64);
});
const sourcePath=process.env.C80_SUCC455_ROOM3_GLB_PATH;
const parentPath=process.env.C80_SUCC455_PARENT_GLB_PATH;
const load=(path,sha,expectedSize)=>{
 const bytes=readFileSync(path);
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.length,expectedSize);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),sha);
 assert.equal(bytes.readUInt32LE(4),2);
 return {bytes,json:JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'))};
};
test('authentic original 54.9MB GLB all seven COW scenes and negative mutations',{skip:!sourcePath},()=>{
 const {json}=load(sourcePath,C80_SUCC455_ROOM3_GLB_SHA256,C80_SUCC455_ROOM3_GLB_BYTES);
 for(const i of ids){
  const spec=C80_SUCC455_ROOM3_SCENES[i];
  assert.equal(isC80Succ455Room3PhotoDoorSourceScene(json,C80_SUCC455_ROOM3_GLB_SHA256,i,spec.floor),true,'scene '+i);
  assert.equal(isC80Succ455Room3PhotoDoorSourceScene(json,C80_SUCC455_ROOM3_GLB_SHA256,i,'1F'),false);
  assert.equal(isC80Succ455Room3PhotoDoorSourceScene(json,'0'.repeat(64),i),false);
 }
 const m=structuredClone(json);
 m.scenes[469].nodes[C80_SUCC455_ROOM3_SCENES[469].replaceAt]=10837;
 assert.equal(isC80Succ455Room3PhotoDoorSourceScene(m,C80_SUCC455_ROOM3_GLB_SHA256,469),false,'old door wrapper regression');
 const g=structuredClone(json);
 g.scenes[470].extras.sourceLinksBound=true;
 assert.equal(isC80Succ455Room3PhotoDoorSourceScene(g,C80_SUCC455_ROOM3_GLB_SHA256,470),false,'false sourceLinks claim');
 const a=structuredClone(json);
 a.nodes[12222].children=[];
 assert.equal(isC80Succ455Room3PhotoDoorSourceScene(a,C80_SUCC455_ROOM3_GLB_SHA256,472),false,'missing photo-door subtree');
});
test('authentic previous SUCC455 469-scene prefix preserved',{skip:!sourcePath||!parentPath},()=>{
 const child=load(sourcePath,C80_SUCC455_ROOM3_GLB_SHA256,C80_SUCC455_ROOM3_GLB_BYTES).json;
 const parent=load(parentPath,C80_SUCC455_ROOM3_PARENT_GLB_SHA256,54778060).json;
 assert.equal(child.scene,parent.scene);
 assert.deepEqual(child.scenes.slice(0,469),parent.scenes);
 assert.deepEqual(child.nodes.slice(0,parent.nodes.length),parent.nodes);
 assert.deepEqual(child.meshes.slice(0,parent.meshes.length),parent.meshes);
 assert.deepEqual(child.materials.slice(0,parent.materials.length),parent.materials);
 assert.deepEqual(child.accessors.slice(0,parent.accessors.length),parent.accessors);
 assert.deepEqual(child.bufferViews.slice(0,parent.bufferViews.length),parent.bufferViews);
});
