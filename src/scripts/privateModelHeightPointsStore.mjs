/**
 * Source-scene height marker records. These are user annotations on a model,
 * not surveying data or a claim that geometry represents built conditions.
 * Storage is injected to make browser permission failures explicit and testable.
 */
export const HEIGHT_POINTS_SCHEMA_VERSION = 1;
export const MAX_HEIGHT_POINTS_PER_MODEL = 64;
const PREFIX = 'ylisrinne:height-points:v1:';
const FRAME = 'YLIS-G1-LOCAL';
const SHA_256 = /^[0-9a-f]{64}$/;
const MARKER_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function heightPointsStorageKey(modelSha256) {
  return typeof modelSha256 === 'string' && SHA_256.test(modelSha256)
    ? PREFIX + modelSha256
    : null;
}

const validCoordinate = value => typeof value === 'number'
  && Number.isFinite(value) && Math.abs(value) <= 1000000;

function normalizePoint(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { id, label, xM, yM, sourceHeightYUpM, surfaceObjectName } = value;
  if (typeof id !== 'string' || !MARKER_ID.test(id)) return null;
  if (typeof label !== 'string' || !label.trim() || label.trim().length > 80 || /[\u0000-\u001f]/.test(label)) return null;
  if (![xM, yM, sourceHeightYUpM].every(validCoordinate)) return null;
  if (surfaceObjectName !== null && surfaceObjectName !== undefined
      && (typeof surfaceObjectName !== 'string' || surfaceObjectName.length > 160)) return null;
  return {
    id,
    label: label.trim(),
    xM,
    yM,
    sourceHeightYUpM,
    surfaceObjectName: surfaceObjectName ?? null,
    coordinateFrame: FRAME,
    interpretation: 'WORK_TEST_MODEL_POINT_ONLY',
  };
}

function readRecord(storage, modelSha256) {
  const key = heightPointsStorageKey(modelSha256);
  if (!key) return { ok: false, reason: 'INVALID_MODEL_SHA', points: [] };
  if (!storage || typeof storage.getItem !== 'function')
    return { ok: false, reason: 'STORAGE_UNAVAILABLE', points: [] };
  let raw;
  try { raw = storage.getItem(key); }
  catch { return { ok: false, reason: 'STORAGE_UNAVAILABLE', points: [] }; }
  if (raw === null || raw === undefined) return { ok: true, points: [] };
  try {
    const payload = JSON.parse(raw);
    if (payload?.version !== HEIGHT_POINTS_SCHEMA_VERSION || payload?.modelSha256 !== modelSha256
        || payload?.coordinateFrame !== FRAME || !Array.isArray(payload?.points)
        || payload.points.length > MAX_HEIGHT_POINTS_PER_MODEL) {
      return { ok: false, reason: 'CORRUPTED_RECORD', points: [] };
    }
    const points = payload.points.map(normalizePoint);
    if (points.some(item => item === null)
        || new Set(points.map(item => item.id)).size !== points.length) {
      return { ok: false, reason: 'CORRUPTED_RECORD', points: [] };
    }
    return { ok: true, points };
  } catch {
    return { ok: false, reason: 'CORRUPTED_RECORD', points: [] };
  }
}

export function readHeightPoints(storage, modelSha256) {
  return readRecord(storage, modelSha256);
}

function persist(storage, modelSha256, points) {
  const key = heightPointsStorageKey(modelSha256);
  if (!key || typeof storage?.setItem !== 'function')
    return { ok: false, reason: 'STORAGE_UNAVAILABLE', points: [] };
  try {
    storage.setItem(key, JSON.stringify({
      version: HEIGHT_POINTS_SCHEMA_VERSION,
      modelSha256,
      coordinateFrame: FRAME,
      points,
    }));
    return { ok: true, points };
  } catch {
    return { ok: false, reason: 'STORAGE_UNAVAILABLE', points: [] };
  }
}

/** A stable, caller-generated ID is required. No geometry is inferred. */
export function addHeightPoint(storage, modelSha256, candidate) {
  const previous = readRecord(storage, modelSha256);
  if (!previous.ok) return previous;
  const point = normalizePoint(candidate);
  if (!point) return { ok: false, reason: 'INVALID_POINT', points: previous.points };
  if (previous.points.some(item => item.id === point.id))
    return { ok: false, reason: 'DUPLICATE_ID', points: previous.points };
  if (previous.points.length >= MAX_HEIGHT_POINTS_PER_MODEL)
    return { ok: false, reason: 'MODEL_POINT_LIMIT', points: previous.points };
  return persist(storage, modelSha256, [...previous.points, point]);
}

export function removeHeightPoint(storage, modelSha256, id) {
  const previous = readRecord(storage, modelSha256);
  if (!previous.ok) return previous;
  if (typeof id !== 'string' || !MARKER_ID.test(id) || !previous.points.some(x => x.id === id))
    return { ok: false, reason: 'POINT_NOT_FOUND', points: previous.points };
  return persist(storage, modelSha256, previous.points.filter(point => point.id !== id));
}

/**
 * This function never invents an N2000 datum. Offset must be supplied by the
 * caller from a separately documented source. Its result remains WORK_TEST.
 * sourceHeightYUpM (not model yM) is the vertical model coordinate.
 */
export function displayHeightValue(point, options = {}) {
  if (!point || !validCoordinate(point.sourceHeightYUpM))
    return { ok: false, reason: 'INVALID_POINT' };
  if (options.mode === 'LOCAL') {
    return {
      ok: true,
      meters: point.sourceHeightYUpM,
      label: 'Paikallinen mallikorkeus',
      interpretation: 'WORK_TEST_MODEL_POINT_ONLY',
    };
  }
  if (options.mode === 'N2000') {
    if (!validCoordinate(options.n2000OffsetM)
        || options.offsetBasis !== 'OWNER_WORK_ASSUMPTION')
      return { ok: false, reason: 'N2000_DATUM_NOT_VERIFIED' };
    const meters = point.sourceHeightYUpM + options.n2000OffsetM;
    if (!Number.isFinite(meters)) return { ok: false, reason: 'INVALID_HEIGHT' };
    return {
      ok: true,
      meters,
      label: 'N2000 (työoletus)',
      interpretation: 'WORK_TEST_CONVERTED_NOT_SURVEYED',
    };
  }
  return { ok: false, reason: 'INVALID_COORDINATE_MODE' };
}
