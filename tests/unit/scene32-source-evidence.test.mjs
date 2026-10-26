import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evidenceAnchors, scene32SourceEvidence, auditScene32Evidence } from '../../src/data/scene32SourceScopeEvidence.mjs';

test('scene32 source evidence 142/134/8 is internally complete and fail-closed', () => {
  const records = scene32SourceEvidence();
  const qa = auditScene32Evidence(records);
  assert.deepEqual(qa.errors, []);
  assert.equal(qa.ok, true);
  assert.equal(qa.canApply, false);
  assert.equal(records.filter(r => r.unresolved).length, 8);
  assert.equal(records.filter(r => !r.unresolved).length, 134);
  assert.deepEqual(qa.summary.apartment, { A: 42, D: 60, B: 20, C: 20 });
  assert.equal(qa.summary.storey.UNKNOWN, 8);
  assert.equal(qa.summary.roles.UNCLASSIFIED, 8);
});

test('source hashes pin evidence to R4C and scene32, not future GLBs', () => {
  assert.match(evidenceAnchors.r4cScene28ZipSha256, /^[0-9a-f]{64}$/);
  assert.match(evidenceAnchors.scene32ZipSha256, /^[0-9a-f]{64}$/);
  assert.match(evidenceAnchors.scene32GlbSha256, /^[0-9a-f]{64}$/);
  assert.equal(evidenceAnchors.oldPreserved + evidenceAnchors.oldRetired, evidenceAnchors.oldActive);
  assert.equal(evidenceAnchors.oldPreserved + evidenceAnchors.newOnly, evidenceAnchors.newActive);
});

test('unknown K14 roof/gable nodes never silently become visible', () => {
  for (const node of [2762, 2763, 2764, 2765, 2784, 2785, 2786, 2787]) {
    const records = scene32SourceEvidence().map(r => ({ ...r }));
    const r = records.find(row => row.nodeIndex === node);
    r.storeyScope = '2F'; r.role = 'CONTENT'; r.unresolved = false;
    const result = auditScene32Evidence(records);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(x => x.includes('Fail-closed violation at ' + node)));
  }
});

test('duplicated, missing, invented indices and invented objectKeys fail', () => {
  const source = scene32SourceEvidence();
  const changed = source.map(x => ({ ...x }));
  changed[0].nodeIndex = changed[1].nodeIndex;
  assert.equal(auditScene32Evidence(changed).ok, false);
  assert.equal(auditScene32Evidence(source.slice(1)).ok, false);
  const extra = source.map(x => ({ ...x }));
  extra[0].nodeIndex = 999999;
  assert.equal(auditScene32Evidence(extra).ok, false);
  const guessed = source.map(x => ({ ...x }));
  guessed[0].objectKey = 'node-2762';
  assert.equal(auditScene32Evidence(guessed).ok, false);
});

test('a fake apartment/role classification cannot satisfy overall QA', () => {
  const bad = scene32SourceEvidence().map(x => ({ ...x }));
  bad.find(r => r.nodeIndex === 2766).apartmentScope = 'D';
  assert.equal(auditScene32Evidence(bad).ok, false);
  bad.find(r => r.nodeIndex === 2766).apartmentScope = 'A';
  bad.find(r => r.nodeIndex === 2835).role = 'CONTENT';
  assert.equal(auditScene32Evidence(bad).ok, false);
});
