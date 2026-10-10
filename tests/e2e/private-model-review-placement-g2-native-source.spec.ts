import { expect, test } from '@playwright/test';
import { placementG2DocumentId, resolvePlacementG2Context } from '../../src/scripts/privateModelReviewPlacementG2Context';
import { projectNativeG2CurrentDoorReadback } from '../../src/scripts/privateModelReviewPlacementG2NativeSource';

// Minimal exact wording of the existing G2 p137J and p137N evidence lines,
// not a fabricated approval object. No wall host or historical source ID exists
// for these two current-only review doors.
const lines = [
  '3D-D/G2 p137J - D 1F kaksi käyttäjävahvistettua nykytilan ovea WORK_TEST-geometriaksi 2026-09-29',
  'Tila: PASS_USER_CURRENT_DOOR_WORK_GEOMETRY_2_OF_2.',
  'Pysyvät review-ankkurit: `D1F_USER_CURRENT_DOOR_A` = p137E `HUMAN_REVIEW_ANCHOR_A`, klikattu YLIS-G1-LOCAL X=3,235 m / Y=5,063 m. `D1F_USER_CURRENT_DOOR_B` = `HUMAN_REVIEW_ANCHOR_B`, klikattu X=3,852 / Y=4,314 m.',
  '3D-D/G2 p137N - D 1F A/B historical/source-ID reconciliation 2026-09-29',
  'Tila: PASS_NEGATIVE_SOURCE_ID_RECONCILIATION / KEEP_USER_CURRENT_IDENTITIES.',
  'Johtopäätös p137I-C0:n mukaan: Historiallista G2_DOOR-ID:tä ei luoda eikä 7/7 source-ID-joukkoa muuteta. P137J:n pysyvät `D1F_USER_CURRENT_DOOR_A/B` reviewDoorId:t säilyvät current-only identiteetteinä.',
];

const body = (texts: string[]) => ({
  content: texts.map((content) => ({
    paragraph: { elements: [{ textRun: { content: content + '\n' } }] },
  })),
});
const native = (texts = lines) => ({
  documentId: placementG2DocumentId,
  revisionId: 'G2_NATIVE_TEST_REV_1',
  body: body(texts),
});
const getTarget = async (document: unknown, targetId = 'D1F_USER_CURRENT_DOOR_A', floor: '1F' | '2F' = '1F') =>
  resolvePlacementG2Context({
    targetId, floor,
    readG2: async () => projectNativeG2CurrentDoorReadback(document),
  });

test('native G2 evidence returns only the two current-only D1F review identities', async () => {
  const source = projectNativeG2CurrentDoorReadback(native());
  expect(source).toMatchObject({
    documentId: placementG2DocumentId,
    revisionId: 'G2_NATIVE_TEST_REV_1',
    targets: [
      { reviewTargetId: 'D1F_USER_CURRENT_DOOR_A', identityKind: 'USER_CURRENT_ONLY_REVIEW_ID', sourceG2Id: null, wallHosts: [] },
      { reviewTargetId: 'D1F_USER_CURRENT_DOOR_B', identityKind: 'USER_CURRENT_ONLY_REVIEW_ID', sourceG2Id: null, wallHosts: [] },
    ],
  });
  expect((await getTarget(native())).status).toBe('REVIEW_CONTEXT_READY');
  expect((await getTarget(native(), 'D1F_USER_CURRENT_DOOR_B')).status).toBe('REVIEW_CONTEXT_READY');
  expect((await getTarget(native(), 'D1F_USER_CURRENT_DOOR_A', '2F')).status).toBe('TARGET_SOURCE_CONFLICT');
});

test('tabbed native Docs document is supported without inventing wall approval', async () => {
  const source = projectNativeG2CurrentDoorReadback({
    documentId: placementG2DocumentId,
    revisionId: 'G2_NATIVE_TAB_REV',
    tabs: [{ documentTab: { body: body(lines) } }],
  });
  expect(source?.targets).toHaveLength(2);
  expect(source?.targets.every((t) => t.wallHosts.length === 0)).toBe(true);
});

test('wrong document, empty revision and missing anchored source sections fail closed', () => {
  expect(projectNativeG2CurrentDoorReadback({ ...native(), documentId: 'WRONG' })).toBeNull();
  expect(projectNativeG2CurrentDoorReadback({ ...native(), revisionId: '' })).toBeNull();
  expect(projectNativeG2CurrentDoorReadback(native(lines.slice(0, 3)))).toBeNull();
  expect(projectNativeG2CurrentDoorReadback(native(lines.slice(3)))).toBeNull();
});

test('source reconciliation must explicitly retain nonhistorical identities', () => {
  const renamed = [...lines];
  renamed[5] = renamed[5].replace('Historiallista G2_DOOR-ID:tä ei luoda', 'Historiallinen G2_DOOR-ID luotiin');
  expect(projectNativeG2CurrentDoorReadback(native(renamed))).toBeNull();

  const incomplete = [...lines];
  incomplete[4] = 'Tila: PASS_NEGATIVE_SOURCE_ID_RECONCILIATION.';
  expect(projectNativeG2CurrentDoorReadback(native(incomplete))).toBeNull();
});

test('ambiguous duplicate G2 source sections and missing review anchors fail closed', () => {
  expect(projectNativeG2CurrentDoorReadback(native([...lines, ...lines]))).toBeNull();
  const missingB = [...lines];
  missingB[2] = missingB[2].replace('D1F_USER_CURRENT_DOOR_B', 'UNKNOWN_CURRENT_DOOR_B');
  expect(projectNativeG2CurrentDoorReadback(native(missingB))).toBeNull();
});

test('an unrelated G2 source target cannot be promoted through this narrow bridge', async () => {
  expect((await getTarget(native(), 'G2_DOOR_INT_D_1F_WC_001')).status).toBe('TARGET_NOT_FOUND');
  expect((await getTarget(native(), 'THERMO_LOBBY')).status).toBe('TARGET_NOT_FOUND');
});
