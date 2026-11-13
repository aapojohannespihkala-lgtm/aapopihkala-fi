export type SelectionMetadataEntry = readonly [string, string];

export type SelectionMetadataNode = {
  name?: string;
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
 * V90 H21/H22 use verified 2026 photo Drive IDs rather than sourceLinks.
 * Resolve only these two exact evidence IDs under their V90 integration task,
 * never an arbitrary userData ID or URL. These are WORK_TEST source photos,
 * not evidence of current geometry or physical pipe connections.
 */
const v90PhotoSourceForNode = (
  data: Record<string, unknown> | undefined,
): SelectionSourceLink | null => {
  const integrated = data?.v90IntegratedFrom;
  if (!integrated || typeof integrated !== 'object' || Array.isArray(integrated)) return null;
  const task = (integrated as Record<string, unknown>).task;

  if (task === 'H21' &&
      (data?.photoSourceDriveId === '1a16hN0pssODwrhazkkyXPzIQf2yeXP7-' ||
       data?.['2026PhotoZip'] === '1a16hN0pssODwrhazkkyXPzIQf2yeXP7-')) {
    return {
      link: 'https://drive.google.com/file/d/1a16hN0pssODwrhazkkyXPzIQf2yeXP7-/view',
      label: 'H21 - vuoden 2026 WC-valokuvat (WORK_TEST)',
    };
  }
  if (task === 'H22' &&
      data?.sourcePhoto === '1BmfFwt2R1OzEYzWQPP31CjSpeybxi9uO') {
    return {
      link: 'https://drive.google.com/file/d/1BmfFwt2R1OzEYzWQPP31CjSpeybxi9uO/view',
      label: 'H22 - vuoden 2026 keittio kuva (WORK_TEST)',
    };
  }
  return null;
};

/**
 * H23's integrated V90 PA2 group root has an exact pair of 2026 sourcePhoto
 * IDs but no sourceLinks. Its 23 children already have their own sourceLinks.
 * Only this source-exact group root may inherit the two verified photo links.
 * WORK_TEST photo evidence never establishes physical connections or as-built.
 */
const v90H23Pa2RootPhotoLinks = (
  data: Record<string, unknown> | undefined,
): SelectionSourceLink[] => {
  const integrated = data?.v90IntegratedFrom;
  if (!integrated || typeof integrated !== 'object' || Array.isArray(integrated)) return [];
  const origin = integrated as Record<string, unknown>;
  if (origin.task !== 'H23' || origin.donorNode !== 11391 ||
      data?.H23 !== true || data?.modelScope !== 'WORK_TEST/HOST_HOLD' ||
      data?.canonical !== false || data?.asBuilt !== false ||
      data?.sourceV89GLBSHA256 !== '718163b76b46aee51193e059c5790d0e22c84a364d82d8d58bc2084776902a2c') return [];
  const photos = data?.sourcePhotos;
  if (!Array.isArray(photos) || photos.length !== 2 ||
      photos[0] !== '1AwU2CHmVnnL4fPoBzBBMkLTU8ppurS3V' ||
      photos[1] !== '1k9fRDgKfu2mINDru0uqv6C5eVZ0-9kce') return [];
  return [
    {
      link: 'https://drive.google.com/file/d/1AwU2CHmVnnL4fPoBzBBMkLTU8ppurS3V/view',
      label: 'H23 PA2 - 2026 sulkuventtiilit ja letkut (WORK_TEST)',
    },
    {
      link: 'https://drive.google.com/file/d/1k9fRDgKfu2mINDru0uqv6C5eVZ0-9kce/view',
      label: 'H23 PA2 - 2026 vesilukko ja poimuletkut (WORK_TEST)',
    },
  ];
};

/**
 * The V93 double covered exterior outlets have exact owner-photo Drive IDs in
 * their source GLB root extras, but no sourceLinks array. Resolve only the two
 * source-exact roots, never a generic 2026PhotoDriveId from another object.
 * Model/viewer SHA and scene gates remain separate. A source photo does not
 * verify the 3D geometry, device SKU, wiring or installation.
 */
const v93DoubleOutletPhotoForNode = (
  node: SelectionMetadataNode | null | undefined,
): SelectionSourceLink | null => {
  const data = node?.userData;
  if (data?.['2026OwnerReview'] !== 'PHOTO LOCATION APPROVED; 2_OUTLETS_AND_PLASTIC_COVER_CONFIRMED_2026_11_10' ||
      data?.sourceModel !== 'Ylisrinne V93 socket scene303/304/305' ||
      data?.numSocketPositions !== 2 ||
      data?.oneProtectivePlasticCover !== true ||
      data?.hostHold !== true ||
      data?.current !== false ||
      data?.asBuilt !== false ||
      data?.physicalWiring !== 'NOT_MODELED_OR_VERIFIED') return null;
  if (node?.name === 'D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD' &&
      data?.['2026PhotoDriveId'] === '1H9Fp8oFQ38ERes_zX0jfKp7uY0sc4V8j') {
    return {
      link: 'https://drive.google.com/file/d/1H9Fp8oFQ38ERes_zX0jfKp7uY0sc4V8j/view',
      label: 'V93 1F terassi - 2026 valokuva (WORK_TEST-lähde)',
    };
  }
  if (node?.name === 'D_2F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP_OWNER_APPROVED_ROOT_WORK_TEST_HOST_HOLD' &&
      data?.['2026PhotoDriveId'] === '14WdPPFc0ZVolz4Z5a3Zf6ANPmPwGKvY1') {
    return {
      link: 'https://drive.google.com/file/d/14WdPPFc0ZVolz4Z5a3Zf6ANPmPwGKvY1/view',
      label: 'V93 2F parveke - 2026 valokuva (WORK_TEST-lähde)',
    };
  }
  return null;
};

/**
 * GLB node extras.sourceLinks ({docId, link, role, supports}) or legacy
 * {url, evidence} records from the selected node and
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
        // Older M5 WORK_TEST donors, including V87-H3, store URL under `url`.
        // Keep `link` authoritative when present; never invent a source URL.
        const rawLink = typeof record.link === 'string' ? record.link : record.url;
        const link = typeof rawLink === 'string' ? rawLink.trim() : '';
        if (!allowedSourceLinkPrefixes.some((prefix) => link.startsWith(prefix))) continue;
        if (links.has(link)) continue;
        const label =
          [sourceLinkText(record.role), sourceLinkText(record.supports) || sourceLinkText(record.evidence)]
            .filter(Boolean).join(' · ') ||
          sourceLinkText(record.docId) ||
          'Lähde';
        links.set(link, { link, label: label.length > 240 ? `${label.slice(0, 237)}…` : label });
      }
    }
    const photo = v90PhotoSourceForNode(current.userData);
    if (photo && links.size < maxSelectionSourceLinks && !links.has(photo.link)) {
      links.set(photo.link, photo);
    }
    for (const rootPhoto of v90H23Pa2RootPhotoLinks(current.userData)) {
      if (links.size >= maxSelectionSourceLinks) break;
      if (!links.has(rootPhoto.link)) links.set(rootPhoto.link, rootPhoto);
    }
    const outletPhoto = v93DoubleOutletPhotoForNode(current);
    if (outletPhoto && links.size < maxSelectionSourceLinks && !links.has(outletPhoto.link)) {
      links.set(outletPhoto.link, outletPhoto);
    }
    current = current.parent;
    depth += 1;
  }

  return [...links.values()];
};
