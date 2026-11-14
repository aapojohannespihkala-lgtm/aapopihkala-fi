// Source-only WORK_TEST runtime coverage, no binary or sourceLinks committed.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_SUCC455_GLB_SHA256,C80_SUCC455_GLB_BYTES,C80_SUCC455_PUBLISH_ALLOWED,
 C80_SUCC455_SOURCE_LINKS_BOUND
} from '../../src/scripts/privateModelC80Succ455LedSpacingSourceProfile.mjs';
import {
 C80_SUCC455_VIEWER_ROLES,normalizeC80Succ455Options,
 resolveC80Succ455SceneIndex,resolveC80Succ455Scenes,createC80Succ455FloorRuntime
} from '../../src/scripts/privateModelC80Succ455FloorRuntime.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const mapping=[
 [467,'1F','CLOSED',false],[460,'2F','CLOSED',false],[461,'BOTH','CLOSED',false],
 [462,'2F','ONE_OPEN',false],[463,'BOTH','ONE_OPEN',false],
 [464,'2F','STACKED',false],[465,'BOTH','STACKED',false],
 [468,'1F','CLOSED',true],[466,'BOTH','CLOSED',true]
];
test('nine unique SUCC455 scene controls resolve only for authenticated full-GLB SHA',()=>{
 assert.deepEqual(Object.keys(C80_SUCC455_VIEWER_ROLES).map(Number).sort((a,b)=>a-b),
   [460,461,462,463,464,465,466,467,468]);
 for(const [id,floor,glazing,cutaway] of mapping)
   assert.equal(resolveC80Succ455SceneIndex(C80_SUCC455_GLB_SHA256,floor,glazing,cutaway),id);
 assert.equal(resolveC80Succ455SceneIndex(C80_SUCC455_GLB_SHA256,'2F','CLOSED',true),null);
 assert.equal(resolveC80Succ455SceneIndex(C80_SUCC455_GLB_SHA256,'1F','STACKED'),null);
 assert.equal(resolveC80Succ455SceneIndex('0'.repeat(64),'BOTH'),null);
 assert.equal(resolveC80Succ455SceneIndex(C80_SUCC455_GLB_SHA256,'attic'),null);
 assert.equal(resolveC80Succ455SceneIndex(C80_SUCC455_GLB_SHA256,'2F','UNVERIFIED'),null);
 assert.deepEqual(normalizeC80Succ455Options('1F','STACKED',false),
   {floor:'1F',glazing:'CLOSED',cutaway:false});
 assert.deepEqual(normalizeC80Succ455Options('2F','CLOSED',true),
   {floor:'2F',glazing:'CLOSED',cutaway:false});
 assert.deepEqual(normalizeC80Succ455Options('BOTH','ONE_OPEN',true),
   {floor:'BOTH',glazing:'ONE_OPEN',cutaway:false});
 assert.equal(normalizeC80Succ455Options('BOTH','CLOSED','yes'),null);
 assert.equal(C80_SUCC455_PUBLISH_ALLOWED,false);
 assert.equal(C80_SUCC455_SOURCE_LINKS_BOUND,false);
});
test('wrong or missing runtime scenes fail closed without mounting or CURRENT',()=>{
 assert.equal(resolveC80Succ455Scenes(null,C80_SUCC455_GLB_SHA256),null);
 assert.equal(resolveC80Succ455Scenes({scenes:[]},C80_SUCC455_GLB_SHA256),null);
 assert.equal(resolveC80Succ455Scenes({scenes:Array(469).fill({})},'badSHA'),null);
 assert.throws(()=>createC80Succ455FloorRuntime({gltf:null,sha:C80_SUCC455_GLB_SHA256,
   mount:()=>{},mounted:()=>null}),/SUCC455_SOURCE_SCENE_MISMATCH/);
 assert.throws(()=>createC80Succ455FloorRuntime({gltf:null,sha:C80_SUCC455_GLB_SHA256,
   mount:null,mounted:()=>null}),/SUCC455_MOUNT_CONTRACT/);
});
test('work-test source identity routed, no current/default C70 access or auto-publish',()=>{
 const candidates=JSON.parse(read('../../.github/work-test-candidates.json')).candidates;
 const id='c80-succ455-led-spacing-20261114';
 assert.deepEqual(candidates[id],{driveFileId:'1Ybrzm6TpgCUgyfMTZXhe8TYxqSpmdjiE'});
 const worker=read('../../worker/privateWorkTest.ts');
 const candidateStart=worker.indexOf('const C80_SUCC455_LED_WORK_TEST_CANDIDATE = {');
 assert.ok(candidateStart>=0);
 const candidateCode=worker.slice(candidateStart,worker.indexOf('} as const satisfies PrivateWorkTestCandidate;',candidateStart));
 assert.ok(candidateCode.includes("expectedSize: 54778060"));
 assert.ok(candidateCode.includes("expectedSha256: '"+C80_SUCC455_GLB_SHA256+"'"));
 assert.ok(candidateCode.includes("id: '"+id+"'"));
 assert.ok(worker.includes('  C80_SUCC455_LED_WORK_TEST_CANDIDATE,'));
 const viewer=read('../../src/pages/private-model/index.astro');
 assert.ok(viewer.includes("resolveC80Succ455Scenes(gltf,loadedModelSha256(gltf))"));
 assert.ok(viewer.includes('createC80Succ455FloorRuntime({gltf,sha:loadedModelSha256(gltf)'));
 assert.ok(viewer.includes('succ455[461]'));
 assert.ok(viewer.includes("candidate.id === '"+id+"'"));
 assert.ok(!viewer.includes("sourceLinksBound=true"));
});
const fixture=process.env.C80_SUCC455_GLB_PATH;
test('authentic GLB all nine scenes mount and switch, then restore',{skip:!fixture},()=>{
 const b=readFileSync(fixture);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.length,C80_SUCC455_GLB_BYTES);
 assert.equal(createHash('sha256').update(b).digest('hex'),C80_SUCC455_GLB_SHA256);
 const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
 const scenes=json.scenes.map((s)=>({
    name:s.name,children:(s.nodes||[]).map(n=>({name:json.nodes[n]?.name})),
    traverse(visitor){for(const c of this.children)visitor(c);}
 }));
 const gltf={parser:{json},scenes};
 const mapped=resolveC80Succ455Scenes(gltf,C80_SUCC455_GLB_SHA256);
 assert.ok(mapped);
 let current=mapped[461];
 const runtime=createC80Succ455FloorRuntime({gltf,sha:C80_SUCC455_GLB_SHA256,
   mount(s){current=s;},mounted(){return current;}});
 assert.equal(runtime.sceneIndex,461);
 for(const [id,floor,glazing,cutaway] of mapping){
   assert.ok(runtime.apply(floor,glazing));
   if(cutaway)assert.ok(runtime.setCutaway(true));
   assert.equal(runtime.sceneIndex,id);
   runtime.setCutaway(false);
 }
 runtime.restore();
 assert.equal(current,mapped[461]);
 assert.equal(runtime.sceneIndex,461);
 runtime.dispose();
 assert.equal(runtime.apply('1F'),null);
});
