import { expect, test } from '@playwright/test';

import { prepareP186EReviewPresentation } from '../../src/scripts/privateModelP186EReviewPresentation';

const makeMaterial = () => ({
  clone: () => ({
    color: { setHex: () => undefined },
    emissive: { setHex: () => undefined },
    userData: {},
  }),
  color: { setHex: () => undefined },
  emissive: { setHex: () => undefined },
  userData: {},
});

const makeRenderable = (name: string, userData: Record<string, unknown>) => ({
  name,
  isMesh: true,
  material: makeMaterial(),
  userData: { ...userData },
  visible: true,
  renderOrder: 0,
});

test('P186E review uses real wall context roots and suppresses helper footprints', () => {
  const target = makeRenderable('P186E_X1_D_1F_GROUP_LABEL_01', {
    Pass: 'P186E-X1',
    hostStorey: 'D_1F',
    presentationLayer: 'MEP_ELECTRICAL',
    representationKind: 'electricalGroupSourceLabelAnchor',
  });
  const productionWallRoot = makeRenderable(
    'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
    {
      G2Id: 'P173D_D_WALL_HR67_SEMANTIC_REBASE_ROOT_BABYLON_Y_UP',
      presentationLayer: 'CURRENT_D',
      representationKind: 'wallSurface',
    },
  );
  const helperFootprint = makeRenderable(
    'P117D_REVIEW_P87_VIEW_G2_D15_SPACE_PESUHUONE_1F_SRC',
    {
      G2Id: 'G2_D15_SPACE_PESUHUONE_1F_SRC',
      presentationLayer: 'CURRENT_D',
      representationKind: 'referenceFootprint',
    },
  );
  const unrelatedContext = makeRenderable('TERRAIN_CONTEXT_WALL_LIKE_BOUNDARY', {
    G2Id: 'TERRAIN_CONTEXT_WALL_LIKE_BOUNDARY',
    presentationLayer: 'SITE_GROUND',
    representationKind: 'wallLikeBoundary',
  });
  const objects = [target, productionWallRoot, helperFootprint, unrelatedContext];
  const sceneRoot = {
    traverse: (visitor: (object: unknown) => void) => {
      for (const object of objects) visitor(object);
    },
  };

  const result = prepareP186EReviewPresentation(sceneRoot, 'D1F');

  expect(result.targetRenderableCount).toBe(1);
  expect(result.contextRenderableCount).toBe(1);
  expect(result.realWallContextRenderableCount).toBe(1);
  expect(result.suppressedHelperContextCount).toBe(1);

  expect(productionWallRoot.visible).toBe(true);
  expect(productionWallRoot.renderOrder).toBe(20);
  expect(productionWallRoot.userData.p186eReviewRole).toBe('D_1F_ARCH_CONTEXT_20');
  expect(productionWallRoot.userData.p186eReviewContextSource).toBe(
    'KNOWN_D_ARCHITECTURE_ROOT',
  );
  expect((productionWallRoot.material as any).opacity).toBe(0.2);
  expect((productionWallRoot.material as any).depthTest).toBe(false);

  expect(helperFootprint.visible).toBe(false);
  expect(helperFootprint.userData.p186eReviewRole).toBe(
    'P186E_HELPER_CONTEXT_SUPPRESSED',
  );
  expect(unrelatedContext.visible).toBe(false);
  expect(unrelatedContext.userData.p186eReviewRole).toBe('NON_QUESTION_CONTEXT_SUPPRESSED');
});
