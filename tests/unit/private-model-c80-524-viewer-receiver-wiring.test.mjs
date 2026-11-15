import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { C80_524_RAIN_GLB_SHA256, C80_524_RAIN_GLB_BYTES } from '../../src/scripts/privateModelC80524RainZonesSourceProfile.mjs';
import { resolveC80524RainSceneIndex, c80524RainReviewProfile } from '../../src/scripts/privateModelC80524RainZonesFloorRuntime.mjs';
import { isC80LayerSuccessorSha, resolveC80437SuccessorReceiptScene, resolveC80437SuccessorTechnicalNode, resolveC80SuccessorNewTechnicalNode } from '../../src/scripts/privateModelC80437SuccessorLayerInheritance.mjs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('C80 524 opens its own BOTH scene 520 before the 500 gate', () => {
  const index = read('../../src/pages/private-model/index.astro');
  assert.ok(index.includes("loadedModelSha256(gltf) === C80_524_RAIN_GLB_SHA256"));
  assert.ok(index.includes("createC80524RainFloorRuntime({gltf,sha:loadedModelSha256(gltf)"));
  assert.ok(index.includes("if(loadedModelSha256(gltf)===C80_524_RAIN_GLB_SHA256&&!c80524)throw new Error('C80_524_SOURCE_SCENE_MISMATCH')"));
  assert.ok(index.includes("if(c80524) gltf.scene=c80524[520];\n            else if(c80500) gltf.scene=c80500[496];"));
  assert.equal(resolveC80524RainSceneIndex('1F'), 518);
  assert.equal(resolveC80524RainSceneIndex('2F'), 519);
  assert.equal(resolveC80524RainSceneIndex('BOTH'), 520);
  assert.equal(resolveC80524RainSceneIndex('BOTH', 'CLOSED', true), 523);
});

test('524 glazing, cutaway, Sisältö allowlist and technical review route on source match', () => {
  const index = read('../../src/pages/private-model/index.astro');
  const tech = read('../../src/scripts/privateModelTechnicalReviewPresentation.mjs');
  assert.ok(index.includes('(layersLoadedSha===C80_524_RAIN_GLB_SHA256 && runtime?.isC80524Rain)'));
  assert.ok(index.includes('(layersLoadedSha===C80_524_RAIN_GLB_SHA256&&runtime?.isC80524Rain)'));
  assert.match(index.match(/const verifiedChainSourceSha =([\s\S]*?)\? layersLoadedSha : null;/)[1], /layersLoadedSha === C80_524_RAIN_GLB_SHA256 \|\|/);
  assert.ok(tech.includes('loadedSha === C80_524_RAIN_GLB_SHA256 ? c80524RainReviewProfile(json,loadedSha,sceneIndex)'));
  assert.ok(isC80LayerSuccessorSha(C80_524_RAIN_GLB_SHA256));
});

test('524 WORK_TEST catalog, Worker and original Drive ZIP match the immutable SHA', () => {
  const id = 'c80-524-rain-zones-t110-kvv-20261115';
  const catalog = JSON.parse(read('../../.github/work-test-candidates.json'));
  const worker = read('../../worker/privateWorkTest.ts');
  assert.equal(catalog.candidates[id].driveFileId, '1M5ToN7C_tKnhGwLH8D3fMNueMqbjKQZ8');
  assert.ok(worker.includes("id: '" + id + "'"));
  assert.ok(worker.includes('expectedSize: ' + C80_524_RAIN_GLB_BYTES));
  assert.ok(worker.includes("expectedSha256: '" + C80_524_RAIN_GLB_SHA256 + "'"));
  assert.ok(worker.includes('C80_524_RAIN_ZONES_WORK_TEST_CANDIDATE,'));
});

test('real C80 524 GLB: Sisältö inherits, new MEP roots map, rain zones stay out of review', { skip: !process.env.C80_524_GLB_PATH }, () => {
  const bytes = readFileSync(process.env.C80_524_GLB_PATH);
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
  const sha = C80_524_RAIN_GLB_SHA256;
  const scene = resolveC80437SuccessorReceiptScene(json, sha, 520);
  assert.ok(scene);
  const ok = Object.keys(scene.technical).filter(n => resolveC80437SuccessorTechnicalNode(json, sha, 520, +n)).length;
  assert.ok(ok / Object.keys(scene.technical).length > 0.9);
  assert.equal(resolveC80SuccessorNewTechnicalNode(json, sha, 520, 12243)?.id, 'technical-water');
  assert.equal(resolveC80SuccessorNewTechnicalNode(json, sha, 520, 12239)?.id, 'technical-drainage');
  const roots = c80524RainReviewProfile(json, sha, 520).roots[520].map(r => r.node);
  assert.ok(roots.includes(12243) && roots.includes(12239) && roots.includes(12237));
  assert.ok(!roots.includes(12251) && !roots.includes(12238));
});


// Non-regression: named 2015 concealed feeder roots must be unreachable in
// the 2026 WORK_TEST scene trees; preserving the five 2F switch roots matters.
const hiddenFeedIds=new Map([
 [11829,'GPT6H_P01_RK3_3PH_'],
 [11908,'GPT6H_P01_RK13_2_APK_FROM_'],
 [11909,'GPT6H_P01_RK13_2_APK_CONCEALED_'],
 [11911,'GPT6H_P01_RK13_3_UUNI_SINGLE_'],
 [11912,'GPT6H_P01_RK13_3_OVEN_FEED_']
]);
const switchIds=[11830,11833,11836,11839,11842];
function c80ActiveDfs(json,index){
 const roots=json?.scenes?.[index]?.nodes,nodes=json?.nodes;
 if(!Array.isArray(roots)||!Array.isArray(nodes))return null;
 const seen=new Set(),stack=[...roots];
 while(stack.length){
  const id=stack.pop();
  if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id])return null;
  if(seen.has(id))continue;
  seen.add(id);
  const children=nodes[id].children??[];
  if(!Array.isArray(children))return null;
  stack.push(...children);
 }
 return seen;
}
function c80AssertHiddenFeeds(json,index,floor){
 const active=c80ActiveDfs(json,index);
 assert.ok(active,'invalid source DFS scene '+index);
 for(const [id,prefix] of hiddenFeedIds){
  assert.ok(json.nodes[id]?.name?.startsWith(prefix),'changed feeder identity '+id);
  assert.equal(active.has(id),false,'MUST conceal legacy feeder '+id+' in scene '+index);
 }
 for(const id of switchIds){
  assert.ok(json.nodes[id]?.name?.startsWith('D2F-SW-'),'changed switch identity '+id);
  assert.equal(active.has(id),floor!=='1F','switch reachability '+id+' scene '+index);
 }
}
test('524/530 feeder guard: valid, hidden-root regression, restore',()=>{
 const j={nodes:Array.from({length:11913},()=>({})),scenes:[{nodes:[3]}]};
 for(const [id,prefix] of hiddenFeedIds)j.nodes[id].name=prefix+'TEST';
 for(const id of switchIds)j.nodes[id].name='D2F-SW-TEST';
 j.nodes[3].children=[...switchIds];
 assert.doesNotThrow(()=>c80AssertHiddenFeeds(j,0,'2F'));
 j.nodes[11830].children=[11909];
 assert.throws(()=>c80AssertHiddenFeeds(j,0,'2F'),/MUST conceal/);
 j.nodes[11830].children=[];
 assert.doesNotThrow(()=>c80AssertHiddenFeeds(j,0,'2F'));
 j.scenes[0].nodes=[11908];
 assert.throws(()=>c80AssertHiddenFeeds(j,0,'1F'),/MUST conceal/);
 j.scenes[0].nodes=[3];
 assert.throws(()=>c80AssertHiddenFeeds(j,0,'1F'),/switch reachability/);
 j.nodes[3].children=[];
 assert.doesNotThrow(()=>c80AssertHiddenFeeds(j,0,'1F'));
 j.nodes[3].children=[-1];
 assert.throws(()=>c80AssertHiddenFeeds(j,0,'1F'),/invalid source DFS/);
});
for(const spec of [
 {n:524,env:'C80_524_GLB_PATH',sha:C80_524_RAIN_GLB_SHA256,bytes:C80_524_RAIN_GLB_BYTES,first:518},
 {n:530,env:'C80_530_GLB_PATH',sha:'1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e',bytes:55645812,first:524}
]){
 test('authentic C80 '+spec.n+' six-scene concealed-feeder source DFS',{skip:!process.env[spec.env]},()=>{
  const buf=readFileSync(process.env[spec.env]);
  assert.equal(buf.length,spec.bytes);
  assert.equal(createHash('sha256').update(buf).digest('hex'),spec.sha);
  assert.equal(buf.toString('utf8',0,4),'glTF');
  const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
  assert.equal(json.scenes.length,spec.n);
  for(let k=0;k<6;k++)c80AssertHiddenFeeds(json,spec.first+k,k===0?'1F':k===1?'2F':'BOTH');
 });
}
