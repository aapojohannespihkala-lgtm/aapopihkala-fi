import { expect, test } from '@playwright/test';
import { buildPlacementReviewDraft, type PlacementReviewHandoff } from '../../src/scripts/privateModelReviewPlacementDraft';
import { placementG2DocumentId } from '../../src/scripts/privateModelReviewPlacementG2Context';
import {
  createNativeG2PlacementPersistenceAdapter,
  type NativePlacementG2Document,
} from '../../src/scripts/privateModelReviewPlacementG2Persistence';

const lines = [
  '3D-D/G2 p137J - D 1F kaksi käyttäjävahvistettua nykytilan ovea WORK_TEST-geometriaksi 2026-09-29',
  'Tila: PASS_USER_CURRENT_DOOR_WORK_GEOMETRY_2_OF_2 / HUMAN_REVIEW_IN_PROGRESS.',
  'Pysyvät review-ankkurit: `D1F_USER_CURRENT_DOOR_A` = p137E `HUMAN_REVIEW_ANCHOR_A`, klikattu YLIS-G1-LOCAL X=3,235 m / Y=5,063 m. `D1F_USER_CURRENT_DOOR_B` = `HUMAN_REVIEW_ANCHOR_B`, klikattu X=3,852 / Y=4,314 m.',
  '3D-D/G2 p137N - D 1F A/B historical/source-ID reconciliation 2026-09-29',
  'Tila: PASS_NEGATIVE_SOURCE_ID_RECONCILIATION / KEEP_USER_CURRENT_IDENTITIES / HUMAN_REVIEW_IN_PROGRESS.',
  'Johtopäätös p137I-C0:n mukaan: Historiallista G2_DOOR-ID:tä ei luoda eikä 7/7 source-ID-joukkoa muuteta. P137J:n pysyvät `D1F_USER_CURRENT_DOOR_A/B` reviewDoorId:t säilyvät current-only identiteetteinä.',
  'R989 - D current Themo room/group provenance - 8.10.2026',
  'Tila: PASS_CURRENT_INSTALLATION_ROOM_BINDING / HISTORICAL_GROUP_CONTEXT_BOUND / NO_GEOMETRY_MUTATION / NO_PROMOTION.',
  'Current installation evidence: `Ylisrinne - huollon ja ylläpidon seuranta` vahvistaa käyttäjän ilmoituksella, että kaikki 3 x Themo-lattialämmitystermostaatti asennettiin 7.10.2026. Käyttäjä vahvisti 8.10.2026 myös laitteiden huonenimien olevan oikein: Bathroom, Bedroom ja Lobby.',
  'Loogiset nykylaite-identiteetit tulevaa tietomallikulutusta varten: `D_THEMO_CURRENT_BATHROOM_01` = Themo / Bathroom; `D_THEMO_CURRENT_BEDROOM_01` = Themo / Bedroom; `D_THEMO_CURRENT_LOBBY_01` = Themo / Lobby. Näillä identiteeteillä on `currentInstallationEvidence=true` ja `roomAssignmentEvidence=USER_CONFIRMED`, mutta ei fyysistä pistekoordinaattia eikä 3D-laitegeometriaa.',
  'Historiallinen ryhmäkonteksti peritään muuttamatta G2 r791/r886 -evidenssistä: Bathroom -> source component C -> `sourceGroupKey=10.2`; Bedroom -> A -> `sourceGroupKey=10.3`; Lobby -> B -> `sourceGroupKey=10.1`.',
  'No-promotion / materialisointiraja: `exactCurrentXYClaim=false`, `exactZClaim=false`, `deviceGeometryClaim=false`, `physicalCableRouteClaim=false`, `continuousCableTopologyClaim=false`, `currentGeometryClaim=false`, `asBuilt=false`, `canonical=false`, `publishToCURRENT=false` ja `HUMAN_REVIEW=NOT_RUN`.',
  'R999 - M5B-Z2R persisted registration / independent raw QA',
];
const single = (content: string) => ({ paragraph: { elements: [{ textRun: { content: content + '\n' } }] } });
const initialDocument = (): NativePlacementG2Document => ({
  documentId: placementG2DocumentId,
  revisionId: 'G2_AUTH_SOURCE_REV_1',
  tabs: [{
    tabProperties: { tabId: 't.0' },
    documentTab: { body: { content: lines.map(single) } },
  }],
});

const draft = (id = 'D1F_USER_CURRENT_DOOR_A') => {
  const result = buildPlacementReviewDraft({
    context: { targetId: id, floor: '1F', approvedWallHosts: [] },
    coordinate: { xM: 3.235, yM: 5.063 },
    noteRaw: '120 cm lattiasta. Oven sijainti WORK_TEST, ei lopullinen mittaus.',
  });
  if (result.status !== 'READY_FOR_G2_HANDOFF') throw new Error('Expected valid draft');
  return result.payload;
};
const recordId = 'P137E_G2_TESTREVIEW_000001';

const makeAdapter = () => {
  let document = initialDocument();
  const writes: unknown[] = [];
  let applyWrite = true;
  let tamperReadback = false;
  const getDocument = async () => document;
  const batchUpdateDocument = async (args: {
    documentId: typeof placementG2DocumentId;
    requests: Array<{ insertText: { endOfSegmentLocation: { tabId: string }; text: string } }>;
    writeControl: { requiredRevisionId: string };
  }) => {
    writes.push(args);
    if (!applyWrite) return {};
    expect(args.documentId).toBe(placementG2DocumentId);
    expect(args.writeControl.requiredRevisionId).toBe(document.revisionId);
    expect(args.requests).toHaveLength(1);
    expect(args.requests[0].insertText.endOfSegmentLocation.tabId).toBe('t.0');
    let line = args.requests[0].insertText.text.trim();
    if (tamperReadback) line = line.replace('120 cm lattiasta.', '90 cm lattiasta.');
    document.tabs[0].documentTab?.body?.content?.push(single(line));
    document = { ...document, revisionId: 'G2_AUTH_SOURCE_REV_2' };
    return {};
  };
  const adapter = createNativeG2PlacementPersistenceAdapter({
    getDocument, batchUpdateDocument, nextRecordId: () => recordId,
  });
  return {
    adapter, writes,
    getDocument, setApplyWrite: (v: boolean) => { applyWrite = v; },
    setTamper: (v: boolean) => { tamperReadback = v; },
    setDocument: (v: NativePlacementG2Document) => { document = v; },
    duplicate: () => {
      const body = document.tabs[0].documentTab?.body?.content;
      if (!body?.length) throw new Error('Expected persisted record');
      body.push(body[body.length - 1]);
    },
  };
};

test('P137E authenticated native G2 adapter writes to same G2 doc and confirms fresh roundtrip', async () => {
  const state = makeAdapter();
  const payload = draft();
  const ack = await state.adapter.persist(payload);
  expect(ack).toEqual({ status: 'PERSISTED_TO_EXISTING_G2', recordId });
  expect(state.writes).toHaveLength(1);
  const saved = await state.adapter.readback(recordId);
  expect(saved).toEqual({ recordId, payload });
  const document = await state.getDocument();
  expect(document.revisionId).toBe('G2_AUTH_SOURCE_REV_2');
  expect(document.tabs[0].documentTab?.body?.content).toHaveLength(lines.length + 1);
});

test('P137E source IDs and invented wall hosts cannot enter a saved current-only observation', async () => {
  const state = makeAdapter();
  await expect(state.adapter.persist(draft('G2_DOOR_INT_D_1F_WC_001')))
    .rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  expect(state.writes).toHaveLength(0);
  const item = draft();
  const promoted = { ...item, canonical: true } as unknown as PlacementReviewHandoff;
  await expect(state.adapter.persist(promoted))
    .rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  const snapped = { ...item, resolution: {
    ...item.resolution, status: 'HOST_PROPOSED_WORK_TEST',
  } } as unknown as PlacementReviewHandoff;
  await expect(state.adapter.persist(snapped))
    .rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  expect(state.writes).toHaveLength(0);
});

test('P137E refuses stale/noop authenticated write: HTTP success alone is never a G2 save', async () => {
  const state = makeAdapter();
  state.setApplyWrite(false);
  await expect(state.adapter.persist(draft()))
    .rejects.toThrow('G2_DURABLE_READBACK_MISMATCH');
  expect(state.writes).toHaveLength(1);
  expect(await state.adapter.readback(recordId)).toBeNull();
});

test('P137E rejects changed user note on independent native Docs readback', async () => {
  const state = makeAdapter();
  state.setTamper(true);
  await expect(state.adapter.persist(draft()))
    .rejects.toThrow('G2_DURABLE_READBACK_MISMATCH');
  expect(await state.adapter.readback(recordId)).toBeNull();
});

test('P137E rejects duplicate record IDs even when the prior entry is malformed', async () => {
  const state = makeAdapter();
  const first = await state.adapter.persist(draft());
  expect(first.recordId).toBe(recordId);
  await expect(state.adapter.persist(draft()))
    .rejects.toThrow('G2_DUPLICATE_RECORD_ID');
  state.duplicate();
  expect(await state.adapter.readback(recordId)).toBeNull();
  expect(state.writes).toHaveLength(1);
});

test('P137E rejects incorrect G2 document, malformed revision and untrusted record IDs', async () => {
  const state = makeAdapter();
  state.setDocument({ ...initialDocument(), documentId: 'WRONG_G2_DOC' });
  await expect(state.adapter.persist(draft())).rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  state.setDocument({ ...initialDocument(), revisionId: '' });
  await expect(state.adapter.persist(draft())).rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  expect(await state.adapter.readback('P137E_G2_bad')).toBeNull();
  expect(state.writes).toHaveLength(0);
});

test('P137E accepts the real G2 connector flattened tabId/body readback and verifies persisted bytes', async () => {
  // The live G2 get_document connector presents {tabId, body}, whereas raw
  // Google Docs REST presents {tabProperties, documentTab}. Both are one tab.
  let document: NativePlacementG2Document = {
    documentId: placementG2DocumentId,
    revisionId: 'LIVE_FLATTENED_REV_1',
    tabs: [{ tabId: 't.0', body: { content: lines.map(single) } }],
  };
  const writes: unknown[] = [];
  const adapter = createNativeG2PlacementPersistenceAdapter({
    getDocument: async () => document,
    batchUpdateDocument: async (args) => {
      writes.push(args);
      expect(args.documentId).toBe(placementG2DocumentId);
      expect(args.writeControl.requiredRevisionId).toBe('LIVE_FLATTENED_REV_1');
      expect(args.requests[0].insertText.endOfSegmentLocation.tabId).toBe('t.0');
      document.tabs[0].body?.content?.push(single(args.requests[0].insertText.text.trim()));
      document = { ...document, revisionId: 'LIVE_FLATTENED_REV_2' };
      return {};
    },
    nextRecordId: () => recordId,
  });
  const payload = draft();
  expect(await adapter.persist(payload)).toEqual({ status: 'PERSISTED_TO_EXISTING_G2', recordId });
  expect(writes).toHaveLength(1);
  expect(await adapter.readback(recordId)).toEqual({ recordId, payload });
});

test('P137E rejects inconsistent and missing G2 tab identities without writing', async () => {
  const state = makeAdapter();
  const source = initialDocument();
  state.setDocument({
    ...source,
    tabs: [{
      tabId: 't.1',
      tabProperties: { tabId: 't.0' },
      documentTab: source.tabs[0].documentTab,
    }],
  });
  await expect(state.adapter.persist(draft())).rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  state.setDocument({
    ...source,
    tabs: [{ documentTab: source.tabs[0].documentTab }],
  });
  await expect(state.adapter.persist(draft())).rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  expect(state.writes).toHaveLength(0);
});

test('P137E native adapter persists all three source-backed CURRENT Themo observations with exact independent readback', async () => {
  for (const targetId of [
    'D_THEMO_CURRENT_BATHROOM_01',
    'D_THEMO_CURRENT_BEDROOM_01',
    'D_THEMO_CURRENT_LOBBY_01',
  ]) {
    const state = makeAdapter();
    const payload = draft(targetId);
    expect(await state.adapter.persist(payload)).toEqual({
      status: 'PERSISTED_TO_EXISTING_G2', recordId,
    });
    expect(state.writes).toHaveLength(1);
    expect(await state.adapter.readback(recordId)).toEqual({ recordId, payload });
    expect(payload.anchor.targetId).toBe(targetId);
    expect(payload.currentGeometry).toBe(false);
    expect(payload.canonical).toBe(false);
    expect(payload.asBuilt).toBe(false);
  }
});

test('P137E rejects superseded Themo marker IDs and historical circuit IDs without G2 write', async () => {
  const state = makeAdapter();
  for (const obsolete of [
    'D_THEMO_BATHROOM_CURRENT_01',
    'D_THEMO_BEDROOM_CURRENT_01',
    'D_THEMO_LOBBY_CURRENT_01',
    'G2_ELECTRIC_GROUP_10_2',
  ]) {
    await expect(state.adapter.persist(draft(obsolete)))
      .rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  }
  expect(state.writes).toHaveLength(0);
});

test('P137E requires the whole live door and R989 Themo evidence chain for any current placement', async () => {
  const state = makeAdapter();
  const source = initialDocument();
  source.tabs[0].documentTab!.body!.content =
    source.tabs[0].documentTab!.body!.content!.filter((item) =>
      !item.paragraph?.elements?.[0]?.textRun?.content?.includes('R989 - D current Themo'));
  state.setDocument(source);
  await expect(state.adapter.persist(draft()))
    .rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  expect(state.writes).toHaveLength(0);

  const noDoors = initialDocument();
  noDoors.tabs[0].documentTab!.body!.content =
    noDoors.tabs[0].documentTab!.body!.content!.filter((item) =>
      !item.paragraph?.elements?.[0]?.textRun?.content?.includes('3D-D/G2 p137N -'));
  state.setDocument(noDoors);
  await expect(state.adapter.persist(draft('D_THEMO_CURRENT_BATHROOM_01')))
    .rejects.toThrow('G2_TARGET_EVIDENCE_NOT_VERIFIED');
  expect(state.writes).toHaveLength(0);
});
