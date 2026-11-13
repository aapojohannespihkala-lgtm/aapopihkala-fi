import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { resolveConcealedTechnicalObjects, createConcealedTechnicalPresentation } from '../../src/scripts/privateModelConcealedTechnicalPresentation.mjs';
import { SUCCESSOR_R1_SHA256 as SHA } from '../../src/scripts/privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';

// Minimal receipt extracted from original Drive ZIP152JZ... / inner SHA31dc12c4.
// Source values are independent of the presentation implementation.
const RECEIPT = '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';
function fixture(index = 362) {
  const receipt = JSON.parse(inflateSync(Buffer.from(RECEIPT, 'base64')).toString());
  const json = { ...receipt, nodes: Array.from({length:12108}, () => ({})),
    meshes: Array.from({length:4556}, () => ({})), scenes: Array.from({length:369}, () => ({nodes:[]})) };
  for (const [id, value] of Object.entries(receipt.nodes)) json.nodes[id] = value;
  for (const [id, value] of Object.entries(receipt.scenes)) json.scenes[id] = value;
  const associations = new Map(), byId = new Map();
  function build(id, parent) {
    const n = json.nodes[id];
    const object = { name:n.name, visible:true, isMesh:n.mesh !== undefined, parent, children:[],
      traverse(fn) { fn(this); for (const child of this.children) child.traverse(fn); } };
    associations.set(object, {nodes:id}); byId.set(id, object);
    // Only target ancestry is needed here, not the donor socket's full tree.
    if ([11730,11908,11912].includes(id)) {
      for (const child of n.children ?? []) object.children.push(build(child, object));
    }
    return object;
  }
  const scene = { children:[], traverse(fn) { fn(this); for (const child of this.children) child.traverse(fn); } };
  for (const id of json.scenes[index].nodes) scene.children.push(build(id, scene));
  const gltf = {scenes:Array.from({length:369}, (_,i) => i === index ? scene : null), parser:{json,associations}};
  return {json,gltf,scene,byId,index,resolve() { return resolveConcealedTechnicalObjects(gltf,scene,index,SHA,SHA); }};
}

test('all nine source scenes mask only the seven declared concealed routes', () => {
  for (let index=360; index<=368; index++) {
    const f=fixture(index), result=f.resolve();
    assert.ok(result, 'actual source receipt scene '+index);
    const ids=result.objects.map(object => f.gltf.parser.associations.get(object).nodes);
    const twoFloor = [361,363,365].includes(index);
    assert.deepEqual(ids, twoFloor ? [11829,11909,11911] : [11733,11737,11738,11829,11905,11909,11911]);
    assert.equal(result.diagnosticScene, index===367 || index===368);
    assert.equal(ids.includes(12098),false,'visible owner socket remains outside concealment');
    assert.equal(ids.includes(11636),false,'visible NIBE copper is not hidden by the word hidden in uncertainty');
  }
});

test('inspection respects layer and ancestor hides, then normal mode conceals again', () => {
  const f=fixture(), result=f.resolve();
  f.byId.get(11909).visible=false; // Existing per-mesh Layers hide.
  f.byId.get(11912).visible=false; // Existing parent hide.
  const view=createConcealedTechnicalPresentation(result);
  view.apply(false);
  assert.ok(result.objects.every(object => !object.visible));
  assert.equal(f.byId.get(12098).visible,true,'real visible socket untouched');
  view.apply(true);
  assert.equal(f.byId.get(11829).visible,true);
  assert.equal(f.byId.get(11909).visible,false,'never reveal layer-hidden route');
  assert.equal(f.byId.get(11912).visible,false,'never reveal hidden parent');
  view.apply(false);
  assert.ok(result.objects.every(object => !object.visible));
  view.dispose();
  assert.equal(f.byId.get(11829).visible,true,'restore previous scene baseline');
  assert.equal(f.byId.get(11909).visible,false);
  view.apply(false);
  assert.equal(f.byId.get(11829).visible,true,'disposed controller does not mutate old scene');
});

test('PK1 diagnostic cutaway retains concealed routes at existing visibility baseline', () => {
  const f=fixture(368), result=f.resolve();
  f.byId.get(11905).visible=false;
  const view=createConcealedTechnicalPresentation(result);
  view.apply(false);
  assert.equal(f.byId.get(11829).visible,true);
  assert.equal(f.byId.get(11905).visible,false);
  view.dispose();
});

test('wrong SHA, scene, source mesh, semantic flag, parent or duplicate association fails closed', () => {
  let f=fixture();
  assert.equal(resolveConcealedTechnicalObjects(f.gltf,f.scene,362,SHA,'0'.repeat(64)),null);
  assert.equal(resolveConcealedTechnicalObjects(f.gltf,f.scene,355,SHA,SHA),null);
  f.json.nodes[11911].mesh=4515; assert.equal(f.resolve(),null);
  f=fixture(); delete f.json.nodes[11829].extras.noVisibleRoomCable; assert.equal(f.resolve(),null);
  f=fixture(); f.byId.get(11911).parent=f.scene; assert.equal(f.resolve(),null);
  f=fixture(); f.gltf.parser.associations.delete(f.byId.get(11908)); assert.equal(f.resolve(),null);
  f=fixture(); const copy={...f.byId.get(11911)};
  f.byId.get(11912).children.push(copy); f.gltf.parser.associations.set(copy,{nodes:11911});
  assert.equal(f.resolve(),null);
});

test('viewer disposes the concealment before Layers and blocks inspection under isolate/hide', () => {
  const source=readFileSync(new URL('../../src/pages/private-model/index.astro',import.meta.url),'utf8');
  const dispose=source.slice(source.indexOf('const disposeLayersPresentation = () => {'),source.indexOf('beforeLayersSceneChange = disposeLayersPresentation;'));
  assert.ok(dispose.indexOf('concealedTechnical?.dispose()') < dispose.indexOf('layersRuntime?.dispose()'));
  const change=source.slice(source.indexOf("technicalReviewInput.addEventListener('change'"),source.indexOf("layersContextInput.addEventListener('change'"));
  assert.ok(change.indexOf("objectVisibilityFilter === 'active'") < change.indexOf('concealedTechnical?.apply(technicalReviewOn)'));
  assert.ok(source.includes('concealedTechnical.apply(technicalReviewOn)'));
});
