/**
 * R32H T12 northwest (CD west north) downpipe, isolated 3D COW work candidate.
 *
 * Source exact: original R32H c26d99c1, scene814/815, node13801, mesh5207.
 * The T12 source used SW grade -0.36 m for BOTH west downpipes. The original
 * SCALGO surface is approximately -0.348 m at SW but -0.041/+0.034 m at NW.
 * The NW pipe's lowest mesh vertex is -0.32821 m while the candidate Merika
 * splash grate is at +0.109 m. The 25.4.2026 owner photo shows a free outlet
 * ABOVE the grate. The target 20 mm lower-lip clearance is ONLY a WORK_TEST
 * modeling choice, not a measured distance or an as-built assertion.
 *
 * This pure utility does not modify a GLB, its source geometry or a viewer.
 * An authorized receiver may clone the exact source mesh and use the returned
 * positions. The upper roof/collar part remains byte-for-byte at its source Y.
 */
export const R32H_T12_NW_COW_SOURCE = Object.freeze({
  glbSha256: 'c26d99c11ffef90859ff17cad5edecf7ab22d811baddfa0506794ecdbef6294c',
  scenes: Object.freeze([814, 815]),
  nodeIndex: 13801,
  meshIndex: 5207,
  nodeName: 'T12_2026_CD_LANSI_POHJOINEN_DOWNPIPE_SWAN_NECK_ROUTE_R32',
  vertexCount: 360,
  sourceMinY: -0.32821011543273926,
  sourceMaxY: 5.679999828338623,
  sourceBounds: Object.freeze({ minX: -0.3412628173828125, maxX: -0.03999998793005943,
    minZ: -11.640000343322754, maxZ: -10.635000228881836 }),
  originalOutletCentreY: -0.290,
  assumedT12WestGroundY: -0.360,
  sourceNWGroundYSamples: Object.freeze([-0.0412916894, 0.0337248951]),
  sourceSWGroundY: -0.34789,
  candidateWellGroundY: 0.034,
  candidateGrateY: 0.109,
  workTestLowerLipGapM: 0.020,
  lowerBandY: 0.45,
  upperBandY: 4.60,
  photoSourceDriveId: '1Hbw4Ir3c7WHg2PDU58KcN6v1W_uunuS8',
});

const nearly = (a, b, tol) => Math.abs(a - b) <= tol;
const failure = (status) => Object.freeze({ status, stage: 'WORK_TEST_HOST_HOLD',
  sourceVerified: false, physicalHostVerified: false, asBuiltClaim: false });

/**
 * Return NEW Float32 positions for an exactly authenticated source mesh.
 * All other sources, scenes, nodes, transforms and meshes fail closed.
 * No Three.js dependency, no mutation of the caller's source Float32Array.
 */
export function planR32HT12NorthwestWorkTestCOW({
  glbSha256, sceneIndex, nodeIndex, meshIndex, nodeName,
  worldMatrixIsIdentity, positions,
} = {}) {
  const s = R32H_T12_NW_COW_SOURCE;
  if (glbSha256 !== s.glbSha256 || !s.scenes.includes(sceneIndex) ||
      nodeIndex !== s.nodeIndex || meshIndex !== s.meshIndex ||
      nodeName !== s.nodeName || worldMatrixIsIdentity !== true) {
    return failure('OUT_OF_EXACT_SOURCE_SCOPE');
  }
  if (!(positions instanceof Float32Array) ||
      positions.length !== s.vertexCount * 3 ||
      !Array.from(positions).every(Number.isFinite)) {
    return failure('INVALID_SOURCE_GEOMETRY');
  }
  let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = [positions[i], positions[i + 1], positions[i + 2]];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  if (!nearly(minY, s.sourceMinY, 0.002) ||
      !nearly(maxY, s.sourceMaxY, 0.002) ||
      !nearly(minX, s.sourceBounds.minX, 0.002) ||
      !nearly(maxX, s.sourceBounds.maxX, 0.002) ||
      !nearly(minZ, s.sourceBounds.minZ, 0.002) ||
      !nearly(maxZ, s.sourceBounds.maxZ, 0.002)) {
    return failure('SOURCE_MESH_BOUNDS_MISMATCH');
  }

  // Approximate 2 cm free clearance from the lowest outlet lip to the grate.
  // The original GLB is never changed. A future authenticated viewer receiver
  // may use these coordinates only as a clearly documented WORK_TEST COW.
  const targetMinY = s.candidateGrateY + s.workTestLowerLipGapM;
  const riseY = targetMinY - minY;
  const out = new Float32Array(positions);
  let shiftedVertices = 0;
  for (let i = 1; i < out.length; i += 3) {
    const y = positions[i];
    const factor = y <= s.lowerBandY ? 1
      : y >= s.upperBandY ? 0
      : (s.upperBandY - y) / (s.upperBandY - s.lowerBandY);
    if (factor > 0) {
      out[i] = y + riseY * factor;
      shiftedVertices += 1;
    }
  }
  let minNewY = Infinity;
  for (let i = 1; i < out.length; i += 3) minNewY = Math.min(minNewY, out[i]);
  if (minNewY < s.candidateGrateY + 0.015 ||
      !nearly(minNewY, targetMinY, 0.002)) {
    return failure('COW_CLEARANCE_FAIL');
  }

  return {
    status: 'WORK_TEST_COW',
    stage: 'WORK_TEST_HOST_HOLD',
    sourceVerified: true,
    physicalHostVerified: false,
    asBuiltClaim: false,
    sourceGlbSha256: s.glbSha256,
    nodeIndex: s.nodeIndex,
    meshIndex: s.meshIndex,
    sourceMinY: minY,
    targetMinY,
    riseY,
    shiftedVertices,
    positions: out,
    assumption: 'Luoteissyöksyn alareuna noin 2 cm ehdokas-Merikan sihdin yläpuolella. Ei mitattu.',
    sourceHostConflict: 'T12:n yhteinen SW/NW groundY -0,36 m ei vastaa NW SCALGO-maastoa.',
  };
}
