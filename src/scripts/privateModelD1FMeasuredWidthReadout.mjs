import { D1F_COMBINED_WALL_ASSETS } from './privateModelD1FCombinedWallSceneContract.mjs';

const MEASURED_ID = 'd1f-measured-wall-140-100-2350-b710-basin-20261014';
const FINISHED_ID = 'd1f-finished-face-2360-wall-basin-20261014';
const CORRECTED_ID = 'd1f-four-review-corrections-20261014';
// G2_D1F_KPH_M1_M7_20261013_FIELD_AND_SOURCE_DELTA, M4:
// B wall bathroom finished face -> D/C wall bathroom finished face.
const FIELD_WIDTH_MM = 2360;

function indexedFaceX(geometry, start, count, side, vertexCount = 240) {
  const position = geometry?.getAttribute?.('position');
  const index = geometry?.getIndex?.();
  if (position?.count !== vertexCount || position.itemSize !== 3 || !index ||
      typeof position.getX !== 'function' || typeof position.getY !== 'function' ||
      typeof position.getZ !== 'function' || typeof index.getX !== 'function') return null;
  const indexed = new Set();
  for (let i = 0; i < index.count; i++) {
    const vertex = index.getX(i);
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= position.count) return null;
    indexed.add(vertex);
  }
  const xs = [];
  for (let i = start; i < start + count; i++) {
    if (!indexed.has(i)) return null; // Retained but unindexed old vertices are not visible faces.
    const xyz = [position.getX(i), position.getY(i), position.getZ(i)];
    if (!xyz.every(Number.isFinite)) return null;
    xs.push(xyz[0]);
  }
  const low = Math.min(...xs);
  const high = Math.max(...xs);
  if (high <= low) return null;
  return side === 'min' ? low : high;
}

/**
 * Read-only comparison for the exact authenticated measured WORK_TEST source.
 * The mesh layout identifies faces; their coordinates come from live indexed
 * BufferGeometry, not cached GLB extras, a source centreline or the field value.
 * This is neither a physical-location approval nor production pixel evidence.
 */
export function getD1FMeasuredWidthComparison({
  candidateId, sourceSha, rawGlbByteIdentityVerified, selected,
}) {
  const corrections = candidateId === CORRECTED_ID;
  const finished = candidateId === FINISHED_ID || corrections;
  const asset = corrections ? D1F_COMBINED_WALL_ASSETS[CORRECTED_ID] : finished ? D1F_COMBINED_WALL_ASSETS[FINISHED_ID] : D1F_COMBINED_WALL_ASSETS[MEASURED_ID];
  if ((!finished && candidateId !== MEASURED_ID) || rawGlbByteIdentityVerified !== true ||
      sourceSha !== asset.sha256 ||
      selected?.workTestOnly !== true || selected.absolutePhysicalXYVerified !== false ||
      selected.humanReview !== 'NOT_RUN' || selected.wall?.visible === false ||
      selected.wall?.userData?.sourceNodeIndex !== 798) return null;
  const wall = selected.wall;
  const west = finished && selected.variant?.startsWith('WEST_');
  if (finished && !/^(WEST|EAST)_ANCHOR_(725_895_740|740_895_725)$/.test(selected.variant ?? '')) return null;
  const vertexCount = (west ? 256 : 240) + (corrections ? 16 : 0);
  // Both source primitives are direct children of the same replacement carrier.
  // Independently addressable corner geometries have different vertex counts.
  const meshes = (wall.children ?? []).filter(object => object.isMesh === true &&
    object.visible !== false && object.geometry?.getAttribute?.('position')?.count === vertexCount);
  const context = meshes.filter(object => object.geometry.getIndex?.()?.count === (west ? 576 : 612));
  const changed = meshes.filter(object => object.geometry.getIndex?.()?.count === (west ? 480 : 396) + (corrections ? 60 : 0));
  if (meshes.length !== 2 || context.length !== 1 || changed.length !== 1) return null;
  // The shared carrier can rotate/translate for presentation, but cannot change
  // the metre scale used by this source-space width comparison.
  const matrix = wall.matrixWorld?.elements;
  if (!matrix || matrix.length !== 16 || !Array.from(matrix).every(Number.isFinite) ||
      Math.abs(Math.hypot(matrix[0], matrix[1], matrix[2]) - 1) > 1e-6) return null;
  const bFaceXM = indexedFaceX(changed[0].geometry, 200, 40, 'max', vertexCount);
  const dcFaceXM = indexedFaceX(west ? changed[0].geometry : context[0].geometry, west ? 240 : 64, west ? 16 : 8, 'min', vertexCount);
  if (bFaceXM === null || dcFaceXM === null || dcFaceXM <= bFaceXM) return null;
  const sourceWidthMm = Math.round((dcFaceXM - bFaceXM) * 1000);
  if (!Number.isSafeInteger(sourceWidthMm) || sourceWidthMm <= 0) return null;
  const residualMm = sourceWidthMm - FIELD_WIDTH_MM;
  const signed = residualMm > 0 ? '+' + residualMm : String(residualMm);
  return Object.freeze({
    sourceWidthMm, fieldWidthMm: FIELD_WIDTH_MM, residualMm,
    sourceFaceXM: Object.freeze({ b: bFaceXM, dc: dcFaceXM }),
    fieldSourceRecord: 'G2_D1F_KPH_M1_M7_20261013_FIELD_AND_SOURCE_DELTA',
    bindingStatus: finished ? 'WORK_GEOMETRY_MATCH_FIELD_PHYSICAL_ANCHOR_OPEN' : 'SOURCE_FIELD_BINDING_OPEN',
    absolutePhysicalXYVerified: false, humanReview: 'NOT_RUN',
    label: `KPH:n vapaa leveys: mallissa ${sourceWidthMm} mm, mitattu ${FIELD_WIDTH_MM} mm, ero ${signed} mm. Seinien sijainti vielä tarkistamatta.`,
  });
}
