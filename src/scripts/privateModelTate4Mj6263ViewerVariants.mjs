// Opt-in scene selection adapter for the existing C80 viewer.
// This is staging code only. It neither registers a published model nor
// permits bypassing the source-exact receiver or the current viewer gates.
import {
  TATE4_MJ6263_SCENES,
  TATE4_MJ6263_SOURCE_SHA256,
  isTate4Mj62Mj63SourceScene,
} from './privateModelTate4Mj62Mj63SourceProfile.mjs';

export const TATE4_MJ6263_VIEWER_FLOORS = Object.freeze(['1F', '2F', 'BOTH']);
export const TATE4_MJ6263_GLAZING_STATES = Object.freeze(['CLOSED', 'ONE_OPEN', 'STACKED']);

// The glazing alternatives belong to the upper floor. A 1F-only view remains
// at scene353 regardless of its UI selection, avoiding a fabricated scene.
const SCENE_BY_VIEW = Object.freeze({
  '1F:CLOSED': 353, '1F:ONE_OPEN': 353, '1F:STACKED': 353,
  '2F:CLOSED': 354, '2F:ONE_OPEN': 356, '2F:STACKED': 358,
  'BOTH:CLOSED': 355, 'BOTH:ONE_OPEN': 357, 'BOTH:STACKED': 359,
});

export function tate4Mj6263SceneForView(floor, glazingState) {
  if (!TATE4_MJ6263_VIEWER_FLOORS.includes(floor) ||
      !TATE4_MJ6263_GLAZING_STATES.includes(glazingState)) return null;
  const sceneIndex = SCENE_BY_VIEW[`${floor}:${glazingState}`];
  const expected = TATE4_MJ6263_SCENES[sceneIndex];
  const effectiveGlazing = floor === '1F' ? 'CLOSED' : glazingState;
  if (!expected || expected.floor !== floor ||
      expected.glazing !== effectiveGlazing) return null;
  return sceneIndex;
}

export function tate4Mj6263SceneChoices() {
  return Object.freeze(Object.entries(TATE4_MJ6263_SCENES)
    .map(([index, scene]) => Object.freeze({
      sceneIndex: Number(index),
      floor: scene.floor,
      glazingState: scene.glazing,
      parentSceneIndex: scene.parent,
      status: 'WORK_TEST_HOST_HOLD',
    })));
}

// loadedSourceSha256 MUST be independently computed from the actual inner GLB
// bytes before this call. A ZIP hash, filename, parent GLB or UI selection
// cannot serve as the loaded source identity.
export function resolveTate4Mj6263ViewerSelection({
  floor, glazingState, loadedSourceSha256, gltfJson,
} = {}) {
  const sceneIndex = tate4Mj6263SceneForView(floor, glazingState);
  if (sceneIndex === null ||
      loadedSourceSha256 !== TATE4_MJ6263_SOURCE_SHA256) return null;
  const effectiveGlazing = floor === '1F' ? 'CLOSED' : glazingState;
  if (!isTate4Mj62Mj63SourceScene(
    gltfJson, loadedSourceSha256, sceneIndex, floor, effectiveGlazing,
  )) return null;
  return Object.freeze({
    sceneIndex,
    sceneName: gltfJson.scenes[sceneIndex].name,
    floor,
    requestedGlazing: glazingState,
    effectiveGlazing,
    glazingVisibleInView: floor !== '1F',
    loadedSourceSha256,
    status: 'WORK_TEST_HOST_HOLD',
    sourceLinksBindingVerified: false,
    productionWebGLVerified: false,
    humanReviewVerified: false,
    current: false,
    asBuilt: false,
  });
}
