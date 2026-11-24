import test from 'node:test';
import assert from 'node:assert/strict';
import {
  R31_FIBER_DISPLAY_Y,
  buildR31FiberOverlay,
  buildR31FiberEntryLink,
  setR31SiteNetworkLayerMode,
} from '../../src/scripts/privateModelR31Inspection.mjs';
import { R31_LOCUS_FIBER_LINES, R31_LOCUS_FIBER_SOURCE } from '../../src/scripts/privateModelR31LocusFiber.mjs';
import { r31SiteLayerKeyForNetwork } from '../../src/scripts/privateModelR31SiteLayerKey.mjs';

// In-memory THREE shape contract only. No private GLB, browser or physical route is inferred.
class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
  distanceTo(other) {
    return Math.hypot(this.x - other.x, this.y - other.y, this.z - other.z);
  }
}
class Group {
  constructor() { this.children = []; this.visible = true; this.userData = {}; }
  add(object) { this.children.push(object); object.parent = this; }
  traverse(visitor) {
    visitor(this);
    for (const child of this.children) child.traverse(visitor);
  }
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
class MeshStandardMaterial {
  constructor(options = {}) {
    Object.assign(this, { opacity: 1, transparent: false, depthWrite: true }, options);
    this.disposed = false;
  }
  clone() {
    return new MeshStandardMaterial({
      color: this.color, emissive: this.emissive,
      emissiveIntensity: this.emissiveIntensity, roughness: this.roughness,
      metalness: this.metalness, transparent: this.transparent,
      opacity: this.opacity, depthWrite: this.depthWrite,
    });
  }
  dispose() { this.disposed = true; }
}
class Mesh {
  constructor(geometry, material) {
    Object.assign(this, { geometry, material, isMesh: true, visible: true, userData: {} });
  }
  traverse(visitor) { visitor(this); }
}
const THREE = { Vector3, Group, CurvePath, LineCurve3, TubeGeometry, MeshStandardMaterial, Mesh };

test('real source-bound Locus fibre lines build 22 independent 2D-only presentation meshes', () => {
  assert.equal(R31_LOCUS_FIBER_LINES.length, 22);
  assert.equal(R31_LOCUS_FIBER_SOURCE.zState, 'UNRESOLVED');
  const group = buildR31FiberOverlay(THREE, R31_LOCUS_FIBER_LINES);
  assert.equal(group.children.length, 22);
  assert.equal(group.userData.counts.FIBER, 22);
  assert.equal(group.userData.presentationOnly, true);
  assert.equal(group.userData.displayY, R31_FIBER_DISPLAY_Y);
  for (let i = 0; i < group.children.length; i += 1) {
    const mesh = group.children[i];
    const line = R31_LOCUS_FIBER_LINES[i];
    assert.equal(mesh.name, 'R31_INFRA_' + line.name);
    assert.equal(mesh.userData.sourceRecord, line.record);
    assert.equal(mesh.userData.component, line.component);
    assert.equal(mesh.userData.zState, 'UNRESOLVED');
    assert.equal(mesh.userData.representationKind, '2D_XY_MAP');
    assert.equal(mesh.userData.presentationOnly, true);
    assert.equal(mesh.userData.physicalZClaim, false);
    assert.equal(mesh.userData.currentClaim, false);
    assert.equal(mesh.userData.asBuiltClaim, false);
    assert.ok(mesh.geometry.path.curves.length > 0);
    for (const segment of mesh.geometry.path.curves) {
      assert.equal(segment.v1.y, R31_FIBER_DISPLAY_Y);
      assert.equal(segment.v2.y, R31_FIBER_DISPLAY_Y);
    }
    const [x, y] = line.points[0];
    assert.deepEqual(
      [mesh.geometry.path.curves[0].v1.x, mesh.geometry.path.curves[0].v1.z],
      [x, -y],
    );
  }
});

test('fiberEntry creates one optional WORK_ASSUMPTION drop and shares the existing fiber Layerit key', () => {
  const entry = buildR31FiberEntryLink(THREE, R31_LOCUS_FIBER_LINES);
  assert.equal(entry.children.length, 1);
  assert.equal(entry.userData.counts.FIBER_ENTRY, 1);
  assert.equal(entry.userData.presentationOnly, true);
  const mesh = entry.children[0];
  assert.equal(mesh.name, 'R31_FIBER_ENTRY_DROP_AND_LINK_WORK_ASSUMPTION');
  assert.equal(mesh.userData.system, 'FIBER');
  assert.equal(mesh.userData.presentationOnly, true);
  assert.equal(mesh.userData.workAssumption, true);
  assert.equal(mesh.userData.physicalRouteClaim, false);
  assert.equal(mesh.userData.ModelStage, 'WORK_TEST_VIEW');
  assert.equal(entry.userData.linkedMapLine, mesh.userData.linkedMapLine);
  assert.ok(entry.userData.linkedMapLine);
  assert.equal(mesh.geometry.path.curves.length, 2);
  assert.equal(r31SiteLayerKeyForNetwork('fiber'), 'fiber');
  assert.equal(r31SiteLayerKeyForNetwork('fiberEntry'), 'fiber');
  assert.equal(r31SiteLayerKeyForNetwork('fiberBox'), null);
});

test('visible / ghost / hidden / visible restores original fiber and fiberEntry materials without duplicate clones', () => {
  for (const group of [
    buildR31FiberOverlay(THREE, R31_LOCUS_FIBER_LINES),
    buildR31FiberEntryLink(THREE, R31_LOCUS_FIBER_LINES),
  ]) {
    const originals = new Map();
    const source = group.children.map(mesh => mesh.material);
    setR31SiteNetworkLayerMode(group, 'visible', true, originals);
    assert.equal(group.visible, true);
    setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
    assert.equal(group.visible, true);
    assert.equal(originals.size, group.children.length);
    const ghost = group.children.map(mesh => mesh.material);
    for (let i = 0; i < ghost.length; i += 1) {
      assert.notEqual(ghost[i], source[i]);
      assert.equal(ghost[i].transparent, true);
      assert.equal(ghost[i].depthWrite, false);
      assert.equal(ghost[i].emissiveIntensity, 0);
      assert.ok(ghost[i].opacity <= 0.17);
    }
    setR31SiteNetworkLayerMode(group, 'ghost', true, originals);
    assert.deepEqual(group.children.map(mesh => mesh.material), ghost);
    setR31SiteNetworkLayerMode(group, 'hidden', true, originals);
    assert.equal(group.visible, false);
    assert.equal(originals.size, 0);
    assert.deepEqual(group.children.map(mesh => mesh.material), source);
    for (const material of ghost) assert.equal(material.disposed, true);
    setR31SiteNetworkLayerMode(group, 'visible', true, originals);
    assert.equal(group.visible, true);
    assert.deepEqual(group.children.map(mesh => mesh.material), source);
    setR31SiteNetworkLayerMode(group, 'ghost', false, originals);
    assert.equal(group.visible, false);
    assert.equal(originals.size, 0);
    assert.deepEqual(group.children.map(mesh => mesh.material), source);
  }
});
