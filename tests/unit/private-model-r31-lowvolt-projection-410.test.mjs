import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildR31LowVoltageOverlay, R31_LOWVOLT_DISPLAY_Y } from '../../src/scripts/privateModelR31Inspection.mjs';
import { R31_LOCUS_LOWVOLT_LINES, R31_LOCUS_LOWVOLT_SOURCE } from '../../src/scripts/privateModelR31LocusLowVoltage.mjs';

// Source XY is a 2D WORK_TEST map, NOT a physical Z or an electrical connection.
// Check every projected segment, not only record counts or the first point.
test('R31 Locus low-voltage projects all 410 source segments without an extra mirror', () => {
  const before = JSON.stringify(R31_LOCUS_LOWVOLT_LINES);
  assert.equal(R31_LOCUS_LOWVOLT_SOURCE.mirrorCheck, 'T3_RELEASED_DET_PLUS1_NO_EXTRA_MIRROR');
  assert.equal(R31_LOCUS_LOWVOLT_LINES.length, 32);

  const group = buildR31LowVoltageOverlay(THREE, R31_LOCUS_LOWVOLT_LINES, R31_LOCUS_LOWVOLT_SOURCE);
  assert.equal(group.children.length, R31_LOCUS_LOWVOLT_LINES.length);
  assert.equal(group.userData.displayY, R31_LOWVOLT_DISPLAY_Y);
  let checked = 0;

  R31_LOCUS_LOWVOLT_LINES.forEach((line, lineIndex) => {
    const mesh = group.children[lineIndex];
    const path = mesh.geometry.parameters.path;
    const curves = path.curves;
    assert.equal(mesh.userData.sourceRecord, line.record);
    assert.equal(mesh.userData.g3Id, line.g3Id);
    assert.equal(mesh.userData.representationKind, '2D_XY_MAP');
    assert.equal(mesh.userData.zState, 'UNRESOLVED');
    assert.equal(mesh.userData.currency, 'NONCURRENT');
    assert.equal(mesh.userData.physicalZClaim, false);
    assert.equal(mesh.userData.buildingPenetrationClaim, false);
    assert.equal(mesh.userData.asBuiltClaim, false);
    assert.equal(curves.length, line.points.length - 1, 'unexpected dropped or added source segment at record ' + line.record);
    assert.equal(mesh.geometry.parameters.tubularSegments, Math.max(8, curves.length * 4));

    for (let segment = 0; segment < curves.length; segment += 1) {
      const [ax, ay] = line.points[segment];
      const [bx, by] = line.points[segment + 1];
      const distance = Math.hypot(bx - ax, by - ay);
      assert.ok(Number.isFinite(distance) && distance > 1e-4, 'source degenerate/invalid at ' + line.record + ':' + segment);
      assert.deepEqual(
        [curves[segment].v1.x, curves[segment].v1.y, curves[segment].v1.z],
        [ax, R31_LOWVOLT_DISPLAY_Y, -ay],
        'source start projection changed at ' + line.record + ':' + segment,
      );
      assert.deepEqual(
        [curves[segment].v2.x, curves[segment].v2.y, curves[segment].v2.z],
        [bx, R31_LOWVOLT_DISPLAY_Y, -by],
        'source end projection changed at ' + line.record + ':' + segment,
      );
      checked += 1;
    }
  });

  assert.equal(checked, 410);
  assert.equal(group.userData.counts.LOWVOLT_SEGMENTS, checked);
  assert.equal(JSON.stringify(R31_LOCUS_LOWVOLT_LINES), before, 'builder mutated original Shape lines');
});
