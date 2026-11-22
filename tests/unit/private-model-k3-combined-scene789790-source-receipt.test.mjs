import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  K3_COMBINED_789790_SOURCE as S,
  isK3CombinedScene789790Source as valid,
  k3CombinedScene789790SourceReceipt as receipt,
} from '../../src/scripts/privateModelK3CombinedScene789790SourceReceipt.mjs';

const older = [11625, 13522, 13519, 13525, 13528,
  13507, 13510, 13513, 13516, S.legacySw05Root];
function fixture() {
  const scenes = Array.from({ length: S.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: S.nodeCount }, () => ({}));
  for (const [role, v] of Object.entries(S.views)) {
    const original = older.filter(x => v.plexi || x !== 11625);
    scenes[v.parent] = { nodes: [...original] };
    scenes[v.index] = {
      name: 'Ylisrinne_C80_R31_K3_D1F_SW01_02_03_04_D2F_SW01_02_03_04_05_' +
        role + '_WORK_TEST_HOST_HOLD__scene' + v.index,
      nodes: [...original.filter(x => x !== S.legacySw05Root), S.newSw05Root],
      extras: { stage:'WORK_TEST_HOST_HOLD', role,
        sourceParentScene:v.parent, current:false, asBuilt:false,
        sourceLinksBoundToOutputSHA:false, productionWebGLVerified:false, humanReview:false },
    };
  }
  for (const [stableID, idx] of Object.entries(S.retainedRoots)) {
    nodes[idx] = { extras: { stableID, current:false, asBuilt:false } };
  }
  nodes[S.newSw05Root] = {
    children:[...S.newChildren],
    extras:{ stableID:'D2F-SW-05', floor:'D2F', current:false, asBuilt:false },
  };
  nodes[S.newChildren[0]] = { mesh:S.newMeshes[0] };
  nodes[S.newChildren[1]] = { mesh:S.newMeshes[1] };
  return {
    asset:{ version:'2.0', extras:{
      ModelStage:'WORK_TEST', current:false, asBuilt:false, HUMAN_REVIEW:'NOT_RUN' }},
    scene:S.defaultScene, scenes, nodes, meshes:Array(S.meshCount).fill(null),
  };
}
const check=(j, role, sha=S.glbSha256) =>
  valid(j, sha, S.views[role].index, role, 'BOTH');

test('exact 789/790 synthetic scene graphs qualify SOURCE_ONLY, never publishable', () => {
  for (const role of ['NORMAL','SERVICE']) {
    const j=fixture();
    assert.equal(check(j,role),true);
    const r=receipt(j,S.glbSha256,S.views[role].index,role,'BOTH');
    assert.equal(r.exactSource,true);
    for (const k of ['sourceLinksBound','viewerRegistered','publishAllowed',
      'productionWebGLVerified','current','asBuilt','installedProductVerified',
      'physicalHostVerified','electricalCircuitVerified']) assert.equal(r[k],false);
    assert.equal(r.humanReview,'NOT_RUN');
  }
});
test('wrong SHA, source revision, role, floor or scene is rejected', () => {
  const j=fixture();
  for(const sha of [S.parentGlbSha256,S.donorGlbSha256,'0'.repeat(64),'bad'])
    assert.equal(check(j,'NORMAL',sha),false);
  assert.equal(valid(j,undefined,789,'NORMAL','BOTH'),false);
  assert.equal(valid(j,S.glbSha256,790,'NORMAL','BOTH'),false);
  assert.equal(valid(j,S.glbSha256,789,'NORMAL','D1F'),false);
  assert.equal(valid(j,S.glbSha256,789,'OTHER','BOTH'),false);
  assert.equal(receipt(null,S.glbSha256,789,'NORMAL','BOTH').publishAllowed,false);
  assert.equal(receipt(null,S.glbSha256,789,'NORMAL','BOTH').exactSource,false);
});
test('fail closed on provenance, legacy root, unique IDs, role and status mutations',()=>{
  for (const role of ['NORMAL','SERVICE']) {
    const j=fixture(), v=S.views[role];
    const mutate=(o,k,val)=>{
      const old=o[k];o[k]=val;
      try {assert.equal(check(j,role),false,k);}
      finally {o[k]=old;}
    };
    assert.equal(check(j,role),true);
    mutate(j,'scene',789);
    mutate(j.asset.extras,'ModelStage','CURRENT');
    mutate(j.asset.extras,'HUMAN_REVIEW','APPROVED');
    mutate(j.scenes[v.index],'name','renamed');
    mutate(j.scenes[v.index].extras,'sourceParentScene',0);
    mutate(j.scenes[v.index].extras,'productionWebGLVerified',true);
    mutate(j.scenes[v.index].extras,'sourceLinksBoundToOutputSHA',true);
    mutate(j.scenes[v.index].extras,'humanReview',true);
    mutate(j.scenes[v.index].extras,'current',true);
    mutate(j.scenes[v.index],'nodes',[...j.scenes[v.index].nodes,S.legacySw05Root]);
    mutate(j.scenes[v.parent],'nodes',[...j.scenes[v.parent].nodes,S.newSw05Root]);
    mutate(j.nodes[S.newSw05Root],'children',[13532]);
    mutate(j.nodes[S.newSw05Root].extras,'stableID','D2F-SW-04');
    mutate(j.nodes[S.newSw05Root].extras,'floor','D1F');
    mutate(j.nodes[S.newChildren[0]],'mesh',5186);
    mutate(j.nodes[S.retainedRoots['D1F-SW-03']].extras,'stableID','D1F-SW-02');
    assert.equal(check(j,role),true);
  }
});
const raw = process.env.C80_R31_K3_COMBINED_SCENE789790_GLB_PATH;
test('optional real ORIGINAL full GLB: SHA, structural parity and dual roles',
  {skip:!raw},()=>{
  const b=readFileSync(raw);
  assert.equal(b.toString('ascii',0,4),'glTF');
  assert.equal(b.readUInt32LE(8),b.length);
  assert.equal(b.length,S.glbBytes);
  const sha=createHash('sha256').update(b).digest('hex');
  assert.equal(sha,S.glbSha256);
  const len=b.readUInt32LE(12);
  const json=JSON.parse(b.subarray(20,20+len).toString('utf8'));
  for(const role of ['NORMAL','SERVICE']) {
    assert.equal(check(json,role,sha),true,role);
    assert.equal(receipt(json,sha,S.views[role].index,role,'BOTH').publishAllowed,false);
  }
});
