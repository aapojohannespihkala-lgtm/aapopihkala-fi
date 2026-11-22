/**
 * R31 inspection views (owner 22.11.2026 17.08): "Salaojat" and "Infra" on the
 * same authenticated R31 model, built only from already published sources.
 *
 * - Salaojat: the M5A-R3 Z1C drain topology WORK_TEST (CURRENT model.glb,
 *   scene 59 "... CURRENT CANDIDATE R845", source scene 58). Wells, reference
 *   routes and the open (unresolved) discharge/boundary markers keep their
 *   source geometry and world placement; R31 shares the same YLIS-G1 Y-up frame.
 * - Infra: the Locus site water/wastewater work-Z routes already used by the
 *   P139AD/P143D reviews, plus R31's own site-sewer branches.
 *
 * Drainage, stormwater and wastewater stay separate; no connection or
 * discharge route is invented. Everything is WORK_TEST, presentation only.
 * THREE is injected so the pure parts stay testable without a renderer.
 */

export const R31_DRAINAGE_SOURCE = Object.freeze({
  path: '/private-model/model.glb',
  sceneIndex: 59,
  sceneName: 'M5A-R3 Z1C WHOLE BUILDING CURRENT CANDIDATE R845 - BABYLON Y-UP',
  pass: 'M5A-R3-Z1C-CURRENT-CANDIDATE-R845',
});

/** Drain object kinds by source metadata (never by guessing from geometry). */
export function r31DrainageKind(userData = {}) {
  const kind = String(userData.representationKind ?? '').toUpperCase();
  if (kind === 'WELLMARKERWORK') return 'well';
  if (kind === 'REFERENCEROUTEWORK') return 'route';
  if (kind === 'UNRESOLVEDBOUNDARYMARKER') return 'open';
  return null;
}

/** Site-sewer branches that R31 itself carries (source names, exact prefix). */
export const R31_SITE_SEWER_ROOT_NAMES = Object.freeze([
  'M5_INTEGRATION_CLAUDE_WW_D1F_TO_SITE_SEWER_L150',
  'M5_WW74_C80_542_WITH_A_C_CONCEPTUAL_L100_BRANCHES',
]);
export const isR31SiteSewerName = (name) =>
  typeof name === 'string' && R31_SITE_SEWER_ROOT_NAMES.some((prefix) => name.startsWith(prefix));

export const R31_INSPECTION_COLORS = Object.freeze({
  // Owner 22.11.2026 20.12: drainage must not read as ventilation (green)
  // nor as stormwater (turquoise): yellow family, open ends red-orange.
  well: 0xd39b00, route: 0xf2c230, open: 0xff5a36,
  WATER: 0x1e88e5, WASTEWATER: 0xb2672d, sewer: 0x8e44ad,
  // Stormwater (gutters/downpipes) is drawn 0x26c6da in the viewer; fibre magenta.
  storm: 0x26c6da, FIBER: 0xe040b8,
  // Municipal Locus stormwater sewer: darker teal, apart from the property's own gutters/downpipes.
  STORM_MUNICIPAL: 0x00838f,
});

/** Locus fibre is a 2D map: drawn on one display level, not at a physical depth. */
export const R31_FIBER_DISPLAY_Y = -0.9;

/**
 * Locus municipal stormwater sewer (2D map) as tubes on the shared display
 * level, plus flow-direction cones from the source flow marks. No Z, no plot
 * connection: nothing is drawn towards the house.
 */
export function buildR31StormOverlay(THREE, lines, flowMarks = [], displayY = R31_FIBER_DISPLAY_Y) {
  const group = new THREE.Group();
  group.name = 'R31_INFRA_LOCUS_STORM_SEWER_2D_MAP_WORK_TEST';
  const color = R31_INSPECTION_COLORS.STORM_MUNICIPAL;
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0 });
  const base = { system: 'STORM_MUNICIPAL', zState: 'UNRESOLVED', representationKind: '2D_XY_MAP', presentationOnly: true,
    ModelStage: 'WORK_TEST_VIEW', physicalZClaim: false, plotConnectionClaim: false, currentClaim: false, asBuiltClaim: false };
  let count = 0;
  for (const line of lines ?? []) {
    if (!Array.isArray(line.points) || line.points.length < 2) continue;
    const pts = line.points.map(([x, y]) => new THREE.Vector3(x, displayY, -y));
    const path = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i += 1) {
      if (pts[i].distanceTo(pts[i - 1]) > 1e-4) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    }
    if (!path.curves.length) continue;
    const radius = Math.max(0.06, (line.diameterMm || 300) / 2000);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, pts.length * 6), radius, 8, false), material);
    mesh.name = `R31_INFRA_${line.name}`;
    mesh.renderOrder = 6;
    mesh.userData = { ...base, sourceRecord: line.record, diameterMm: line.diameterMm, buildYear: line.buildYear,
      ownerCode: line.ownerCode, parcelDistM: line.parcelDistM };
    group.add(mesh);
    count += 1;
  }
  let flows = 0;
  for (const mark of flowMarks ?? []) {
    const [a, b] = mark.points ?? [];
    if (!a || !b) continue;
    const from = new THREE.Vector3(a[0], displayY, -a[1]);
    const to = new THREE.Vector3(b[0], displayY, -b[1]);
    const dir = to.clone().sub(from);
    const len = dir.length();
    if (len < 1e-4) continue;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, Math.max(0.8, len), 10), material);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    cone.position.copy(from).lerp(to, 0.5);
    cone.updateMatrix();
    cone.matrixAutoUpdate = false;
    cone.name = `R31_INFRA_${mark.name}`;
    cone.userData = { ...base, sourceRecord: mark.record, flowMark: true };
    group.add(cone);
    flows += 1;
  }
  group.userData = { counts: { STORM: count, STORM_FLOW: flows }, presentationOnly: true, displayY };
  return group;
}

/**
 * Locus Valokuitunen fibre map lines (G1 local X/Y) as thin tubes in the
 * Y-up frame (x, y, -Y). Z is unresolved in the source, so every line sits
 * on R31_FIBER_DISPLAY_Y and is marked physicalZClaim false.
 */
export function buildR31FiberOverlay(THREE, lines, displayY = R31_FIBER_DISPLAY_Y) {
  const group = new THREE.Group();
  group.name = 'R31_INFRA_LOCUS_FIBER_2D_MAP_WORK_TEST';
  const material = new THREE.MeshStandardMaterial({ color: R31_INSPECTION_COLORS.FIBER,
    emissive: R31_INSPECTION_COLORS.FIBER, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0 });
  let count = 0;
  for (const line of lines ?? []) {
    if (!Array.isArray(line.points) || line.points.length < 2) continue;
    const pts = line.points.map(([x, y]) => new THREE.Vector3(x, displayY, -y));
    const path = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i += 1) {
      if (pts[i].distanceTo(pts[i - 1]) > 1e-4) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    }
    if (!path.curves.length) continue;
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(8, pts.length * 6), 0.05, 6, false), material);
    mesh.name = `R31_INFRA_${line.name}`;
    mesh.renderOrder = 6;
    mesh.userData = { system: 'FIBER', sourceRecord: line.record, component: line.component,
      zState: 'UNRESOLVED', representationKind: '2D_XY_MAP', presentationOnly: true,
      ModelStage: 'WORK_TEST_VIEW', physicalZClaim: false, currentClaim: false, asBuiltClaim: false };
    group.add(mesh);
    count += 1;
  }
  group.userData = { counts: { FIBER: count }, presentationOnly: true, displayY };
  return group;
}

/** World-space points of a mesh/line geometry (source order kept). */
function worldPoints(THREE, object) {
  const position = object.geometry?.attributes?.position;
  if (!position) return [];
  const out = [];
  for (let i = 0; i < position.count; i += 1) {
    out.push(new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld));
  }
  return out;
}

/**
 * Drain objects of the verified source scene as visible solids. The source
 * draws them as 1-px lines (routes: line strips, wells and open ends: rings),
 * so routes become tubes along the exact source vertices and wells/open ends
 * become markers at the exact source centre. Null on identity mismatch.
 */
export function buildR31DrainageOverlay(THREE, gltf) {
  const json = gltf?.parser?.json;
  const scene = gltf?.scenes?.[R31_DRAINAGE_SOURCE.sceneIndex];
  if (!scene || json?.scenes?.[R31_DRAINAGE_SOURCE.sceneIndex]?.name !== R31_DRAINAGE_SOURCE.sceneName ||
      scene.userData?.Pass !== R31_DRAINAGE_SOURCE.pass) return null;
  scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = 'R31_INSPECTION_DRAINAGE_M5A_R3_Z1C';
  const materials = {};
  const material = (kind) => materials[kind] ??= new THREE.MeshStandardMaterial({
    color: R31_INSPECTION_COLORS[kind], emissive: R31_INSPECTION_COLORS[kind], emissiveIntensity: 0.45,
    roughness: 0.6, metalness: 0,
  });
  const counts = { well: 0, route: 0, open: 0 };
  scene.traverse((object) => {
    if (!object.isMesh && !object.isLine && !object.isLineSegments) return;
    let kind = null;
    for (let node = object; node && node !== scene && !kind; node = node.parent) kind = r31DrainageKind(node.userData);
    if (!kind) return;
    const points = worldPoints(THREE, object);
    if (points.length < 2) return;
    let mesh;
    if (kind === 'route') {
      // Line strips in source order; LINES pairs are joined the same way.
      const path = new THREE.CurvePath();
      for (let i = 1; i < points.length; i += 1) {
        if (points[i].distanceTo(points[i - 1]) > 1e-6) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
      }
      if (!path.curves.length) return;
      mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(4, path.curves.length * 6), 0.07, 8, false), material(kind));
    } else {
      const box = new THREE.Box3().setFromPoints(points);
      const centre = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(0.12, Math.max(size.x, size.z) / 2);
      mesh = kind === 'well'
        ? new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.3, 20), material(kind))
        : new THREE.Mesh(new THREE.OctahedronGeometry(Math.max(0.18, radius)), material(kind));
      mesh.position.copy(centre);
      mesh.updateMatrix();
    }
    mesh.name = object.name;
    mesh.renderOrder = 6;
    mesh.userData = { ...object.userData, r31InspectionKind: kind, presentationOnly: true,
      ModelStage: 'WORK_TEST_VIEW', currentClaim: false, asBuiltClaim: false };
    group.add(mesh);
    counts[kind] += 1;
  });
  if (!group.children.length) return null;
  group.userData = { source: R31_DRAINAGE_SOURCE, counts, presentationOnly: true };
  return group;
}

/**
 * Locus site routes as tubes. `routes` = the viewer's P139AD work-Z routes
 * (G1 XY, absolute work elevation); y = elevation - verticalReference.
 */
export function buildR31InfraOverlay(THREE, routes, verticalReferenceM) {
  const group = new THREE.Group();
  group.name = 'R31_INSPECTION_INFRA_LOCUS_WORK_Z';
  const counts = { WATER: 0, WASTEWATER: 0 };
  for (const route of routes ?? []) {
    if (!['WATER', 'WASTEWATER'].includes(route.system) || !Array.isArray(route.points) || route.points.length < 2) continue;
    const pts = route.points.map(([x, y, z]) => new THREE.Vector3(x, z - verticalReferenceM, -y));
    const path = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i += 1) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
    // Parcel branches are uncertain in the source: drawn thinner and lighter.
    const uncertain = /PARCEL/.test(route.name);
    const geometry = new THREE.TubeGeometry(path, Math.max(8, pts.length * 12), uncertain ? 0.06 : 0.1, 8, false);
    const color = R31_INSPECTION_COLORS[route.system];
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0,
      transparent: uncertain, opacity: uncertain ? 0.6 : 1,
    }));
    mesh.name = `R31_INFRA_${route.name}`;
    mesh.renderOrder = 6;
    mesh.userData = { label: route.label, sourceObject: route.sourceObject, system: route.system,
      workZBasis: route.workZBasis, uncertain, verticalDatumStatus: 'OPEN_UNVERIFIED',
      presentationOnly: true, ModelStage: 'WORK_TEST_VIEW', physicalZClaim: false,
      currentClaim: false, asBuiltClaim: false };
    group.add(mesh);
    counts[route.system] += 1;
  }
  group.userData = { counts, presentationOnly: true, verticalReferenceM };
  return group;
}

/**
 * Dim the whole model (building and terrain) to a translucent grey so that
 * underground routes read through it. `keep(object)` objects get `keepMaterial`.
 * Returns a restore function.
 */
export function dimR31ModelForInspection(THREE, root, { keep = () => false, keepMaterial = null, opacity = 0.06 } = {}) {
  const grey = new THREE.MeshBasicMaterial({ color: 0x9aa1a9, transparent: true, opacity, depthWrite: false });
  const saved = new Map();
  const hidden = new Map();
  let kept = 0;
  root?.traverse?.((object) => {
    if (object.isMesh) {
      const isKept = keep(object);
      saved.set(object, object.material);
      object.material = isKept && keepMaterial ? keepMaterial : grey;
      if (isKept) kept += 1;
    } else if (object.isLine || object.isLineSegments || object.isPoints) {
      hidden.set(object, object.visible);
      object.visible = false;
    }
  });
  const restore = () => {
    for (const [object, material] of saved) object.material = material;
    for (const [object, visible] of hidden) object.visible = visible;
    saved.clear(); hidden.clear();
    grey.dispose();
  };
  return { restore, dimmed: saved.size - kept, kept };
}

/**
 * Whole-building exterior donors (owner 22.11.2026 17.08: "autokatos ja
 * räystäät"): earlier published WORK_TEST models in the same YLIS-G1 Y-up
 * frame, reused as-is (no remodelling). Identity = catalog path + scene name.
 */
export const R31_EXTERIOR_DONORS = Object.freeze({
  carport: Object.freeze({
    path: '/private-model/work-test/auto-ylisrinne-p6-autokatos-omistaja-180-work-test-r2-20261025-1misjswp.glb',
    sceneName: 'P6_OWNER_CONFIRMED_180_WORK_TEST',
    include: (name) => /^P6_/.test(name),
  }),
  rainwater: Object.freeze({
    path: '/private-model/work-test/auto-ylisrinne-t12-syoksytorvet-5-vyohyketta-work-test-20261024-1o1p2v82.glb',
    sceneName: 'T12 + four WORK gutters + five NEW visible rainwater downpipe zones / WORK_TEST scene66',
    include: (name) => /^T12_RAYSTASKOURU_/.test(name) || (/^T12_2026_/.test(name) && /DOWNPIPE/.test(name)),
  }),
});

/** World-placed clones of a donor's selected meshes, or null on identity mismatch. */
export function buildR31ExteriorDonorOverlay(THREE, key, gltf) {
  const donor = R31_EXTERIOR_DONORS[key];
  const scene = gltf?.scenes?.[0];
  if (!donor || !scene || gltf?.parser?.json?.scenes?.[0]?.name !== donor.sceneName) return null;
  scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = `R31_EXTERIOR_DONOR_${key.toUpperCase()}`;
  scene.traverse((object) => {
    if (!object.isMesh || !donor.include(object.name ?? '')) return;
    const clone = new THREE.Mesh(object.geometry, object.material);
    clone.name = object.name;
    clone.matrixAutoUpdate = false;
    clone.matrix.copy(object.matrixWorld);
    clone.userData = { ...object.userData, donorPath: donor.path, donorScene: donor.sceneName,
      presentationOnly: true, ModelStage: 'WORK_TEST_VIEW', currentClaim: false, asBuiltClaim: false };
    group.add(clone);
  });
  if (!group.children.length) return null;
  group.userData = { donor: key, count: group.children.length, presentationOnly: true };
  return group;
}

/**
 * Downpipe targets from human observation (owner 22.11.2026 18.08-20.12).
 * All four building corners alike: on the gable face, 10-15 cm in from the
 * facade edge (owner point X 25.400 / Y 10.683 on the east gable). West
 * gable face (brick) x = -0.02, east gable face x = 25.408; facade edges
 * z = +1.72 / -10.81. The C/B pipe is its own case (owner photo 19.27):
 * between the balcony boarding and the brick wall. `outlet` = direction the
 * low bottom outlet points (away from the wall). West `groundY` = bottom of
 * the replaced R31 lower pipe (node 8756, y -0.36).
 */
export const R31_CORNER_PIPE_INSET_M = 0.125;
export const R31_DOWNPIPE_TARGETS = Object.freeze({
  T12_2026_CD_LANSI_ETELA: Object.freeze({ x: -0.09, z: 1.72 - 0.125, groundY: -0.36, outlet: [-1, 0], basis: 'OWNER_20261122_CORNER_ON_GABLE_125MM_IN' }),
  T12_2026_CD_LANSI_POHJOINEN: Object.freeze({ x: -0.09, z: -10.81 + 0.125, groundY: -0.36, outlet: [-1, 0], basis: 'OWNER_20261122_CORNER_ON_GABLE_125MM_IN' }),
  T12_2026_AB_ITA_ETELA: Object.freeze({ x: 25.478, z: 1.71 - 0.125, outlet: [1, 0], basis: 'OWNER_20261122_CORNER_ON_GABLE_125MM_IN' }),
  T12_2026_AB_ITA_POHJOINEN: Object.freeze({ x: 25.478, z: -10.81 + 0.125, outlet: [1, 0], basis: 'OWNER_POINT_20261122_X25400_Y10683' }),
  T12_2026_CB_ETELAJULKISIVU: Object.freeze({ x: 12.7, z: 1.665, outlet: [0, 1], basis: 'OWNER_PHOTO_20261122_BETWEEN_BALCONY_BOARDING_AND_BRICK' }),
});

/** R31's own older west lower pipes, replaced by the corner pipes in the whole-building view. */
export const isR31ReplacedWestDownpipe = (name) =>
  typeof name === 'string' && /DOWNSPO/.test(name) && !/PRESENCE/.test(name) &&
  /(WEST_BRICK_CORNER|NW_CORNER)/.test(name);

/** Roof underside of the R31 C/D roof (node 13360: ridge y 7.5238 at z -4.58, slope 0.25, eaves 5.806). */
export const R31_CD_ROOF_UNDERSIDE = Object.freeze({ ridgeY: 7.5238, ridgeZ: -4.58, slope: 0.25, sourceNode: 13360 });
export const r31RoofUndersideY = (z) => 7.5238 - 0.25 * Math.abs(z + 4.58);

/**
 * Gable brick / brown boarding line, derived from the 1985 ARK 3 drawing
 * (Drive 1h1qq98wTfVQTEEJIG45WqeKhLD_JfvjG, 600 dpi): the brick top is drawn
 * at the lower eave/fascia level, east +26,530 and west +27,530 (ARK 2
 * 1u8jhHfL...: same levels = fascia bottom on the long facades). Local
 * datum +21,750 = 0 (checked against R31: A/B ridge 6.73 = +28,480). DESIGN
 * WORK_TEST values; +-0.03 m = drawing interpretation, not a site measurement.
 * The earlier 5.15 / 5.28 came from the mass model (roof plane +26,900) and a
 * P186 work solid, not from any material line source.
 */
export const R31_GABLE_DESIGN_DATUM = 21.75;
export const R31_EAST_BRICK_TOP_Y = 26.53 - R31_GABLE_DESIGN_DATUM; // 4.78
export const R31_WEST_BRICK_TOP_Y = 27.53 - R31_GABLE_DESIGN_DATUM; // 5.78
/** West brick top / boarding start (kept name for older callers). */
export const R31_GABLE_BOARDING_FROM_Y = R31_WEST_BRICK_TOP_Y;
/** South edge of the west brick facade (node 6653 world z max). */
export const R31_WEST_FACADE_SOUTH_Z = 1.724;
/** Owner 22.11.2026 20.46 (Street View heinä 2026): dark brown vertical boarding in both gable triangles. */
export const R31_GABLE_BOARDING_COLOR = 0x3b2a22;
/** Presentation lift of the boarding overlays off the source faces (reversed depth, see liftGableFace). */
export const R31_GABLE_BOARDING_LIFT_M = 0.004;
export const isR31WestGableBoardingSource = (name) =>
  typeof name === 'string' && /C80_D_KATON_LANSIPAATY_(ALEMPI|YLEMPI)/.test(name);

/**
 * West gable infill (owner 22.11.2026 20.12 "reikä pitäisi korjata"): the
 * source gable fills stop at z = 0 while the brick wall runs to z = 1.72, so
 * above the ARK 3 brick line (y 5.78) up to the roof underside there is an opening.
 * Same plane as the source fills (x 0..0.22), lifted 4 mm out; z 0..1.72.
 */
export function buildR31WestGableInfill(THREE, material) {
  const shape = new THREE.Shape();
  shape.moveTo(0, R31_GABLE_BOARDING_FROM_Y);
  shape.lineTo(R31_WEST_FACADE_SOUTH_Z, R31_GABLE_BOARDING_FROM_Y);
  shape.lineTo(R31_WEST_FACADE_SOUTH_Z, r31RoofUndersideY(R31_WEST_FACADE_SOUTH_Z));
  shape.lineTo(0, r31RoofUndersideY(0));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.22 + R31_GABLE_BOARDING_LIFT_M, bevelEnabled: false });
  const mesh = new THREE.Mesh(geometry, material);
  // Shape X -> world +Z, shape Y -> world +Y, extrusion -> world -X (from x 0.22).
  mesh.matrixAutoUpdate = false;
  mesh.matrix.makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0));
  mesh.matrix.setPosition(0.22, 0, 0);
  mesh.name = 'R31_WEST_GABLE_INFILL_ABOVE_SOUTH_PIER_WORK_TEST';
  mesh.userData = { presentationOnly: true, workAssumption: true, ModelStage: 'WORK_TEST_VIEW',
    basis: 'OWNER_20261122_HOLE_FIX_BROWN_BOARDING', currentClaim: false, asBuiltClaim: false };
  return mesh;
}

/**
 * World-space copy of `geometry` (placed by `matrix`) keeping only the part
 * with y >= minY; triangles crossing the cut are clipped exactly.
 */
export function clipGeometryAboveY(THREE, geometry, matrix, minY) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const out = [];
  const v = (k) => new THREE.Vector3().fromBufferAttribute(pos, k).applyMatrix4(matrix);
  for (let t = 0; t + 2 < pos.count; t += 3) {
    const tri = [v(t), v(t + 1), v(t + 2)];
    const poly = [];
    for (let a = 0; a < 3; a += 1) {
      const p = tri[a];
      const q = tri[(a + 1) % 3];
      const pin = p.y >= minY;
      const qin = q.y >= minY;
      if (pin) poly.push(p);
      if (pin !== qin) poly.push(p.clone().lerp(q, (minY - p.y) / (q.y - p.y)));
    }
    for (let k = 1; k + 1 < poly.length; k += 1) out.push(poly[0], poly[k], poly[k + 1]);
  }
  const result = new THREE.BufferGeometry().setFromPoints(out);
  result.computeVertexNormals();
  return result;
}

/**
 * Source-exact AB lower-roof underside from R31 scene769 node13361 mesh5112.
 * This is a WORK_TEST roof mesh, not a measured as-built roof profile.
 */
export const R31_AB_ROOF_UNDERSIDE_WORK_TEST = Object.freeze({
  ridgeZ: -4.58, ridgeY: 6.523845, pitch: 0.25,
  sourceScene: 769, sourceNode: 13361, sourceMesh: 5112,
});
export const r31ABRoofUndersideY = (z) =>
  R31_AB_ROOF_UNDERSIDE_WORK_TEST.ridgeY -
    R31_AB_ROOF_UNDERSIDE_WORK_TEST.pitch * Math.abs(z - R31_AB_ROOF_UNDERSIDE_WORK_TEST.ridgeZ);

export const hasR31ABRoofClipSource = (json) => {
  const source = R31_AB_ROOF_UNDERSIDE_WORK_TEST;
  return json?.nodes?.[source.sourceNode]?.name === 'C80_R31_AB_ALEMPI_VESIKATTO_OPTIN' &&
    json.nodes[source.sourceNode].mesh === source.sourceMesh &&
    /__scene769$/.test(json?.scenes?.[source.sourceScene]?.name ?? '');
};

/**
 * Intersect the K14 display COPY with the two sloping planes of the R31
 * lower-roof underside. Split at the ridge BEFORE clipping: a single plane
 * across both slopes would cut the wrong triangles. Return local-space
 * positions so the source world matrix, material and source geometry survive.
 */
export function clipR31EastGableToABRoof(THREE, geometry, worldMatrix) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = geo.getAttribute('position');
  if (!pos || !worldMatrix?.isMatrix4) throw new Error('R31 east gable roof clip source missing');
  const source = R31_AB_ROOF_UNDERSIDE_WORK_TEST;
  const EPS = 1e-8;
  const clip = (polygon, signedDistance) => {
    const out = [];
    for (let i = 0; i < polygon.length; i += 1) {
      const p = polygon[i], q = polygon[(i + 1) % polygon.length];
      const dp = signedDistance(p), dq = signedDistance(q);
      const pin = dp >= -EPS, qin = dq >= -EPS;
      if (pin) out.push(p);
      if (pin !== qin && Math.abs(dp - dq) > EPS) out.push(p.clone().lerp(q, dp / (dp - dq)));
    }
    return out;
  };
  const inverse = worldMatrix.clone().invert();
  const out = [];
  for (let i = 0; i + 2 < pos.count; i += 3) {
    const tri = [0, 1, 2].map((offset) =>
      new THREE.Vector3().fromBufferAttribute(pos, i + offset).applyMatrix4(worldMatrix));
    for (const half of [-1, 1]) {
      let polygon = clip(tri, (p) => half * (p.z - source.ridgeZ));
      if (polygon.length < 3) continue;
      polygon = clip(polygon, (p) => r31ABRoofUndersideY(p.z) - p.y);
      for (let j = 1; j + 1 < polygon.length; j += 1) {
        const a = polygon[0], b = polygon[j], c = polygon[j + 1];
        const area = new THREE.Vector3().subVectors(b, a)
          .cross(new THREE.Vector3().subVectors(c, a)).lengthSq();
        if (area <= 1e-14) continue;
        out.push(a.clone().applyMatrix4(inverse), b.clone().applyMatrix4(inverse),
          c.clone().applyMatrix4(inverse));
      }
    }
  }
  if (geo !== geometry) geo.dispose();
  const result = new THREE.BufferGeometry().setFromPoints(out);
  result.computeVertexNormals();
  return result;
}

/** The only mutable geometry is the overlay clone, never the source K14 mesh. */
function applyR31EastGableRoofClip(THREE, clone, json) {
  if (!/^K14_A_GABLE_EXTERIOR_FACE/.test(clone.name ?? '')) return;
  if (!hasR31ABRoofClipSource(json)) {
    clone.userData = { ...clone.userData, roofClipStatus: 'SOURCE_HOLD' };
    return;
  }
  clone.geometry = clipR31EastGableToABRoof(THREE, clone.geometry, clone.matrix);
  clone.userData = { ...clone.userData, roofClipStatus: 'R31_AB_UNDERSIDE_WORK_TEST',
    roofClipSourceNode: R31_AB_ROOF_UNDERSIDE_WORK_TEST.sourceNode,
    physicalRoofClaim: false };
}

/**
 * World-space part of `geometry` between minY and a symmetric pitched roof
 * underside { ridgeY, ridgeZ, slope }. Split at the ridge first so each half
 * is clipped by its own slope plane.
 */
export function clipGeometryToGableBand(THREE, geometry, matrix, roof, minY) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const EPS = 1e-9;
  const clip = (polygon, d) => {
    const out = [];
    for (let i = 0; i < polygon.length; i += 1) {
      const p = polygon[i];
      const q = polygon[(i + 1) % polygon.length];
      const dp = d(p);
      const dq = d(q);
      if (dp >= -EPS) out.push(p);
      if ((dp >= -EPS) !== (dq >= -EPS) && Math.abs(dp - dq) > EPS) out.push(p.clone().lerp(q, dp / (dp - dq)));
    }
    return out;
  };
  const under = (z) => roof.ridgeY - roof.slope * Math.abs(z - roof.ridgeZ);
  const out = [];
  for (let t = 0; t + 2 < pos.count; t += 3) {
    const tri = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, t + k).applyMatrix4(matrix));
    for (const half of [-1, 1]) {
      let poly = clip(tri, (p) => half * (p.z - roof.ridgeZ));
      if (poly.length >= 3) poly = clip(poly, (p) => under(p.z) - p.y);
      if (poly.length >= 3) poly = clip(poly, (p) => p.y - minY);
      for (let k = 1; k + 1 < poly.length; k += 1) {
        const area = new THREE.Vector3().subVectors(poly[k], poly[0]).cross(new THREE.Vector3().subVectors(poly[k + 1], poly[0])).lengthSq();
        if (area > 1e-14) out.push(poly[0], poly[k], poly[k + 1]);
      }
    }
  }
  if (g !== geometry) g.dispose();
  const result = new THREE.BufferGeometry().setFromPoints(out);
  result.computeVertexNormals();
  return result;
}

/** Brick course module of the R31 west 2F brick wall (node 6653): 77 mm brick + 9.6 mm joint. */
export const R31_WEST_BRICK_COURSE_M = 0.0866;

/**
 * West brick facade completion 5.30 -> 5.78 (ARK 3 brick top +27,530).
 * The existing 2F brick wall (node 6653: brick faces, recessed mortar plane,
 * end returns; top 5.30) is continued with its own courses: every source
 * primitive is clipped to the band [top - k*course, 5.78 - k*course] and
 * lifted by k*course with an even k, so the running bond, joints and
 * materials continue without a seam; nothing overlaps the source.
 * `sources` = [{ geometry, matrixWorld, material }] of the wall's meshes.
 */
export function buildR31WestBrickCompletion(THREE, sources, topY = R31_WEST_BRICK_TOP_Y) {
  const list = (sources ?? []).filter((m) => m?.geometry && m?.matrixWorld);
  if (!list.length) return null;
  let wallTop = -Infinity;
  for (const m of list) {
    m.geometry.computeBoundingBox();
    wallTop = Math.max(wallTop, m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld).max.y);
  }
  const need = topY - wallTop;
  if (!(need > 1e-6)) return null;
  let courses = Math.ceil(need / R31_WEST_BRICK_COURSE_M - 1e-9);
  if (courses % 2) courses += 1; // even: same running-bond offset
  const lift = courses * R31_WEST_BRICK_COURSE_M;
  const y0 = wallTop - lift;
  const y1 = topY - lift;
  const group = new THREE.Group();
  group.name = 'R31_WEST_BRICK_COMPLETION_TO_ARK3_LINE_WORK_TEST';
  for (const src of list) {
    const geometry = clipGeometryByYBand(THREE, src.geometry, src.matrixWorld, y0, y1);
    if (!geometry.getAttribute('position').count) continue;
    geometry.translate(0, lift, 0);
    const mesh = new THREE.Mesh(geometry, src.material);
    mesh.name = `R31_WEST_BRICK_COMPLETION_${src.name ?? 'PART'}`;
    mesh.matrixAutoUpdate = false;
    group.add(mesh);
  }
  group.userData = { presentationOnly: true, ModelStage: 'WORK_TEST_VIEW', basis: 'ARK3_1985_WEST_BRICK_TOP_27530',
    extendsNode: 6653, fromY: wallTop, toY: topY, courseLift: lift, currentClaim: false, asBuiltClaim: false };
  return group.children.length ? group : null;
}

/** World-space part of `geometry` with y0 <= y <= y1 (exact triangle clipping). */
export function clipGeometryByYBand(THREE, geometry, matrix, y0, y1) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const clip = (poly, d) => {
    const out = [];
    for (let a = 0; a < poly.length; a += 1) {
      const p = poly[a];
      const q = poly[(a + 1) % poly.length];
      const dp = d(p);
      const dq = d(q);
      if (dp >= 0) out.push(p);
      if ((dp >= 0) !== (dq >= 0)) out.push(p.clone().lerp(q, dp / (dp - dq)));
    }
    return out;
  };
  const out = [];
  for (let t = 0; t + 2 < pos.count; t += 3) {
    let poly = [0, 1, 2].map((k) => new THREE.Vector3().fromBufferAttribute(pos, t + k).applyMatrix4(matrix));
    poly = clip(poly, (p) => p.y - y0);
    if (poly.length >= 3) poly = clip(poly, (p) => y1 - p.y);
    for (let k = 1; k + 1 < poly.length; k += 1) out.push(poly[0], poly[k], poly[k + 1]);
  }
  if (g !== geometry) g.dispose();
  const result = new THREE.BufferGeometry().setFromPoints(out);
  result.computeVertexNormals();
  return result;
}

/**
 * Brown gable boarding overlays for both gables: the west source fills
 * (ALEMPI/YLEMPI) and the east K14 face above the brick line, each copied
 * world-placed and lifted 4 mm outwards. Presentation only.
 */
export function buildR31GableBoarding(THREE, { westMeshes = [], eastFace = null } = {}, material) {
  const group = new THREE.Group();
  group.name = 'R31_GABLE_TRIANGLE_BROWN_BOARDING_WORK_TEST';
  const add = (geometry, name, dx) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.matrixAutoUpdate = false;
    mesh.matrix.makeTranslation(dx, 0, 0);
    mesh.userData = { presentationOnly: true, ModelStage: 'WORK_TEST_VIEW', basis: 'OWNER_20261122_GABLE_TRIANGLE_BROWN_BOARDING',
      currentClaim: false, asBuiltClaim: false };
    group.add(mesh);
  };
  for (const source of westMeshes) {
    source.updateWorldMatrix?.(true, false);
    // West: ARK 3 brick line 5.78 up to the C/D roof's own underside.
    add(clipGeometryToGableBand(THREE, source.geometry, source.matrixWorld, R31_CD_ROOF_UNDERSIDE, R31_WEST_BRICK_TOP_Y),
      `${source.name}_BROWN_BOARDING_OVERLAY`, -R31_GABLE_BOARDING_LIFT_M);
  }
  if (eastFace) {
    const m = eastFace.matrix.clone();
    if (eastFace.parent?.matrixWorld) m.premultiply(eastFace.parent.matrixWorld);
    // K14 copy is already clipped to the A/B roof underside (#2215): boarding
    // = ARK 3 brick line 4.78 .. own roof underside (1.00 m below the west).
    add(clipGeometryAboveY(THREE, eastFace.geometry, m, R31_EAST_BRICK_TOP_Y),
      'K14_A_GABLE_TRIANGLE_BROWN_BOARDING_OVERLAY', R31_GABLE_BOARDING_LIFT_M);
  }
  return group;
}

/**
 * Owner 22.11.2026 20.46 (photos): the fibre enters at the D north entrance,
 * outside box right of the door (west of it, x < 2.43) with the cable running
 * down; inside it is the small casing under the electric centre (source node
 * C80R2_V15_D1F_ENTRY_SMALL_CASING_FIBER_SOCKETS). Door outer face z -9.04.
 */
export const R31_FIBER_ENTRY = Object.freeze({
  box: Object.freeze({ x: 2.33, y: 0.605, z: -9.075, w: 0.10, h: 0.25, d: 0.06 }),
  conduitX: 2.33, conduitZ: -9.10, outsideMinG1Y: 9.2,
  basis: 'OWNER_PHOTOS_20261122_D_NORTH_ENTRANCE_RIGHT_OF_DOOR',
});

/** Exterior fibre box (whole-building view). */
export function buildR31FiberEntryBox(THREE, material) {
  const { box } = R31_FIBER_ENTRY;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(box.w, box.h, box.d), material);
  mesh.name = 'R31_D1F_NORTH_ENTRANCE_FIBER_BOX_OWNER_OBSERVED_WORK_TEST';
  mesh.matrixAutoUpdate = false;
  mesh.matrix.makeTranslation(box.x, box.y, box.z);
  mesh.userData = { system: 'FIBER', basis: R31_FIBER_ENTRY.basis, presentationOnly: true,
    ModelStage: 'WORK_TEST_VIEW', dimensionsAssumed: true, currentClaim: false, asBuiltClaim: false };
  return mesh;
}

/**
 * Fibre drop from the box down to the map display level and a link to the
 * nearest Locus fibre map point north of the facade. The link is a work
 * assumption (the map itself ends inside the house outline).
 */
export function buildR31FiberEntryLink(THREE, lines, displayY = R31_FIBER_DISPLAY_Y) {
  const { box, conduitX, conduitZ, outsideMinG1Y } = R31_FIBER_ENTRY;
  let best = null;
  for (const line of lines ?? []) {
    for (const [x, y] of line.points ?? []) {
      if (y < outsideMinG1Y) continue;
      const d = Math.hypot(x - conduitX, y + conduitZ);
      if (!best || d < best.d) best = { d, x, y, line: line.name };
    }
  }
  const group = new THREE.Group();
  group.name = 'R31_FIBER_ENTRY_LINK_WORK_ASSUMPTION';
  const material = new THREE.MeshStandardMaterial({ color: R31_INSPECTION_COLORS.FIBER, emissive: R31_INSPECTION_COLORS.FIBER,
    emissiveIntensity: 0.4, roughness: 0.6, metalness: 0, transparent: true, opacity: 0.55 });
  const pts = [new THREE.Vector3(conduitX, box.y - box.h / 2, conduitZ), new THREE.Vector3(conduitX, displayY, conduitZ)];
  if (best) pts.push(new THREE.Vector3(best.x, displayY, -best.y));
  const path = new THREE.CurvePath();
  for (let i = 1; i < pts.length; i += 1) path.add(new THREE.LineCurve3(pts[i - 1], pts[i]));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.03, 6, false), material);
  mesh.name = 'R31_FIBER_ENTRY_DROP_AND_LINK_WORK_ASSUMPTION';
  mesh.userData = { system: 'FIBER', basis: R31_FIBER_ENTRY.basis, linkedMapLine: best?.line ?? null,
    workAssumption: true, physicalRouteClaim: false, presentationOnly: true, ModelStage: 'WORK_TEST_VIEW' };
  group.add(mesh);
  group.userData = { counts: { FIBER_ENTRY: 1 }, linkedMapLine: best?.line ?? null, presentationOnly: true };
  return group;
}

/**
 * Re-route each T12 downpipe to its target: collar slides along its gutter,
 * short drop, 45-degree swan neck back to the wall (owner photos 18.25),
 * straight down; either onto the existing R31 lower pipe (stopY) or to a low
 * outlet bend pointing away from the wall. The source straight pipe and its
 * high terminal bend are hidden. Returns the moves for the record.
 */
export function relocateR31Downpipes(THREE, group, targets = R31_DOWNPIPE_TARGETS) {
  const parts = new Map();
  for (const mesh of group?.children ?? []) {
    const m = /^(T12_2026_.+?)_DOWNPIPE_(INLET_COLLAR|VERTICAL_PIPE|TERMINAL_BEND)/.exec(mesh.name ?? '');
    if (!m) continue;
    if (!parts.has(m[1])) parts.set(m[1], {});
    parts.get(m[1])[m[2]] = mesh;
  }
  const boxOf = (mesh) => {
    mesh.geometry.computeBoundingBox();
    return mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrix);
  };
  const moves = [];
  for (const [id, p] of parts) {
    const target = targets[id];
    if (!target || !p.VERTICAL_PIPE || !p.INLET_COLLAR) continue;
    const pipe = boxOf(p.VERTICAL_PIPE);
    const collar = boxOf(p.INLET_COLLAR);
    const bend = p.TERMINAL_BEND ? boxOf(p.TERMINAL_BEND) : pipe;
    const groundY = Number.isFinite(target.groundY) ? target.groundY : Math.min(bend.min.y, pipe.min.y);
    const c = collar.getCenter(new THREE.Vector3());
    const dx = target.x - c.x;
    p.INLET_COLLAR.matrix.premultiply(new THREE.Matrix4().makeTranslation(dx, 0, 0));
    const radius = Math.max(0.02, (pipe.max.x - pipe.min.x) / 2);
    const top = collar.min.y;
    const p0 = new THREE.Vector3(target.x, top, c.z);
    const p1 = new THREE.Vector3(target.x, top - 0.12, c.z);
    const run = Math.abs(target.z - c.z);
    const p2 = new THREE.Vector3(target.x, p1.y - run, target.z);
    const points = [p0, p1, p2];
    if (Number.isFinite(target.stopY)) {
      points.push(new THREE.Vector3(target.x, target.stopY, target.z));
    } else {
      const [ox, oz] = target.outlet ?? [0, 1];
      const low = groundY + 0.25;
      points.push(new THREE.Vector3(target.x, low, target.z));
      points.push(new THREE.Vector3(target.x + ox * 0.22, low - 0.18, target.z + oz * 0.22));
    }
    const path = new THREE.CurvePath();
    for (let i = 1; i < points.length; i += 1) {
      if (points[i].distanceTo(points[i - 1]) > 1e-4) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
    }
    const route = new THREE.Mesh(new THREE.TubeGeometry(path, 64, radius, 12, false), p.VERTICAL_PIPE.material);
    route.name = `${id}_DOWNPIPE_SWAN_NECK_ROUTE_WORK_ASSUMPTION`;
    route.userData = { presentationOnly: true, workAssumption: true, ModelStage: 'WORK_TEST_VIEW',
      targetBasis: target.basis, shapeBasis: 'OWNER_PHOTOS_20261122_SWAN_NECK_45DEG', physicalRouteClaim: false };
    group.add(route);
    p.VERTICAL_PIPE.visible = false;
    if (p.TERMINAL_BEND) p.TERMINAL_BEND.visible = false;
    moves.push({ id, x: target.x, z: target.z, endsOnExistingPipe: Number.isFinite(target.stopY), basis: target.basis });
  }
  group.userData = { ...group.userData, downpipeMoves: moves };
  return moves;
}

/**
 * Owner 22.11.2026 19.27: the east gable facade is as wide as the west one.
 * R31 itself carries the source A gable face (K14, full width to the balcony
 * front) and its balcony end in scene 23; the whole-building scene only has
 * the narrower reference mass. Cloned source-exact, world-placed.
 */
export const R31_EAST_GABLE_SOURCE = Object.freeze({
  sceneIndex: 23,
  nodes: Object.freeze([3665, ...Array.from({ length: 18 }, (_, k) => 4653 + k)]),
  namePattern: /^(K14_A_GABLE_EXTERIOR_FACE|K14_K12_A_GABLE_DREF_)/,
});

/**
 * The K14 face shares the reference mass plane x = 25.40 (coplanar depth
 * fight; polygonOffset is unreliable with the reversed depth buffer): show
 * it 8 mm outward. Presentation-only, recorded on the object.
 */
export const R31_EAST_GABLE_FACE_LIFT_M = 0.008;
function liftGableFace(THREE, mesh) {
  if (!/^K14_A_GABLE_EXTERIOR_FACE/.test(mesh.name ?? '')) return;
  mesh.matrix.premultiply(new THREE.Matrix4().makeTranslation(R31_EAST_GABLE_FACE_LIFT_M, 0, 0));
  mesh.userData = { ...mesh.userData, presentationLiftXM: R31_EAST_GABLE_FACE_LIFT_M };
}

export function buildR31EastGableOverlay(THREE, gltf) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  const scene = gltf?.scenes?.[R31_EAST_GABLE_SOURCE.sceneIndex];
  if (!scene || typeof associations?.get !== 'function') return null;
  const wanted = new Set(R31_EAST_GABLE_SOURCE.nodes);
  scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  group.name = 'R31_EAST_GABLE_K14_SOURCE_SCENE23';
  scene.traverse((object) => {
    const index = associations.get(object)?.nodes;
    if (!object.isMesh || !wanted.has(index) || !R31_EAST_GABLE_SOURCE.namePattern.test(json?.nodes?.[index]?.name ?? '')) return;
    const clone = new THREE.Mesh(object.geometry, object.material);
    clone.name = object.name;
    clone.matrixAutoUpdate = false;
    clone.matrix.copy(object.matrixWorld);
    liftGableFace(THREE, clone);
    clone.userData = { ...object.userData, sourceNode: index, sourceScene: R31_EAST_GABLE_SOURCE.sceneIndex,
      presentationOnly: true, ModelStage: 'WORK_TEST_VIEW', basis: 'OWNER_20261122_EAST_GABLE_AS_WIDE_AS_WEST' };
    applyR31EastGableRoofClip(THREE, clone, json);
    group.add(clone);
  });
  if (!group.children.length) return null;
  group.userData = { count: group.children.length, presentationOnly: true };
  return group;
}

/** World matrix of a JSON node through its parent chain (glTF TRS / matrix). */
function jsonWorldMatrix(THREE, json, index, parentOf) {
  const chain = [];
  for (let n = index; n !== undefined && n >= 0; n = parentOf.get(n)) chain.unshift(n);
  const world = new THREE.Matrix4();
  for (const n of chain) {
    const node = json.nodes[n];
    const local = new THREE.Matrix4();
    if (Array.isArray(node.matrix)) local.fromArray(node.matrix);
    else local.compose(new THREE.Vector3(...(node.translation ?? [0, 0, 0])),
      new THREE.Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new THREE.Vector3(...(node.scale ?? [1, 1, 1])));
    world.multiply(local);
  }
  return world;
}

/**
 * Same east gable, for loaders that build only the viewed scenes: each source
 * node is loaded on demand from the authenticated GLB parser and placed with
 * its JSON world matrix (source scene 23 chain).
 */
export async function loadR31EastGableOverlay(THREE, gltf) {
  const ready = buildR31EastGableOverlay(THREE, gltf);
  if (ready) return ready;
  const json = gltf?.parser?.json;
  if (!json || typeof gltf?.parser?.getDependency !== 'function') return null;
  const parentOf = new Map();
  json.nodes.forEach((node, i) => (node.children ?? []).forEach((c) => parentOf.set(c, i)));
  const inScene = new Set();
  const walk = (n) => { inScene.add(n); (json.nodes[n].children ?? []).forEach(walk); };
  (json.scenes?.[R31_EAST_GABLE_SOURCE.sceneIndex]?.nodes ?? []).forEach(walk);
  const group = new THREE.Group();
  group.name = 'R31_EAST_GABLE_K14_SOURCE_SCENE23';
  for (const index of R31_EAST_GABLE_SOURCE.nodes) {
    const node = json.nodes[index];
    if (!inScene.has(index) || node?.mesh === undefined || !R31_EAST_GABLE_SOURCE.namePattern.test(node.name ?? '')) continue;
    const meshes = await gltf.parser.getDependency('mesh', node.mesh);
    const world = jsonWorldMatrix(THREE, json, index, parentOf);
    const list = meshes?.isMesh ? [meshes] : (meshes?.children ?? []).filter((m) => m.isMesh);
    for (const mesh of list) {
      const clone = new THREE.Mesh(mesh.geometry, mesh.material);
      clone.name = node.name;
      clone.matrixAutoUpdate = false;
      clone.matrix.copy(world);
      liftGableFace(THREE, clone);
      clone.userData = { ...(node.extras ?? {}), sourceNode: index, sourceScene: R31_EAST_GABLE_SOURCE.sceneIndex,
        presentationOnly: true, ModelStage: 'WORK_TEST_VIEW', basis: 'OWNER_20261122_EAST_GABLE_AS_WIDE_AS_WEST' };
      applyR31EastGableRoofClip(THREE, clone, json);
      group.add(clone);
    }
  }
  if (!group.children.length) return null;
  group.userData = { count: group.children.length, presentationOnly: true };
  return group;
}

/**
 * Technical overlay colours exterior donors independently of their arrival order.
 * Called again after each asynchronous donor load and when the preset changes.
 * The map stores each mesh's original material only once per ON/OFF cycle.
 * No dependency on the renderer or on a particular glTF scene index.
 */
/**
 * Apply an R31 source-bound site-network visibility mode without mutating its
 * original materials. Hidden/unavailable restores exactly the original
 * material object references; ghost is a disposable presentation-only clone.
 * Models and source links remain unchanged.
 */
export function setR31SiteNetworkLayerMode(group, mode, allowed, originals = new Map()) {
  if (!group) return originals;
  const effective = allowed && (mode === 'visible' || mode === 'ghost') ? mode : 'hidden';
  group.traverse((object) => {
    if (!object.isMesh && !object.isLine && !object.isPoints) return;
    const captured = originals.get(object);
    if (effective === 'ghost') {
      if (captured) return;
      const source = object.material;
      if (!source) return;
      const clones = (Array.isArray(source) ? source : [source]).map((material) => {
        const clone = material.clone();
        clone.transparent = true;
        clone.opacity = Math.min(Number.isFinite(material.opacity) ? material.opacity : 1, 0.17);
        clone.depthWrite = false;
        if ('emissiveIntensity' in clone) clone.emissiveIntensity = 0;
        return clone;
      });
      originals.set(object, { source, clones });
      object.material = Array.isArray(source) ? clones : clones[0];
    } else if (captured) {
      object.material = captured.source;
      for (const clone of captured.clones) clone.dispose();
      originals.delete(object);
    }
  });
  group.visible = effective !== 'hidden';
  return originals;
}

export function syncR31ExteriorDonorMaterials(groups, originals, enabled, materials) {
  if (!enabled) {
    if (originals) {
      for (const [mesh, material] of originals) mesh.material = material;
    }
    return null;
  }
  const saved = originals ?? new Map();
  for (const [key, group] of Object.entries(groups)) {
    group?.traverse?.((object) => {
      if (!object.isMesh) return;
      if (!saved.has(object)) saved.set(object, object.material);
      object.material = key === 'rainwater' ? materials.rainwater : materials.grey;
    });
  }
  return saved;
}
