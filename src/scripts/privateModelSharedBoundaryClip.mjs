/**
 * T04: source-verified C/D shared boundary, viewer-only floor clipping.
 *
 * Source: Ylisrinne D-floor plan, T04/SIJ062, G2 local 1F/2F Z=2.760m.
 * This is a geometry-free half-space calculator, NOT a viewer integration.
 * It does not create proxies, mutate source mesh/materials or infer a G1
 * transform from a mesh name or raw world-Y coordinate.
 *
 * The caller must first verify the selected ZIP SHA, the source objectKey,
 * the active SHARED_CD/BOTH metadata, and the G1-local-to-world matrix.
 * Result plane is in Three.js Plane form (normal, constant): clipped when
 * normal·worldPosition + constant > 0 (the opposite half is kept).
 * Install on a target-specific material clone, NOT the global renderer
 * clippingPlanes, so neighboring apartments cannot be clipped.
 */
export const G2_CD_FLOOR_SPLIT_Z_M = 2.760;

const fail = reason => ({ ok: false, reason, plane: null });
const validSha = x => typeof x === 'string' && /^[a-f0-9]{64}$/i.test(x);

export function deriveSharedCdFloorPlane({
  floor, source, expectedZipSha256, expectedObjectKey,
  g1LocalToWorld, matrixReference,
} = {}) {
  if (!['WHOLE', 'BOTH', '1F', '2F'].includes(floor)) return fail('INVALID_FLOOR');
  if (!source || !validSha(expectedZipSha256) ||
      !validSha(source.zipSha256) ||
      source.zipSha256.toLowerCase() !== expectedZipSha256.toLowerCase() ||
      !expectedObjectKey || source.objectKey !== expectedObjectKey) {
    return fail('SOURCE_IDENTITY_NOT_VERIFIED');
  }
  if (source.apartmentScope !== 'SHARED_CD' ||
      source.storeyScope !== 'BOTH' ||
      source.role !== 'SHARED_BOUNDARY' ||
      source.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST') {
    return fail('SOURCE_SCOPE_NOT_VERIFIED');
  }

  // WHOLE and D+BOTH reuse exactly one original mesh, with no clip plane.
  if (floor === 'WHOLE' || floor === 'BOTH') {
    return { ok: true, reason: 'SOURCE_ORIGINAL', floor, plane: null };
  }

  if (matrixReference !== 'G1_LOCAL_TO_WORLD' ||
      !Array.isArray(g1LocalToWorld) ||
      g1LocalToWorld.length !== 16 ||
      g1LocalToWorld.some(x => !Number.isFinite(x)) ||
      Math.abs(g1LocalToWorld[3]) > 1e-9 ||
      Math.abs(g1LocalToWorld[7]) > 1e-9 ||
      Math.abs(g1LocalToWorld[11]) > 1e-9 ||
      Math.abs(g1LocalToWorld[15] - 1) > 1e-9) {
    return fail('UNVERIFIED_G1_WORLD_TRANSFORM');
  }

  // glTF/Three Matrix4.elements is column-major. G1 has local Z up.
  // Inverse-transpose of the affine 3x3 transports the local +Z normal.
  const m = g1LocalToWorld;
  const ax = m[0], ay = m[1], az = m[2];
  const bx = m[4], by = m[5], bz = m[6];
  const cx = m[8], cy = m[9], cz = m[10];
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const det = nx * cx + ny * cy + nz * cz;
  const normalLength = Math.hypot(nx, ny, nz);
  if (!Number.isFinite(det) || !Number.isFinite(normalLength) ||
      Math.abs(det) < 1e-10 || normalLength < 1e-10) {
    return fail('SINGULAR_G1_WORLD_TRANSFORM');
  }

  // det sign is necessary for mirrored/reflected local coordinate frames.
  const upSign = Math.sign(det);
  const worldUp = [upSign * nx / normalLength,
                   upSign * ny / normalLength,
                   upSign * nz / normalLength];
  const z = G2_CD_FLOOR_SPLIT_Z_M;
  const cutPoint = [m[8] * z + m[12],
                    m[9] * z + m[13],
                    m[10] * z + m[14]];
  const keepLower = floor === '1F';
  const normal = worldUp.map(v => keepLower ? v : -v);
  const constant = -normal.reduce((sum, value, i) => sum + value * cutPoint[i], 0);

  if (!normal.every(Number.isFinite) || !Number.isFinite(constant)) {
    return fail('INVALID_WORLD_PLANE');
  }
  return {
    ok: true,
    reason: 'T04_VIEW_ONLY_REFERENCE_PLANE',
    floor,
    plane: { normal, constant },
    sourceObjectKey: source.objectKey,
    // This is the G2 reference level, not a measured floor thickness.
    referenceLocalZ: G2_CD_FLOOR_SPLIT_Z_M,
  };
}
