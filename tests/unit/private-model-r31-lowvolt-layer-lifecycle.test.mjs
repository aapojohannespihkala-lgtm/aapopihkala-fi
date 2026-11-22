import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildR31LowVoltageOverlay, R31_LOWVOLT_DISPLAY_Y, R31_FIBER_DISPLAY_Y,
  R31_INSPECTION_COLORS, setR31SiteNetworkLayerMode,
} from '../../src/scripts/privateModelR31Inspection.mjs';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';
import {
  R31_LOCUS_LOWVOLT_LINES, R31_LOCUS_LOWVOLT_SOURCE,
} from '../../src/scripts/privateModelR31LocusLowVoltage.mjs';

test('R31 Locus low-voltage remains its own source-bound 2D, NONCURRENT Layerit group', () => {
  assert.equal(r31SiteLayerKeyForNetwork('lowvolt'), 'lowvolt');
  assert.equal(r31SiteLayerKeyForNetwork('fiberEntry'), 'fiber');
  assert.equal(r31SiteLayerKeyForNetwork('inventedCablePenetration'), null);
  assert.equal(R31_LOCUS_LOWVOLT_LINES.length, 32);
  assert.equal(R31_LOCUS_LOWVOLT_LINES.reduce((sum, line) => sum + line.points.length - 1, 0), 410);
  assert.equal(R31_LOWVOLT_DISPLAY_Y - R31_FIBER_DISPLAY_Y, 0.15);

  const group = buildR31LowVoltageOverlay(THREE, R31_LOCUS_LOWVOLT_LINES, R31_LOCUS_LOWVOLT_SOURCE);
  assert.deepEqual(group.userData.counts, { LOWVOLT: 32, LOWVOLT_SEGMENTS: 410 });
  assert.equal(group.userData.presentationOnly, true);
  assert.equal(group.userData.displayY, R31_LOWVOLT_DISPLAY_Y);
  assert.equal(group.children.length, 32);
  for (let i = 0; i < group.children.length; i += 1) {
    const mesh = group.children[i];
    const record = R31_LOCUS_LOWVOLT_LINES[i];
    assert.equal(mesh.userData.system, 'LOWVOLT');
    assert.equal(mesh.userData.sourceRecord, record.record);
    assert.equal(mesh.userData.g3Id, record.g3Id);
    assert.equal(mesh.userData.shapeDriveId, R31_LOCUS_LOWVOLT_SOURCE.shapeDriveId);
    assert.equal(mesh.userData.g2bDriveId, R31_LOCUS_LOWVOLT_SOURCE.g2bDriveId);
    assert.equal(mesh.userData.zState, 'UNRESOLVED');
    assert.equal(mesh.userData.currency, 'NONCURRENT');
    assert.equal(mesh.userData.representationKind, '2D_XY_MAP');
    assert.equal(mesh.userData.ModelStage, 'WORK_TEST_PRESENTATION');
    for (const key of [
      'physicalZClaim', 'plotConnectionClaim', 'buildingPenetrationClaim',
      'sameCableClaim', 'cableDiameterClaim', 'currentClaim', 'asBuiltClaim',
    ]) assert.equal(mesh.userData[key], false, key);
    assert.equal(mesh.material.color.getHex(), R31_INSPECTION_COLORS.LOWVOLT);
  }
});

test('R31 low-voltage Layerit visible / ghost / hidden restores exact materials and source metadata', () => {
  const group = buildR31LowVoltageOverlay(
    THREE, R31_LOCUS_LOWVOLT_LINES.slice(0, 2), R31_LOCUS_LOWVOLT_SOURCE,
  );
  assert.equal(group.children.length, 2);
  const [first, second] = group.children;
  const original = first.material;
  const originalMetadata = first.userData;
  assert.strictEqual(second.material, original, 'source material initially shared');
  const cache = new Map();

  setR31SiteNetworkLayerMode(group, 'visible', true, cache);
  assert.equal(group.visible, true);
  assert.strictEqual(first.material, original);
  assert.equal(cache.size, 0);

  setR31SiteNetworkLayerMode(group, 'ghost', true, cache);
  assert.equal(group.visible, true);
  assert.equal(cache.size, 2);
  const ghost = first.material;
  assert.notStrictEqual(ghost, original);
  assert.equal(ghost.transparent, true);
  assert.ok(ghost.opacity <= 0.17);
  assert.equal(ghost.depthWrite, false);
  assert.equal(ghost.emissiveIntensity, 0);
  assert.strictEqual(first.userData, originalMetadata);
  assert.equal(original.transparent, false);
  setR31SiteNetworkLayerMode(group, 'ghost', true, cache);
  assert.strictEqual(first.material, ghost, 'second ghost pass must not allocate another clone');
  assert.equal(cache.size, 2);

  setR31SiteNetworkLayerMode(group, 'hidden', true, cache);
  assert.equal(group.visible, false);
  assert.strictEqual(first.material, original);
  assert.strictEqual(second.material, original);
  assert.equal(cache.size, 0);

  setR31SiteNetworkLayerMode(group, 'visible', true, cache);
  assert.equal(group.visible, true);
  assert.strictEqual(first.material, original);
  setR31SiteNetworkLayerMode(group, 'ghost', true, cache);
  assert.notStrictEqual(first.material, original);
  setR31SiteNetworkLayerMode(group, 'visible', false, cache);
  assert.equal(group.visible, false, 'unaccepted source must fail closed');
  assert.strictEqual(first.material, original);
  assert.equal(cache.size, 0);
  setR31SiteNetworkLayerMode(group, 'invalid-mode', true, cache);
  assert.equal(group.visible, false);
  assert.strictEqual(first.userData, originalMetadata);
  assert.equal(first.userData.physicalZClaim, false);
});
