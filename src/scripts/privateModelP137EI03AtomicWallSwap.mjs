/**
 * V4 candidate: fail-closed, in-memory I03 WALL surgery on the normal viewer scene.
 * No GLB, G2, CURRENT, canonical, physical XY or HUMAN_REVIEW promotion.
 *
 * The source's mesh406 is a combined 176-vertex carrier (22 rectangular wall
 * segments). Replacing that complete mesh with an additional scene69 wall
 * would duplicate walls or remove unrelated segments. Swap exactly one THREE
 * Mesh instance after proving 168/176 positions are unchanged, and retain all
 * current-scene siblings, child objects and transform.
 *
 * Call ONLY with independently SHA-verified source69 built from scene67.
 */
export const P137E_I03_NORMAL_INTEGRATION_QA_ID = 'scene69-source-bound-atomic';
const ROOT = 'P137E_SCENE69_THREE_SOURCE_CORNERS_AND_I03_FIELD_WORK_TEST_ROOT';
const CANDIDATE_WALL = 'P137E_FIELD_I03_WALL_WITH_THREE_SOURCE_CORNER_PATCHES';
const CORNER_PATCHES = 'P137E_THREE_CORNER_SOURCE_PATCHES';
const EPS = .0002;
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= EPS;
const fail = (code) => { throw new Error('P137E_I03_ATOMIC_WALL_SWAP_BLOCKED:' + code); };
const position = (object) => {
  const attr = object?.geometry?.getAttribute?.('position');
  if (!attr || attr.itemSize !== 3 || attr.count !== 176) fail('WALL_VERTEX_LAYOUT');
  return attr;
};
const bounds = (attr, start, count) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = start; i < start + count; i++) {
    for (let axis = 0; axis < 3; axis++) {
      const value = axis === 0 ? attr.getX(i) : axis === 1 ? attr.getY(i) : attr.getZ(i);
      if (!Number.isFinite(value)) fail('WALL_NONFINITE');
      lo[axis] = Math.min(lo[axis], value);
      hi[axis] = Math.max(hi[axis], value);
    }
  }
  return [...lo, ...hi];
};
const equalsBounds = (got, expected) => got.every((v, i) => close(v, expected[i]));
const sourceWallSignature = (attr) =>
  equalsBounds(bounds(attr, 128, 8), [5.098,4.206,0,6.306,4.286,2.76]) &&
  equalsBounds(bounds(attr, 64, 8), [6.266,-1.124,0,6.346,10.544,2.76]) &&
  equalsBounds(bounds(attr, 136, 8), [.231,5.032,0,6.306,5.112,2.76]);
const measuredSignature = (attr) =>
  equalsBounds(bounds(attr,128,8), [5.306,3.807,0,6.266,4.012,2.76]) &&
  equalsBounds(bounds(attr,64,8), [6.266,-1.124,0,6.346,10.544,2.76]) &&
  equalsBounds(bounds(attr,136,8), [.231,5.032,0,6.306,5.112,2.76]);

function sourceCornerSignature(object) {
  if (!object?.isMesh || object.name !== CORNER_PATCHES) fail('CORNER_IDENTITY');
  const attr = object.geometry?.getAttribute?.('position');
  const index = object.geometry?.getIndex?.();
  if (!attr || attr.itemSize !== 3 || attr.count !== 72 || index?.count !== 108)
    fail('CORNER_TOPOLOGY');
  for (let n = 0; n < 3; n++) {
    const b = bounds(attr, n * 24, 24);
    if (!close(b[3] - b[0], .04) || !close(b[4] - b[1], .04) ||
        !close(b[2], 0) || !close(b[5], 2.76)) fail('CORNER_SIZE');
  }
}

export function stageP137EI03NormalWallReplacement(currentScene, scene69) {
  if (!currentScene?.traverse || !scene69?.children ||
      scene69.name !== 'P137E D1F THREE SOURCE L CORNERS + MEASURED I03 WORK_TEST')
    fail('SCENE_IDENTITY');
  const roots = scene69.children.filter(n => n.name === ROOT);
  if (roots.length !== 1 || roots[0].children?.length !== 4 ||
      roots[0].userData?.sourceCornerGapsClosed !== 3 ||
      roots[0].userData?.fieldMeasurementsCurrent !== true ||
      roots[0].userData?.current !== false ||
      roots[0].userData?.publishToCURRENT !== false)
    fail('SOURCE69_CONTRACT');
  const candidate = roots[0].children[0];
  if (!candidate?.isMesh || candidate.name !== CANDIDATE_WALL ||
      candidate.children?.length !== 1) fail('CANDIDATE_WALL_IDENTITY');
  const patch = candidate.children[0];
  sourceCornerSignature(patch);
  const nextPositions = position(candidate);
  if (!measuredSignature(nextPositions)) fail('MEASURED_WALL_BOUNDS');

  // Match a unique actual wall carrier in the NORMAL current scene.
  // Do not mistake a named WORK_TEST root, another scene or a shared geometry
  // from source67 for the current in-scene wall to be removed.
  const matches = [];
  currentScene.traverse(object => {
    if (!object?.isMesh || !object.parent) return;
    const attr = object.geometry?.getAttribute?.('position');
    if (attr?.itemSize === 3 && attr.count === 176 && sourceWallSignature(attr)) matches.push(object);
  });
  if (matches.length !== 1) fail('NORMAL_WALL_UNIQUE_MATCH_' + matches.length);
  const old = matches[0];
  const originalPositions = position(old);
  for (let i = 0; i < 176; i++) {
    if (i >= 128 && i < 136) continue;
    if (!close(originalPositions.getX(i),nextPositions.getX(i)) ||
        !close(originalPositions.getY(i),nextPositions.getY(i)) ||
        !close(originalPositions.getZ(i),nextPositions.getZ(i)))
      fail('UNRELATED_WALL_VERTEX_DRIFT_' + i);
  }
  // Unchanged transform is mandatory. Otherwise scene69 patch vertices could
  // be presented in different coordinates than the normal building.
  currentScene.updateMatrixWorld(true);
  scene69.updateMatrixWorld(true);
  for (let i = 0; i < 16; i++)
    if (!close(old.matrixWorld.elements[i],candidate.matrixWorld.elements[i]))
      fail('WORLD_TRANSFORM_MISMATCH');
  if (old.children?.some(child => child.name === CORNER_PATCHES)) fail('ALREADY_PATCHED');
  const parent = old.parent;
  const index = parent.children.indexOf(old);
  if (index < 0 || parent === scene69) fail('PARENT_IDENTITY');

  // Prepare all resources BEFORE modifying the visible normal scene.
  const next = old.clone(true);
  next.geometry = candidate.geometry.clone();
  next.add(patch.clone(true));
  next.name = old.name;
  next.userData = { ...next.userData,
    i03IntegrationQa: P137E_I03_NORMAL_INTEGRATION_QA_ID,
    sourceXYBinding:'CONDITIONAL_UNVERIFIED',workTest:true,
    current:false,canonical:false,asBuilt:false,publishToCURRENT:false,
    HUMAN_REVIEW:'NOT_RUN' };
  try {
    parent.remove(old);
    parent.add(next);
    parent.children.splice(parent.children.indexOf(next),1);
    parent.children.splice(index,0,next);
    if (parent.children[index] !== next || old.parent ||
        next.children.filter(child => child.name === CORNER_PATCHES).length !== 1)
      fail('ATOMIC_POSTCONDITION');
    currentScene.updateMatrixWorld(true);
  } catch (error) {
    parent.remove(next);
    parent.add(old);
    parent.children.splice(parent.children.indexOf(old),1);
    parent.children.splice(index,0,old);
    currentScene.updateMatrixWorld(true);
    throw error;
  }
  return { originalDetached:true, insertedCount:1, untouchedVertices:168,
    sourceCorners:3, scene:currentScene, original:old, replacement:next,
    externalApproval:'NOT_RUN', current:false };
}
