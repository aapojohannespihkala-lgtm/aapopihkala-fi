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


/**
 * Fetch exact authenticated same-origin GLB bytes before passing an identity
 * assertion to selectVerifiedSharedSystemsScene. Do not accept a HEAD response,
 * published metadata, or a catalogue SHA as proof of the fetched full body.
 * No scene is changed; the verified raw bytes must be parsed by GLTFLoader after
 * this returns, and the resulting glTF passed into the scene selector.
 */
export async function fetchVerifiedSharedSystemsGlb({
  candidate,
  contract,
  origin = globalThis.location?.origin,
  fetchImpl = globalThis.fetch,
  cryptoSubtle = globalThis.crypto?.subtle,
}) {
  if (!candidate || !contract ||
      candidate.id !== contract.candidateId ||
      !Number.isSafeInteger(contract.expectedSizeBytes) ||
      contract.expectedSizeBytes < 20 ||
      !shaPattern.test(contract.expectedSha256) ||
      candidate.expectedSize !== contract.expectedSizeBytes ||
      candidate.expectedSha256 !== contract.expectedSha256) {
    fail('unverified-candidate-contract');
  }
  if (typeof origin !== 'string' || !/^https:\/\/[^/]+$/.test(origin) ||
      typeof candidate.path !== 'string' ||
      !/^\/(?!\/)[^?#\\\s]*$/.test(candidate.path) ||
      typeof fetchImpl !== 'function' ||
      typeof cryptoSubtle?.digest !== 'function') {
    fail('invalid-same-origin-fetch-settings');
  }
  let fetchUrl;
  try {
    fetchUrl = new URL(candidate.path, origin);
    if (fetchUrl.origin !== origin || fetchUrl.pathname !== candidate.path) {
      fail('path-canonicalization-or-origin-mismatch');
    }
  } catch {
    fail('invalid-candidate-url');
  }
  // No fallback to anonymous requests, redirects, CDN or stale cached bytes.
  const response = await fetchImpl(fetchUrl.href, {
    credentials: 'same-origin', mode: 'same-origin', redirect: 'error', cache: 'no-store',
  });
  if (!response?.ok || response.redirected || response.type === 'opaque' ||
      typeof response.arrayBuffer !== 'function') {
    fail('authenticated-source-fetch-failed');
  }
  if (typeof response.url === 'string' && response.url &&
      response.url !== fetchUrl.href) {
    fail('response-url-mismatch');
  }
  const bytes = await response.arrayBuffer();
  if (!(bytes instanceof ArrayBuffer) || bytes.byteLength !== contract.expectedSizeBytes ||
      bytes.byteLength < 20) {
    fail('full-body-size-mismatch');
  }
  const view = new DataView(bytes);
  if (view.getUint32(0, true) !== 0x46546c67 ||
      view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== bytes.byteLength ||
      view.getUint32(16, true) !== 0x4e4f534a ||
      view.getUint32(12, true) > bytes.byteLength - 20) {
    fail('glb2-header-mismatch');
  }
  const digest = await cryptoSubtle.digest('SHA-256', bytes);
  const actualSha256 = Array.from(new Uint8Array(digest), b =>
    b.toString(16).padStart(2, '0')).join('');
  if (actualSha256 !== contract.expectedSha256) fail('full-body-sha256-mismatch');
  return {
    verifiedBytes: bytes,
    verification: {
      candidateId: candidate.id,
      actualSizeBytes: bytes.byteLength,
      actualSha256,
    },
  };
}
