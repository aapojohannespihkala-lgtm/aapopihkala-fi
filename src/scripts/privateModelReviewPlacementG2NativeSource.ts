import {
  placementG2DocumentId,
  type G2PlacementReviewTarget,
  type G2PlacementSourceReadback,
} from './privateModelReviewPlacementG2Context';

/**
 * Server-side only projection from the EXISTING native G2 Google Doc.
 *
 * The caller must fetch Google Docs through its authenticated backend. This
 * pure function neither authenticates nor writes, and must never accept a
 * document supplied by the viewer itself as evidence of approval.
 *
 * Only p137J/p137N's two CURRENT-ONLY D1F review identities are projected.
 * Neither 2015 source IDs nor approved wall/opening geometry can be inferred
 * from these prose sections. The resulting empty wall-host sets ensure that
 * downstream placement remains UNSNAPPED until separate G2 evidence is read.
 */
type NativeDocsTextElement = { textRun?: { content?: unknown } };
type NativeDocsBody = { content?: Array<{ paragraph?: { elements?: NativeDocsTextElement[] } }> };
type NativeDocsTab = {
  documentTab?: { body?: NativeDocsBody };
  body?: NativeDocsBody;
  childTabs?: NativeDocsTab[];
};
type NativeG2Document = {
  documentId?: unknown;
  revisionId?: unknown;
  body?: NativeDocsBody;
  tabs?: NativeDocsTab[];
};

const getParagraphsFromBody = (body?: NativeDocsBody): string[] =>
  Array.isArray(body?.content)
    ? body.content.flatMap((item) => item.paragraph?.elements
      ? [item.paragraph.elements.map((e) => typeof e.textRun?.content === 'string'
        ? e.textRun.content : '').join('').trim()]
      : []).filter(Boolean)
    : [];

const getParagraphsFromTabs = (tabs: NativeDocsTab[]): string[] =>
  tabs.flatMap((tab) => [
    ...getParagraphsFromBody(tab.documentTab?.body ?? tab.body),
    ...(Array.isArray(tab.childTabs) ? getParagraphsFromTabs(tab.childTabs) : []),
  ]);

const sectionBetween = (paragraphs: string[], heading: RegExp): string[] | null => {
  const positions = paragraphs.flatMap((p, i) => heading.test(p) ? [i] : []);
  if (positions.length !== 1) return null;
  const start = positions[0];
  let end = paragraphs.length;
  for (let i = start + 1; i < paragraphs.length; i++) {
    if (/^3D-D\/G2\s+p\d+/i.test(paragraphs[i])) { end = i; break; }
  }
  return paragraphs.slice(start, end);
};

const currentDoor = (reviewTargetId: string): G2PlacementReviewTarget => ({
  reviewTargetId,
  sourceRecordId: reviewTargetId,
  apartment: 'D',
  floor: '1F',
  coordinateFrame: 'YLIS-G1-LOCAL',
  identityKind: 'USER_CURRENT_ONLY_REVIEW_ID',
  sourceG2Id: null,
  wallHosts: [],
});

/**
 * A fail-closed source binder, not a general prose-to-geometry extractor.
 * Section headings, independent review-anchor and negative reconciliation
 * evidence must all be present in this exact G2 document revision.
 */
export const projectNativeG2CurrentDoorReadback = (
  document: unknown,
): G2PlacementSourceReadback | null => {
  if (!document || typeof document !== 'object') return null;
  const source = document as NativeG2Document;
  if (
    source.documentId !== placementG2DocumentId ||
    typeof source.revisionId !== 'string' ||
    source.revisionId.trim().length === 0
  ) return null;
  // Docs can expose legacy body and tab content together; consume only one
  // source surface so the same G2 paragraph cannot become a false duplicate.
  const paragraphs = Array.isArray(source.tabs) && source.tabs.length
    ? getParagraphsFromTabs(source.tabs)
    : getParagraphsFromBody(source.body);
  const review = sectionBetween(paragraphs,
    /^3D-D\/G2 p137J - D 1F kaksi käyttäjävahvistettua nykytilan ovea WORK_TEST-geometriaksi/);
  const reconciliation = sectionBetween(paragraphs,
    /^3D-D\/G2 p137N - D 1F A\/B historical\/source-ID reconciliation/);
  if (!review || !reconciliation) return null;

  const anchors = review.filter((p) => p.startsWith('Pysyvät review-ankkurit:'));
  const status = reconciliation.filter((p) => p.startsWith('Tila:'));
  const negative = reconciliation.filter((p) => p.startsWith('Johtopäätös p137I-C0:n mukaan:'));
  if (
    anchors.length !== 1 || status.length !== 1 || negative.length !== 1 ||
    !anchors[0].includes('YLIS-G1-LOCAL') ||
    !/\bD1F_USER_CURRENT_DOOR_A\b/.test(anchors[0]) ||
    !/\bD1F_USER_CURRENT_DOOR_B\b/.test(anchors[0]) ||
    !status[0].includes('PASS_NEGATIVE_SOURCE_ID_RECONCILIATION') ||
    !status[0].includes('KEEP_USER_CURRENT_IDENTITIES') ||
    !negative[0].includes('Historiallista G2_DOOR-ID:tä ei luoda') ||
    !negative[0].includes('current-only identiteetteinä') ||
    !negative[0].includes('D1F_USER_CURRENT_DOOR_A/B')
  ) return null;

  return {
    documentId: placementG2DocumentId,
    revisionId: source.revisionId,
    targets: [
      currentDoor('D1F_USER_CURRENT_DOOR_A'),
      currentDoor('D1F_USER_CURRENT_DOOR_B'),
    ],
  };
};
