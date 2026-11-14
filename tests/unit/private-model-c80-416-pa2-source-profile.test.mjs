// Source-only profile: no private model fixture is committed to this repository.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_416_GLB_SHA256,C80_416_GLB_BYTES,C80_416_SCENES,
  resolveC80416SceneIndex,c80416RootFnv32,isC80416SourceScene}
  from '../../src/scripts/privateModelC80416PA2SourceProfile.mjs';
test('six exact source-scene roles, including misleading CLOSED names', () => {
  assert.deepEqual(Object.keys(C80_416_SCENES).map(Number), [410,411,412,413,414,415]);
  assert.equal(c80416RootFnv32([1,2,3]), '56cf37ab');
  assert.equal(c80416RootFnv32([1,-2]), null);
  for (const [id, spec] of Object.entries(C80_416_SCENES))
    assert.equal(resolveC80416SceneIndex(C80_416_GLB_SHA256,
      spec.floor,spec.glazing,spec.cutaway), Number(id));
  assert.equal(C80_416_SCENES[412].glazing, 'ONE_OPEN');
  assert.equal(C80_416_SCENES[413].glazing, 'STACKED');
  assert.match(C80_416_SCENES[412].name, /CLOSED_BOTH/);
  assert.equal(resolveC80416SceneIndex(C80_416_GLB_SHA256,'2F'),null);
  assert.equal(resolveC80416SceneIndex(C80_416_GLB_SHA256,'1F','ONE_OPEN'),null);
  assert.equal(resolveC80416SceneIndex('0'.repeat(64),'BOTH'),null);
});
test('missing GLB or unmatched digest rejects instead of trusting labels', () => {
  for (const index of [410,411,412,413,414,415]) {
    assert.equal(isC80416SourceScene(null,C80_416_GLB_SHA256,index),false);
    assert.equal(isC80416SourceScene({scenes:[]},C80_416_GLB_SHA256,index),false);
    assert.equal(isC80416SourceScene({scenes:[{}]},'fake',index),false);
  }
});
const path=process.env.C80_416_GLB_PATH;
test('original 54MB GLB six source scenes and mutation guards',{skip:!path},() => {
  const b=readFileSync(path);
  assert.equal(b.toString('ascii',0,4),'glTF');
  assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(b.length,C80_416_GLB_BYTES);
  assert.equal(createHash('sha256').update(b).digest('hex'),C80_416_GLB_SHA256);
  const json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
  for (const [id,spec] of Object.entries(C80_416_SCENES)) {
    const i=Number(id),orig=json.scenes[i];
    assert.equal(isC80416SourceScene(json,C80_416_GLB_SHA256,i,
      spec.floor,spec.glazing,spec.cutaway),true,'genuine '+i);
    assert.equal(isC80416SourceScene(json,'f'.repeat(64),i),false);
    json.scenes[i]={...orig,nodes:orig.nodes.slice().reverse()};
    assert.equal(isC80416SourceScene(json,C80_416_GLB_SHA256,i),false,'changed root order '+i);
    json.scenes[i]={...orig,extras:{...orig.extras,sourceLinksBindingVerified:true}};
    assert.equal(isC80416SourceScene(json,C80_416_GLB_SHA256,i),false,'fake binding '+i);
    json.scenes[i]={...orig,extras:{...orig.extras,PA2FourPipeEnds20261114:{
      ...orig.extras.PA2FourPipeEnds20261114,oldScene:999
    }}};
    assert.equal(isC80416SourceScene(json,C80_416_GLB_SHA256,i),false,'wrong origin '+i);
    json.scenes[i]=orig;
  }
  const prior=json.nodes[12144].mesh;
  json.nodes[12144].mesh=0;
  assert.equal(isC80416SourceScene(json,C80_416_GLB_SHA256,410),false);
  json.nodes[12144].mesh=prior;
});
