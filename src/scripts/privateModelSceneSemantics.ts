export type PrivateModelFloor = '1F' | '2F';

export const semanticName = (object: any) => {
  const names: string[] = [];
  let current = object;
  let depth = 0;

  while (current && depth < 12) {
    if (current.name) names.push(String(current.name));
    current = current.parent;
    depth += 1;
  }

  return names.join(' | ').toUpperCase();
};

export const normalizeSceneName = (name: unknown) =>
  String(name ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

export const findSourceNamedScene = (gltf: any, sourceName: string) => {
  const sourceScenes = gltf?.parser?.json?.scenes;
  if (Array.isArray(sourceScenes)) {
    const sourceIndex = sourceScenes.findIndex((candidate: any) => candidate?.name === sourceName);
    if (sourceIndex >= 0 && gltf.scenes?.[sourceIndex]) {
      return gltf.scenes[sourceIndex];
    }
  }

  const target = normalizeSceneName(sourceName);
  return (
    gltf.scenes?.find((candidate: any) => normalizeSceneName(candidate?.name) === target) ?? null
  );
};

export const hasFloorToken = (object: any, floor: PrivateModelFloor) => {
  const explicitStorey = String(object?.userData?.storey ?? '').toUpperCase();
  if (explicitStorey === floor) return true;

  const name = semanticName(object);
  return new RegExp('(^|[_\\s-])(?:D[_\\s-]?)?' + floor + '([_\\s-]|$)').test(name);
};

export const explicitFloorToken = (object: any) => {
  const has1F = hasFloorToken(object, '1F');
  const has2F = hasFloorToken(object, '2F');
  if (has1F && has2F) return '1F / 2F';
  if (has1F) return '1F';
  if (has2F) return '2F';
  return '-';
};


export type ArchitecturalWallFamily =
  | 'EXTERIOR'
  | 'PARTY'
  | 'INTERIOR'
  | 'UNCLASSIFIED'
  | 'UNRESOLVED_SEMANTIC_CONFLICT';

export type ArchitecturalBuildingPartFamily =
  | 'WALL'
  | 'DOOR'
  | 'WINDOW'
  | 'REVIEW_HELPER'
  | 'OTHER';

export type ArchitecturalRepresentationRole =
  | 'PHYSICAL'
  | 'WORK_TEST_ASSUMPTION'
  | 'REFERENCE'
  | 'REVIEW_HELPER'
  | 'UNRESOLVED';

export type ArchitecturalPhysicalClaimStatus = 'YES' | 'NO' | 'UNRESOLVED';

export type ArchitecturalSemanticDescriptor = {
  semanticWallFamily: ArchitecturalWallFamily;
  buildingPartFamily: ArchitecturalBuildingPartFamily;
  representationRole: ArchitecturalRepresentationRole;
  physicalClaimStatus: ArchitecturalPhysicalClaimStatus;
  labelFi: string;
  classLabelFi: string;
  representationLabelFi: string;
  statusLabelFi: string;
  physicalClaimLabelFi: string;
  storey: string;
};

type ArchitecturalSemanticNode = {
  userData?: Record<string, unknown>;
  parent?: ArchitecturalSemanticNode | null;
  name?: unknown;
};

const architecturalSemanticMetadataKeys = [
  'G2Id',
  'ParentG2Id',
  'representationKind',
  'presentationOnly',
  'PresentationOnly',
  'presentationLayer',
  'markerType',
  'physicalWallClaim',
  'physicalThicknessClaim',
  'physicalWallThicknessClaim',
  'physicalOpeningClaim',
  'physicalDoorVoid',
  'doorLeafGeometryAdded',
  'doorLeafGeometryClaim',
  'physicalWindowClaim',
  'windowProductGeometryClaim',
  'physicalClaim',
  'assumption',
  'workAssumption',
  'thicknessStatus',
  'sourceRole',
  'ModelStage',
  'modelStage',
  'humanReview',
  'Canonical',
  'canonical',
] as const;

const collectArchitecturalSemanticMetadata = (
  object: ArchitecturalSemanticNode | null | undefined,
  stopAt: ArchitecturalSemanticNode | null | undefined,
) => {
  const values: Record<string, unknown> = {};
  let current = object;
  let depth = 0;

  while (current && current !== stopAt && depth < 8) {
    const userData = current.userData ?? {};
    for (const key of architecturalSemanticMetadataKeys) {
      if (!(key in values) && Object.prototype.hasOwnProperty.call(userData, key)) {
        values[key] = userData[key];
      }
    }
    current = current.parent;
    depth += 1;
  }

  return values;
};

const normalizedSemanticString = (value: unknown) => String(value ?? '').trim();

const wallFamilyFromIdentity = (value: unknown): Exclude<
  ArchitecturalWallFamily,
  'UNCLASSIFIED' | 'UNRESOLVED_SEMANTIC_CONFLICT'
> | null => {
  const identity = normalizedSemanticString(value).toUpperCase();
  if (identity.startsWith('G2_WALL_EXT_')) return 'EXTERIOR';
  if (identity.startsWith('G2_WALL_PART_')) return 'PARTY';
  if (identity.startsWith('G2_WALL_INT_')) return 'INTERIOR';
  return null;
};

type DoorFamily = 'EXTERIOR' | 'INTERIOR' | null;

const doorFamilyFromIdentity = (value: unknown): DoorFamily => {
  const identity = normalizedSemanticString(value).toUpperCase();
  if (identity.startsWith('G2_DOOR_EXT_')) return 'EXTERIOR';
  if (identity.startsWith('G2_DOOR_INT_')) return 'INTERIOR';
  return null;
};

const buildingPartFromIdentity = (value: unknown): ArchitecturalBuildingPartFamily | null => {
  const identity = normalizedSemanticString(value).toUpperCase();
  if (identity.startsWith('G2_WALL_')) return 'WALL';
  if (identity.startsWith('G2_DOOR_')) return 'DOOR';
  if (identity.startsWith('G2_WINDOW_')) return 'WINDOW';
  return null;
};

const resolvePhysicalClaimStatus = (
  metadata: Record<string, unknown>,
  family: ArchitecturalBuildingPartFamily,
): ArchitecturalPhysicalClaimStatus => {
  const keys =
    family === 'WALL'
      ? ['physicalWallClaim', 'physicalThicknessClaim', 'physicalWallThicknessClaim']
      : family === 'DOOR'
        ? ['physicalOpeningClaim', 'physicalDoorVoid', 'doorLeafGeometryAdded', 'doorLeafGeometryClaim']
        : family === 'WINDOW'
          ? ['physicalOpeningClaim', 'physicalWindowClaim', 'windowProductGeometryClaim']
          : ['physicalClaim'];
  const values = keys
    .map((key) => metadata[key])
    .filter((value): value is boolean => typeof value === 'boolean');
  const hasYes = values.includes(true);
  const hasNo = values.includes(false);
  if (hasYes && hasNo) return 'UNRESOLVED';
  if (hasYes) return 'YES';
  if (hasNo) return 'NO';
  return 'UNRESOLVED';
};

const representationLabelFi = (role: ArchitecturalRepresentationRole) => {
  if (role === 'PHYSICAL') return 'Fyysinen';
  if (role === 'WORK_TEST_ASSUMPTION') return 'WORK_TEST-oletus';
  if (role === 'REFERENCE') return 'Referenssi';
  if (role === 'REVIEW_HELPER') return 'Review-apugeometria';
  return 'Ei ratkaistu';
};

const physicalClaimLabelFi = (status: ArchitecturalPhysicalClaimStatus) => {
  if (status === 'YES') return 'Kyllä';
  if (status === 'NO') return 'Ei';
  return 'Ei ratkaistu';
};

const statusLabelFi = (metadata: Record<string, unknown>) => {
  const stage = normalizedSemanticString(metadata.ModelStage ?? metadata.modelStage).toUpperCase();
  if (stage.includes('WORK_TEST')) return 'WORK_TEST';
  if (stage === 'CURRENT') return 'CURRENT';

  const humanReview = normalizedSemanticString(metadata.humanReview).toUpperCase();
  if (humanReview.includes('PASS')) return 'HUMAN_REVIEW PASS (rajattu)';
  if (humanReview.includes('NOT_RUN') || humanReview.includes('NOT_YET_REVIEWED')) {
    return 'Ei ihmiskatselmoitu';
  }

  if (metadata.Canonical === false || metadata.canonical === false) return 'Ei kanoninen';
  return 'Ei ratkaistu';
};

export const resolveArchitecturalSemanticDescriptor = (
  object: ArchitecturalSemanticNode | null | undefined,
  stopAt: ArchitecturalSemanticNode | null | undefined = null,
): ArchitecturalSemanticDescriptor => {
  const metadata = collectArchitecturalSemanticMetadata(object, stopAt);
  const g2Id = normalizedSemanticString(metadata.G2Id);
  const parentG2Id = normalizedSemanticString(metadata.ParentG2Id);
  const representationKind = normalizedSemanticString(metadata.representationKind);
  const representationKindUpper = representationKind.toUpperCase();
  const sourceRoleUpper = normalizedSemanticString(metadata.sourceRole).toUpperCase();
  const markerTypeUpper = normalizedSemanticString(metadata.markerType).toUpperCase();

  const g2Part = buildingPartFromIdentity(g2Id);
  const parentPart = buildingPartFromIdentity(parentG2Id);

  const isReference =
    ['OPENINGANCHOR', 'REFERENCEOPENING', 'REFERENCELINE'].includes(representationKindUpper) ||
    markerTypeUpper === 'HORIZONTAL_ONLY_REFERENCE_AT_HOST_FLOOR';
  const isReviewHelper =
    ['REFERENCEFOOTPRINT', 'STAIRHOSTFOOTPRINT'].includes(representationKindUpper) ||
    normalizedSemanticString(metadata.presentationLayer).toUpperCase() === 'CURRENT_D_OUTLINE' ||
    representationKindUpper.includes('HELPER') ||
    sourceRoleUpper.includes('HELPER') ||
    metadata.presentationOnly === true ||
    metadata.PresentationOnly === true;

  let buildingPartFamily =
    g2Part ??
    parentPart ??
    (representationKindUpper.includes('WALL') ||
    metadata.physicalWallClaim === true ||
    metadata.physicalThicknessClaim === true ||
    metadata.physicalWallThicknessClaim === true
      ? 'WALL'
      : isReviewHelper
        ? 'REVIEW_HELPER'
        : 'OTHER');

  const wallFamilies = [wallFamilyFromIdentity(g2Id), wallFamilyFromIdentity(parentG2Id)].filter(
    (value): value is 'EXTERIOR' | 'PARTY' | 'INTERIOR' => value !== null,
  );
  const uniqueWallFamilies = [...new Set(wallFamilies)];
  let semanticWallFamily: ArchitecturalWallFamily = 'UNCLASSIFIED';
  if (buildingPartFamily === 'WALL') {
    semanticWallFamily =
      uniqueWallFamilies.length > 1
        ? 'UNRESOLVED_SEMANTIC_CONFLICT'
        : uniqueWallFamilies[0] ?? 'UNCLASSIFIED';
  }

  const doorFamily =
    buildingPartFamily === 'DOOR'
      ? doorFamilyFromIdentity(g2Id) ?? doorFamilyFromIdentity(parentG2Id)
      : null;

  if (g2Part && parentPart && g2Part !== parentPart && g2Part !== 'WINDOW') {
    buildingPartFamily = 'OTHER';
    semanticWallFamily = 'UNRESOLVED_SEMANTIC_CONFLICT';
  }

  const physicalClaimStatus = resolvePhysicalClaimStatus(metadata, buildingPartFamily);
  const explicitAssumption =
    metadata.assumption === true ||
    metadata.workAssumption === true ||
    normalizedSemanticString(metadata.thicknessStatus).toUpperCase().includes('ASSUMPTION') ||
    sourceRoleUpper.includes('ASSUMPTION');

  const representationRole: ArchitecturalRepresentationRole = isReference
    ? 'REFERENCE'
    : isReviewHelper
      ? 'REVIEW_HELPER'
      : explicitAssumption
        ? 'WORK_TEST_ASSUMPTION'
        : physicalClaimStatus === 'YES'
          ? 'PHYSICAL'
          : 'UNRESOLVED';

  let classLabelFi = 'Muu konteksti';
  if (representationRole === 'REVIEW_HELPER') classLabelFi = 'Review-apugeometria';
  else if (buildingPartFamily === 'WALL') {
    classLabelFi =
      semanticWallFamily === 'EXTERIOR'
        ? 'Ulkoseinä'
        : semanticWallFamily === 'PARTY'
          ? 'Huoneistorajaseinä'
          : semanticWallFamily === 'INTERIOR'
            ? 'Sisäseinä'
            : semanticWallFamily === 'UNRESOLVED_SEMANTIC_CONFLICT'
              ? 'Semantiikkaristiriita'
              : 'Seinä / luokittelematon';
  } else if (buildingPartFamily === 'DOOR') {
    classLabelFi =
      doorFamily === 'EXTERIOR'
        ? 'Ulko-ovi'
        : doorFamily === 'INTERIOR'
          ? 'Sisäovi'
          : 'Ovi / luokittelematon';
  } else if (buildingPartFamily === 'WINDOW') classLabelFi = 'Ikkuna / ikkuna-aukko';

  let labelFi = 'Muu konteksti / Luokittelematon esitys';
  if (semanticWallFamily === 'UNRESOLVED_SEMANTIC_CONFLICT') {
    labelFi = 'Semantiikkaristiriita - ei ratkaistu';
  } else if (representationRole === 'REVIEW_HELPER') {
    const helperHint = representationKindUpper + ' ' + sourceRoleUpper;
    labelFi =
      helperHint.includes('WINDOW') && helperHint.includes('HELPER')
        ? 'Review-apugeometria - ikkunan host-helper'
        : 'Review-apugeometria';
  } else if (buildingPartFamily === 'DOOR' && representationRole === 'REFERENCE') {
    labelFi =
      doorFamily === 'EXTERIOR'
        ? 'Ulko-oven aukon referenssi'
        : doorFamily === 'INTERIOR'
          ? 'Sisäoven aukon referenssi'
          : 'Oviaukon referenssi';
  } else if (buildingPartFamily === 'WINDOW' && representationRole === 'REFERENCE') {
    labelFi = 'Ikkuna-aukko (referenssi)';
  } else if (buildingPartFamily === 'WALL') {
    labelFi =
      semanticWallFamily === 'UNCLASSIFIED'
        ? 'Seinä (luokittelematon esitys)'
        : representationRole === 'REFERENCE'
          ? classLabelFi + ' (referenssi)'
          : representationRole === 'WORK_TEST_ASSUMPTION'
            ? classLabelFi + ' (WORK_TEST-oletus)'
            : classLabelFi;
  } else if (buildingPartFamily === 'DOOR') {
    labelFi =
      representationRole === 'WORK_TEST_ASSUMPTION'
        ? classLabelFi + ' (WORK_TEST-oletus)'
        : classLabelFi;
  } else if (buildingPartFamily === 'WINDOW') {
    labelFi =
      representationRole === 'WORK_TEST_ASSUMPTION'
        ? 'Ikkuna (WORK_TEST-oletus)'
        : 'Ikkuna / ikkuna-aukko';
  }

  return {
    semanticWallFamily,
    buildingPartFamily,
    representationRole,
    physicalClaimStatus,
    labelFi,
    classLabelFi,
    representationLabelFi: representationLabelFi(representationRole),
    statusLabelFi: statusLabelFi(metadata),
    physicalClaimLabelFi: physicalClaimLabelFi(physicalClaimStatus),
    storey: object ? explicitFloorToken(object) : '-',
  };
};
