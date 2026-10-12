/**
 * Source-bound identity parity between native G2 R989 current-installed Themos
 * and the EXISTING P137E scene67 focused 3D WORK_TEST selection.
 *
 * The existing server-side G2 projector establishes reviewTargetIds; the
 * existing glTF selector establishes source wall and 3D node identity. This
 * PURE cross-check never reads Google Docs, authenticates GLB bytes, assigns
 * physical XY/Z, approves a wall host, publishes, or grants HUMAN_REVIEW.
 */
export const p137eR989G2DocumentId =
  '1B59UmyKNKVfXJwIZ9dCTcQXyT6O0l7rESG2YOX6AdHE';
export const p137eScene67DriveId = '17FqR79AIjJhScxdydK0HG1RX0P53e0wf';
export const p137eScene67Sha256 =
  '07331f15ca223a5db8e0e8ea8955d7707f880cef23ca80b09dc6611730ae0b7d';
export const p137eScene67ByteSize = 3258268;
export const p137eScene67CurrentReviewIds = Object.freeze([
  'D_THEMO_CURRENT_LOBBY_01',
  'D_THEMO_CURRENT_BEDROOM_01',
  'D_THEMO_CURRENT_BATHROOM_01',
] as const);

type G2Target = {
  reviewTargetId: string;
  sourceRecordId: string;
  apartment: string;
  floor: string;
  coordinateFrame: string;
  identityKind: string;
  sourceG2Id: string | null;
  wallHosts: readonly unknown[];
};
type G2Readback = {
  documentId: string;
  revisionId: string;
  targets: readonly G2Target[];
};
type FocusedSelection = {
  sceneIndex: number;
  sourceWallNode: number;
  sourceWallMesh: number;
  logicalDeviceIds: readonly string[];
  representationKind: string;
  humanReview: string;
  currentGeometry: boolean;
  canonical: boolean;
  asBuilt: boolean;
};
type CandidateIdentity = {
  driveFileId: string;
  byteSize: number;
  sha256: string;
};
export type P137ER989Scene67Binding = Readonly<{
  status: 'SOURCE_IDENTITIES_MATCH_WORK_TEST_ONLY';
  documentId: typeof p137eR989G2DocumentId;
  revisionId: string;
  candidateDriveId: typeof p137eScene67DriveId;
  wallSourceNode: 798;
  wallSourceMesh: 406;
  logicalDeviceIds: readonly string[];
  sourceByteAuthentication: 'EXTERNAL_GATE_NOT_RUN';
  productionRender: 'NOT_RUN';
  humanReview: 'NOT_RUN';
  currentGeometry: false;
  canonical: false;
  asBuilt: false;
}>;

const fail = (reason: string): never => {
  throw new Error('P137E_R989_SCENE67_SOURCE_MISMATCH: ' + reason);
};
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const exactKeys = (v: Record<string, unknown>, expected: readonly string[]) =>
  Object.keys(v).length === expected.length &&
  expected.every(key => Object.prototype.hasOwnProperty.call(v, key));
const targetKeys = [
  'reviewTargetId', 'sourceRecordId', 'apartment', 'floor',
  'coordinateFrame', 'identityKind', 'sourceG2Id', 'wallHosts',
] as const;

/**
 * Input readback MUST already come from the trusted native G2 R989 projector.
 * Input selection MUST already come from selectP137EScene67FocusedReview.
 * This matches their independent identities, not their provenance/authentication.
 */
export function crossBindP137ER989CurrentThemosToScene67({
  g2, selection, candidate,
}: {
  g2: unknown;
  selection: unknown;
  candidate: unknown;
}): P137ER989Scene67Binding {
  if (!record(candidate) ||
      candidate.driveFileId !== p137eScene67DriveId ||
      candidate.byteSize !== p137eScene67ByteSize ||
      candidate.sha256 !== p137eScene67Sha256) {
    fail('persisted WORK_TEST candidate identity');
  }
  if (!record(g2) || g2.documentId !== p137eR989G2DocumentId ||
      typeof g2.revisionId !== 'string' || !g2.revisionId.trim() ||
      !Array.isArray(g2.targets) || g2.targets.length !== 3) {
    fail('native G2 R989 revision or target count');
  }
  const source = g2 as unknown as G2Readback;
  const currentTargets = new Map<string, G2Target>();
  for (const item of source.targets) {
    if (!record(item) || !exactKeys(item, targetKeys) ||
        typeof item.reviewTargetId !== 'string' ||
        !p137eScene67CurrentReviewIds.some(id => id === item.reviewTargetId) ||
        currentTargets.has(item.reviewTargetId) ||
        item.sourceRecordId !== item.reviewTargetId ||
        item.apartment !== 'D' || item.floor !== '1F' ||
        item.coordinateFrame !== 'YLIS-G1-LOCAL' ||
        item.identityKind !== 'USER_CURRENT_ONLY_REVIEW_ID' ||
        item.sourceG2Id !== null ||
        !Array.isArray(item.wallHosts) || item.wallHosts.length !== 0) {
      fail('G2 target identity, unapproved wall host, or physical coordinate');
    }
    currentTargets.set(item.reviewTargetId, item as G2Target);
  }
  if (currentTargets.size !== 3) fail('missing R989 source-backed device');
  if (!record(selection) ||
      selection.sceneIndex !== 67 ||
      selection.sourceWallNode !== 798 ||
      selection.sourceWallMesh !== 406 ||
      selection.representationKind !== 'P137E_SOURCE_WALL_AND_THREE_THEMOS_WORK_TEST' ||
      selection.humanReview !== 'NOT_RUN' ||
      selection.currentGeometry !== false ||
      selection.canonical !== false || selection.asBuilt !== false ||
      !Array.isArray(selection.logicalDeviceIds) ||
      selection.logicalDeviceIds.length !== 3 ||
      !p137eScene67CurrentReviewIds.every((id, index) =>
        selection.logicalDeviceIds[index] === id)) {
    fail('P123C original wall or source-bound 3D Themo identity');
  }
  const selected = selection as unknown as FocusedSelection;
  return Object.freeze({
    status: 'SOURCE_IDENTITIES_MATCH_WORK_TEST_ONLY',
    documentId: p137eR989G2DocumentId,
    revisionId: source.revisionId,
    candidateDriveId: p137eScene67DriveId,
    wallSourceNode: 798,
    wallSourceMesh: 406,
    logicalDeviceIds: Object.freeze([...selected.logicalDeviceIds]),
    sourceByteAuthentication: 'EXTERNAL_GATE_NOT_RUN',
    productionRender: 'NOT_RUN',
    humanReview: 'NOT_RUN',
    currentGeometry: false,
    canonical: false,
    asBuilt: false,
  });
}
