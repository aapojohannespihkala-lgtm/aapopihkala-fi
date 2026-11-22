import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  R31_DRAINAGE_SOURCE, r31DrainageKind, buildR31DrainageOverlay, buildR31InfraOverlay,
  dimR31ModelForInspection, isR31SiteSewerName,
} from '../../src/scripts/privateModelR31Inspection.mjs';
import {
  C80_R31_TECHNICAL_REVIEW_ADDITIONS, c80R31TechnicalReviewNodeSet,
} from '../../src/scripts/privateModelC80R31TechnicalReview.mjs';
import { C80_620R22_REVIEW_MEP_NODES } from '../../src/scripts/privateModelC80620R22FloorRuntime.mjs';

test('drain kinds come only from source representationKind', () => {
  assert.equal(r31DrainageKind({ representationKind: 'wellMarkerWork' }), 'well');
  assert.equal(r31DrainageKind({ representationKind: 'referenceRouteWork' }), 'route');
  assert.equal(r31DrainageKind({ representationKind: 'unresolvedBoundaryMarker' }), 'open');
  assert.equal(r31DrainageKind({ name: 'SOK2' }), null);
});

const drainSource = (sceneName = R31_DRAINAGE_SOURCE.sceneName, pass = R31_DRAINAGE_SOURCE.pass) => {
  const scenes = Array.from({ length: 60 }, () => new THREE.Group());
  const scene = scenes[59];
  scene.userData = { Pass: pass };
  const well = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.01, 0.4), new THREE.MeshBasicMaterial());
  well.userData = { representationKind: 'wellMarkerWork' };
  well.position.set(26, -1, 0.7);
  const route = new THREE.Group();
  route.userData = { representationKind: 'referenceRouteWork' };
  // Source routes are line strips.
  route.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -1, 0), new THREE.Vector3(5, -1, 0), new THREE.Vector3(5, -1.2, -3)]), new THREE.LineBasicMaterial()));
  const open = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.3), new THREE.MeshBasicMaterial());
  open.userData = { representationKind: 'unresolvedBoundaryMarker' };
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  scene.add(well, route, open, wall);
  const json = { scenes: scenes.map((_, i) => ({ name: i === 59 ? sceneName : `s${i}` })) };
  return { scenes, parser: { json } };
};

test('drainage overlay keeps source placement, counts kinds and fails closed on identity', () => {
  const overlay = buildR31DrainageOverlay(THREE, drainSource());
  assert.deepEqual(overlay.userData.counts, { well: 1, route: 1, open: 1 });
  const well = overlay.children.find((c) => c.userData.r31InspectionKind === 'well');
  const p = new THREE.Vector3().setFromMatrixPosition(well.matrix);
  assert.ok(Math.abs(p.x - 26) < 1e-6 && Math.abs(p.y + 1) < 1e-6 && Math.abs(p.z - 0.7) < 1e-6);
  const route = overlay.children.find((c) => c.userData.r31InspectionKind === 'route');
  route.geometry.computeBoundingBox();
  assert.ok(route.geometry.boundingBox.max.x > 4.9 && route.geometry.boundingBox.min.z < -2.9, 'tube follows the source strip');
  assert.equal(buildR31DrainageOverlay(THREE, drainSource('other')), null);
  assert.equal(buildR31DrainageOverlay(THREE, drainSource(undefined, 'M5A-R2')), null);
});

test('infra overlay maps G1 XY + work elevation into the Y-up frame and marks parcels uncertain', () => {
  const routes = [
    { name: 'P139AD_LOCUS_WATER_MAIN_WORK_Z', system: 'WATER', points: [[10, 20, 18], [12, 20, 18]] },
    { name: 'P139AD_LOCUS_WASTEWATER_PARCEL_WORK_Z', system: 'WASTEWATER', points: [[0, 0, 18.15], [5, 0, 17.9]] },
    { name: 'BAD', system: 'STORM', points: [[0, 0, 0], [1, 1, 1]] },
  ];
  const overlay = buildR31InfraOverlay(THREE, routes, 21.75);
  assert.deepEqual(overlay.userData.counts, { WATER: 1, WASTEWATER: 1 });
  const water = overlay.children[0];
  water.geometry.computeBoundingBox();
  const box = water.geometry.boundingBox;
  assert.ok(Math.abs((box.min.y + box.max.y) / 2 - (18 - 21.75)) < 1e-6);
  assert.ok(Math.abs((box.min.z + box.max.z) / 2 + 20) < 1e-6, 'G1 +Y maps to -Z');
  assert.equal(overlay.children[1].userData.uncertain, true);
  assert.equal(overlay.children[0].userData.uncertain, false);
});

test('dimming greys every mesh, keeps chosen objects and restores exactly', () => {
  const root = new THREE.Group();
  const a = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  const b = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  b.name = 'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150_WORK_TEST';
  const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial());
  root.add(a, b, line);
  const ma = a.material, mb = b.material;
  const keepMaterial = new THREE.MeshBasicMaterial();
  const dim = dimR31ModelForInspection(THREE, root, { keep: (o) => isR31SiteSewerName(o.name), keepMaterial });
  assert.equal(dim.kept, 1);
  assert.equal(b.material, keepMaterial);
  assert.ok(a.material.transparent && a.material.opacity < 0.1);
  assert.equal(line.visible, false);
  dim.restore();
  assert.equal(a.material, ma);
  assert.equal(b.material, mb);
  assert.equal(line.visible, true);
});

test('R31 technical review keeps R22 roots, named R31 additions and source-tagged systems only', () => {
  const nodes = Array.from({ length: 13507 }, (_, i) => ({ name: `N${i}` }));
  for (const { node, name } of C80_R31_TECHNICAL_REVIEW_ADDITIONS) nodes[node] = { name };
  nodes[100] = { name: 'PIPE', extras: { m5System: 'VESI' } };
  nodes[101] = { name: 'WALL', extras: { m5System: 'RAKENNUSOSA' } };
  nodes[102] = { name: 'ZONE', extras: { m5System: 'VIEMARI', presentationOnly: true } };
  const keep = c80R31TechnicalReviewNodeSet({ nodes });
  for (const n of C80_620R22_REVIEW_MEP_NODES) assert.ok(keep.has(n));
  for (const { node } of C80_R31_TECHNICAL_REVIEW_ADDITIONS) assert.ok(keep.has(node));
  assert.ok(keep.has(100));
  assert.ok(!keep.has(101));
  assert.ok(!keep.has(102));
  // A renamed addition is not the same source: fail closed.
  nodes[13488] = { name: 'SOMETHING_ELSE' };
  assert.equal(c80R31TechnicalReviewNodeSet({ nodes }).size, 0);
});

test('exterior donors keep only their own source parts and check the scene name', async () => {
  const { buildR31ExteriorDonorOverlay, R31_EXTERIOR_DONORS } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const scene = new THREE.Group();
  const gutter = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  gutter.name = 'T12_RAYSTASKOURU_1985_ROOF_CD_ETELA_WORK_TEST';
  const pipe = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  pipe.name = 'T12_2026_CD_LANSI_ETELA_DOWNPIPE_VERTICAL_PIPE_WORK_TEST';
  const host = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  host.name = 'P134B_ARCH_BASE_CLONE__WALL';
  scene.add(gutter, pipe, host);
  const gltf = (name) => ({ scenes: [scene], parser: { json: { scenes: [{ name }] } } });
  const overlay = buildR31ExteriorDonorOverlay(THREE, 'rainwater', gltf(R31_EXTERIOR_DONORS.rainwater.sceneName));
  assert.deepEqual(overlay.children.map((c) => c.name).sort(), [pipe.name, gutter.name].sort());
  assert.equal(buildR31ExteriorDonorOverlay(THREE, 'rainwater', gltf('other')), null);
});

test('owner-corrected zones win: downpipes move to the nearest zone, collar stays on the gutter', async () => {
  const { relocateR31Downpipes } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const group = new THREE.Group();
  const part = (name, x, y, z, h) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h), new THREE.MeshBasicMaterial());
    m.name = name; m.matrixAutoUpdate = false; m.matrix.makeTranslation(x, y, z); group.add(m); return m;
  };
  const pipe = part('T12_2026_CD_LANSI_ETELA_DOWNPIPE_VERTICAL_PIPE_WORK_TEST', -0.5, 3, 2.45, 5);
  const collar = part('T12_2026_CD_LANSI_ETELA_DOWNPIPE_INLET_COLLAR_WORK_TEST', -0.5, 5.75, 2.45, 0.1);
  const moves = relocateR31Downpipes(THREE, group, [{ x: -0.14, z: 1.56, name: 'SW' }, { x: 25.5, z: -10.6, name: 'NE' }]);
  assert.equal(moves[0].zone, 'SW');
  const p = new THREE.Vector3().setFromMatrixPosition(pipe.matrix);
  assert.ok(Math.abs(p.x + 0.14) < 1e-6 && Math.abs(p.z - 1.56) < 1e-6);
  const c = new THREE.Vector3().setFromMatrixPosition(collar.matrix);
  assert.ok(Math.abs(c.x + 0.14) < 1e-6 && Math.abs(c.z - 2.45) < 1e-6, 'collar only along the gutter');
  assert.ok(group.children.some((m) => /CONNECTOR_TO_OWNER_ZONE/.test(m.name)));
});
