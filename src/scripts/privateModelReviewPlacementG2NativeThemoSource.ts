import {
  placementG2DocumentId,
  type G2PlacementReviewTarget,
  type G2PlacementSourceReadback,
} from './privateModelReviewPlacementG2Context';

/**
 * Server-only projection of the EXISTING G2 R989 current Themo installation evidence.
 * The caller obtains native Google Docs through an authenticated trusted backend.
 * No browser-provided document, historical P186F-X1 centroid or synthetic XY
 * can establish current placement.
 *
 * R989 logical device IDs use D_THEMO_CURRENT_..._01. The distinct
 * D_THEMO_..._CURRENT_01 identifiers in R1009 are old presentation markers;
 * never equate these IDs or inherit their superseded placement proxies.
 */
type TextElement = { textRun?: { content?: unknown } };
type Body = { content?: Array<{ paragraph?: { elements?: TextElement[] } }> };
type Tab = { documentTab?: { body?: Body }; body?: Body; childTabs?: Tab[] };
type NativeDocument = {
  documentId?: unknown;
  revisionId?: unknown;
  body?: Body;
  tabs?: Tab[];
};

const paragraphsOfBody = (body?: Body): string[] =>
  Array.isArray(body?.content)
    ? body.content.flatMap((item) => item.paragraph?.elements
      ? [item.paragraph.elements.map((e) =>
        typeof e.textRun?.content === 'string' ? e.textRun.content : '').join('').trim()]
      : []).filter(Boolean)
    : [];

const paragraphsOfTabs = (tabs: Tab[]): string[] =>
  tabs.flatMap((tab) => [
    ...paragraphsOfBody(tab.documentTab?.body ?? tab.body),
    ...(Array.isArray(tab.childTabs) ? paragraphsOfTabs(tab.childTabs) : []),
  ]);

const logicalTargets = [
  ['D_THEMO_CURRENT_BATHROOM_01', 'Bathroom'],
  ['D_THEMO_CURRENT_BEDROOM_01', 'Bedroom'],
  ['D_THEMO_CURRENT_LOBBY_01', 'Lobby'],
] as const;

const asCurrentOnly = (reviewTargetId: string): G2PlacementReviewTarget => ({
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
 * Reject missing/duplicate R989 evidence. A source-backed identity is not
 * evidence of physical installation XY/Z or an approved wall-opening host.
 */
export const projectNativeG2CurrentThemoReadback = (
  document: unknown,
): G2PlacementSourceReadback | null => {
  if (!document || typeof document !== 'object') return null;
  const source = document as NativeDocument;
  if (
    source.documentId !== placementG2DocumentId ||
    typeof source.revisionId !== 'string' ||
    !source.revisionId.trim()
  ) return null;

  // Google Docs may supply legacy body and tabs together: avoid double count.
  const paragraphs = Array.isArray(source.tabs) && source.tabs.length
    ? paragraphsOfTabs(source.tabs) : paragraphsOfBody(source.body);

  const positions = paragraphs.flatMap((line, index) =>
    /^R989 - D current Themo room\/group provenance - 8\.10\.2026$/.test(line)
      ? [index] : []);
  if (positions.length !== 1) return null;
  const start = positions[0];
  let end = paragraphs.length;
  for (let i = start + 1; i < paragraphs.length; i++) {
    if (/^(?:R\d+|G2 R\d+|3D-D\/G2 p\d+)\s+-\s+/.test(paragraphs[i])) {
      end = i;
      break;
    }
  }
  const section = paragraphs.slice(start + 1, end);
  const unique = (prefix: string) => {
    const matches = section.filter((line) => line.startsWith(prefix));
    return matches.length === 1 ? matches[0] : null;
  };
  const status = unique('Tila:');
  const installation = unique('Current installation evidence:');
  const logical = unique('Loogiset nykylaite-identiteetit');
  const noPromotion = unique('No-promotion / materialisointiraja:');
  if (
    !status?.includes('PASS_CURRENT_INSTALLATION_ROOM_BINDING') ||
    !status.includes('NO_PROMOTION') ||
    !installation?.includes('kaikki 3 x Themo-lattialämmitystermostaatti asennettiin 7.10.2026') ||
    !installation.includes('Bathroom, Bedroom ja Lobby') ||
    !logical?.includes('currentInstallationEvidence=true') ||
    !logical.includes('roomAssignmentEvidence=USER_CONFIRMED') ||
    !logical.includes('ei fyysistä pistekoordinaattia eikä 3D-laitegeometriaa') ||
    !noPromotion
  ) return null;

  for (const [id, room] of logicalTargets) {
    const pattern = new RegExp('`' + id + '`\\s*=\\s*Themo\\s*\\/\\s*' + room + '(?=\\s*[;.]|$)');
    if (!pattern.test(logical)) return null;
  }
  const requiredNoPromotion = [
    'exactCurrentXYClaim=false',
    'exactZClaim=false',
    'deviceGeometryClaim=false',
    'physicalCableRouteClaim=false',
    'currentGeometryClaim=false',
    'asBuilt=false',
    'canonical=false',
    'publishToCURRENT=false',
    'HUMAN_REVIEW=NOT_RUN',
  ];
  if (!requiredNoPromotion.every((token) => noPromotion.includes(token))) return null;

  return {
    documentId: placementG2DocumentId,
    revisionId: source.revisionId,
    targets: logicalTargets.map(([id]) => asCurrentOnly(id)),
  };
};
