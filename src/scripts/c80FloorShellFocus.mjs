/**
 * Optional source-presentation-only interior focus for exact D_C80 WORK_TEST GLB.
 * Default intended hook: after an existing C80 bridge mounts gltf.scenes[1/2].
 * Does not edit geometry, materials, transforms, scene routing or other floor layers.
 * Deliberately not an implementation of the separate K17 selective GROUP hide.
 */
const GLB_SHA = 'c8230e1877a2fc2cd0c633c5247a92975b4669ae685f491fad9f45092fc11b8d';
const SCENES = Object.freeze({
  1: 'D_1F_C80_SOURCE_PRESENTATION_WORK_TEST_HOST_HOLD',
  2: 'D_2F_C80_SOURCE_PRESENTATION_WORK_TEST_HOST_HOLD',
});
const COUNTS = Object.freeze({1: 8, 2: 7});
const K17_COUNT = 14;
const TYPES = new Set(['SOURCE_CONTEXT', 'SOURCE_REFERENCE_PLANE_NOT_SLAB']);
const PREFIX = 'C80_SOURCE_CONTEXT__';
const CONNECTOR = 'SOURCE_CONNECTOR_CONTEXT_NOT_FLOOR_ASSIGNMENT';

export function createC80FloorShellFocus({gltf, verifiedSourceSHA256}) {
  // Guard against 2015 plans, C70, a derivative, a future C81, or a partially
  // loaded/renamed scene. Don't quietly use floor labels as authorization.
  const json = gltf?.parser?.json;
  const safe = verifiedSourceSHA256 === GLB_SHA &&
    json?.asset?.version === '2.0' && json?.scene === 0 &&
    Array.isArray(json?.scenes) && json.scenes.length === 4 &&
    Array.isArray(gltf?.scenes) && gltf.scenes.length === 4 &&
    [1, 2].every(i => json.scenes[i]?.name === SCENES[i] && gltf.scenes[i]?.name === SCENES[i]);
  if (!safe) return Object.freeze({ok:false, reason:'C80_EXACT_GLTF_SCENE_AND_SHA_GUARD', apply(){return false;}, restore(){}});

  const floorShell = new Map();
  for (const index of [1, 2]) {
    const shell = [], k17 = [];
    gltf.scenes[index].traverse(o => {
      if (!o?.isMesh || !o.name?.startsWith(PREFIX)) return;
      const kind = o.userData?.representationKind;
      if (TYPES.has(kind)) shell.push(o);
      else if (kind === CONNECTOR) k17.push(o);
    });
    if (shell.length !== COUNTS[index] || k17.length !== K17_COUNT ||
        new Set([...shell,...k17]).size !== shell.length + k17.length ||
        shell.some(o => o.userData?.current !== false || o.userData?.physicalStructureApproved !== false) ||
        k17.some(o => o.userData?.current !== false || o.userData?.physicalStructureApproved !== false)) {
      return Object.freeze({ok:false, reason:`SOURCE_CONTEXT_IDENTITY_FAILED_SCENE${index}`, apply(){return false;}, restore(){}});
    }
    floorShell.set(index, shell);
  }

  const baseline = new Map();
  let active = null;
  const restore = () => {
    // Revert only the precise nodes whose visible bit we changed. Preserve
    // another controller's K17 mutations, scene mounts, all source transforms.
    for (const [node, original] of baseline) node.visible = original;
    baseline.clear(); active=null;
  };
  const apply = (index, mode = 'FOCUS') => {
    if (![1,2].includes(index) || !['FOCUS','SOURCE'].includes(mode)) return false;
    restore();
    if (mode === 'FOCUS') {
      for (const node of floorShell.get(index)) {
        baseline.set(node, node.visible);
        node.visible = false;
      }
    }
    active = {index, mode};
    return true;
  };
  return Object.freeze({ok:true, glbSHA256:GLB_SHA, scenes:[1,2], shellCounts:{1:8,2:7},
    k17Counts:{1:14,2:14}, apply, restore, dispose:restore,
    get active(){return active && {...active}}});
}
