import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  C80_495_GLB_SHA256, C80_495_GLB_BYTES, C80_495_VIEWER_ROLES,
  C80_495_SEWER_ROOT, C80_495_SAVO_ROOT,
  isC80495SavoSewerSourceScene, resolveC80495SavoSewerScenes,
  resolveC80495SavoSewerSceneIndex, createC80495SavoSewerFloorRuntime,
  c80495SavoSewerReviewProfile,
} from '../../src/scripts/privateModelC80495SavoSewerFloorRuntime.mjs';

const roles = [[483,'1F','CLOSED',false],[488,'2F','CLOSED',false],
  [489,'BOTH','CLOSED',false],[490,'2F','ONE_OPEN',false],
  [491,'BOTH','ONE_OPEN',false],[492,'2F','STACKED',false],
  [493,'BOTH','STACKED',false],[494,'BOTH','CLOSED',true]];
test('495 source roles preserve 1F483 and select new 2F/BOTH scenes', () => {
  assert.deepEqual(Object.keys(C80_495_VIEWER_ROLES).map(Number).sort((a,b)=>a-b),
    roles.map(x=>x[0]).sort((a,b)=>a-b));
  for (const [scene, floor, glazing, cutaway] of roles)
    assert.equal(resolveC80495SavoSewerSceneIndex(floor, glazing, cutaway), scene);
  assert.equal(resolveC80495SavoSewerSceneIndex('2F','UNKNOWN'), null);
  assert.equal(resolveC80495SavoSewerSceneIndex('2F','CLOSED',true), null);
  assert.equal(resolveC80495SavoSewerSceneIndex('BOTH','ONE_OPEN',true), null);
});
test('mismatched SHA, missing geometry and mount contract fail closed', () => {
  assert.equal(resolveC80495SavoSewerScenes(null,C80_495_GLB_SHA256), null);
  assert.equal(resolveC80495SavoSewerScenes({scenes:Array(495).fill({})},'invalid'), null);
  assert.equal(isC80495SavoSewerSourceScene({},C80_495_GLB_SHA256,489),false);
  assert.throws(()=>createC80495SavoSewerFloorRuntime({
    gltf:null,sha:C80_495_GLB_SHA256,mount:()=>{},mounted:()=>null
  }),/C80_495_SOURCE_SCENE_MISMATCH/);
  assert.throws(()=>createC80495SavoSewerFloorRuntime({
    gltf:null,sha:C80_495_GLB_SHA256,mount:null,mounted:()=>null
  }),/C80_495_MOUNT_CONTRACT/);
});
const fixture=process.env.C80_495_GLB_PATH;
const load = () => {
  const buffer=readFileSync(fixture);
  assert.equal(buffer.length,C80_495_GLB_BYTES);
  assert.equal(createHash('sha256').update(buffer).digest('hex'),C80_495_GLB_SHA256);
  const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString('utf8'));
  const scenes=json.scenes.map(s=>({
    name:s.name,
    children:(s.nodes||[]).map(n=>({name:json.nodes[n]?.name})),
    traverse(fn){for(const obj of this.children)fn(obj);}
  }));
  return {json,gltf:{parser:{json},scenes}};
};
test('real 55 MB GLB exact scene receipt and alternating floor runtime', {skip:!fixture}, () => {
  const {json,gltf}=load();
  const scenes=resolveC80495SavoSewerScenes(gltf,C80_495_GLB_SHA256);
  assert.ok(scenes);
  assert.equal(json.scenes.length,495);
  let current=scenes[489];
  const runtime=createC80495SavoSewerFloorRuntime({
    gltf,sha:C80_495_GLB_SHA256,mount(next){current=next;},mounted(){return current;}
  });
  for(const [id,floor,glazing,cutaway] of roles){
    runtime.restore();
    assert.ok(runtime.apply(floor,glazing));
    if(cutaway)assert.ok(runtime.setCutaway(true));
    assert.equal(runtime.sceneIndex,id);
    assert.equal(runtime.selectedScene,current);
    const roots=json.scenes[id].nodes;
    assert.equal(roots.includes(C80_495_SEWER_ROOT),floor!=='2F');
    assert.equal(roots.includes(C80_495_SAVO_ROOT),floor!=='1F');
    assert.equal(roots.includes(12224),floor==='1F');
    const profile=c80495SavoSewerReviewProfile(json,C80_495_GLB_SHA256,id);
    assert.ok(profile);
    assert.equal(profile.count,495);
    const activeRoots=profile.roots[id].map(r=>r.node);
    assert.ok(activeRoots.includes(floor==='1F'?12224:C80_495_SAVO_ROOT));
  }
  runtime.dispose();
  assert.equal(runtime.apply('BOTH'),null);
});
test('viewer source gate opens 495 scene 489 without overriding 488',()=>{
  const page=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  assert.match(page,/import \{C80_495_GLB_SHA256,resolveC80495SavoSewerScenes,createC80495SavoSewerFloorRuntime\}/);
  assert.match(page,/loadedModelSha256\(gltf\) === C80_495_GLB_SHA256/);
  assert.match(page,/if\(c80495\) gltf\.scene=c80495\[489\];/);
  assert.match(page,/if\(ww74\) gltf\.scene=ww74\[484\]/);
});
