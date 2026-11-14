import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  C80_SUCC455_SAVO483_GLB_SHA256,
  C80_SUCC455_SAVO483_GLB_BYTES,
  C80_SUCC455_SAVO483_SCENES,
  C80_SUCC455_SAVO483_SOURCE_LINKS_BOUND,
  C80_SUCC455_SAVO483_PUBLISH_ALLOWED,
} from '../../src/scripts/privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import {
  C80_SUCC455_SAVO483_VIEWER_ROLES,
  normalizeC80Succ455Savo483Options,
  resolveC80Succ455Savo483SceneIndex,
  resolveC80Succ455Savo483Scenes,
  createC80Succ455Savo483FloorRuntime,
} from '../../src/scripts/privateModelC80Succ455Room3Mj83FloorRuntime.mjs';

const options=[
  [476,'2F','CLOSED',false],
  [477,'BOTH','CLOSED',false],
  [478,'2F','ONE_OPEN',false],
  [479,'BOTH','ONE_OPEN',false],
  [480,'2F','STACKED',false],
  [481,'BOTH','STACKED',false],
  [482,'BOTH','CLOSED',true],
];

test('seven immutable 483-source scene choices with no 1F or automatic publish',()=>{
  assert.deepEqual(Object.keys(C80_SUCC455_SAVO483_VIEWER_ROLES).map(Number),
    [476,477,478,479,480,481,482]);
  assert.deepEqual(Object.keys(C80_SUCC455_SAVO483_SCENES).map(Number),
    [476,477,478,479,480,481,482]);
  for(const [scene,floor,glazing,cutaway] of options){
    assert.equal(resolveC80Succ455Savo483SceneIndex(
      C80_SUCC455_SAVO483_GLB_SHA256,floor,glazing,cutaway),scene);
    assert.deepEqual(normalizeC80Succ455Savo483Options(floor,glazing,cutaway),
      {floor,glazing,cutaway});
  }
  assert.equal(resolveC80Succ455Savo483SceneIndex('bad-sha','BOTH'),null);
  assert.equal(resolveC80Succ455Savo483SceneIndex(C80_SUCC455_SAVO483_GLB_SHA256,'1F'),null);
  assert.equal(resolveC80Succ455Savo483SceneIndex(C80_SUCC455_SAVO483_GLB_SHA256,'BOTH','ONE_OPEN',true),null);
  assert.equal(resolveC80Succ455Savo483SceneIndex(C80_SUCC455_SAVO483_GLB_SHA256,'2F','CLOSED',true),null);
  assert.equal(resolveC80Succ455Savo483SceneIndex(C80_SUCC455_SAVO483_GLB_SHA256,'BOTH','UNKNOWN'),null);
  assert.equal(resolveC80Succ455Savo483SceneIndex(C80_SUCC455_SAVO483_GLB_SHA256,'BOTH','CLOSED','yes'),null);
  assert.equal(C80_SUCC455_SAVO483_SOURCE_LINKS_BOUND,false);
  assert.equal(C80_SUCC455_SAVO483_PUBLISH_ALLOWED,false);
});

test('invalid binary source, scene list, and mount contract fail closed',()=>{
  assert.equal(resolveC80Succ455Savo483Scenes(null,C80_SUCC455_SAVO483_GLB_SHA256),null);
  assert.equal(resolveC80Succ455Savo483Scenes({scenes:Array(483).fill({})},C80_SUCC455_SAVO483_GLB_SHA256),null);
  assert.equal(resolveC80Succ455Savo483Scenes({scenes:Array(483).fill({})},'wrong'),null);
  assert.throws(()=>createC80Succ455Savo483FloorRuntime({
    gltf:null,sha:C80_SUCC455_SAVO483_GLB_SHA256,mount:()=>{},mounted:()=>null
  }),/SUCC455_SAVO483_SOURCE_SCENE_MISMATCH/);
  assert.throws(()=>createC80Succ455Savo483FloorRuntime({
    gltf:null,sha:C80_SUCC455_SAVO483_GLB_SHA256,mount:null,mounted:()=>null
  }),/SUCC455_SAVO483_MOUNT_CONTRACT/);
});

// Full authenticated 54.97 MB GLB is optional and must never enter git.
// Passing self-contained tests alone does NOT verify production Three/WebGL.
const fixture=process.env.C80_SUCC455_SAVO483_GLB_PATH;
test('authentic 483-scene GLB mounts all seven source roots and restores',
  {skip:!fixture},()=>{
    const binary=readFileSync(fixture);
    assert.equal(binary.toString('ascii',0,4),'glTF');
    assert.equal(binary.length,C80_SUCC455_SAVO483_GLB_BYTES);
    assert.equal(createHash('sha256').update(binary).digest('hex'),
      C80_SUCC455_SAVO483_GLB_SHA256);
    const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString('utf8'));
    const scenes=json.scenes.map(s=>({
      name:s.name,
      children:(s.nodes||[]).map(n=>({name:json.nodes[n]?.name})),
      traverse(visitor){for(const obj of this.children)visitor(obj);}
    }));
    const gltf={parser:{json},scenes};
    const resolved=resolveC80Succ455Savo483Scenes(gltf,C80_SUCC455_SAVO483_GLB_SHA256);
    assert.ok(resolved);
    let current=resolved[477];
    const runtime=createC80Succ455Savo483FloorRuntime({
      gltf,sha:C80_SUCC455_SAVO483_GLB_SHA256,
      mount(next){current=next;},mounted(){return current;}
    });
    assert.equal(runtime.defaultScene,resolved[477]);
    assert.equal(runtime.apply('1F'),null);
    for(const [index,floor,glazing,cutaway] of options){
      runtime.restore();
      assert.ok(runtime.apply(floor,glazing));
      if(cutaway)assert.ok(runtime.setCutaway(true));
      assert.equal(runtime.sceneIndex,index);
      assert.equal(runtime.selectedScene,current);
    }
    runtime.restore();
    assert.equal(current,resolved[477]);
    assert.equal(runtime.sceneIndex,477);
    assert.equal(runtime.active,false);
    runtime.dispose();
    assert.equal(runtime.apply('2F'),null);
  });
