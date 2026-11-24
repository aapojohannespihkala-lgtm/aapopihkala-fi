/**
 * Reversible R22 1F bathroom C-edge WORK_TEST presentation.
 * Architecturally meaningful contours only: KPH tile perimeter, sauna/bath
 * doorway, mirror body, basin cabinet. Never change original geometry,
 * material, parent, visibility or layer state. Small fittings stay visible
 * but do not receive decorative outline clutter.
 *
 * Original native R22 GLB SHA20beae53, glTF scene686 (not __scene index).
 * 2015 plan/2026 host status remains WORK_TEST/HOST_HOLD, NOT as-built.
 */
export const R22_BATH_C_SOURCE = Object.freeze({
  sha256: '20beae53cd85b87beffc7afea8f22494b4c15eec8ddaf07eeca9bf5455ef8533',
  sceneIndex: 686,
  parts: Object.freeze([
    Object.freeze({ role: 'floor-perimeter', node: 12320, mesh: 4630, vertices: 300, prefix: 'K12_KPH_FLOOR_100x100_TILE_' }),
    Object.freeze({ role: 'door-opening', node: 5786, mesh: 1734, vertices: 24, prefix: 'HI08_R1_DOOR__D6SC_KPH2360_' }),
    Object.freeze({ role: 'mirror-outline', node: 1731, mesh: 837, vertices: 8, prefix: 'K11_XMIRROR_R989_FLOOR_INTEGRATION_DERIVED_CLONE_2960_' }),
    Object.freeze({ role: 'cabinet-outline', node: 2202, mesh: 1456, vertices: 24, prefix: 'K18_PHYSICAL_PREVIEW__R989_FLOOR_INTEGRATION_DERIVED_CLONE_2897_' }),
  ]),
});

/** Native R33 source GLB 3a226f98, 1F BOTH scene818 only. Scene819 lacks floor and mirror. */
export const R33_BATH_C_SOURCE = Object.freeze({
  sha256: '3a226f987d5605eff523029d580b760167ae4a32f13ddd51248fe933d913c54c',
  sceneIndex: 818,
  // R33 source-exact: same four node indices, meshes, POSITIONS, bounds and unique names.
  parts: R22_BATH_C_SOURCE.parts,
});

/** Native R34 BOTH normal scene822 only; exact R33 geometry and parent paths retained. */
export const R34_BATH_C_SOURCE = Object.freeze({
  sha256: '99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725',
  sceneIndex: 822,
  parts: R22_BATH_C_SOURCE.parts,
  parentPaths: Object.freeze([
    Object.freeze([13167, 12320]),
    Object.freeze([12408, 12407, 12406, 5786]),
    Object.freeze([13167, 1731]),
    Object.freeze([13466, 2202]),
  ]),
});

const reject = (reason) => ({ status: reason, applied: false, count: 0, dispose() {} });
const near = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= 0.002;

function reachableSceneNodes(json, sceneIndex) {
  const roots = json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)) return null;
  const seen = new Set();
  const stack = [...roots];
  while (stack.length) {
    const index = stack.pop();
    if (!Number.isInteger(index) || !json.nodes?.[index]) return null;
    if (seen.has(index)) continue;
    seen.add(index);
    const children = json.nodes[index].children || [];
    if (!Array.isArray(children)) return null;
    stack.push(...children);
  }
  return seen;
}

/**
 * Construct only when BOTH the verified original GLB and the exact 1F
 * source scene are active. THREE is injected to keep tests/render independent.
 * The returned handle removes every derived edge without altering the source.
 */
function createBathroomCEmphasis({
  glbSha256, sceneIndex, json, sceneRoot, associations, THREE, enabled = false,
} = {}, src) {
  if (!enabled) return reject('DISABLED');
  if (glbSha256 !== src.sha256 || sceneIndex !== src.sceneIndex)
    return reject('SOURCE_SCOPE_HOLD');
  if (!sceneRoot?.traverse || !THREE?.LineSegments || !THREE?.BufferGeometry ||
      !THREE?.Float32BufferAttribute || !THREE?.EdgesGeometry || !THREE?.LineBasicMaterial)
    return reject('RECEIVER_UNAVAILABLE');
  if (typeof associations?.get !== 'function') return reject('RENDER_ASSOCIATIONS_UNAVAILABLE');
  const reachable = reachableSceneNodes(json, src.sceneIndex);
  if (!reachable) return reject('SOURCE_SCENE_INVALID');
  // R34 is bound to its actual root-to-node paths, not just inherited names.
  if (src.parentPaths && !src.parentPaths.every(path =>
      json.scenes[src.sceneIndex].nodes.includes(path[0]) &&
      path.slice(1).every((node, index) => json.nodes[path[index]]?.children?.includes(node))))
    return reject('SOURCE_PARENT_PATH_MISMATCH');
  const targets = [];
  for (const part of src.parts) {
    const node = json?.nodes?.[part.node];
    if (!reachable.has(part.node) || node?.mesh !== part.mesh ||
        typeof node.name !== 'string' || !node.name.startsWith(part.prefix))
      return reject('SOURCE_NODE_MISMATCH');
    const primitive = json?.meshes?.[part.mesh]?.primitives;
    if (!Array.isArray(primitive) || primitive.length !== 1) return reject('SOURCE_PRIMITIVE_MISMATCH');
    const accessor = json?.accessors?.[primitive[0]?.attributes?.POSITION];
    if (accessor?.count !== part.vertices || accessor.type !== 'VEC3' ||
        !Array.isArray(accessor.min) || !Array.isArray(accessor.max))
      return reject('SOURCE_ACCESSOR_MISMATCH');

    // GLTFLoader uniquifies runtime names across the whole source. R34
    // contains same-name nodes 5786/5790, 829/1731/4239 and 1318/2202/4935.
    // Do not use a name fallback: the mounted object's source association
    // must identify the exact node, mesh and sole primitive.
    const matches = [];
    sceneRoot.traverse((obj) => {
      if (obj?.isMesh && associations.get(obj)?.nodes === part.node) matches.push(obj);
    });
    if (matches.length !== 1) return reject('RENDER_MESH_NOT_UNIQUE');
    const mesh = matches[0];
    const binding = associations.get(mesh);
    if (binding?.meshes !== part.mesh || binding?.primitives !== 0)
      return reject('RENDER_ASSOCIATION_MISMATCH');
    if (src.parentPaths) {
      const expected = src.parentPaths.find(path => path.at(-1) === part.node);
      let object = mesh;
      for (let i = expected.length - 1; i >= 0; i--) {
        if (!object || associations.get(object)?.nodes !== expected[i])
          return reject('RENDER_PARENT_PATH_MISMATCH');
        object = object.parent;
      }
      if (object !== sceneRoot) return reject('RENDER_PARENT_PATH_MISMATCH');
    }
    const positions = mesh.geometry?.getAttribute?.('position');
    if (positions?.count !== part.vertices || !mesh.add || !mesh.remove)
      return reject('RENDER_GEOMETRY_MISMATCH');
    mesh.geometry.computeBoundingBox?.();
    const box = mesh.geometry.boundingBox;
    if (!box || [0,1,2].some((axis) =>
      !near([box.min.x,box.min.y,box.min.z][axis], accessor.min[axis]) ||
      !near([box.max.x,box.max.y,box.max.z][axis], accessor.max[axis])))
      return reject('RENDER_BOUNDS_MISMATCH');
    targets.push({ part, mesh, box });
  }

  // Transactional validation above: never attach partial highlights.
  const overlays = [];
  try {
    for (const { part, mesh, box } of targets) {
      let geometry;
      if (part.role === 'floor-perimeter') {
        const x0 = box.min.x, x1 = box.max.x;
        const z0 = box.min.z, z1 = box.max.z;
        const y = box.max.y + 0.003;
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
          x0,y,z0, x1,y,z0, x1,y,z0, x1,y,z1,
          x1,y,z1, x0,y,z1, x0,y,z1, x0,y,z0,
        ], 3));
      } else {
        geometry = new THREE.EdgesGeometry(mesh.geometry, 22);
      }
      const attr = geometry.getAttribute('position');
      if (!attr || attr.count === 0 || attr.count > 160) {
        geometry.dispose?.();
        throw Error('DENSE_OR_EMPTY_EDGE_GUARD');
      }
      const material = new THREE.LineBasicMaterial({
        color: 0x204e52, transparent: true, opacity: 0.92,
        depthTest: true, depthWrite: false,
      });
      const line = new THREE.LineSegments(geometry, material);
      line.name = (src === R34_BATH_C_SOURCE ? 'R34_BATHROOM_C_' : src === R33_BATH_C_SOURCE ? 'R33_BATHROOM_C_' : 'R22_BATHROOM_C_') + part.role.toUpperCase();
      line.userData = { PresentationOnly: true, Canonical: false,
        WorkTest: true, sourceNodeIndex: part.node, sourceMeshIndex: part.mesh };
      line.renderOrder = 35;
      line.raycast = () => {}; // presentation line must never hijack model picking
      mesh.add(line); // inherits source/layer/scene visibility
      overlays.push({ mesh, line, geometry, material });
    }
  } catch (_) {
    for (const item of overlays) {
      item.mesh.remove(item.line); item.geometry.dispose?.(); item.material.dispose?.();
    }
    return reject('EDGE_BUILD_HOLD');
  }
  let disposed = false;
  return {
    status: 'WORK_TEST_C_VISIBLE',
    applied: true,
    count: overlays.length,
    roles: overlays.map(({ line }) => line.name),
    sourceVerified: true,
    physicalHostVerified: false,
    asBuiltClaim: false,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const item of overlays) {
        item.mesh.remove(item.line); item.geometry.dispose?.(); item.material.dispose?.();
      }
    },
  };
}

/** Existing R22 public API and WORK_TEST semantics are unchanged. */
export function createR22BathroomCEmphasis(options = {}) {
  return createBathroomCEmphasis(options, R22_BATH_C_SOURCE);
}
/** Verified R33 1F BOTH scene818 only, never scene819 or 2F. */
export function createR33BathroomCEmphasis(options = {}) {
  return createBathroomCEmphasis(options, R33_BATH_C_SOURCE);
}

/** Verified R34 BOTH normal scene822 only; service and 2F scenes remain disabled. */
export function createR34BathroomCEmphasis(options = {}) {
  return createBathroomCEmphasis(options, R34_BATH_C_SOURCE);
}
