import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  H24_SCENE791792_SOURCE as S,
  isH24Scene791792Source as valid,
  h24Scene791792SourceReceipt as receipt,
} from '../../src/scripts/privateModelH24Scene791792SourceReceipt.mjs';

// Synthetic tests are NOT proof that original GLB bytes were available to CI.
function fixture() {
  const scenes = Array.from({ length: S.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: S.nodeCount }, () => ({}));
  nodes[S.hatchRoot] = { children: [S.hatchDoor, S.hatchKnob] };
  nodes[S.hatchDoor] = { mesh: S.doorMesh };
  nodes[S.hatchKnob] = { mesh: S.knobMesh };
  nodes[S.hatchFrame] = { mesh: S.hatchFrameMesh };
  nodes[S.wcBowl] = { mesh: S.wcBowlMesh };
  for (const view of Object.values(S.views)) {
    const original = [S.hatchRoot, S.hatchFrame, S.wcBowl, 13525, 13522, 13239,
      ...(view.plexi ? [S.plexi] : [])];
    scenes[view.parentScene] = { nodes: original };
    scenes[view.sceneIndex] = {
      name: 'C80_R31_K3_H24_DOOR_VISUALLY_REMOVED_' + view.role +
        '_WORK_TEST_HOST_HOLD__scene' + view.sceneIndex,
      nodes: original.filter(id => id !== S.hatchRoot),
    };
  }
  return { scene: S.defaultScene, scenes, nodes,
    meshes: Array(S.meshCount), materials: Array(S.materialCount),
    accessors: Array(S.accessorCount), bufferViews: Array(S.bufferViewCount) };
}
const check = (j, v, sha = S.glbSha256) => valid(j, sha, v.sceneIndex, v.role);

test('H24 scene791/792 structural receipt, always HOLD', () => {
  assert.match(S.zipSha256, /^[0-9a-f]{64}$/);
  assert.match(S.glbSha256, /^[0-9a-f]{64}$/);
  const j = fixture();
  for (const view of Object.values(S.views)) {
    assert.equal(check(j, view), true);
    const r = receipt(j, S.glbSha256, view.sceneIndex, view.role);
    assert.equal(r.exactSource, true);
    for (const key of ['viewerRegistered','publishAllowed','sourceLinksBound',
      'productionWebGLVerified','current','asBuilt',
      'physicalHatchOpeningVerified','physicalServiceClearanceVerified']) {
      assert.equal(r[key], false, key);
    }
  }
});

test('wrong SHA, role, roots, hatch, WC, plexiglass and scene reject', () => {
  const j = fixture();
  for (const v of Object.values(S.views)) {
    assert.equal(check(j,v, S.parentGlbSha256), false);
    assert.equal(check(j,v, '0'.repeat(64)), false);
    assert.equal(valid(j, S.glbSha256, v.sceneIndex, v.role === 'NORMAL' ? 'SERVICE' : 'NORMAL'), false);
    assert.equal(valid(j, S.glbSha256, v.parentScene, v.role), false);
    const mutate = (obj,key,val) => {
      const old=obj[key]; obj[key]=val;
      try { assert.equal(check(j,v),false,key); } finally { obj[key]=old; }
    };
    mutate(j,'scene',791);
    mutate(j.scenes[v.sceneIndex],'name','bad__scene'+v.sceneIndex);
    mutate(j.scenes[v.sceneIndex],'nodes',[...j.scenes[v.sceneIndex].nodes,S.hatchRoot]);
    mutate(j.scenes[v.sceneIndex],'nodes',j.scenes[v.sceneIndex].nodes.filter(x=>x!==S.hatchFrame));
    mutate(j.scenes[v.sceneIndex],'nodes',j.scenes[v.sceneIndex].nodes.filter(x=>x!==S.wcBowl));
    mutate(j.scenes[v.parentScene],'nodes',j.scenes[v.parentScene].nodes.filter(x=>x!==S.hatchRoot));
    mutate(j.nodes[S.hatchRoot],'children',[S.hatchDoor]);
    mutate(j.nodes[S.hatchFrame],'mesh',0);
    mutate(j.nodes[S.wcBowl],'mesh',0);
    mutate(j.nodes[S.hatchKnob],'mesh',0);
    mutate(j.scenes[v.sceneIndex],'nodes',[...j.scenes[v.sceneIndex].nodes, 999999]);
    assert.equal(check(j,v),true);
  }
});

test('missing bytes never indicate a valid receipt', () => {
  const v=S.views.normal, r=receipt(null,S.glbSha256,v.sceneIndex,v.role);
  assert.equal(r.exactSource,false);
  assert.equal(r.publishAllowed,false);
});

// Optional independent byte check: set to the original unpacked GLB path.
const rawGlb=process.env.C80_H24_SCENE791792_ORIGINAL_GLB_PATH;
test('optional original RAW GLB SHA and scene structure', {skip: !rawGlb}, () => {
  const bytes=readFileSync(rawGlb);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.length,S.glbBytes);
  assert.equal(bytes.readUInt32LE(8),S.glbBytes);
  const sha=createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,S.glbSha256);
  const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
  for(const v of Object.values(S.views)) assert.equal(check(json,v,sha),true);
});
