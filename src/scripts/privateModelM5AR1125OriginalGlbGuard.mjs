import { createHash } from 'node:crypto';
import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

// Only server-side bytes may establish original-GLB identity. Never infer
// authenticity from a viewer URL, screenshot, synthetic scene or caller claim.
export const R1125_ORIGINAL_GLB = Object.freeze({
  driveFileId: '13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs',
  sha256: 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
  bytes: 3112432,
  sceneIndex: 63,
  sourceTargetCount: 13,
});
const classContract = '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN';
const sourceKinds = m5aR1125SourcePixelKinds;
const expectedPalette = {
  wellGray: [0.62, 0.67, 0.72, 1],
  routeCyan: [0.09, 0.65, 0.82, 1],
  boundaryYellow: [0.92, 0.72, 0.16, 1],
};
const validRoles = {
  wellGray: new Set(['wellMarkerWork', 'wellDiameterPresentationWork']),
  routeCyan: new Set(['referenceRouteWork', 'pipeDiameterPresentationWork']),
  boundaryYellow: new Set(['unresolvedBoundaryMarker']),
};

const sourceKey = (extras) => {
  if (typeof extras?.G2IdCandidate === 'string') return extras.G2IdCandidate;
  if (extras?.representationKind === 'unresolvedBoundaryMarker') {
    return 'boundary:' + String(extras.boundaryRole ?? '');
  }
  return '';
};
const fail = (why) => { throw new Error('R1125 original GLB: ' + why); };

export function inspectM5AR1125Scene63Source(gltf) {
  const scene = gltf?.scenes?.[R1125_ORIGINAL_GLB.sceneIndex];
  const extras = scene?.extras ?? {};
  if (!Array.isArray(scene?.nodes) || !Array.isArray(gltf?.nodes) ||
      !Array.isArray(gltf?.meshes) || !Array.isArray(gltf?.materials) ||
      extras.sourceDiameterCorrectionContract !== 'G2_R1125' ||
      extras.sourceDiameterClassBreakdown !== classContract ||
      extras.Canonical !== false ||
      extras.presentationOnly !== true ||
      extras.workAssumption !== true ||
      extras.currentGeometryClaim !== false ||
      extras.asBuiltClaim !== false ||
      extras.publishToCURRENT !== false ||
      extras.humanReview !== 'NOT_RUN') fail('scene63 provenance/no-promotion mismatch');

  const seen = new Set();
  const found = new Map();
  const pending = [...scene.nodes];
  while (pending.length) {
    const index = pending.pop();
    if (!Number.isInteger(index) || index < 0 ||
        index >= gltf.nodes.length) fail('invalid scene node');
    if (seen.has(index)) continue;
    if (seen.size > 5000) fail('scene node limit exceeded');
    seen.add(index);
    const node = gltf.nodes[index], details = node?.extras ?? {};
    if (!node || !Array.isArray(node.children ?? [])) fail('malformed source node');
    const key = sourceKey(details);
    if (Object.hasOwn(sourceKinds, key)) {
      if (found.has(key)) fail('duplicate exact source: ' + key);
      const kind = sourceKinds[key];
      if (!validRoles[kind]?.has(details.representationKind) ||
          !['M5A-Z2', 'M5A-Z2D-R1036', 'M5A-Z2D-R1090'].includes(details.Pass) ||
          details.Canonical !== false ||
          details.presentationOnly !== true ||
          details.workAssumption !== true ||
          details.exactXYClaim !== false ||
          details.exactZClaim !== false ||
          details.currentGeometryClaim !== false ||
          details.asBuiltClaim !== false ||
          details.publishToCURRENT !== false) fail('unsafe source: ' + key);
      if (kind === 'boundaryYellow' &&
          (details.boundaryStatus !== 'UNRESOLVED_BOUNDARY' ||
           details.G2IdCandidate != null)) fail('boundary status/identity mismatch: ' + key);
      const mesh = gltf.meshes[node.mesh];
      if (!Array.isArray(mesh?.primitives) || mesh.primitives.length !== 1) {
        fail('missing or ambiguous source mesh: ' + key);
      }
      const primitive = mesh.primitives[0];
      const mode = primitive.mode ?? 4;
      if (mode !== (kind === 'boundaryYellow' ? 1 : 4)) {
        fail('original source primitive type mismatch: ' + key);
      }
      const color = gltf.materials[primitive.material]?.pbrMetallicRoughness?.baseColorFactor;
      if (!Array.isArray(color) || color.length !== 4 ||
          color.some((x, i) => !Number.isFinite(x) ||
            Math.abs(x - expectedPalette[kind][i]) > 0.0001)) {
        fail('original source palette mismatch: ' + key);
      }
      found.set(key, { key, kind, nodeIndex: index, primitiveMode: mode });
    }
    pending.push(...(node.children ?? []));
  }
  const expected = Object.keys(sourceKinds);
  if (found.size !== expected.length ||
      expected.some((key) => !found.has(key))) {
    fail('missing exact 13 source identities');
  }
  return {
    sourceSceneIndex: 63,
    sourceTargetCount: 13,
    sourceTargets: expected.map((key) => found.get(key)),
    requiredCounts: { wellGray: 4, routeCyan: 7, boundaryYellow: 2 },
    sourceShapeVerified: true,
    originalGlbDigestAuthenticated: false,
    productionScreenshotVerified: false,
    humanReview: 'NOT_RUN',
  };
}

export function authenticateM5AR1125OriginalGlb(rawBytes) {
  if (!(rawBytes instanceof Uint8Array) ||
      rawBytes.byteLength !== R1125_ORIGINAL_GLB.bytes) {
    fail('original raw byte length mismatch');
  }
  // Copy view respecting offsets, without interpreting any untrusted JSON.
  const bytes = Buffer.from(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);
  const actualDigest = createHash('sha256').update(bytes).digest('hex');
  if (actualDigest !== R1125_ORIGINAL_GLB.sha256) fail('original digest mismatch');
  if (bytes.toString('ascii', 0, 4) !== 'glTF' ||
      bytes.readUInt32LE(4) !== 2 ||
      bytes.readUInt32LE(8) !== bytes.length) fail('GLB header invalid');
  const jsonLength = bytes.readUInt32LE(12);
  const chunkType = bytes.readUInt32LE(16);
  if (chunkType !== 0x4e4f534a || jsonLength < 2 ||
      jsonLength % 4 !== 0 || 20 + jsonLength > bytes.length) {
    fail('GLB JSON chunk invalid');
  }
  let gltf;
  try { gltf = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength)); }
  catch { fail('GLB JSON malformed'); }
  const evidence = inspectM5AR1125Scene63Source(gltf);
  return {
    ...evidence,
    driveFileId: R1125_ORIGINAL_GLB.driveFileId,
    sha256: actualDigest,
    originalGlbDigestAuthenticated: true,
    productionScreenshotVerified: false,
    humanReview: 'NOT_RUN',
  };
}
