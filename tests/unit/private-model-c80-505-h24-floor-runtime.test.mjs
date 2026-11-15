import {C80_437_SCENES} from '../../src/scripts/privateModelC80437SourceProfile.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  C80_505_GLB_SHA256, C80_505_GLB_BYTES,
  C80_505_H24_NEW_ROOT, C80_505_H24_OLD_ROOT,
  resolveC80505H24Scenes,
} from '../../src/scripts/privateModelC80505H24SourceProfile.mjs';
import {
  createC80505H24FloorRuntime, c80505H24ReviewProfile,
} from '../../src/scripts/privateModelC80505H24FloorRuntime.mjs';

const roles = [
 [500,'1F','CLOSED',false], [488,'2F','CLOSED',false],
 [501,'BOTH','CLOSED',false], [490,'2F','ONE_OPEN',false],
 [502,'BOTH','ONE_OPEN',false], [492,'2F','STACKED',false],
 [503,'BOTH','STACKED',false], [504,'BOTH','CLOSED',true],
];

test('505 floor runtime fails closed on wrong source and invalid mount callbacks', () => {
 assert.throws(() => createC80505H24FloorRuntime({
   gltf: null, sha: C80_505_GLB_SHA256, mount: () => {}, mounted: () => null,
 }), /C80_505_SOURCE_SCENE_MISMATCH/);
 assert.throws(() => createC80505H24FloorRuntime({
   gltf: null, sha: C80_505_GLB_SHA256, mount: null, mounted: () => null,
 }), /C80_505_MOUNT_CONTRACT/);
 assert.equal(c80505H24ReviewProfile({}, C80_505_GLB_SHA256, 501), null);
 assert.equal(c80505H24ReviewProfile({}, 'bad-sha', 501), null);
});

const fixture = process.env.C80_505_GLB_PATH;
test('authentic 505: floor, glazing, cutaway, dispose and H24 non-MEP highlight',
 { skip: !fixture }, () => {
 const bytes = readFileSync(fixture);
 assert.equal(bytes.length, C80_505_GLB_BYTES);
 assert.equal(createHash('sha256').update(bytes).digest('hex'), C80_505_GLB_SHA256);
 const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8'));
 const scenes = json.scenes.map(scene => ({
   name: scene.name, children: scene.nodes.map(node => ({name: json.nodes[node]?.name})),
   traverse(fn) { for (const child of this.children) fn(child); },
 }));
 const gltf = { parser: { json }, scenes };
 const accepted = resolveC80505H24Scenes(gltf, C80_505_GLB_SHA256);
 assert.ok(accepted);
 let current = accepted[501];
 const runtime = createC80505H24FloorRuntime({
   gltf, sha: C80_505_GLB_SHA256,
   mount(next) { current = next; }, mounted() { return current; },
 });
 assert.equal(runtime.defaultScene, accepted[501]);
 assert.equal(runtime.publicationStatus, 'NOT_AUTHORIZED');
 assert.equal(runtime.physicalClearanceStatus, 'NOT_VERIFIED');
 assert.equal(runtime.stairStatus, 'HOST_HOLD');
 for (const [sceneIndex, floor, glazing, cutaway] of roles) {
   runtime.restore();
   assert.ok(runtime.apply(floor, glazing));
   if (cutaway) assert.ok(runtime.setCutaway(true));
   assert.equal(runtime.sceneIndex, sceneIndex);
   assert.equal(runtime.selectedScene, current);
   assert.equal(runtime.floor, floor);
   assert.equal(runtime.glazing, glazing);
   assert.equal(runtime.cutaway, cutaway);
   const roots = json.scenes[sceneIndex].nodes;
   assert.equal(roots.includes(C80_505_H24_NEW_ROOT), floor !== '2F');
   assert.equal(roots.includes(C80_505_H24_OLD_ROOT), false);
   const review = c80505H24ReviewProfile(json, C80_505_GLB_SHA256, sceneIndex);
   assert.ok(review);
   assert.equal(review.count, 505);
   assert.equal(review.physicalClaim, false);
   assert.equal(review.publicationAllowed, false);
   assert.equal(review.roots[sceneIndex].some(r => r.node === C80_505_H24_NEW_ROOT), false);
   if (floor !== '2F') {
     assert.ok(review.roots[sceneIndex].some(r => r.node === 12237));
     assert.ok(review.roots[sceneIndex].some(r => r.node === 12228));
   } else assert.ok(review.roots[sceneIndex].some(r => r.node === 12230));
   const historic=new Set(Object.values(C80_437_SCENES).flatMap(s => s.review ?? []));
   const expectedTechnical=roots.filter(n => n !== C80_505_H24_NEW_ROOT &&
     (historic.has(n) || [12193,12194,12224,12228,12230,12237].includes(n)));
   assert.deepEqual(review.roots[sceneIndex].map(r => r.node),expectedTechnical);
 }
 runtime.restore();
 assert.equal(runtime.setGlazing('INVALID'), null);
 assert.equal(runtime.setCutaway(true)?.exceptions.length, 0);
 assert.equal(runtime.setGlazing('ONE_OPEN'), null);
 runtime.restore();
 current = null;
 assert.equal(runtime.apply('BOTH'), null);
 current = accepted[501];
 runtime.dispose();
 assert.equal(runtime.apply('1F'), null);
 assert.equal(runtime.setCutaway(true), null);
 assert.equal(c80505H24ReviewProfile(json, 'bad-sha', 501), null);
 assert.equal(c80505H24ReviewProfile(json, C80_505_GLB_SHA256, 499), null);
});

test('505 source mount fail-closed even if scene identity changes after construction',
 { skip: !fixture }, () => {
 const buf = readFileSync(fixture);
 const json = JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString('utf8'));
 const scenes = json.scenes.map(s => ({name:s.name,children:s.nodes.map(n=>({name:json.nodes[n].name}))}));
 const gltf={parser:{json},scenes};
 let current=scenes[501];
 const runtime=createC80505H24FloorRuntime({
   gltf,sha:C80_505_GLB_SHA256,
   mount() {},mounted(){return current;},
 });
 assert.throws(()=>runtime.apply('2F'),/C80_505_SCENE_MOUNT_MISMATCH/);
 assert.equal(runtime.sceneIndex,501);
 current=scenes[501];
 assert.equal(runtime.apply('BOTH')===null,false); // mounting the current identity is valid
 runtime.dispose();
});

test('505 H24 source-only reviewer preserves historical MEP roots without promoting H24',()=>{
 const source=readFileSync(new URL('../../src/scripts/privateModelC80505H24FloorRuntime.mjs',import.meta.url),'utf8');
 assert.ok(source.includes('C80_437_SCENES'));
 assert.ok(source.includes('...HISTORICAL_MEP_ROOTS, 12193, 12194, 12224, 12228, 12230, 12237'));
 assert.ok(source.includes('node !== C80_505_H24_NEW_ROOT'));
});
