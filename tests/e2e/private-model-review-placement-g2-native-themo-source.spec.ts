import { expect, test } from '@playwright/test';
import {
  placementG2DocumentId,
  resolvePlacementG2Context,
} from '../../src/scripts/privateModelReviewPlacementG2Context';
import { projectNativeG2CurrentThemoReadback } from '../../src/scripts/privateModelReviewPlacementG2NativeThemoSource';

// Source-faithful R989 excerpt; no coordinates, host or 3D geometry added.
const lines = [
  'R989 - D current Themo room/group provenance - 8.10.2026',
  'Tila: PASS_CURRENT_INSTALLATION_ROOM_BINDING / HISTORICAL_GROUP_CONTEXT_BOUND / NO_GEOMETRY_MUTATION / NO_PROMOTION.',
  'Current installation evidence: §Ylisrinne - huollon ja ylläpidon seuranta§ vahvistaa käyttäjän ilmoituksella, että kaikki 3 x Themo-lattialämmitystermostaatti asennettiin 7.10.2026. Käyttäjä vahvisti 8.10.2026 myös laitteiden huonenimien olevan oikein: Bathroom, Bedroom ja Lobby.',
  'Loogiset nykylaite-identiteetit tulevaa tietomallikulutusta varten: §D_THEMO_CURRENT_BATHROOM_01§ = Themo / Bathroom; §D_THEMO_CURRENT_BEDROOM_01§ = Themo / Bedroom; §D_THEMO_CURRENT_LOBBY_01§ = Themo / Lobby. Näillä identiteeteillä on §currentInstallationEvidence=true§ ja §roomAssignmentEvidence=USER_CONFIRMED§, mutta ei fyysistä pistekoordinaattia eikä 3D-laitegeometriaa.',
  'Historiallinen ryhmäkonteksti peritään muuttamatta G2 r791/r886 -evidenssistä: Bathroom -> source component C -> §sourceGroupKey=10.2§; Bedroom -> A -> §sourceGroupKey=10.3§; Lobby -> B -> §sourceGroupKey=10.1§.',
  'No-promotion / materialisointiraja: §exactCurrentXYClaim=false§, §exactZClaim=false§, §deviceGeometryClaim=false§, §physicalCableRouteClaim=false§, §continuousCableTopologyClaim=false§, §currentGeometryClaim=false§, §asBuilt=false§, §canonical=false§, §publishToCURRENT=false§ ja §HUMAN_REVIEW=NOT_RUN§.',
  'R999 - M5B-Z2R persisted registration / independent raw QA',
].map((line) => line.replaceAll('§', String.fromCharCode(96)));

const body = (paragraphs: string[]) => ({
  content: paragraphs.map((content) => ({
    paragraph: { elements: [{ textRun: { content: content + '\n' } }] },
  })),
});
const doc = (paragraphs = lines) => ({
  documentId: placementG2DocumentId,
  revisionId: 'G2_THEMO_R989_TEST_REV',
  body: body(paragraphs),
});

test('G2 R989 binds three installed Themo logical identities to D1F, with zero guessed XY/host', async () => {
  const result = projectNativeG2CurrentThemoReadback(doc());
  expect(result).toMatchObject({
    documentId: placementG2DocumentId,
    revisionId: 'G2_THEMO_R989_TEST_REV',
    targets: [
      { reviewTargetId: 'D_THEMO_CURRENT_BATHROOM_01', floor: '1F', sourceG2Id: null, wallHosts: [] },
      { reviewTargetId: 'D_THEMO_CURRENT_BEDROOM_01', floor: '1F', sourceG2Id: null, wallHosts: [] },
      { reviewTargetId: 'D_THEMO_CURRENT_LOBBY_01', floor: '1F', sourceG2Id: null, wallHosts: [] },
    ],
  });
  expect(result?.targets).toHaveLength(3);
  for (const target of result?.targets ?? []) {
    expect(target.identityKind).toBe('USER_CURRENT_ONLY_REVIEW_ID');
    expect(Object.keys(target)).not.toContain('xM');
    expect(Object.keys(target)).not.toContain('yM');
    const resolved = await resolvePlacementG2Context({
      targetId: target.reviewTargetId,
      floor: '1F',
      readG2: async () => result,
    });
    expect(resolved.status).toBe('REVIEW_CONTEXT_READY');
    if (resolved.status === 'REVIEW_CONTEXT_READY') {
      expect(resolved.evidence.verifiedWallCount).toBe(0);
      expect(resolved.evidence.exactPhysicalPlacement).toBe(false);
    }
  }
});

test('native Docs tabs take precedence over duplicate legacy body rendering', () => {
  const result = projectNativeG2CurrentThemoReadback({
    ...doc([...lines, ...lines]),
    tabs: [{ documentTab: { body: body(lines) } }],
  });
  expect(result?.targets).toHaveLength(3);
});

test('duplicate or missing Themo source section fails closed', () => {
  expect(projectNativeG2CurrentThemoReadback(doc([...lines, ...lines]))).toBeNull();
  expect(projectNativeG2CurrentThemoReadback(doc(lines.slice(1)))).toBeNull();
  expect(projectNativeG2CurrentThemoReadback(doc(lines.filter((line) =>
    !line.startsWith('Loogiset nykylaite-identiteetit'))))).toBeNull();
});

test('a different device ID, missing installation evidence or room reassignment is not accepted', () => {
  const replaced = [...lines];
  replaced[3] = replaced[3].replace('D_THEMO_CURRENT_LOBBY_01', 'D_THEMO_LOBBY_CURRENT_01');
  expect(projectNativeG2CurrentThemoReadback(doc(replaced))).toBeNull();

  const wronglyAssigned = [...lines];
  wronglyAssigned[3] = wronglyAssigned[3].replace('Themo / Bedroom', 'Themo / Kitchen');
  expect(projectNativeG2CurrentThemoReadback(doc(wronglyAssigned))).toBeNull();

  const lackingInstallation = [...lines];
  lackingInstallation[2] = lackingInstallation[2].replace('asennettiin 7.10.2026', 'asennusta suunniteltiin');
  expect(projectNativeG2CurrentThemoReadback(doc(lackingInstallation))).toBeNull();
});

test('unknown G2 document, no revision, changed promotion statuses fail closed', () => {
  expect(projectNativeG2CurrentThemoReadback({ ...doc(), documentId: 'WRONG' })).toBeNull();
  expect(projectNativeG2CurrentThemoReadback({ ...doc(), revisionId: '' })).toBeNull();
  const canonical = [...lines];
  canonical[5] = canonical[5].replace('§canonical=false§'.replaceAll('§', String.fromCharCode(96)), 'canonical=true');
  expect(projectNativeG2CurrentThemoReadback(doc(canonical))).toBeNull();
});

test('old Themo WORK_TEST presentation-anchor IDs are not promoted into current device IDs', async () => {
  const readback = projectNativeG2CurrentThemoReadback(doc());
  expect(readback?.targets.some((t) => t.reviewTargetId === 'D_THEMO_LOBBY_CURRENT_01')).toBe(false);
  const result = await resolvePlacementG2Context({
    targetId: 'D_THEMO_LOBBY_CURRENT_01',
    floor: '1F',
    readG2: async () => readback,
  });
  expect(result.status).toBe('TARGET_NOT_FOUND');
  const wrongFloor = await resolvePlacementG2Context({
    targetId: 'D_THEMO_CURRENT_BEDROOM_01',
    floor: '2F',
    readG2: async () => readback,
  });
  expect(wrongFloor.status).toBe('TARGET_SOURCE_CONFLICT');
});
