import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  R31_DRAINAGE_SOURCE, r31DrainageKind, buildR31DrainageOverlay, buildR31InfraOverlay,
  dimR31ModelForInspection, isR31SiteSewerName, syncR31ExteriorDonorMaterials,
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

test('owner 20.12: corner pipes alike on the gable faces, 125 mm in, low outward outlet', async () => {
  const { relocateR31Downpipes, R31_DOWNPIPE_TARGETS: T, R31_CORNER_PIPE_INSET_M } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const group = new THREE.Group();
  const part = (name, x, y, z, h) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, h), new THREE.MeshBasicMaterial());
    m.name = name; m.matrixAutoUpdate = false; m.matrix.makeTranslation(x, y, z); group.add(m); return m;
  };
  const west = part('T12_2026_CD_LANSI_ETELA_DOWNPIPE_VERTICAL_PIPE_WORK_TEST', -0.5, 3, 2.45, 5);
  part('T12_2026_CD_LANSI_ETELA_DOWNPIPE_INLET_COLLAR_WORK_TEST', -0.5, 5.75, 2.45, 0.1);
  part('T12_2026_CD_LANSI_ETELA_DOWNPIPE_TERMINAL_BEND_WORK_TEST', -0.5, 0.45, 2.55, 0.3);
  part('T12_2026_AB_ITA_POHJOINEN_DOWNPIPE_VERTICAL_PIPE_WORK_TEST', 25.85, 2.2, -11.55, 5);
  part('T12_2026_AB_ITA_POHJOINEN_DOWNPIPE_INLET_COLLAR_WORK_TEST', 25.85, 4.75, -11.55, 0.1);
  part('T12_2026_AB_ITA_POHJOINEN_DOWNPIPE_TERMINAL_BEND_WORK_TEST', 25.85, -0.55, -11.65, 0.3);
  const moves = relocateR31Downpipes(THREE, group);
  assert.equal(moves.length, 2);
  assert.equal(west.visible, false);
  const routeOf = (id) => group.children.find((m) => m.name === `${id}_DOWNPIPE_SWAN_NECK_ROUTE_WORK_ASSUMPTION`);
  const w = routeOf('T12_2026_CD_LANSI_ETELA'); w.geometry.computeBoundingBox();
  assert.ok(w.geometry.boundingBox.min.x < T.T12_2026_CD_LANSI_ETELA.x - 0.2, 'west outlet points west');
  assert.ok(w.geometry.boundingBox.min.y < -0.2, 'west pipe runs down to the old lower-pipe bottom');
  const e = routeOf('T12_2026_AB_ITA_POHJOINEN'); e.geometry.computeBoundingBox();
  assert.ok(e.geometry.boundingBox.max.x > T.T12_2026_AB_ITA_POHJOINEN.x + 0.2, 'east outlet points east');
  assert.ok(Math.abs(T.T12_2026_AB_ITA_POHJOINEN.z - (-10.685)) < 1e-9, 'owner point Y 10.683');
  // Same inset at every corner.
  assert.ok(Math.abs((1.72 - T.T12_2026_CD_LANSI_ETELA.z) - R31_CORNER_PIPE_INSET_M) < 1e-9);
  assert.ok(Math.abs((T.T12_2026_CD_LANSI_POHJOINEN.z + 10.81) - R31_CORNER_PIPE_INSET_M) < 1e-9);
  for (const t of Object.values(T)) assert.equal(t.stopY, undefined);
});

test('west gable infill closes the opening above the south pier up to the roof underside', async () => {
  const { buildR31WestGableInfill, r31RoofUndersideY, isR31ReplacedWestDownpipe } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const mesh = buildR31WestGableInfill(THREE, new THREE.MeshBasicMaterial());
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix);
  assert.ok(Math.abs(box.min.z) < 1e-6 && Math.abs(box.max.z - 1.72) < 1e-6);
  assert.ok(Math.abs(box.min.x + 0.02) < 1e-6 && Math.abs(box.max.x - 0.22) < 1e-6);
  assert.ok(Math.abs(box.max.y - r31RoofUndersideY(0)) < 1e-6 && Math.abs(box.min.y - 5.30) < 1e-6);
  assert.ok(isR31ReplacedWestDownpipe('C80R2_D1F_TERRACE_WEST_BRICK_CORNER_DARK_DOWNSPOUT_LOWER_ELBOW_MINUS220_TOP_BRACKET'));
  assert.ok(!isR31ReplacedWestDownpipe('WPA_K01_D_GABLE_SW_BLUE_DOWNSPOUT_PRESENCE_ZONE'));
});

test('east gable loads on demand with the JSON world matrix when the scene is not built', async () => {
  const { loadR31EastGableOverlay, R31_EAST_GABLE_SOURCE } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const nodes = Array.from({ length: 4671 }, () => ({}));
  nodes[0] = { rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2], children: [3665] };
  nodes[3665] = { name: 'K14_A_GABLE_EXTERIOR_FACE_WORK_TEST', mesh: 0, translation: [-0.22, 0, 0] };
  const scenes = Array.from({ length: 24 }, () => ({ nodes: [] }));
  scenes[R31_EAST_GABLE_SOURCE.sceneIndex] = { nodes: [0] };
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  const gltf = { scenes: [], parser: { json: { nodes, scenes }, associations: new Map(),
    getDependency: async (type, i) => (type === 'mesh' && i === 0 ? mesh : null) } };
  const group = await loadR31EastGableOverlay(THREE, gltf);
  assert.equal(group.children.length, 1);
  const p = new THREE.Vector3().setFromMatrixPosition(group.children[0].matrix);
  // Source x -0.22 plus the 8 mm presentation lift off the coplanar mass face.
  assert.ok(Math.abs(p.x - (-0.22 + 0.008)) < 1e-9);
});

test('Locus fibre map: 22 source lines on one display level, Z unresolved', async () => {
  const { buildR31FiberOverlay, R31_FIBER_DISPLAY_Y } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const { R31_LOCUS_FIBER_LINES } = await import('../../src/scripts/privateModelR31LocusFiber.mjs');
  const group = buildR31FiberOverlay(THREE, R31_LOCUS_FIBER_LINES);
  assert.equal(group.userData.counts.FIBER, 22);
  const m = group.children.find((c) => c.name === 'R31_INFRA_FIBER_SHAPE_LINE_085_C2');
  m.geometry.computeBoundingBox();
  const b = m.geometry.boundingBox;
  assert.ok(Math.abs((b.min.y + b.max.y) / 2 - R31_FIBER_DISPLAY_Y) < 0.01);
  // Source end at the house map reference: G1 (8.625, 3.442) -> three (8.625, y, -3.442).
  assert.ok(b.min.x < 8.7 && b.max.z > -3.5);
  assert.equal(m.userData.physicalZClaim, false);
});

test('Talotekniikka recolours donors loaded after ON and restores all exact materials after OFF', () => {
  const gutterOriginal = new THREE.MeshBasicMaterial({ color: 0x135790 });
  const carportOriginal = new THREE.MeshBasicMaterial({ color: 0x246802 });
  const latePipeOriginal = new THREE.MeshBasicMaterial({ color: 0xabcdef });
  const stormwater = new THREE.MeshBasicMaterial({ color: 0x26c6da });
  const grey = new THREE.MeshBasicMaterial({ color: 0x9aa1a9 });
  const donors = {};
  const styles = { rainwater: stormwater, grey };
  let saved = syncR31ExteriorDonorMaterials(donors, null, true, styles);
  assert.equal(saved.size, 0, 'switching on before any donor exists makes an empty cache');

  const gutter = new THREE.Mesh(new THREE.BoxGeometry(), gutterOriginal);
  const carport = new THREE.Mesh(new THREE.BoxGeometry(), carportOriginal);
  const rainwater = new THREE.Group(); rainwater.add(gutter);
  const carportGroup = new THREE.Group(); carportGroup.add(carport);
  donors.rainwater = rainwater;
  donors.carport = carportGroup;
  saved = syncR31ExteriorDonorMaterials(donors, saved, true, styles);
  assert.equal(gutter.material, stormwater, 'late gutter gets stormwater colour');
  assert.equal(carport.material, grey, 'late carport gets grey');
  assert.equal(saved.size, 2);

  const latePipe = new THREE.Mesh(new THREE.BoxGeometry(), latePipeOriginal);
  rainwater.add(latePipe);
  saved = syncR31ExteriorDonorMaterials(donors, saved, true, styles);
  assert.equal(latePipe.material, stormwater, 'new child of an already-coloured donor is covered');
  assert.equal(saved.size, 3);
  saved = syncR31ExteriorDonorMaterials(donors, saved, true, styles);
  assert.equal(saved.size, 3, 'repeated ON does not replace stored originals');

  saved = syncR31ExteriorDonorMaterials(donors, saved, false, styles);
  assert.equal(saved, null);
  assert.equal(gutter.material, gutterOriginal);
  assert.equal(carport.material, carportOriginal);
  assert.equal(latePipe.material, latePipeOriginal);
  assert.equal(syncR31ExteriorDonorMaterials(donors, saved, false, styles), null);
  const nextCycle = syncR31ExteriorDonorMaterials(donors, saved, true, styles);
  assert.equal(nextCycle.size, 3, 'subsequent ON recaptures restored originals');
  syncR31ExteriorDonorMaterials(donors, nextCycle, false, styles);
  assert.equal(latePipe.material, latePipeOriginal);
});


test('C/B south downpipe preserves its source collar plane and uses only a photo-based work route', async () => {
  const { relocateR31Downpipes, R31_DOWNPIPE_TARGETS } = await import('../../src/scripts/privateModelR31Inspection.mjs');
  const id = 'T12_2026_CB_ETELAJULKISIVU';
  const target = R31_DOWNPIPE_TARGETS[id];
  const group = new THREE.Group();
  const part = (role, y, height) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, height), new THREE.MeshBasicMaterial());
    mesh.name = id + '_DOWNPIPE_' + role + '_WORK_TEST';
    mesh.matrixAutoUpdate = false;
    mesh.matrix.makeTranslation(13.4, y, 1.83); // Synthetic inlet, not the physical T12 gutter.
    group.add(mesh);
    return mesh;
  };
  const vertical = part('VERTICAL_PIPE', 2.50, 5.0);
  const collar = part('INLET_COLLAR', 5.75, 0.1);
  const terminal = part('TERMINAL_BEND', 0.40, 0.3);
  const moves = relocateR31Downpipes(THREE, group);
  assert.equal(moves.length, 1, 'C/B must be recognized as the fifth independent pipe');
  assert.equal(moves[0].id, id);
  assert.equal(moves[0].x, 12.7);
  assert.equal(moves[0].z, 1.665);
  assert.equal(moves[0].endsOnExistingPipe, false);
  assert.equal(moves[0].basis, 'OWNER_PHOTO_20261122_BETWEEN_BALCONY_BOARDING_AND_BRICK');
  collar.geometry.computeBoundingBox();
  const inlet = collar.geometry.boundingBox.clone().applyMatrix4(collar.matrix).getCenter(new THREE.Vector3());
  assert.ok(Math.abs(inlet.x - target.x) < 1e-9, 'collar is moved along gutter X');
  assert.ok(Math.abs(inlet.z - 1.83) < 1e-9, 'unverified gutter-native Z is not silently replaced');
  const route = group.children.find((m) => m.name === id + '_DOWNPIPE_SWAN_NECK_ROUTE_WORK_ASSUMPTION');
  assert.ok(route);
  route.geometry.computeBoundingBox();
  assert.ok(route.geometry.boundingBox.min.z < target.z, 'route reaches the wall-side target');
  assert.ok(route.geometry.boundingBox.max.z > target.z + 0.20, 'lower outlet points away from the facade');
  assert.ok(route.geometry.boundingBox.min.y < 0.12, 'route reaches its low outlet');
  assert.equal(route.userData.presentationOnly, true);
  assert.equal(route.userData.physicalRouteClaim, false);
  assert.equal(vertical.visible, false);
  assert.equal(terminal.visible, false);
  assert.equal(collar.visible, true);
  // No physical gutter/contact PASS: that requires the actual T12 scene66 triangle source.
});
