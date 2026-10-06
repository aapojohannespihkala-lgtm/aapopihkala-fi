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

const selectionMetadataLabels: Record<string, string> = {
  sourceConnection: 'Lähdeyhteys',
  sourceVideoLengthM: 'Videokuvauksen pituus (m)',
  sourceConditionClass: 'Kuntoluokka',
  pipeMaterialSource: 'Putkimateriaali',
  pipeDiameterMmSource: 'Putken lähdehalkaisija (mm)',
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
      const value = scalarSelectionMetadataValue(rawValue);
      if (value !== null) values.set(key, value);
    }
    current = current.parent;
    depth += 1;
  }

  const priority = new Map(selectionMetadataPriority.map((key, index) => [key, index]));
  return [...values.entries()]
    .sort(([keyA], [keyB]) => {
      const rankA = priority.get(keyA as (typeof selectionMetadataPriority)[number]) ?? Number.MAX_SAFE_INTEGER;
      const rankB = priority.get(keyB as (typeof selectionMetadataPriority)[number]) ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB || keyA.localeCompare(keyB, 'fi');
    })
    .slice(0, 12);
};
