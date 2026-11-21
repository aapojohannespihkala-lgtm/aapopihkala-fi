// Headless desktop navigation intent. The authenticated source receiver and
// viewer own the scene, camera and layers; this module never mutates them.
export const DESKTOP_SCOPE_KEYS = Object.freeze([
  'd-1f', 'd-2f', 'd', 'd-roof', 'building', 'systems',
]);

export const DESKTOP_CAMERA_KEYS = Object.freeze([
  '3d', 'isometric', 'elev-pos-y', 'elev-neg-y', 'elev-pos-x', 'elev-neg-x',
]);

export const DEFAULT_DESKTOP_NAVIGATION = Object.freeze({
  scope: 'd',
  camera: '3d',
});

// A roofless D is the initial UI *intent*, not a mutation of glTF default.
// The systems preset requires its own source-bound route: electrical alone
// must not be misrepresented as all mechanical/electrical systems.
const SCOPE_INTENTS = Object.freeze({
  'd-1f': Object.freeze({ standardPreset: 'd-1f', roof: 'hidden' }),
  'd-2f': Object.freeze({ standardPreset: 'd-2f', roof: 'hidden' }),
  d: Object.freeze({ standardPreset: 'd-apartment', roof: 'hidden' }),
  'd-roof': Object.freeze({ standardPreset: 'd-apartment', roof: 'visible' }),
  building: Object.freeze({ standardPreset: 'whole-building', roof: 'visible' }),
  systems: Object.freeze({ standardPreset: null, roof: 'source-defined' }),
});

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isScope = (value) => typeof value === 'string' && hasOwn(SCOPE_INTENTS, value);
const isCamera = (value) => DESKTOP_CAMERA_KEYS.includes(value);

function hasVerifiedSource(profile) {
  // Flags can only be issued by the existing authenticated viewer receiver.
  // The UI must still verify the actual SHA/scene/node/parent before mounting.
  return profile != null &&
    profile.sourceBound === true &&
    profile.availableInViewer === true &&
    typeof profile.candidateId === 'string' &&
    profile.candidateId.trim().length > 0 &&
    typeof profile.glbSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(profile.glbSha256) &&
    typeof profile.sceneName === 'string' &&
    /^__scene[0-9]+$/.test(profile.sceneName) &&
    Number.isSafeInteger(profile.gltfSceneIndex) &&
    profile.gltfSceneIndex >= 0 &&
    (profile.sourceKind === 'WORK_TEST' || profile.sourceKind === 'CURRENT') &&
    Array.isArray(profile.supportedCameras) &&
    profile.supportedCameras.every(isCamera);
}

/**
 * Pure, fail-closed intent resolver for the owner-approved desktop toolbar.
 *
 * Exactly one of selection.scope or selection.camera changes per call.
 * A scope change preserves the camera selection, and vice versa. It never
 * guesses a missing verified source or silently substitutes another angle.
 *
 * sceneName (__sceneN) and gltfSceneIndex are deliberately INDEPENDENT.
 * The publisher/viewer must separately authorize SHA, scene roots and layers.
 */
export function resolveDesktopNavigation({ state = DEFAULT_DESKTOP_NAVIGATION, selection, profiles } = {}) {
  if (!isScope(state?.scope) || !isCamera(state?.camera)) {
    return { ok: false, reason: 'INVALID_STATE' };
  }
  if (!selection || typeof selection !== 'object' ||
      (hasOwn(selection, 'scope') === hasOwn(selection, 'camera')) ||
      Object.keys(selection).some((key) => key !== 'scope' && key !== 'camera')) {
    return { ok: false, reason: 'INVALID_SELECTION' };
  }

  const scope = hasOwn(selection, 'scope') ? selection.scope : state.scope;
  const camera = hasOwn(selection, 'camera') ? selection.camera : state.camera;
  if (!isScope(scope) || !isCamera(camera)) {
    return { ok: false, reason: 'UNKNOWN_PRESET' };
  }

  const profile = profiles && hasOwn(profiles, scope) ? profiles[scope] : null;
  if (!hasVerifiedSource(profile)) {
    return { ok: false, reason: 'SOURCE_NOT_VERIFIED' };
  }
  if (!profile.supportedCameras.includes(camera)) {
    return { ok: false, reason: 'CAMERA_NOT_AVAILABLE' };
  }
  const config = SCOPE_INTENTS[scope];

  return {
    ok: true,
    nextState: { scope, camera },
    intent: {
      scope,
      camera,
      standardPreset: config.standardPreset,
      roof: config.roof,
      candidateId: profile.candidateId,
      glbSha256: profile.glbSha256,
      sourceKind: profile.sourceKind,
      sceneName: profile.sceneName,
      gltfSceneIndex: profile.gltfSceneIndex,
      // NOT a publication, authorization or geometry change.
      verifiedBy: 'EXTERNAL_VIEWER_RECEIVER_REQUIRED',
    },
  };
}
