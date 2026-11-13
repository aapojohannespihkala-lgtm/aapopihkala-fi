// Source-exact scene selection for the already built TATE4+MJ62+MJ63R2 GLB.
// This module prepares a guarded viewer target. It does not publish, load a
// GLB, authenticate a request, promote CURRENT/as-built, or claim WebGL proof.
import {
  TATE4_MJ6263_SOURCE_SHA256,
  TATE4_MJ6263_SCENES,
  isTate4Mj62Mj63SourceScene,
} from './privateModelTate4Mj62Mj63SourceProfile.mjs';

export const TATE4_MJ6263_VIEW_FLOORS = Object.freeze(['1F', '2F', 'BOTH']);
export const TATE4_MJ6263_GLAZING_STATES = Object.freeze([
  'CLOSED', 'ONE_OPEN', 'STACKED',
]);

// Deliberately read the real glTF scene indices from the SHA-locked profile,
// never from a ZIP filename ending in __sceneN or a viewer presentation index.
export function selectTate4Mj6263InternalScene(floor, glazingState = 'CLOSED') {
  if (!TATE4_MJ6263_VIEW_FLOORS.includes(floor) ||
      !TATE4_MJ6263_GLAZING_STATES.includes(glazingState)) return null;
  // An upper-floor glazing change must not blank the 1F-only view.
  // 1F always uses the actual CLOSED scene353; no invented 1F scene.
  const effectiveGlazingState = floor === '1F' ? 'CLOSED' : glazingState;
  const matches = Object.entries(TATE4_MJ6263_SCENES)
    .filter(([, scene]) => scene.floor === floor && scene.glazing === effectiveGlazingState);
  return matches.length === 1 ? Number(matches[0][0]) : null;
}

// A non-null result still requires the existing authenticated loader to
// verify the COMPLETE raw GLB SHA256 before calling this function.
export function resolveTate4Mj6263ViewerScene({
  sourceJson = null,
  loadedGlbSha256 = null,
  floor = null,
  glazingState = 'CLOSED',
} = {}) {
  const sceneIndex = selectTate4Mj6263InternalScene(floor, glazingState);
  if (sceneIndex === null)
    return { ok: false, reason: 'M6263_UNSUPPORTED_FLOOR_GLAZING' };
  if (loadedGlbSha256 !== TATE4_MJ6263_SOURCE_SHA256)
    return { ok: false, reason: 'M6263_SOURCE_SHA_MISMATCH' };
  const effectiveGlazingState = floor === '1F' ? 'CLOSED' : glazingState;
  if (!isTate4Mj62Mj63SourceScene(
    sourceJson, loadedGlbSha256, sceneIndex, floor, effectiveGlazingState,
  ))
    return { ok: false, reason: 'M6263_SOURCE_SCENE_MISMATCH' };
  return {
    ok: true,
    sceneIndex,
    floor,
    glazingState,
    effectiveGlazingState,
    glazingVisibleInView: floor !== '1F',
    glbSha256: TATE4_MJ6263_SOURCE_SHA256,
    modelStage: 'WORK_TEST',
    hostStatus: 'HOST_HOLD',
    current: false,
    asBuilt: false,
    productionWebGL: 'NOT_RUN',
    humanReview: 'NOT_RUN',
  };
}
