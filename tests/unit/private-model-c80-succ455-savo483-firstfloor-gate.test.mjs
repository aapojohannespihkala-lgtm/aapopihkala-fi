import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  C80_SUCC455_SAVO483_1F_SCENES,
  C80_SUCC455_SAVO483_1F_DEFAULT_SCENE,
  isC80Succ455Savo483FirstFloorScene,
  resolveC80Succ455Savo483FirstFloorScene,
} from '../../src/scripts/privateModelC80Succ455Savo483FirstFloorGate.mjs';
import {
  C80_SUCC455_SAVO483_GLB_SHA256,
  C80_SUCC455_SAVO483_GLB_BYTES,
} from '../../src/scripts/privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import {
  resolveC80Succ455Savo483Scenes,createC80Succ455Savo483FloorRuntime,
  resolveC80Succ455Savo483SceneIndex,
} from '../../src/scripts/privateModelC80Succ455Room3Mj83FloorRuntime.mjs';

test('483 exact-SHA 1F scene indices are explicitly inherited, not 2F door/panel',()=>{
  assert.deepEqual(Object.keys(C80_SUCC455_SAVO483_1F_SCENES),['467','468']);
  assert.equal(C80_SUCC455_SAVO483_1F_DEFAULT_SCENE,467);
  assert.equal(C80_SUCC455_SAVO483_1F_SCENES[467].rootFnv,'0836d5c2');
  assert.equal(C80_SUCC455_SAVO483_1F_SCENES[468].rootFnv,'f3be6c43');
  assert.equal(resolveC80Succ455Savo483SceneIndex(
    C80_SUCC455_SAVO483_GLB_SHA256,'1F','CLOSED',false),467);
  for(const args of [
    ['1F','ONE_OPEN',false],['1F','STACKED',false],
    ['1F','CLOSED',true],['2F','CLOSED',true],
  ])assert.equal(resolveC80Succ455Savo483SceneIndex(
    C80_SUCC455_SAVO483_GLB_SHA256,...args),null);
  assert.equal(resolveC80Succ455Savo483SceneIndex(
    'wrong-sha','1F','CLOSED',false),null);
});

test('1F source gate and renderer fail closed without original authenticated bytes',()=>{
  assert.equal(isC80Succ455Savo483FirstFloorScene(null,C80_SUCC455_SAVO483_GLB_SHA256),false);
  assert.equal(isC80Succ455Savo483FirstFloorScene({},C80_SUCC455_SAVO483_GLB_SHA256),false);
  assert.equal(isC80Succ455Savo483FirstFloorScene({},
    C80_SUCC455_SAVO483_GLB_SHA256,477),false);
  assert.equal(resolveC80Succ455Savo483FirstFloorScene(null,C80_SUCC455_SAVO483_GLB_SHA256),null);
  assert.equal(resolveC80Succ455Savo483FirstFloorScene({
    scenes:Array(483).fill({}),parser:{json:{}}},
    C80_SUCC455_SAVO483_GLB_SHA256),null);
});

const fixture=process.env.C80_SUCC455_SAVO483_GLB_PATH;
test('authentic 483 GLB inherits two 1F roots, cold/hot parent paths and no 2F panel',
  {skip:!fixture},()=>{
    const bytes=readFileSync(fixture);
    assert.equal(bytes.toString('ascii',0,4),'glTF');
    assert.equal(bytes.length,C80_SUCC455_SAVO483_GLB_BYTES);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),
      C80_SUCC455_SAVO483_GLB_SHA256);
    const size=bytes.readUInt32LE(12);
    const json=JSON.parse(bytes.subarray(20,20+size).toString('utf8'));
    const scenes=json.scenes.map(s=>({
      name:s.name,
      children:(s.nodes||[]).map(n=>({name:json.nodes[n]?.name})),
      traverse(visitor){for(const c of this.children)visitor(c);},
    }));
    const gltf={parser:{json},scenes};
    for(const i of [467,468]){
      assert.equal(isC80Succ455Savo483FirstFloorScene(
        json,C80_SUCC455_SAVO483_GLB_SHA256,i),true);
      assert.equal(isC80Succ455Savo483FirstFloorScene(json,'wrong',i),false);
      assert.equal(resolveC80Succ455Savo483FirstFloorScene(
        gltf,C80_SUCC455_SAVO483_GLB_SHA256,i),scenes[i]);
    }
    const accepted=resolveC80Succ455Savo483Scenes(gltf,C80_SUCC455_SAVO483_GLB_SHA256);
    assert.ok(accepted);
    assert.equal(accepted[467],scenes[467]);
    assert.equal(accepted[468],undefined);
    let current=accepted[477];
    const runtime=createC80Succ455Savo483FloorRuntime({
      gltf,sha:C80_SUCC455_SAVO483_GLB_SHA256,
      mount(next){current=next;},mounted(){return current;},
    });
    assert.equal(runtime.supportsFirstFloor,true);
    assert.equal(runtime.apply('1F')!==null,true);
    assert.equal(runtime.sceneIndex,467);
    assert.equal(runtime.selectedScene,current);
    assert.equal(runtime.setGlazing('ONE_OPEN'),null);
    assert.equal(runtime.setCutaway(true),null);
    runtime.restore();
    assert.equal(runtime.sceneIndex,477);
    assert.equal(current,accepted[477]);
    assert.equal(runtime.publicationStatus,'NOT_AUTHORIZED');
    assert.equal(runtime.stairStatus,'HOST_HOLD');
    runtime.dispose();
    assert.equal(runtime.apply('1F'),null);
    const root=json.scenes[467].nodes[0];
    json.scenes[467].nodes[0]=999999;
    assert.equal(isC80Succ455Savo483FirstFloorScene(
      json,C80_SUCC455_SAVO483_GLB_SHA256,467),false);
    json.scenes[467].nodes[0]=root;
    json.nodes[12159].children=[12037,12038,12039];
    assert.equal(isC80Succ455Savo483FirstFloorScene(
      json,C80_SUCC455_SAVO483_GLB_SHA256,467),false);
  });
