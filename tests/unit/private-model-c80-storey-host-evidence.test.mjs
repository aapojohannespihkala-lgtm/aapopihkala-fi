import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { C80_SUCC428_SOURCE_SHA256, validateC80StoreyHostEvidence as gate } from '../../src/scripts/privateModelC80StoreyHostEvidence.mjs';

const sha = C80_SUCC428_SOURCE_SHA256;
const sceneFloors = { 5: '1F', 6: '2F', 7: 'BOTH' };
const gltf = { scenes: Array.from({length:8}, () => ({nodes: []})), nodes: [
  {children:[1]}, {mesh: 3, extras:{presentationOnly: true, physicalHost:'HOST_HOLD', ylisViewScope:{storeyScope:'1F'}}},
  {children:[3]}, {mesh:4, extras:{hostValidated:true, physicalHost:'EVIDENCED', ylisViewScope:{storeyScope:'2F', apartmentScope:'D'}}},
] };
gltf.scenes[5].nodes = [0];gltf.scenes[6].nodes = [2];gltf.scenes[7].nodes = [0,2];
const common = { gltf, glbSha256:sha, sceneFloors, sceneIndex:6,
  pickedNodeIndex:3, pickedMeshIndex:4, pickedNodePath:[2,3],
  requestedFloor:'2F', ownerIdentifiedFloor:'2F',ownerIdentifiedRoom:'AULA',
  targetDeviceFloor:'2F',targetDeviceRoom:'AULA',
  evidence:{origin:'INDEPENDENT_SOURCE_VERIFIED', physicalHostValidated:true,
    sourceDocId:'verified-2f-original-photo',ownerConfirmed:true,glbSha256:sha,sceneIndex:6,
    nodeIndex:3,meshIndex:4,nodePath:[2,3],floor:'2F',room:'AULA'} };
const run = (x={})=>gate({...common,...x});
test('independent evidence verifies identity but never authorizes device move', () => {
  const r=run(); assert.equal(r.status,'SOURCE_HOST_IDENTITY_VERIFIED');
  assert.equal(r.canMoveDevice,false);assert.equal(r.asBuilt,false);
});
test('1F storage pick cannot be a 2F exhaust host, even if screenshot marked', () => {
  const r=run({sceneIndex:5,pickedNodeIndex:1,pickedMeshIndex:3,pickedNodePath:[0,1],
    requestedFloor:'1F',ownerIdentifiedFloor:'1F',ownerIdentifiedRoom:'VARASTO',
    targetDeviceFloor:'2F',targetDeviceRoom:'AULA'});
  assert.equal(r.status,'HOST_HOLD');assert.equal(r.reason,'STOREY_MISMATCH');
});
test('1F presentation proxy is never an installation host even when floor matches', () => {
  const r=run({sceneIndex:5,pickedNodeIndex:1,pickedMeshIndex:3,pickedNodePath:[0,1],
    requestedFloor:'1F',ownerIdentifiedFloor:'1F',ownerIdentifiedRoom:'VARASTO',
    targetDeviceFloor:'1F',targetDeviceRoom:'VARASTO'});
  assert.equal(r.reason,'DISPLAY_GEOMETRY_NOT_PHYSICAL_HOST');
});
test('BOTH floor cannot authenticate which storey owns the picked surface',()=>{
  assert.equal(run({sceneIndex:7}).reason,'BOTH_SCENE_CANNOT_PROVE_STOREY');
});
test('wrong SHA, room, node path, mesh, unknown scene and screenshot-only evidence fail closed',()=>{
  assert.equal(run({glbSha256:'0'.repeat(64)}).reason,'SOURCE_SHA_MISMATCH');
  assert.equal(run({ownerIdentifiedRoom:'WC'}).reason,'ROOM_MISMATCH');
  assert.equal(run({pickedNodePath:[3]}).reason,'SCENE_PARENT_PATH_UNVERIFIED');
  assert.equal(run({pickedMeshIndex:3}).reason,'NODE_MESH_MISMATCH');
  assert.equal(run({sceneIndex:8}).reason,'SCENE_UNVERIFIED');
  assert.equal(run({evidence:{origin:'SCREENSHOT_PIXEL'}}).reason,'INDEPENDENT_HOST_EVIDENCE_MISSING');
  assert.equal(run({evidence:{...common.evidence,ownerConfirmed:false}}).reason,'INDEPENDENT_HOST_EVIDENCE_MISSING');
  assert.equal(run({evidence:{...common.evidence,glbSha256:'0'.repeat(64)}}).reason,'INDEPENDENT_HOST_EVIDENCE_MISSING');
});
test('authentic SUCC428 bytes: 1F storage proxy in original scene401 is never a 2F host',()=>{
  const file=process.env.YLISRINNE_SUCC428_GLB;
  if(!file) return;
  const bytes=readFileSync(file);
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash,sha);
  const jsonLen=bytes.readUInt32LE(12);
  const gltf=JSON.parse(bytes.subarray(20,20+jsonLen).toString('utf8'));
  assert.equal(gltf.scenes.length,428);
  assert.equal(gltf.nodes[9913].mesh,3591);
  assert.equal(gltf.nodes[9913].extras.ylisViewScope.storeyScope,'1F');
  assert.equal(gltf.nodes[9913].extras.presentationOnly,true);
  assert.equal(gltf.nodes[9913].extras.sourceMetadata.floorHostValidated,false);
  assert.ok(gltf.scenes[401].nodes.includes(9913));
  const shared={gltf,glbSha256:sha,sceneFloors:{...sceneFloors,401:'1F',403:'BOTH',419:'1F'},
    sceneIndex:401,pickedNodeIndex:9913,pickedMeshIndex:3591,pickedNodePath:[9913],
    requestedFloor:'1F',ownerIdentifiedFloor:'1F',ownerIdentifiedRoom:'VARASTO',
    targetDeviceFloor:'2F',targetDeviceRoom:'AULA'};
  assert.equal(gate(shared).reason,'STOREY_MISMATCH');
  assert.equal(gate({...shared,targetDeviceFloor:'1F',targetDeviceRoom:'VARASTO'}).reason,
    'DISPLAY_GEOMETRY_NOT_PHYSICAL_HOST');
  assert.equal(gate({...shared,sceneIndex:403}).reason,'BOTH_SCENE_CANNOT_PROVE_STOREY');
  assert.equal(gate({...shared,sceneIndex:419,targetDeviceFloor:'1F',targetDeviceRoom:'VARASTO'}).reason,
    'SCENE_PARENT_PATH_UNVERIFIED');
});
