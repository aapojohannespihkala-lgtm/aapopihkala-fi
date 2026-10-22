export type SelectionMetadataEntry = readonly [string, string];

export type SelectionMetadataNode = {
  userData?: Record<string, unknown>;
  parent?: SelectionMetadataNode | null;
};

const selectionMetadataPriority = [
  'Pass',
  'pass',
  'representationKind',
  'sourceConnection',
  'sourceVideoLengthM',
  'sourceConditionClass',
  'pipeMaterialSource',
  'pipeDiameterMmSource',
  'wellMaterialSource',
  'wellDiameterMmSource',
  'geometryType',
  'sourceRole',
  'sourceFamily',
  'sourceContract',
  'ModelStage',
  'modelStage',
  'storey',
  'floor',
  'PresentationOnly',
  'presentationOnly',
  'Canonical',
  'canonical',
  'current',
  'asBuiltClaim',
  'humanReview',
] as const;

const electricalSelectionMetadataPriority = [
  'Pass',
  'pass',
  'representationKind',
  'hostStorey',
  'presentationLayer',
  'sourceSelector',
  'sourceFragmentCount',
  'sourceLineItemCount',
  'sourceGraphicOnly',
  'floorHeatingCableGeometryClaim',
  'closedHeatingZoneClaim',
  'electricalPanelGeometryClaim',
  'physicalCableRouteClaim',
  'deviceGeometryClaim',
  'symbolSemanticClaim',
  'currentGeometryClaim',
  'ModelStage',
  'modelStage',
] as const;

const luminaireSelectionMetadataPriority = [
  'Pass',
  'pass',
  'representationKind',
  'hostStorey',
  'sourcePos',
  'sourceScheduleType',
  'sourceScheduleSnro',
  'positionTypeBinding',
  'physicalLuminaireGeometryClaim',
  'exactCurrentXYClaim',
  'exactZClaim',
  'currentGeometryClaim',
  'publishToCURRENT',
] as const;

const selectionMetadataLabels: Record<string, string> = {
  hostStorey: 'Kohdekerros',
  presentationLayer: 'Esityskerros',
  sourceSelector: 'Lähdegrafiikan valinta',
  sourceFragmentCount: 'Lähdefragmentteja',
  sourceLineItemCount: 'Lähdeviivoja',
  sourceGraphicOnly: 'Vain lähdegrafiikkaa',
  floorHeatingCableGeometryClaim: 'Lattialämmityskaapelin geometria varmennettu',
  closedHeatingZoneClaim: 'Suljettu lämmitysalue varmennettu',
  electricalPanelGeometryClaim: 'Ryhmäkeskuksen geometria varmennettu',
  physicalCableRouteClaim: 'Fyysinen kaapelireitti varmennettu',
  deviceGeometryClaim: 'Laitesijaintigeometria varmennettu',
  symbolSemanticClaim: 'Sähkösymbolien merkitys varmennettu',
  currentGeometryClaim: 'Nykygeometria varmennettu',
  sourcePos: 'Valaisinluettelon Pos',
  sourceScheduleType: 'Valaisintyyppi',
  sourceScheduleSnro: 'Sähkönumero',
  positionTypeBinding: 'Pos-tyyppisidonnan varmuus',
  physicalLuminaireGeometryClaim: 'Fyysinen valaisingeometria varmennettu',
  exactCurrentXYClaim: 'Nykyinen XY-sijainti täsmällinen',
  exactZClaim: 'Z-korko täsmällinen',
  publishToCURRENT: 'Julkaistaan CURRENTiin',
  sourceConnection: 'Lähdeyhteys',
  sourceVideoLengthM: 'Videokuvauksen pituus (m)',
  sourceConditionClass: 'Kuntoluokka',
  pipeMaterialSource: 'Putkimateriaali',
  pipeDiameterMmSource: 'Putken lähdehalkaisija (mm)',
  wellMaterialSource: 'Raportin kaivomateriaalit (järjestelmätaso)',
  wellDiameterMmSource: 'Raportin kaivokoot (mm, järjestelmätaso)',
};

export const formatSelectionMetadataKey = (key: string) =>
  selectionMetadataLabels[key] ??
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());

export const scalarSelectionMetadataValue = (value: unknown) => {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 180) return null;
    return trimmed;
  }
  return null;
};

const selectionMetadataValue = (key: string, value: unknown) => {
  const scalar = scalarSelectionMetadataValue(value);
  if (scalar !== null) return scalar;

  if (key !== 'wellDiameterMmSource' || !Array.isArray(value) || value.length < 1 || value.length > 8) {
    return null;
  }

  const diameters = value.map((item) =>
    typeof item === 'number' && Number.isFinite(item) ? String(item) : null,
  );
  return diameters.every((item): item is string => item !== null) ? diameters.join(', ') : null;
};

export const selectionMetadataEntries = (
  object: SelectionMetadataNode | null | undefined,
  stopAt: SelectionMetadataNode | null | undefined,
): SelectionMetadataEntry[] => {
  const values = new Map<string, string>();
  let current = object;
  let depth = 0;

  while (current && current !== stopAt && depth < 8 && values.size < 24) {
    for (const [key, rawValue] of Object.entries(current.userData ?? {})) {
      if (values.has(key)) continue;
      const value = selectionMetadataValue(key, rawValue);
      if (value !== null) values.set(key, value);
    }
    current = current.parent;
    depth += 1;
  }

  const priorityKeys: readonly string[] =
    values.get('representationKind') === 'luminaireSourceSymbolAnchorMarker'
      ? [
          ...luminaireSelectionMetadataPriority,
          ...electricalSelectionMetadataPriority,
          ...selectionMetadataPriority,
        ]
      : values.get('presentationLayer') === 'MEP_ELECTRICAL'
        ? [...electricalSelectionMetadataPriority, ...selectionMetadataPriority]
        : selectionMetadataPriority;
  const priority = new Map<string, number>();
  for (const key of priorityKeys) {
    if (!priority.has(key)) priority.set(key, priority.size);
  }

  return [...values.entries()]
    .sort(([keyA], [keyB]) => {
      const rankA = priority.get(keyA) ?? Number.MAX_SAFE_INTEGER;
      const rankB = priority.get(keyB) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB || keyA.localeCompare(keyB, 'fi');
    })
    .slice(0, 12);
};

export type SelectionSourceLink = {
  readonly link: string;
  readonly label: string;
};

const allowedSourceLinkPrefixes = ['https://drive.google.com/', 'https://docs.google.com/'] as const;
const maxSelectionSourceLinks = 50;

const sourceLinkText = (value: unknown) => {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .join(', ');
  }
  return '';
};

/**
 * GLB node extras.sourceLinks ({docId, link, role, supports}) from the selected node and
 * its ancestors (same 8-level walk as scalar metadata). Only Google Drive/Docs links are
 * returned, de-duplicated by link. Source references, not current/as-built claims.
 */
export const selectionSourceLinks = (
  object: SelectionMetadataNode | null | undefined,
  stopAt: SelectionMetadataNode | null | undefined,
): SelectionSourceLink[] => {
  const links = new Map<string, SelectionSourceLink>();
  let current = object;
  let depth = 0;

  while (current && current !== stopAt && depth < 8 && links.size < maxSelectionSourceLinks) {
    const raw = current.userData?.sourceLinks;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        if (links.size >= maxSelectionSourceLinks) break;
        if (!item || typeof item !== 'object') continue;
        const record = item as Record<string, unknown>;
        const link = typeof record.link === 'string' ? record.link.trim() : '';
        if (!allowedSourceLinkPrefixes.some((prefix) => link.startsWith(prefix))) continue;
        if (links.has(link)) continue;
        const label =
          [sourceLinkText(record.role), sourceLinkText(record.supports)].filter(Boolean).join(' · ') ||
          sourceLinkText(record.docId) ||
          'Lähde';
        links.set(link, { link, label: label.length > 240 ? `${label.slice(0, 237)}…` : label });
      }
    }
    current = current.parent;
    depth += 1;
  }

  return [...links.values()];
};
