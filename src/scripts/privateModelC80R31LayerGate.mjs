/**
 * Transfers the already authenticated R31 9e0bf34f review source identity to
 * the existing Layers owner. This is not another GLB parser or a publish gate.
 * Only the single four-view WORK_TEST source can opt in, after the caller's
 * createC80R31ViewSwitch() has verified ALL four original scenes.
 */
import {
  C80_R31_9E0B_WORK_TEST_ID,
  C80_R31_9E0B_SOURCE,
  C80_R31_9E0B_VIEWS,
} from './privateModelC80R31ReviewRuntime.mjs';

export function isAuthenticatedC80R31LayerSession(gltf, loadedSha, session) {
  const source = C80_R31_9E0B_SOURCE;
  const first = C80_R31_9E0B_VIEWS.dNormal;
  return session?.r31ViewsVerified === true &&
    session?.candidateId === C80_R31_9E0B_WORK_TEST_ID &&
    session?.contract === source &&
    session?.gltf === gltf &&
    session?.defaultRoot === gltf?.scene &&
    session?.sceneIndex === first.sceneIndex &&
    session?.authenticatedSha === loadedSha &&
    loadedSha === source.glbSha256 &&
    gltf?.scenes?.length === source.sceneCount &&
    gltf?.scenes?.[first.sceneIndex] === gltf.scene &&
    Object.keys(C80_R31_9E0B_VIEWS).length === 4;
}
