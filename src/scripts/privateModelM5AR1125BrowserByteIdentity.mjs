/**
 * Browser-native raw-byte identity gate for the immutable R1125 scene63 GLB.
 * This is a transport-independent Web Crypto preflight, not geometry, canvas,
 * production-origin or human-review evidence. Never trust a caller-supplied hash.
 * The existing Node-only detailed structural validator remains authoritative
 * for node/mesh/source geometry inspection.
 */
export const M5A_R1125_RAW_BYTE_LENGTH = 3_112_432;
export const M5A_R1125_RAW_SHA256 =
  'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48';

const fail = reason => { throw new Error('R1125_BROWSER_RAW_IDENTITY: ' + reason); };
const snapshotBytes = raw => {
  if (!(raw instanceof Uint8Array) && !(raw instanceof ArrayBuffer)) {
    fail('ArrayBuffer or Uint8Array required');
  }
  // A caller may hold a mutable network response buffer (including a view
  // with a nonzero offset). Freeze the evidence by copying only that view.
  const view = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  return Uint8Array.from(view);
};

/** Standard Web Crypto SHA-256, without Node.js crypto or Buffer imports. */
export async function sha256M5AR1125BrowserBytes(raw) {
  const bytes = snapshotBytes(raw);
  if (typeof globalThis.crypto?.subtle?.digest !== 'function') {
    fail('native secure-context Web Crypto is required');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Requires an exact original-source 3,112,432-byte payload and hardcoded digest.
 * The returned proof confirms BYTES ONLY; it cannot establish that a particular
 * Three.js scene, camera, source mesh or viewer rendered those bytes.
 */
export async function verifyM5AR1125BrowserByteIdentity(raw) {
  const bytes = snapshotBytes(raw);
  if (bytes.byteLength !== M5A_R1125_RAW_BYTE_LENGTH) {
    fail('original byte length mismatch');
  }
  if (await sha256M5AR1125BrowserBytes(bytes) !== M5A_R1125_RAW_SHA256) {
    fail('immutable original SHA-256 mismatch');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = at => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (tag(0) !== 'glTF' || view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== bytes.byteLength) {
    fail('invalid original GLB v2 envelope');
  }
  const jsonLength = view.getUint32(12, true);
  const binHeader = 20 + jsonLength;
  if (tag(16) !== 'JSON' || jsonLength === 0 || jsonLength % 4 ||
      binHeader + 8 > bytes.byteLength ||
      tag(binHeader + 4) !== 'BIN\0' ||
      binHeader + 8 + view.getUint32(binHeader, true) !== bytes.byteLength) {
    fail('invalid original GLB JSON/BIN chunk bounds');
  }

  return Object.freeze({
    originalGlbDigestAuthenticated: true,
    originalSourceDigest: M5A_R1125_RAW_SHA256,
    sourceGlbByteLength: M5A_R1125_RAW_BYTE_LENGTH,
    expectedSceneIndex: 63,
    sourceObjectAssociationVerified: false,
    sourceGeometryVerifiedByThisGate: false,
    authenticatedProductionTransportVerified: false,
    viewerAutoloadVerified: false,
    productionCanvasPixelsVerified: false,
    individualSourcePixelsVerified: false,
    humanReview: 'NOT_RUN',
    current: false,
    canonical: false,
    asBuilt: false,
    publishToCURRENT: false,
  });
}
