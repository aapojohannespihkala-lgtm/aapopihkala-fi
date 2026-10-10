import {
  createTargetBoundReviewAnchor,
  type ApprovedReviewWallHost,
  type ReviewPlacementFloor,
} from './privateModelReviewCoordinates';
import type { PlacementReviewContext } from './privateModelReviewPlacementDraft';

/**
 * Routing identity of the EXISTING live G2 geometry document, not a new
 * review database. Its contents and revision are read by a trusted server-side
 * Drive connector; the public viewer cannot establish G2 approval itself.
 */
export const placementG2DocumentId = '1B59UmyKNKVfXJwIZ9dCTcQXyT6O0l7rESG2YOX6AdHE';

export type G2PlacementIdentityKind = 'SOURCE_G2_ID' | 'USER_CURRENT_ONLY_REVIEW_ID';

/** Projection of an *actual* G2 entry read back by a trusted connector. */
export type G2PlacementReviewTarget = {
  reviewTargetId: string;
  sourceRecordId: string;
  apartment: 'D';
  floor: ReviewPlacementFloor;
  coordinateFrame: 'YLIS-G1-LOCAL';
  identityKind: G2PlacementIdentityKind;
  /** For current-only reviews this MUST stay null; do not mint a G2_DOOR ID. */
  sourceG2Id: string | null;
  wallHosts: ReadonlyArray<ApprovedReviewWallHost>;
};

export type G2PlacementSourceReadback = {
  documentId: string;
  revisionId: string;
  targets: ReadonlyArray<G2PlacementReviewTarget>;
};

/**
 * Authentication and actual Drive API reading are the responsibilities of the
 * injected G2 connector, not this detached browser-side mapper.
 */
export type TrustedG2PlacementReadback = () => Promise<G2PlacementSourceReadback | null>;

export type PlacementG2ContextResolution =
  | { status: 'SOURCE_UNAVAILABLE' | 'TARGET_NOT_FOUND' | 'DUPLICATE_TARGET' |
      'TARGET_SOURCE_CONFLICT'; context: null; evidence: null }
  | {
      status: 'REVIEW_CONTEXT_READY';
      context: PlacementReviewContext;
      evidence: {
        documentId: typeof placementG2DocumentId;
        revisionId: string;
        sourceRecordId: string;
        identityKind: G2PlacementIdentityKind;
        /** Confirmation of matching a G2 readback, not a physical survey. */
        exactPhysicalPlacement: false;
        verifiedWallCount: number;
      };
    };

const isId = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v);
const isReviewFloor = (v: unknown): v is ReviewPlacementFloor => v === '1F' || v === '2F';

const validatedHosts = (
  hosts: unknown,
  floor: ReviewPlacementFloor,
): ReadonlyArray<ApprovedReviewWallHost> => {
  if (!Array.isArray(hosts)) return [];
  const seen = new Set<string>();
  const accepted: ApprovedReviewWallHost[] = [];
  for (const host of hosts) {
    // A missing/unknown wall source never becomes an approved wall by proximity.
    if (!host || typeof host !== 'object') continue;
    const h = host as ApprovedReviewWallHost;
    if (
      h.floor !== floor ||
      h.coordinateFrame !== 'YLIS-G1-LOCAL' ||
      h.approved !== true ||
      !isId(h.g2Id) ||
      !isId(h.approvalEvidenceId) ||
      (h.axis !== 'X_FIXED' && h.axis !== 'Y_FIXED') ||
      ![h.fixedM, h.startM, h.endM].every((v) => typeof v === 'number' && Number.isFinite(v)) ||
      h.startM >= h.endM ||
      h.openingsComplete !== true ||
      !Array.isArray(h.openings)
    ) continue;
    if (seen.has(h.g2Id)) continue;
    const openings = [...h.openings].sort((a, b) => a.startM - b.startM);
    if (openings.some((o, i) =>
      !o || !Number.isFinite(o.startM) || !Number.isFinite(o.endM) ||
      o.startM >= o.endM || o.startM < h.startM || o.endM > h.endM ||
      (i > 0 && o.startM < openings[i - 1].endM)
    )) continue;
    seen.add(h.g2Id);
    accepted.push({
      g2Id: h.g2Id,
      floor: h.floor,
      coordinateFrame: 'YLIS-G1-LOCAL',
      approvalEvidenceId: h.approvalEvidenceId,
      approved: true,
      axis: h.axis,
      fixedM: h.fixedM,
      startM: h.startM,
      endM: h.endM,
      openingsComplete: true,
      openings: openings.map((o) => ({ startM: o.startM, endM: o.endM })),
    });
  }
  return accepted;
};

/**
 * Exact target + D-storey + live-doc revision identity. Any 2015 source ID
 * reconciliation must have happened upstream in G2; never upgrade a P137J
 * current-only reviewDoorId into a historical G2_DOOR source ID here.
 */
export const resolvePlacementG2Context = async ({
  targetId,
  floor,
  readG2,
}: {
  targetId: string;
  floor: ReviewPlacementFloor;
  readG2: TrustedG2PlacementReadback;
}): Promise<PlacementG2ContextResolution> => {
  const fail = (
    status: Extract<PlacementG2ContextResolution, { context: null }>['status'],
  ): PlacementG2ContextResolution => ({ status, context: null, evidence: null });
  if (
    !isId(targetId) ||
    !isReviewFloor(floor) ||
    typeof readG2 !== 'function' ||
    !createTargetBoundReviewAnchor({ targetId, floor, coordinate: { xM: 0, yM: 0 } })
  ) return fail('TARGET_SOURCE_CONFLICT');

  let source: G2PlacementSourceReadback | null;
  try { source = await readG2(); } catch { return fail('SOURCE_UNAVAILABLE'); }
  if (
    source?.documentId !== placementG2DocumentId ||
    !isId(source.revisionId) ||
    !Array.isArray(source.targets)
  ) return fail('SOURCE_UNAVAILABLE');

  const matching = source.targets.filter((t) => t?.reviewTargetId === targetId);
  if (!matching.length) return fail('TARGET_NOT_FOUND');
  if (matching.length !== 1) return fail('DUPLICATE_TARGET');

  const t = matching[0];
  if (
    !isId(t.sourceRecordId) ||
    t.apartment !== 'D' ||
    t.floor !== floor ||
    t.coordinateFrame !== 'YLIS-G1-LOCAL' ||
    (t.identityKind !== 'SOURCE_G2_ID' && t.identityKind !== 'USER_CURRENT_ONLY_REVIEW_ID') ||
    (t.identityKind === 'USER_CURRENT_ONLY_REVIEW_ID' &&
      (t.sourceRecordId !== t.reviewTargetId || t.sourceG2Id !== null)) ||
    (t.identityKind === 'SOURCE_G2_ID' && t.sourceG2Id !== t.reviewTargetId)
  ) return fail('TARGET_SOURCE_CONFLICT');

  const approvedWallHosts = validatedHosts(t.wallHosts, floor);
  return {
    status: 'REVIEW_CONTEXT_READY',
    context: { targetId, floor, approvedWallHosts },
    evidence: {
      documentId: placementG2DocumentId,
      revisionId: source.revisionId,
      sourceRecordId: t.sourceRecordId,
      identityKind: t.identityKind,
      exactPhysicalPlacement: false,
      verifiedWallCount: approvedWallHosts.length,
    },
  };
};
