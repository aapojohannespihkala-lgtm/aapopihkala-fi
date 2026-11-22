import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { R31_D_SCOPE_SOURCE as S, r31DNodeScopeEvidence as classify } from '../../src/scripts/privateModelR31DScopeProvenance.mjs';

const check = (json, node, mesh, parent = null, sha = S.glbSha256, scene = 769) =>
  classify(json, sha, scene, node, mesh, parent);
const synthetic = () => {
  const scenes = Array.from({ length: S.sceneCount }, () => ({ nodes: [] }));
  const nodes = Array.from({ length: S.nodeCount }, () => ({}));
  const roots = [7361, 13363, 7651, 12437, 7657, 13495];
  const rest = S.rootCount - roots.length;
  for (let i = 0; i < rest; i++) roots.push(i);
  scenes[769] = { name: 'synthetic_R31__scene769', nodes: roots };
  nodes[7361] = { children: [5296], extras: { ylisViewScope: {
    apartmentScope: 'D', storeyScope: '2F', role: 'CONTENT', phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST',
  } } };
  nodes[5296] = { mesh: 1300 };
  nodes[7651] = { mesh: 2236, extras: { apartmentScope: 'D', storeyScope: '1F' } };
  nodes[12437] = { mesh: 4679 };
  nodes[7657] = { mesh: 2239 };
  nodes[13495] = { mesh: 5165 };
  nodes[13363] = { children: [13360] };
  nodes[13360] = { mesh: 5111, extras: { intendedViewerLayer: 'roof' } };
  return { scene: 292, scenes, nodes, meshes: Array(S.meshCount).fill(null) };
};

test('inherited D source display scope never authorizes ownership, links or publication', () => {
  const r = check(synthetic(), 5296, 1300, 7361);
  assert.equal(r.sourceIdentityVerified, true);
  assert.equal(r.scopeStatus, 'D_VIEW_SCOPE_WORK_TEST');
  assert.equal(r.dViewScopeVerified, true);
  assert.equal(r.apartmentOwnershipVerified, false);
  assert.equal(r.sourceLinksBound, false);
  assert.equal(r.publishAllowed, false);
  assert.equal(r.current, false);
  assert.equal(r.asBuilt, false);
});

test('legacy D label, boundary roof and unscoped walls/windows stay separate', () => {
  const j = synthetic();
  assert.equal(check(j, 7651, 2236).scopeStatus, 'LEGACY_D_SCOPE_UNVERIFIED');
  assert.equal(check(j, 13360, 5111, 13363).scopeStatus, 'CROSS_BOUNDARY_ROOF_CONTEXT');
  for (const [n, m] of [[12437, 4679], [7657, 2239], [13495, 5165]]) {
    assert.equal(check(j, n, m).scopeStatus, 'SOURCE_SCOPE_UNRESOLVED');
    assert.equal(check(j, n, m).dViewScopeVerified, false);
  }
});

test('SHA, scene, mesh and parent mismatches reject source evidence', () => {
  const j = synthetic();
  for (const r of [
    check(j, 5296, 1300, 7361, '0'.repeat(64)),
    check(j, 5296, 1300, 7361, S.glbSha256, 770),
    check(j, 5296, 1301, 7361),
    check(j, 5296, 1300, null),
    check(j, 13360, 5111, null),
  ]) {
    assert.equal(r.sourceIdentityVerified, false);
    assert.equal(r.scopeStatus, 'IDENTITY_MISMATCH');
    assert.equal(r.dViewScopeVerified, false);
  }
});

test('names, geometry and unsupported phase never promote source role', () => {
  const j = synthetic();
  j.nodes[12437].name = 'D_APARTMENT_WALL';
  j.nodes[12437].extras = { apartmentScope: 'C', bboxOverlapsD: true };
  assert.equal(check(j, 12437, 4679).scopeStatus, 'SOURCE_SCOPE_UNRESOLVED');
  j.nodes[7361].extras.ylisViewScope.phaseScope = 'HISTORICAL';
  assert.equal(check(j, 5296, 1300, 7361).scopeStatus, 'SOURCE_SCOPE_UNRESOLVED');
  j.nodes[7361].extras.ylisViewScope.phaseScope = 'ACTIVE_IN_SELECTED_WORKTEST';
  j.scenes[769].nodes.push(7361);
  assert.equal(check(j, 5296, 1300, 7361).sourceIdentityVerified, false);
});


test('unrelated ambiguous glTF parent does not erase valid D evidence', () => {
  // The authentic R31 scene contains n12477 as both a root and child n12489.
  const j = synthetic();
  j.scenes[769].nodes.splice(-2, 2, 12477, 12489);
  j.nodes[12489] = { children: [12477] };
  j.nodes[12477] = { mesh: 22 };
  assert.equal(check(j, 5296, 1300, 7361).dViewScopeVerified, true);
  assert.equal(check(j, 12477, 22, null).sourceIdentityVerified, false);
  assert.equal(check(j, 12477, 22, 12489).sourceIdentityVerified, false);
});

// Optional authenticated RAW source, never uploaded or committed to CI.
const glbPath = process.env.C80_R31_D_SCOPE_GLB_PATH;
test('optional authentic R31 GLB exact SHA, parent and D-scope cases', { skip: !glbPath }, () => {
  const b = readFileSync(glbPath);
  assert.equal(b.toString('ascii', 0, 4), 'glTF');
  assert.equal(b.readUInt32LE(8), b.length);
  assert.equal(b.length, S.glbBytes);
  assert.equal(b.readUInt32LE(16), 0x4e4f534a);
  const sha = createHash('sha256').update(b).digest('hex');
  assert.equal(sha, S.glbSha256);
  const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'));
  for (const [n, mesh, parent, expected] of [
    [5296, 1300, 7361, 'D_VIEW_SCOPE_WORK_TEST'],
    [5308, 1305, 7366, 'D_VIEW_SCOPE_WORK_TEST'],
    [7651, 2236, null, 'LEGACY_D_SCOPE_UNVERIFIED'],
    [7652, 1801, null, 'LEGACY_D_SCOPE_UNVERIFIED'],
    [12437, 4679, null, 'SOURCE_SCOPE_UNRESOLVED'],
    [7657, 2239, null, 'SOURCE_SCOPE_UNRESOLVED'],
    [7658, 2353, null, 'SOURCE_SCOPE_UNRESOLVED'],
    [13495, 5165, null, 'SOURCE_SCOPE_UNRESOLVED'],
    [13360, 5111, 13363, 'CROSS_BOUNDARY_ROOF_CONTEXT'],
  ]) {
    const result = check(json, n, mesh, parent, sha);
    assert.equal(result.sourceIdentityVerified, true, `identity n${n}`);
    assert.equal(result.scopeStatus, expected, `scope n${n}`);
    assert.equal(result.apartmentOwnershipVerified, false);
  }
});
