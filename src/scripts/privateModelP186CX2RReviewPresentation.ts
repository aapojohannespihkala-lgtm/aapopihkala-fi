import { THREE } from './threeRuntime';

export const p186cX2rReviewTargetOpacity = 0.8;
export const p186cX2rReviewContextOpacity = 0.2;
export const p186cX2rReviewTargetColorHex = 0x38bdf8;
export const p186cX2rReviewContextColorHex = 0xe2e8f0;
export const p186cX2rFloorHeatingSourcePdfDriveId = '1vAyvAHdClqkXKIVNgKKUyOjMja-tzrok';

export const p186cX2rReviewSourceContext = {
  sourceLabel: 'Lattialämmitys.me_design.pdf',
  sourceHref: `https://drive.google.com/file/d/${p186cX2rFloorHeatingSourcePdfDriveId}/view`,
  sourceRole: 'HISTORICAL_2015_ROUTE_GUIDE',
  limit:
    'Vuoden 2015 lähdepiirroksesta johdetut WORK_TEST-reittiproxyt. Ei fyysinen nykykaapelireitti, suljettu lämmitysvyöhyke, exact XY/Z, current-, as-built- tai canonical-väite.',
} as const;

export const p186cX2rReviewQuestionText =
  'Näkyvätkö vuoden 2015 lähdepiirroksesta johdetut lattialämmityksen WORK_TEST-reittiproxyt A/B/C uskottavasti D 1F -tilakontekstissa ilman että niitä tulkitaan fyysisiksi nykykaapelireiteiksi?';

export const p186cX2rExpectedComponents = {
  A: {
    sourceFragmentCount: 126,
    derivedGroupKey: '10.3',
    derivedGroupName: 'makuuhuone',
    sourceCableType: 'DEVI DTIP-10 120M',
    sourcePowerW: 1200,
    sourceSstl: '8169441',
    sourceInstallSpacingCm: 11,
  },
  B: {
    sourceFragmentCount: 116,
    derivedGroupKey: '10.1',
    derivedGroupName: 'eteinen',
    sourceCableType: 'DEVI DTIP-10 140M',
    sourcePowerW: 1400,
    sourceSstl: '8169445',
    sourceInstallSpacingCm: 10,
  },
  C: {
    sourceFragmentCount: 124,
    derivedGroupKey: '10.2',
    derivedGroupName: 'pesuhuone/sauna',
    sourceCableType: 'DEVI DTIP-10 100M',
    sourcePowerW: 1000,
    sourceSstl: '8169439',
    sourceInstallSpacingCm: 10,
  },
} as const;

export const p186cX2rExpectedSourceFragmentCount = Object.values(
  p186cX2rExpectedComponents,
).reduce((sum, component) => sum + component.sourceFragmentCount, 0);

export const p186cX2rContextG2Ids = [
  'G2_D15_SPACE_SAUNA_1F_SRC',
  'G2_D15_SPACE_PESUHUONE_1F_SRC',
  'G2_D15_SPACE_WC_1F_SRC',
  'G2_D15_SPACE_VH_WEST_1F_SRC',
  'G2_D15_SPACE_VH_NORTH_1F_SRC',
  'G2_D15_SPACE_HUONE2_1F_SRC',
] as const;

const contextG2IdSet = new Set<string>(p186cX2rContextG2Ids);
const componentEntries = Object.entries(p186cX2rExpectedComponents) as Array<
  [keyof typeof p186cX2rExpectedComponents, (typeof p186cX2rExpectedComponents)[keyof typeof p186cX2rExpectedComponents]]
>;
const componentContract = new Map(componentEntries);

const isRenderable = (object: any) =>
  Boolean(
    object?.material &&
      (object?.isMesh || object?.isLine || object?.isLineSegments || object?.isPoints),
  );

const cloneObjectMaterials = (
  object: any,
  opacity: number,
  role: 'QUESTION_TARGET_80' | 'D_1F_SOURCE_ROOM_CONTEXT_20',
) => {
  const cloneOne = (material: any) => {
    if (!material?.clone) return material;
    const clone = material.clone();
    clone.opacity = opacity;
    clone.transparent = true;
    clone.depthWrite = false;

    if (role === 'QUESTION_TARGET_80') {
      clone.color?.setHex?.(p186cX2rReviewTargetColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186cX2rReviewTargetColorHex);
        clone.emissiveIntensity = 0.65;
      }
      clone.depthTest = false;
      clone.toneMapped = false;
    } else {
      clone.color?.setHex?.(p186cX2rReviewContextColorHex);
      if (clone.emissive?.setHex) {
        clone.emissive.setHex(p186cX2rReviewContextColorHex);
        clone.emissiveIntensity = 0.35;
      }
      clone.toneMapped = false;
    }

    clone.userData = {
      ...(clone.userData ?? {}),
      p186cX2rReviewPresentation: true,
      p186cX2rPresentationRole: role,
    };
    clone.needsUpdate = true;
    return clone;
  };

  object.material = Array.isArray(object.material)
    ? object.material.map(cloneOne)
    : cloneOne(object.material);
};

const isP186cX2rTarget = (object: any) => {
  const data = object?.userData ?? {};
  return (
    String(data.Pass ?? '') === 'P186C-X2R' &&
    String(data.hostStorey ?? '') === 'D_1F' &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    String(data.representationKind ?? '') === 'floorHeatingCableWorkRouteProxy'
  );
};

const isD1fSourceRoomContext = (object: any) => {
  if (isP186cX2rTarget(object)) return false;
  const data = object?.userData ?? {};
  return (
    String(data.presentationLayer ?? '') === 'CURRENT_D' &&
    String(data.representationKind ?? '') === 'referenceFootprint' &&
    contextG2IdSet.has(String(data.G2Id ?? ''))
  );
};

const hasP186cX2rNoPromotionAndSourceSemantics = (object: any) => {
  const data = object?.userData ?? {};
  const partition = String(data.sourceFragmentPartition ?? '') as
    | keyof typeof p186cX2rExpectedComponents
    | '';
  const expected = partition ? componentContract.get(partition) : undefined;

  if (!expected) return false;

  const workZRange = Array.isArray(data.workZRangeM)
    ? data.workZRangeM.map(Number)
    : [];

  return (
    String(data.Pass ?? '') === 'P186C-X2R' &&
    String(data.ModelStage ?? '') === 'WORK_TEST_GEOMETRY' &&
    String(data.coordinateSystem ?? '') === 'YLIS-G1-LOCAL' &&
    String(data.hostStorey ?? '') === 'D_1F' &&
    String(data.presentationLayer ?? '') === 'MEP_ELECTRICAL' &&
    String(data.representationKind ?? '') === 'floorHeatingCableWorkRouteProxy' &&
    String(data.sourcePdfDriveId ?? '') === p186cX2rFloorHeatingSourcePdfDriveId &&
    String(data.sourcePlanXYRole ?? '') === 'HISTORICAL_2015_ROUTE_GUIDE' &&
    String(data.derivedGroupBindingAuthority ?? '') ===
      'HIGH_CONFIDENCE_DERIVED / CROSS_SOURCE_PLAN_PARITY' &&
    Number(data.sourceFragmentCount) === expected.sourceFragmentCount &&
    String(data.derivedGroupKey ?? '') === expected.derivedGroupKey &&
    String(data.derivedGroupName ?? '') === expected.derivedGroupName &&
    String(data.sourceCableType ?? '') === expected.sourceCableType &&
    Number(data.sourcePowerW) === expected.sourcePowerW &&
    String(data.sourceSstl ?? '') === expected.sourceSstl &&
    Number(data.sourceInstallSpacingCm) === expected.sourceInstallSpacingCm &&
    Number(data.finishedFloorZM) === 0 &&
    workZRange.length === 2 &&
    workZRange[0] === -0.03 &&
    workZRange[1] === -0.02 &&
    Number(data.workCenterDepthM) === 0.025 &&
    Number(data.proxyThicknessM) === 0.01 &&
    data.presentationOnly === true &&
    data.workAssumption === true &&
    data.floorHeatingCableGeometryClaim === false &&
    data.closedHeatingZoneClaim === false &&
    data.physicalCableRouteClaim === false &&
    data.continuousCableTopologyClaim === false &&
    data.exactCurrentXYClaim === false &&
    data.exactZClaim === false &&
    data.currentGeometryClaim === false &&
    data.current === false &&
    data.asBuilt === false &&
    data.Canonical === false &&
    data.canonical === false &&
    data.publishToCURRENT === false &&
    String(data.HUMAN_REVIEW ?? '') === 'NOT_RUN'
  );
};

export const prepareP186cX2rFloorHeatingReviewPresentation = (sceneRoot: any) => {
  const renderables: any[] = [];
  const targets: any[] = [];
  const foundComponents = new Map<string, number>();
  const foundContextG2Ids = new Set<string>();
  let semanticViolationCount = 0;
  let sourceFragmentCount = 0;

  sceneRoot?.updateMatrixWorld?.(true);
  sceneRoot?.traverse?.((object: any) => {
    if (!isRenderable(object)) return;
    renderables.push(object);
    if (!isP186cX2rTarget(object)) return;

    targets.push(object);
    const partition = String(object.userData?.sourceFragmentPartition ?? '');
    foundComponents.set(partition, (foundComponents.get(partition) ?? 0) + 1);
    sourceFragmentCount += Number(object.userData?.sourceFragmentCount ?? 0);
    if (!hasP186cX2rNoPromotionAndSourceSemantics(object)) {
      semanticViolationCount += 1;
    }
  });

  const targetBounds = new THREE.Box3();
  let hasTargetBounds = false;
  let targetRenderableCount = 0;
  let contextRenderableCount = 0;
  let hiddenNonQuestionRenderableCount = 0;

  for (const object of targets) {
    object.visible = true;
    cloneObjectMaterials(object, p186cX2rReviewTargetOpacity, 'QUESTION_TARGET_80');
    object.renderOrder = 30;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186cX2rReviewPresentation: true,
      p186cX2rReviewRole: 'QUESTION_TARGET_80',
    };
    targetRenderableCount += 1;

    sceneRoot?.updateMatrixWorld?.(true);
    const objectBounds = new THREE.Box3().setFromObject(object);
    if (!objectBounds.isEmpty()) {
      if (!hasTargetBounds) {
        targetBounds.copy(objectBounds);
        hasTargetBounds = true;
      } else {
        targetBounds.union(objectBounds);
      }
    }
  }

  for (const object of renderables) {
    if (isP186cX2rTarget(object)) continue;

    if (isD1fSourceRoomContext(object)) {
      object.visible = true;
      cloneObjectMaterials(
        object,
        p186cX2rReviewContextOpacity,
        'D_1F_SOURCE_ROOM_CONTEXT_20',
      );
      object.renderOrder = 5;
      foundContextG2Ids.add(String(object.userData?.G2Id ?? ''));
      object.userData = {
        ...(object.userData ?? {}),
        viewerDerived: true,
        p186cX2rReviewPresentation: true,
        p186cX2rReviewRole: 'D_1F_SOURCE_ROOM_CONTEXT_20',
      };
      contextRenderableCount += 1;
      continue;
    }

    object.visible = false;
    object.userData = {
      ...(object.userData ?? {}),
      viewerDerived: true,
      p186cX2rReviewPresentation: true,
      p186cX2rReviewRole: 'NON_QUESTION_CONTEXT_SUPPRESSED',
    };
    hiddenNonQuestionRenderableCount += 1;
  }

  const missingTargetComponents = Object.keys(p186cX2rExpectedComponents).filter(
    (component) => foundComponents.get(component) !== 1,
  );
  const missingContextG2Ids = p186cX2rContextG2Ids.filter(
    (g2Id) => !foundContextG2Ids.has(g2Id),
  );

  return {
    targetRenderableCount,
    expectedTargetRenderableCount: Object.keys(p186cX2rExpectedComponents).length,
    contextRenderableCount,
    expectedContextRenderableCount: p186cX2rContextG2Ids.length,
    hiddenNonQuestionRenderableCount,
    semanticViolationCount,
    sourceFragmentCount,
    expectedSourceFragmentCount: p186cX2rExpectedSourceFragmentCount,
    foundTargetComponents: Object.fromEntries(
      [...foundComponents.entries()].sort(([a], [b]) => a.localeCompare(b)),
    ),
    missingTargetComponents,
    foundContextG2Ids: [...foundContextG2Ids].sort(),
    missingContextG2Ids,
    targetBounds: hasTargetBounds ? targetBounds : null,
    reviewQuestionText: p186cX2rReviewQuestionText,
    sourceContext: p186cX2rReviewSourceContext,
  };
};
