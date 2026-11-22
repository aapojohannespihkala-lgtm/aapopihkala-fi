import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R31_FIBER_DISPLAY_Y,
  R31_INSPECTION_COLORS,
  buildR31StormOverlay,
  setR31SiteNetworkLayerMode,
} from '../../src/scripts/privateModelR31Inspection.mjs';
import {
  R31_LOCUS_STORM_SOURCE,
  R31_LOCUS_STORM_LINES,
  R31_LOCUS_STORM_FLOW_MARKS,
} from '../../src/scripts/privateModelR31LocusStorm.mjs';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';

// Minimal in-memory THREE contract. This does not authenticate private GLB bytes,
// run WebGL, resolve buried Z or certify a physical house connection.
class Vector3 {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { const n = this.length(); if (n) { this.x /= n; this.y /= n; this.z /= n; } return this; }
  copy(v) { Object.assign(this, { x: v.x, y: v.y, z: v.z }); return this; }
  lerp(v, alpha) {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    this.z += (v.z - this.z) * alpha;
    return this;
  }
}
class Group {
  constructor() { this.children = []; this.visible = true; this.userData = {}; }
  add(o) { this.children.push(o); o.parent = this; }
  traverse(visit) { visit(this); for (const child of this.children) child.traverse(visit); }
}
class CurvePath {
  constructor() { this.curves = []; }
  add(curve) { this.curves.push(curve); }
}
class LineCurve3 {
  constructor(v1, v2) { Object.assign(this, { v1, v2 }); }
}
class TubeGeometry {
  constructor(path, tubularSegments, radius, radialSegments, closed) {
    Object.assign(this, { path, tubularSegments, radius, radialSegments, closed });
  }
}
class ConeGeometry {
  constructor(radius, height, radialSegments) {
    Object.assign(this, { radius, height, radialSegments });
  }
}
class MeshStandardMaterial {
  constructor(properties = {}) {
    Object.assign(this, { opacity: 1, transparent: false, depthWrite: true }, properties);
    this.disposed = false;
  }
  clone() {
    return new MeshStandardMaterial({
      color: this.color, emissive: this.emissive,
      emissiveIntensity: this.emissiveIntensity, roughness: this.roughness,
      metalness: this.metalness, opacity: this.opacity,
      transparent: this.transparent, depthWrite: this.depthWrite,
    });
  }
  dispose() { this.disposed = true; }
}
class Mesh {
  constructor(geometry, material) {
    Object.assign(this, {
      geometry, material, isMesh: true, userData: {},
      position: new Vector3(), matrixAutoUpdate: true,
      quaternion: { setFromUnitVectors: () => {} },
    });
  }
  updateMatrix() { this.matrixUpdated = true; }
  traverse(visit) { visit(this); }
}
const THREE = { Vector3, Group, CurvePath, LineCurve3, TubeGeometry, ConeGeometry, MeshStandardMaterial, Mesh };

test('actual Locus storm builder preserves five Shape rows, eleven XML IDs and five flow marks as 2D WORK_TEST', () => {
  assert.equal(R31_LOCUS_STORM_SOURCE.zState, 'UNRESOLVED');
  assert.equal(R31_LOCUS_STORM_SOURCE.plotConnection, 'NONE_IN_SOURCE');
  assert.equal(R31_LOCUS_STORM_SOURCE.xmlCounterpart, 'IDS_PRESENT_GEOMETRY_NOT_RECHECKED');
  assert.equal(R31_LOCUS_STORM_LINES.length, 5);
  assert.equal(R31_LOCUS_STORM_FLOW_MARKS.length, 5);
  assert.equal(R31_LOCUS_STORM_LINES.reduce((n, row) => n + row.xmlIds.length, 0), 11);

  const group = buildR31StormOverlay(THREE, R31_LOCUS_STORM_LINES, R31_LOCUS_STORM_FLOW_MARKS);
  assert.deepEqual(group.userData.counts, { STORM: 5, STORM_FLOW: 5 });
  assert.equal(group.children.length, 10);
  assert.equal(group.userData.presentationOnly, true);
  assert.equal(group.userData.displayY, R31_FIBER_DISPLAY_Y);
  assert.equal(r31SiteLayerKeyForNetwork('storm'), 'storm');
  assert.equal(r31SiteLayerKeyForNetwork('stormHouseConnection'), null);

  for (let i = 0; i < 5; i += 1) {
    const row = R31_LOCUS_STORM_LINES[i];
    const mesh = group.children[i];
    assert.equal(mesh.name, 'R31_INFRA_' + row.name);
    assert.equal(mesh.userData.sourceRecord, row.record);
    assert.deepEqual(mesh.userData.xmlIds, row.xmlIds);
    assert.equal(mesh.userData.topology, row.topology);
    assert.equal(mesh.userData.parcelDistM, row.parcelDistM);
    assert.ok(row.parcelDistM >= 42);
    assert.equal(mesh.material.color, R31_INSPECTION_COLORS.STORM_MUNICIPAL);
    assert.notEqual(mesh.material.color, R31_INSPECTION_COLORS.storm);
    assert.ok(mesh.geometry.path.curves.length);
    for (const segment of mesh.geometry.path.curves) {
      assert.equal(segment.v1.y, R31_FIBER_DISPLAY_Y);
      assert.equal(segment.v2.y, R31_FIBER_DISPLAY_Y);
    }
    const [x, y] = row.points[0];
    const first = mesh.geometry.path.curves[0].v1;
    assert.deepEqual([first.x, first.z], [x, -y]);
    assert.equal(mesh.userData.system, 'STORM_MUNICIPAL');
    assert.equal(mesh.userData.ModelStage, 'WORK_TEST_VIEW');
    assert.equal(mesh.userData.representationKind, '2D_XY_MAP');
    assert.equal(mesh.userData.zState, 'UNRESOLVED');
    assert.equal(mesh.userData.presentationOnly, true);
    assert.equal(mesh.userData.physicalZClaim, false);
    assert.equal(mesh.userData.plotConnectionClaim, false);
    assert.equal(mesh.userData.currentClaim, false);
    assert.equal(mesh.userData.asBuiltClaim, false);
  }
  for (let i = 0; i < 5; i += 1) {
    const mark = R31_LOCUS_STORM_FLOW_MARKS[i];
    const arrow = group.children[5 + i];
    assert.equal(arrow.name, 'R31_INFRA_' + mark.name);
    assert.equal(arrow.userData.sourceRecord, mark.record);
    assert.equal(arrow.userData.flowMark, true);
    assert.equal(arrow.userData.physicalZClaim, false);
    assert.equal(arrow.userData.plotConnectionClaim, false);
    assert.equal(arrow.position.y, R31_FIBER_DISPLAY_Y);
    assert.equal(arrow.matrixAutoUpdate, false);
    assert.equal(arrow.matrixUpdated, true);
    const [a, b] = mark.points;
    assert.ok(Math.abs(arrow.position.x - (a[0] + b[0]) / 2) < 1e-9);
    assert.ok(Math.abs(arrow.position.z + (a[1] + b[1]) / 2) < 1e-9);
  }
});

test('source topology keeps 34/36/37 common and 48 unconnected; never synthesize a parcel spur', () => {
  const byRecord = new Map(R31_LOCUS_STORM_LINES.map(row => [row.record, row]));
  const common = byRecord.get(34).points.at(-1);
  assert.deepEqual(byRecord.get(36).points.at(-1), common);
  assert.deepEqual(byRecord.get(37).points.at(-1), common);
  assert.equal(byRecord.get(48).topology, 'ENDS_0.29M_FROM_34_NO_SHARED_VERTEX');
  assert.ok(!byRecord.get(48).points.some(p =>
    byRecord.get(34).points.some(q => p[0] === q[0] && p[1] === q[1])));
  const group = buildR31StormOverlay(THREE, R31_LOCUS_STORM_LINES, R31_LOCUS_STORM_FLOW_MARKS);
  assert.equal(group.children.length, 10);
  assert.ok(group.children.every(mesh => mesh.userData.plotConnectionClaim === false));
});

test('storm Layerit visible / ghost / hidden / visible recovers exact source materials and disposes presentation clones', () => {
  const group = buildR31StormOverlay(THREE, R31_LOCUS_STORM_LINES, R31_LOCUS_STORM_FLOW_MARKS);
  const originals = new Map();
  const source = group.children.map(mesh => mesh.material);
  assert.ok(source.every(m => m === source[0]), 'builder shares one immutable source material');
  setR31SiteNetworkLayerMode(group, 'visible', true, originals);
  assert.equal(group.visible, true);
  assert.equal(originals.size, 0);
  setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
  assert.equal(group.visible, true);
  assert.equal(originals.size, 10);
  const ghosts = group.children.map(mesh => mesh.material);
  for (let i = 0; i < ghosts.length; i += 1) {
    assert.notEqual(ghosts[i], source[i]);
    assert.equal(ghosts[i].transparent, true);
    assert.equal(ghosts[i].depthWrite, false);
    assert.equal(ghosts[i].emissiveIntensity, 0);
    assert.ok(ghosts[i].opacity <= 0.17);
  }
  setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
  assert.deepEqual(group.children.map(mesh => mesh.material), ghosts, 'repeated ghost does not allocate again');
  setR31SiteNetworkLayerMode(group, 'hidden', true, originals);
  assert.equal(group.visible, false);
  assert.equal(originals.size, 0);
  assert.deepEqual(group.children.map(mesh => mesh.material), source);
  assert.ok(ghosts.every(material => material.disposed));
  setR31SiteNetworkLayerMode(group, 'visible', true, originals);
  assert.equal(group.visible, true);
  assert.deepEqual(group.children.map(mesh => mesh.material), source);
  setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
  setR31SiteNetworkLayerMode(group, 'ghost', false, originals);
  assert.equal(group.visible, false, 'unavailable source fails closed');
  assert.equal(originals.size, 0);
  assert.deepEqual(group.children.map(mesh => mesh.material), source);
  assert.equal(source[0].disposed, false, 'never dispose original material');
});
