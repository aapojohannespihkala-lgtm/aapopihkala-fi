import {
  buildPlacementReviewDraft,
  verifyPlacementReviewPersistenceReadback,
  type PersistedPlacementReviewAck,
  type PersistedPlacementReviewRecord,
  type PlacementReviewHandoff,
} from './privateModelReviewPlacementDraft';
import {
  placementG2DocumentId,
  resolvePlacementG2Context,
} from './privateModelReviewPlacementG2Context';
import { projectNativeG2CurrentDoorReadback } from './privateModelReviewPlacementG2NativeSource';

/**
 * SERVER-ONLY native Google Docs adapter for the EXISTING G2 document.
 * Authentication and a securely generated unique record ID MUST be provided
 * by the trusted backend. Never give the viewer a Docs token or write endpoint
 * until its independently authorised review gate has been implemented.
 *
 * This adapter does not add a second registry, G2 geometry or approval.
 * It appends one noncanonical WORK_TEST observation to the existing G2 doc,
 * guarded by the document revision and then verified by a separate read.
 */
export type NativePlacementG2Document = {
  documentId: string;
  revisionId: string;
  tabs: Array<{
    /** Raw Google Docs tabs use tabProperties.tabId; connected readback can flatten it. */
    tabId?: string;
    tabProperties?: { tabId?: string };
    documentTab?: { body?: { content?: Array<{ paragraph?: { elements?: Array<{ textRun?: { content?: unknown } }> } }> } };
    body?: { content?: Array<{ paragraph?: { elements?: Array<{ textRun?: { content?: unknown } }> } }> };
  }>;
};

export type TrustedNativeG2WritePorts = {
  /** Fetch authenticated native Docs representation, fresh on every call. */
  getDocument: () => Promise<NativePlacementG2Document | null>;
  /** Apply the Google Docs batchUpdate requests with REQUIRED revision guard. */
  batchUpdateDocument: (args: {
    documentId: typeof placementG2DocumentId;
    requests: Array<{ insertText: { endOfSegmentLocation: { tabId: string }; text: string } }>;
    writeControl: { requiredRevisionId: string };
  }) => Promise<unknown>;
  /** Secure, collision-resistant and SERVER-generated, never supplied by the viewer. */
  nextRecordId: () => string;
};

const recordPrefix = 'P137E_G2_REVIEW_OBSERVATION_V1 | ';
const recordIdPattern = /^P137E_G2_[A-Za-z0-9_-]{12,64}$/;

const paragraphsInTab = (doc: NativePlacementG2Document | null): {
  tabId: string; paragraphs: string[];
} | null => {
  if (doc?.documentId !== placementG2DocumentId || !doc.revisionId?.trim()) return null;
  // No unverified tab or scope guessing: single source tab as in current G2.
  if (!Array.isArray(doc.tabs) || doc.tabs.length !== 1) return null;
  const tab = doc.tabs[0];
  const nativeId = tab.tabProperties?.tabId;
  const flattenedId = tab.tabId;
  // Fail closed if two differently identified tabs were accidentally joined.
  if (nativeId !== undefined && flattenedId !== undefined && nativeId !== flattenedId) return null;
  const tabId = nativeId ?? flattenedId;
  if (typeof tabId !== 'string' || !tabId.trim()) return null;
  const body = tab.documentTab?.body ?? tab.body;
  if (!Array.isArray(body?.content)) return null;
  return {
    tabId,
    paragraphs: body.content.flatMap((entry) => entry.paragraph?.elements
      ? [entry.paragraph.elements.map((el) =>
        typeof el.textRun?.content === 'string' ? el.textRun.content : '').join('').trim()]
      : []).filter(Boolean),
  };
};

type StoredG2ReviewLine = {
  schema: 'P137E_G2_REVIEW_OBSERVATION_V1';
  recordId: string;
  sourceDocumentId: typeof placementG2DocumentId;
  sourceRevision: string;
  payload: PlacementReviewHandoff;
};

const readRecord = (
  doc: NativePlacementG2Document | null,
  recordId: string,
): StoredG2ReviewLine | null => {
  if (!recordIdPattern.test(recordId)) return null;
  const source = paragraphsInTab(doc);
  if (!source) return null;
  const marker = recordPrefix + recordId + ' | ';
  const matches = source.paragraphs.filter((p) => p.startsWith(marker));
  // Distinct record identity: duplicates must never be treated as one write.
  if (matches.length !== 1) return null;
  try {
    const parsed = JSON.parse(matches[0].slice(marker.length)) as StoredG2ReviewLine;
    if (
      parsed?.schema !== 'P137E_G2_REVIEW_OBSERVATION_V1' ||
      parsed.recordId !== recordId ||
      parsed.sourceDocumentId !== placementG2DocumentId ||
      typeof parsed.sourceRevision !== 'string' ||
      !parsed.sourceRevision.trim() ||
      !parsed.payload
    ) return null;
    return parsed;
  } catch {
    return null;
  }
};

const sameReview = (expected: PlacementReviewHandoff, recordId: string, actual: StoredG2ReviewLine | null) =>
  !!actual && verifyPlacementReviewPersistenceReadback({
    expected,
    receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
    readback: { recordId, payload: actual.payload },
  });

const verifyTargetFromNativeSource = async (
  document: NativePlacementG2Document,
  payload: PlacementReviewHandoff,
): Promise<boolean> => {
  if (
    payload?.kind !== 'P137E_G2_REVIEW_OBSERVATION' ||
    payload.stage !== 'WORK_TEST_ONLY' ||
    payload.persisted !== false ||
    payload.humanReview !== 'NOT_RUN' ||
    payload.currentGeometry !== false ||
    payload.canonical !== false ||
    payload.asBuilt !== false
  ) return false;

  const source = projectNativeG2CurrentDoorReadback(document);
  if (!source) return false;
  const selected = await resolvePlacementG2Context({
    targetId: payload.anchor?.targetId,
    floor: payload.anchor?.floor,
    readG2: async () => source,
  });
  if (selected.status !== 'REVIEW_CONTEXT_READY') return false;
  // The currently evidenced p137J/p137N door targets are current-only, and
  // their approved wall/opening sets are UNKNOWN: never invent a wall snap.
  if (selected.evidence.identityKind !== 'USER_CURRENT_ONLY_REVIEW_ID' ||
    selected.context.approvedWallHosts.length !== 0
  ) return false;

  const rebuilt = buildPlacementReviewDraft({
    context: selected.context,
    coordinate: { xM: payload.anchor.xM, yM: payload.anchor.yM },
    noteRaw: payload.observation?.noteRaw,
  });
  if (rebuilt.status !== 'READY_FOR_G2_HANDOFF') return false;
  return verifyPlacementReviewPersistenceReadback({
    expected: rebuilt.payload,
    receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId: 'G2_VALIDATION' },
    readback: { recordId: 'G2_VALIDATION', payload },
  });
};

export const createNativeG2PlacementPersistenceAdapter = ({
  getDocument,
  batchUpdateDocument,
  nextRecordId,
}: TrustedNativeG2WritePorts) => {
  const readback = async (recordId: string): Promise<PersistedPlacementReviewRecord | null> => {
    if (!recordIdPattern.test(recordId)) return null;
    const document = await getDocument();
    if (!document || !projectNativeG2CurrentDoorReadback(document)) return null;
    const record = readRecord(document, recordId);
    if (!record || !(await verifyTargetFromNativeSource(document, record.payload))) return null;
    return { recordId, payload: record.payload };
  };

  const persist = async (payload: PlacementReviewHandoff): Promise<PersistedPlacementReviewAck> => {
    if (
      typeof getDocument !== 'function' ||
      typeof batchUpdateDocument !== 'function' ||
      typeof nextRecordId !== 'function'
    ) throw new Error('G2_AUTHENTICATED_PORTS_MISSING');

    const before = await getDocument();
    const tab = paragraphsInTab(before);
    if (!before || !tab || !(await verifyTargetFromNativeSource(before, payload))) {
      throw new Error('G2_TARGET_EVIDENCE_NOT_VERIFIED');
    }

    const recordId = nextRecordId();
    if (typeof recordId !== 'string' || !recordIdPattern.test(recordId)) {
      throw new Error('G2_RECORD_ID_NOT_TRUSTED');
    }
    // Reject existing identifiers even if the old record is not parseable.
    const marker = recordPrefix + recordId + ' | ';
    if (tab.paragraphs.some((p) => p.startsWith(marker))) {
      throw new Error('G2_DUPLICATE_RECORD_ID');
    }

    const value: StoredG2ReviewLine = {
      schema: 'P137E_G2_REVIEW_OBSERVATION_V1',
      recordId,
      sourceDocumentId: placementG2DocumentId,
      sourceRevision: before.revisionId,
      payload,
    };
    await batchUpdateDocument({
      documentId: placementG2DocumentId,
      requests: [{
        insertText: {
          endOfSegmentLocation: { tabId: tab.tabId },
          text: '\n' + marker + JSON.stringify(value) + '\n',
        },
      }],
      writeControl: { requiredRevisionId: before.revisionId },
    });

    // A successful HTTP response or write acknowledgement is insufficient.
    // Read fresh native G2 bytes and require exact original observation.
    const after = await getDocument();
    if (
      !after ||
      after.revisionId === before.revisionId ||
      !projectNativeG2CurrentDoorReadback(after) ||
      !sameReview(payload, recordId, readRecord(after, recordId))
    ) throw new Error('G2_DURABLE_READBACK_MISMATCH');

    return { status: 'PERSISTED_TO_EXISTING_G2', recordId };
  };
  return { persist, readback };
};
