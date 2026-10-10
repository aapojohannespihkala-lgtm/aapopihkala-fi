import { expect, test } from '@playwright/test';
import { placementG2DocumentId, resolvePlacementG2Context } from '../../src/scripts/privateModelReviewPlacementG2Context';
import { readNativeG2CurrentPlacementTargets } from '../../src/scripts/privateModelReviewPlacementG2CurrentCombined';

const Q = String.fromCharCode(96);
const sourceLines = [
  '3D-D/G2 p137J - D 1F kaksi käyttäjävahvistettua nykytilan ovea WORK_TEST-geometriaksi 2026-09-29',
  'Tila: PASS_USER_CURRENT_DOOR_WORK_GEOMETRY_2_OF_2.',
  'Pysyvät review-ankkurit: §D1F_USER_CURRENT_DOOR_A§ = p137E §HUMAN_REVIEW_ANCHOR_A§, klikattu YLIS-G1-LOCAL X=3,235 m / Y=5,063 m. §D1F_USER_CURRENT_DOOR_B§ = §HUMAN_REVIEW_ANCHOR_B§, klikattu X=3,852 / Y=4,314 m.',
  '3D-D/G2 p137N - D 1F A/B historical/source-ID reconciliation 2026-09-29',
  'Tila: PASS_NEGATIVE_SOURCE_ID_RECONCILIATION / KEEP_USER_CURRENT_IDENTITIES.',
  'Johtopäätös p137I-C0:n mukaan: Historiallista G2_DOOR-ID:tä ei luoda eikä 7/7 source-ID-joukkoa muuteta. P137J:n pysyvät §D1F_USER_CURRENT_DOOR_A/B§ reviewDoorId:t säilyvät current-only identiteetteinä.',
  'R989 - D current Themo room/group provenance - 8.10.2026',
  'Tila: PASS_CURRENT_INSTALLATION_ROOM_BINDING / HISTORICAL_GROUP_CONTEXT_BOUND / NO_GEOMETRY_MUTATION / NO_PROMOTION.',
  'Current installation evidence: §Ylisrinne - huollon ja ylläpidon seuranta§ vahvistaa käyttäjän ilmoituksella, että kaikki 3 x Themo-lattialämmitystermostaatti asennettiin 7.10.2026. Käyttäjä vahvisti 8.10.2026 myös laitteiden huonenimien olevan oikein: Bathroom, Bedroom ja Lobby.',
  'Loogiset nykylaite-identiteetit tulevaa tietomallikulutusta varten: §D_THEMO_CURRENT_BATHROOM_01§ = Themo / Bathroom; §D_THEMO_CURRENT_BEDROOM_01§ = Themo / Bedroom; §D_THEMO_CURRENT_LOBBY_01§ = Themo / Lobby. Näillä identiteeteillä on §currentInstallationEvidence=true§ ja §roomAssignmentEvidence=USER_CONFIRMED§, mutta ei fyysistä pistekoordinaattia eikä 3D-laitegeometriaa.',
  'Historiallinen ryhmäkonteksti peritään muuttamatta G2 r791/r886 -evidenssistä: Bathroom -> source component C -> §sourceGroupKey=10.2§; Bedroom -> A -> §sourceGroupKey=10.3§; Lobby -> B -> §sourceGroupKey=10.1§.',
  'No-promotion / materialisointiraja: §exactCurrentXYClaim=false§, §exactZClaim=false§, §deviceGeometryClaim=false§, §physicalCableRouteClaim=false§, §continuousCableTopologyClaim=false§, §currentGeometryClaim=false§, §asBuilt=false§, §canonical=false§, §publishToCURRENT=false§ ja §HUMAN_REVIEW=NOT_RUN§.',
  'R999 - M5B-Z2R persisted registration / independent raw QA',
].map((line) => line.replaceAll('§', Q));

const body = (lines: string[]) => ({
  content: lines.map((content) => ({
    paragraph: { elements: [{ textRun: { content: content + '\n' } }] },
  })),
});
const native = (lines = sourceLines) => ({
  documentId: placementG2DocumentId,
  revisionId: 'REV_COMBINED_20261011',
  body: body(lines),
});
const read = async (document: unknown) => readNativeG2CurrentPlacementTargets(async () => document);

const expected = [
  'D1F_USER_CURRENT_DOOR_A',
  'D1F_USER_CURRENT_DOOR_B',
  'D_THEMO_CURRENT_BATHROOM_01',
  'D_THEMO_CURRENT_BEDROOM_01',
  'D_THEMO_CURRENT_LOBBY_01',
];

test('one authenticated-source read composes exact five D1F current-only targets from one revision', async () => {
  let calls = 0;
  const combined = await readNativeG2CurrentPlacementTargets(async () => {
    calls++;
    return native();
  });
  expect(calls).toBe(1);
  expect(combined?.documentId).toBe(placementG2DocumentId);
  expect(combined?.revisionId).toBe('REV_COMBINED_20261011');
  expect(combined?.targets.map((t) => t.reviewTargetId)).toEqual(expected);
  for (const target of combined?.targets ?? []) {
    expect(target).toMatchObject({
      apartment: 'D', floor: '1F', coordinateFrame: 'YLIS-G1-LOCAL',
      identityKind: 'USER_CURRENT_ONLY_REVIEW_ID', sourceG2Id: null, wallHosts: [],
    });
    expect(Object.keys(target)).not.toContain('xM');
    expect(Object.keys(target)).not.toContain('yM');
    expect(Object.keys(target)).not.toContain('zM');
  }
});

test('five targets resolve through existing target-bound context but do not gain host approval', async () => {
  const combined = await read(native());
  expect(combined).not.toBeNull();
  for (const targetId of expected) {
    const result = await resolvePlacementG2Context({
      targetId, floor: '1F', readG2: async () => combined,
    });
    expect(result.status).toBe('REVIEW_CONTEXT_READY');
    if (result.status === 'REVIEW_CONTEXT_READY') {
      expect(result.evidence.exactPhysicalPlacement).toBe(false);
      expect(result.evidence.verifiedWallCount).toBe(0);
      expect(result.context.approvedWallHosts).toEqual([]);
    }
  }
});

test('one native tab takes precedence over a poisoned duplicate legacy body', async () => {
  const doc = {
    ...native([...sourceLines, ...sourceLines]),
    tabs: [{ tabId: 't.0', body: body(sourceLines) }],
  };
  expect((await read(doc))?.targets).toHaveLength(5);
});

test('missing either source chain must fail closed for all five identities', async () => {
  expect(await read(native(sourceLines.slice(0, 6)))).toBeNull();
  expect(await read(native(sourceLines.slice(6)))).toBeNull();
  expect(await read(native([...sourceLines, ...sourceLines]))).toBeNull();
  expect(await read({ ...native(), documentId: 'WRONG_DOCUMENT' })).toBeNull();
  expect(await read({ ...native(), revisionId: '' })).toBeNull();
});

test('Themo room mismatch, promotion flag or negative door reconciliation loss rejects the whole batch', async () => {
  const badRoom = [...sourceLines];
  badRoom[9] = badRoom[9].replace('Themo / Bedroom', 'Themo / Kitchen');
  expect(await read(native(badRoom))).toBeNull();

  const promoted = [...sourceLines];
  promoted[11] = promoted[11].replace('canonical=false', 'canonical=true');
  expect(await read(native(promoted))).toBeNull();

  const reidentifiedDoor = [...sourceLines];
  reidentifiedDoor[5] = reidentifiedDoor[5].replace('Historiallista G2_DOOR-ID:tä ei luoda', 'Historiallinen ID luotiin');
  expect(await read(native(reidentifiedDoor))).toBeNull();
});

test('obsolete Themo presentation aliases and cross-floor requests remain closed', async () => {
  const combined = await read(native());
  for (const [targetId, floor, status] of [
    ['D_THEMO_LOBBY_CURRENT_01', '1F', 'TARGET_NOT_FOUND'],
    ['G2_DOOR_INT_D_1F_WC_001', '1F', 'TARGET_NOT_FOUND'],
    ['D_THEMO_CURRENT_LOBBY_01', '2F', 'TARGET_SOURCE_CONFLICT'],
  ] as const) {
    const result = await resolvePlacementG2Context({
      targetId, floor, readG2: async () => combined,
    });
    expect(result.status).toBe(status);
  }
});

test('unavailable trusted native G2 port never returns partial or synthetic targets', async () => {
  expect(await readNativeG2CurrentPlacementTargets(async () => { throw new Error('read denied'); })).toBeNull();
  expect(await readNativeG2CurrentPlacementTargets(async () => null)).toBeNull();
  expect(await readNativeG2CurrentPlacementTargets(null as never)).toBeNull();
});
