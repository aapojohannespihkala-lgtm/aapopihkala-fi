// Fail-closed scene selection for an authenticated, byte-verified shared WORK_TEST GLB.
// This helper does not fetch, hash, publish, or render bytes. Its caller MUST pass
// independent full-byte SHA-256 / length verification before invoking it.
// A valid file with default scene65 is NOT proof the appended shared scene is visible.
const shaPattern = /^[0-9a-f]{64}$/;
const isIndex = (n) => Number.isSafeInteger(n) && n >= 0;
const fail = (reason) => { throw new Error(`SHARED_WORK_TEST_SCENE_GATE: ${reason}`); };

export function selectVerifiedSharedSystemsScene({ candidate, verification, contract, gltf }) {
  if (!candidate || !verification || !contract || !gltf) fail('incomplete-arguments');
  if (typeof contract.candidateId !== 'string' || !contract.candidateId.startsWith('m5a-m5b-d1f-shared-systems-')) {
    fail('candidate-contract-id');
  }
  if (candidate.id !== contract.candidateId || verification.candidateId !== contract.candidateId) {
    fail('candidate-id-mismatch');
  }
  if (!isIndex(contract.expectedSizeBytes) || contract.expectedSizeBytes === 0 ||
      !shaPattern.test(contract.expectedSha256) ||
      !isIndex(verification.actualSizeBytes) ||
      !shaPattern.test(verification.actualSha256) ||
      verification.actualSizeBytes !== contract.expectedSizeBytes ||
      verification.actualSha256 !== contract.expectedSha256) {
    fail('full-byte-identity-mismatch');
  }
  if (candidate.expectedSize !== contract.expectedSizeBytes ||
      candidate.expectedSha256 !== contract.expectedSha256) {
    fail('catalog-source-mismatch');
  }
  const source = gltf.parser?.json;
  if (!source || !Array.isArray(source.scenes) || !Array.isArray(source.nodes) ||
      !Array.isArray(gltf.scenes)) fail('missing-glb-scene-table');
  if (!isIndex(source.scene) || !isIndex(contract.sourceDefaultSceneIndex) ||
      source.scene !== contract.sourceDefaultSceneIndex ||
      !isIndex(contract.combinedSceneIndex) ||
      contract.combinedSceneIndex <= source.scene ||
      contract.combinedSceneIndex >= source.scenes.length ||
      gltf.scenes.length !== source.scenes.length) {
    fail('source-scene-index-mismatch');
  }
  if (gltf.scene !== gltf.scenes[source.scene]) fail('default-scene-loader-drift');
  const sourceScene = source.scenes[contract.combinedSceneIndex];
  const renderedScene = gltf.scenes[contract.combinedSceneIndex];
  if (!renderedScene || typeof contract.combinedSceneName !== 'string' ||
      contract.combinedSceneName.length < 4 ||
      sourceScene?.name !== contract.combinedSceneName ||
      renderedScene.name !== contract.combinedSceneName) {
    fail('combined-scene-name-mismatch');
  }
  const sceneNodes = sourceScene.nodes;
  const required = contract.requiredRootNodeIndices;
  if (!Array.isArray(sceneNodes) || !Array.isArray(required) || required.length < 2 ||
      new Set(sceneNodes).size !== sceneNodes.length ||
      new Set(required).size !== required.length ||
      !required.every((node) => isIndex(node) && node < source.nodes.length &&
        sceneNodes.includes(node) && typeof source.nodes[node]?.name === 'string' && source.nodes[node].name.length > 0)) {
    fail('combined-scene-roots-mismatch');
  }
  // Never silently fall back to original default scene, first scene, or another candidate.
  return renderedScene;
}
