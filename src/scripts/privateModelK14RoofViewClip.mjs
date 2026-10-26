/**
 * K14 scene32: NON-DESTRUCTIVE VIEW-ONLY D roof X-band clip candidate.
 *
 * Source: owner §10 K14 scene30->32 roof world bounds, G1c apartment modules
 * and D-view P2 R5 eight unresolved K14 gable/roof/rake/fascia nodes.
 *
 * This is a pure plane calculator, NOT a renderer adapter or authorization
 * to override UNKNOWN/UNCLASSIFIED source scopes. It does not inspect ZIP/GLB
 * bytes or attest that any caller-supplied source approval is authentic.
 * Unknown roof ownership, slice geometry and roof overhangs remain HOLD.
 * Only externally reviewed source evidence may provide a D band. Even then
 * callers MUST NOT render with these planes until a separate source gate
 * and real-model browser regression explicitly permit presentation.
 *
 * Three.js clips negative signed plane distances. The kept X band therefore
 * lies on the nonnegative side of BOTH returned planes (clipIntersection=false).
 */
export const R4E_K14_SOURCE_LOCK = Object.freeze({
  zipSha256: 'e840c5fa14c0f919aa9617fdd9cd3ae144f511e5e0a023641e6599431b074807',
  glbSha256: '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680',
  sceneIndex: 32,
  roofNodeIndex: 2764,
  roofWorldG1X: Object.freeze([-0.600, 13.250]),
  // G1 reference zone, not a measured roof ownership/split line.
  dcBoundaryReferenceX: Object.freeze([6.250, 6.500]),
});
export const K14_EIGHT_UNRESOLVED = Object.freeze([
  2762, 2763, 2764, 2765, 2784, 2785, 2786, 2787,
]);
const sha = x => typeof x === 'string' && /^[a-f0-9]{64}$/i.test(x);
const sameSha = (a, b) => sha(a) && sha(b) && a.toLowerCase() === b.toLowerCase();
const finite = x => typeof x === 'number' && Number.isFinite(x);
const fail = reason => Object.freeze({
  ok: false, status: 'K14_HOLD', reason, planes: [],
  canApplyToViewer: false, canPublish: false, physicalRoofVerified: false,
});
const staging = (status, more = {}) => ({
  ok: true, status, canApplyToViewer: false, canPublish: false,
  physicalRoofVerified: false, ...more,
});

/** A world-space THREE.Plane style point-and-normal pair for local G1 X. */
function localXNormalAndPoint(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 16 || !matrix.every(finite) ||
      Math.abs(matrix[3]) > 1e-10 || Math.abs(matrix[7]) > 1e-10 ||
      Math.abs(matrix[11]) > 1e-10 || Math.abs(matrix[15] - 1) > 1e-10) return null;
  // glTF/Three Matrix4.elements is COLUMN-MAJOR; Y and Z are basis columns.
  const cross = [
    matrix[5] * matrix[10] - matrix[6] * matrix[9],
    matrix[6] * matrix[8] - matrix[4] * matrix[10],
    matrix[4] * matrix[9] - matrix[5] * matrix[8],
  ];
  const det = matrix[0] * cross[0] + matrix[1] * cross[1] + matrix[2] * cross[2];
  const len = Math.hypot(...cross);
  if (!finite(det) || !finite(len) || Math.abs(det) < 1e-10 || len < 1e-10)
    return null;
  const normal = cross.map(v => v * Math.sign(det) / len);
  return { normal, pointAt: x => [
    matrix[0] * x + matrix[12],
    matrix[1] * x + matrix[13],
    matrix[2] * x + matrix[14],
  ] };
}
const signedPlane = (normal, point) => ({
  normal, constant: -normal.reduce((sum, n, i) => sum + n * point[i], 0),
});

/**
 * @param {object} input
 * @param {'WHOLE'|'D_BOTH'|'D_1F'|'D_2F'} input.view
 * @param {object} input.model - Selected R4E scene32 exact ZIP+GLB identity.
 * @param {object} input.source - Selected renderable source node identity.
 * @param {object} input.sliceProof - Optional separately approved G1 X band.
 * @param {number[]} input.g1LocalToWorld - Verified affine glTF Matrix4.elements.
 * @param {'G1_LOCAL_TO_WORLD'} input.matrixReference
 */
export function deriveK14RoofViewClip(input = {}) {
  if (!input || typeof input !== 'object') return fail('INVALID_INPUT');
  const { view, model, source, sliceProof, g1LocalToWorld, matrixReference } = input;
  if (!['WHOLE', 'D_BOTH', 'D_1F', 'D_2F'].includes(view))
    return fail('INVALID_VIEW');
  if (!model || model.sceneIndex !== R4E_K14_SOURCE_LOCK.sceneIndex ||
      !sameSha(model.zipSha256, R4E_K14_SOURCE_LOCK.zipSha256) ||
      !sameSha(model.glbSha256, R4E_K14_SOURCE_LOCK.glbSha256))
    return fail('SELECTED_MODEL_SHA_MISMATCH');
  if (!source || source.nodeIndex !== R4E_K14_SOURCE_LOCK.roofNodeIndex ||
      typeof source.objectKey !== 'string' || !source.objectKey.trim() ||
      source.apartmentScope !== 'D' ||
      source.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST' ||
      source.storeyScope !== 'UNKNOWN' || source.role !== 'UNCLASSIFIED' ||
      source.k14SourceStatus !== 'HOLD_STOREY_ROLE')
    return fail('K14_ROOF_SOURCE_IDENTITY_NOT_VERIFIED');

  // WHOLE is never a synthetic D rendering. Keep the selected source intact.
  if (view === 'WHOLE') return staging('WHOLE_UNCHANGED', { planes: [] });
  // A floor-by-floor interior view must not show an upper roof/occluder at all.
  if (view === 'D_1F' || view === 'D_2F')
    return staging('D_FLOOR_ROOF_HIDDEN', { planes: [], keepSourceVisible: false });
  // D_BOTH is explicitly blocked on current R4E until source split is reviewed.
  if (!sliceProof || sliceProof.status !== 'SOURCE_APPROVED_X_BAND' ||
      !sameSha(sliceProof.zipSha256, model.zipSha256) ||
      sliceProof.nodeIndex !== source.nodeIndex ||
      sliceProof.sourceObjectKey !== source.objectKey ||
      sliceProof.apartmentSijId !== 'SIJ033' ||
      sliceProof.boundarySijId !== 'SIJ062' ||
      sliceProof.purpose !== 'VIEW_ONLY_NOT_AS_BUILT' ||
      !Array.isArray(sliceProof.sourceDocIds) ||
      !sliceProof.sourceDocIds.includes('DOC:1etsXWpaOUnY8cI9E6anaiqTifO_IXnY3b12CbjHV0TU') ||
      !sliceProof.sourceDocIds.includes('DOC:1wSF0UmWRf7mhtwr-mTDugJNJoAZmH82Wys6V-D4yeYI'))
    return fail('K14_EIGHT_HOLD_SOURCE_GATE');

  const minX = sliceProof.minX, maxX = sliceProof.maxX;
  const [roofMin, roofMax] = R4E_K14_SOURCE_LOCK.roofWorldG1X;
  const [seamMin, seamMax] = R4E_K14_SOURCE_LOCK.dcBoundaryReferenceX;
  if (!finite(minX) || !finite(maxX) || minX >= maxX ||
      minX < roofMin - 1e-6 || minX > 0.25 ||
      maxX < seamMin || maxX > seamMax ||
      maxX > roofMax)
    return fail('K14_SOURCE_BAND_OUTSIDE_REFERENCE');

  if (matrixReference !== 'G1_LOCAL_TO_WORLD')
    return fail('G1_TRANSFORM_NOT_VERIFIED');
  const basis = localXNormalAndPoint(g1LocalToWorld);
  if (!basis) return fail('G1_TRANSFORM_SINGULAR_OR_INVALID');
  const left = signedPlane([...basis.normal], basis.pointAt(minX));
  const right = signedPlane(basis.normal.map(v => -v), basis.pointAt(maxX));
  if (![...left.normal, left.constant, ...right.normal, right.constant].every(finite))
    return fail('INVALID_WORLD_PLANES');

  return staging('STAGING_ONLY_SOURCE_APPROVAL_NOT_INDEPENDENTLY_ATTESTED', {
    planes: [left, right], sourceObjectKey: source.objectKey,
    sourceNodeIndex: source.nodeIndex, referenceLocalBandX: [minX, maxX],
    keepSourceVisible: false, // A separate renderer/QA gate must decide.
    needsExternalProofVerification: true,
  });
}
