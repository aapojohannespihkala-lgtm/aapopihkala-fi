import {
  placementG2DocumentId,
  type G2PlacementReviewTarget,
  type G2PlacementSourceReadback,
} from './privateModelReviewPlacementG2Context';
import { projectNativeG2CurrentDoorReadback } from './privateModelReviewPlacementG2NativeSource';
import { projectNativeG2CurrentThemoReadback } from './privateModelReviewPlacementG2NativeThemoSource';

/**
 * Server-only one-read composition of existing native G2 evidence.
 * The injected port MUST obtain the G2 document from an independently
 * authenticated trusted backend, never from viewer-provided JSON.
 *
 * Both projectors consume exactly the same document revision. Either
 * provenance chain missing/ambiguous => NO selectable targets.
 * The five identities are current-only, not surveyed 2015 source IDs,
 * physical wall hosts, device XY or CURRENT-model geometry.
 */
export type TrustedNativePlacementG2Read = () => Promise<unknown>;

const expectedIds = [
  'D1F_USER_CURRENT_DOOR_A',
  'D1F_USER_CURRENT_DOOR_B',
  'D_THEMO_CURRENT_BATHROOM_01',
  'D_THEMO_CURRENT_BEDROOM_01',
  'D_THEMO_CURRENT_LOBBY_01',
] as const;

const isSafeCurrentTarget = (t: G2PlacementReviewTarget): boolean =>
  t.apartment === 'D' &&
  t.floor === '1F' &&
  t.coordinateFrame === 'YLIS-G1-LOCAL' &&
  t.identityKind === 'USER_CURRENT_ONLY_REVIEW_ID' &&
  t.sourceRecordId === t.reviewTargetId &&
  t.sourceG2Id === null &&
  Array.isArray(t.wallHosts) &&
  t.wallHosts.length === 0;

/**
 * A single trusted native-G2 fetch produces a revision-coherent target
 * readback suitable for resolvePlacementG2Context. This does NOT save any
 * placement observation or enable the hidden viewer placement tool.
 */
export const readNativeG2CurrentPlacementTargets = async (
  readNativeG2: TrustedNativePlacementG2Read,
): Promise<G2PlacementSourceReadback | null> => {
  if (typeof readNativeG2 !== 'function') return null;
  let document: unknown;
  try {
    document = await readNativeG2();
  } catch {
    return null;
  }

  const doors = projectNativeG2CurrentDoorReadback(document);
  const thermos = projectNativeG2CurrentThemoReadback(document);
  if (
    !doors ||
    !thermos ||
    doors.documentId !== placementG2DocumentId ||
    thermos.documentId !== placementG2DocumentId ||
    doors.revisionId !== thermos.revisionId ||
    typeof doors.revisionId !== 'string' ||
    !doors.revisionId.trim()
  ) return null;

  const targets = [...doors.targets, ...thermos.targets];
  const ids = new Set(targets.map((t) => t.reviewTargetId));
  if (
    targets.length !== expectedIds.length ||
    ids.size !== expectedIds.length ||
    expectedIds.some((id) => !ids.has(id)) ||
    !targets.every(isSafeCurrentTarget)
  ) return null;

  return { documentId: placementG2DocumentId, revisionId: doors.revisionId, targets };
};
