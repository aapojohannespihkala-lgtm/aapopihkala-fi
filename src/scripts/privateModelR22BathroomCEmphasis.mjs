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
export function createR22BathroomCEmphasis({
  glbSha256, sceneIndex, json, sceneRoot, THREE, enabled = false,
} = {}) {
  if (!enabled) return reject('DISABLED');
  const src = R22_BATH_C_SOURCE;
  if (glbSha256 !== src.sha256 || sceneIndex !== src.sceneIndex)
    return reject('SOURCE_SCOPE_HOLD');
  if (!sceneRoot?.traverse || !THREE?.LineSegments || !THREE?.BufferGeometry ||
      !THREE?.Float32BufferAttribute || !THREE?.EdgesGeometry || !THREE?.LineBasicMaterial)
    return reject('RECEIVER_UNAVAILABLE');
  const reachable = reachableSceneNodes(json, src.sceneIndex);
  if (!reachable) return reject('SOURCE_SCENE_INVALID');
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

    const matches = [];
    sceneRoot.traverse((obj) => {
      if (obj?.isMesh && obj.name === node.name) matches.push(obj);
    });
    if (matches.length !== 1) return reject('RENDER_MESH_NOT_UNIQUE');
    const mesh = matches[0];
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
      line.name = 'R22_BATHROOM_C_' + part.role.toUpperCase();
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
