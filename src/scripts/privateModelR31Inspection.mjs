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
  well: 0x00b3a4, route: 0x2bbf5a, open: 0xff8a00,
  WATER: 0x1e88e5, WASTEWATER: 0xb2672d, sewer: 0x8e44ad,
});

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
 * Downpipe targets from human observation (owner 22.11.2026 18.08-19.27).
 * West gable: R31 already carries the photo-based lower pipes (nodes 8756
 * SW / 8832 NW, top y 2.62); the gutter swan neck ends on top of them, no
 * second pipe. East gable: mirror of the west (east facade as wide as the
 * west, owner 19.27). C/B: between the balcony boarding and the brick wall
 * (owner photo 19.27). `outlet` = direction the bottom outlet points.
 */
export const R31_DOWNPIPE_TARGETS = Object.freeze({
  T12_2026_CD_LANSI_ETELA: Object.freeze({ x: -0.145, z: 1.665, stopY: 2.62, basis: 'R31_NODE_8756_PHOTO_LOWER_PIPE' }),
  T12_2026_CD_LANSI_POHJOINEN: Object.freeze({ x: -0.145, z: -10.875, stopY: 2.62, basis: 'R31_NODE_8832_PHOTO_LOWER_PIPE' }),
  T12_2026_AB_ITA_ETELA: Object.freeze({ x: 25.545, z: 1.665, outlet: [1, 0], basis: 'OWNER_20261122_EAST_GABLE_AS_WIDE_AS_WEST_MIRROR_SW' }),
  T12_2026_AB_ITA_POHJOINEN: Object.freeze({ x: 25.545, z: -10.875, outlet: [1, 0], basis: 'OWNER_20261122_EAST_GABLE_MIRROR_NW' }),
  T12_2026_CB_ETELAJULKISIVU: Object.freeze({ x: 12.7, z: 1.665, outlet: [0, 1], basis: 'OWNER_PHOTO_20261122_BETWEEN_BALCONY_BOARDING_AND_BRICK' }),
});

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
    const groundY = Math.min(bend.min.y, pipe.min.y);
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
      group.add(clone);
    }
  }
  if (!group.children.length) return null;
  group.userData = { count: group.children.length, presentationOnly: true };
  return group;
}
