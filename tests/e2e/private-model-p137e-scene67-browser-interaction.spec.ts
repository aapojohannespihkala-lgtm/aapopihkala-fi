import { expect, test } from '@playwright/test';

// Synthetic glTF fixture, never an original 3D survey or production pixel proof.
// Its node identities and no-promotion metadata match the scene67 source contract.
// Unlike source-text assertions, this test drives the real viewer in Chromium.
const candidateId = 'p137e-d1f-three-wall-mounted-themos';
const reviewId = candidateId + '-review';
const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
const sceneName =
  'P137E D1F THREE PHOTO_REFERENCED THEMO WALL_FLUSH WORK_TEST (NOT CURRENT) BABYLON Y_UP';
const rootName = 'P137E_D_THEMOS_REAL_WALL_FACE_WORK_TEST_ROOT_BABYLON_Y_UP';
const wallName = 'P137E_ORIGINAL_P123C_D1F_NODE798_MESH406_PRESENTATION_INSTANCE';

const noPromotion = {
  Canonical: false,
  asBuilt: false,
  publishToCURRENT: false,
  HUMAN_REVIEW: 'NOT_RUN',
};

const makeScene67Glb = () => {
  const wallPositions = [-2, 0, 0, 2, 0, 0, -2, 0, 2];
  // Themo housing mesh ~94 mm: source-projected housing ROI must fit
  // the actual 2D camera viewport, not an oversized synthetic square.
  const devicePositions = [-0.047, 0, 0, 0.047, 0, 0, 0, 0, 0.094];
  const floats = [...wallPositions, ...devicePositions];
  const binary = Buffer.alloc(floats.length * 4);
  floats.forEach((value, index) => binary.writeFloatLE(value, index * 4));

  const nodes: Record<string, unknown>[] = Array.from({ length: 1108 }, () => ({}));
  // The real viewer first resolves the independent D1F interior carrier
  // before opening the exact scene67 P123C wall. Keep this minimal semantic
  // context in the fixture, never as a substitute for the original wall.
  nodes[1] = { name: 'D_1F_SYNTHETIC_INTERIOR_CONTEXT_NOT_THEMO_SOURCE', mesh: 1 };
  nodes[798] = { name: 'ORIGINAL_P123C_WALL_SOURCE', mesh: 406 };
  nodes[1106] = {
    name: wallName,
    mesh: 406,
    translation: [0, 5.072, 0],
    extras: {
      sourceNodeIndex: 798,
      sourceMeshIndex: 406,
      originalSourceGeometryUnmodified: true,
      presentationOnly: true,
      ...noPromotion,
    },
  };

  const targets = [
    { index: 1091, name: 'P137E_THEMO_LOBBY_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_LOBBY_01', side: 'NORTH', faceY: 5.112, sign: 1, x: -0.9 },
    { index: 1096, name: 'P137E_THEMO_BEDROOM_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_BEDROOM_01', side: 'SOUTH', faceY: 5.032, sign: -1, x: 0.4 },
    { index: 1101, name: 'P137E_THEMO_BATHROOM_WALL_CONTACT_WORK_TEST',
      id: 'D_THEMO_CURRENT_BATHROOM_01', side: 'SOUTH', faceY: 5.032, sign: -1, x: 1.2 },
  ];
  for (const target of targets) {
    nodes[target.index] = {
      name: target.name,
      mesh: 0,
      translation: [target.x, target.faceY, 1],
      extras: {
        logicalDeviceId: target.id,
        representationKind: 'photoReferencedThermostatWallMountWorkTest',
        sourceFaceMeshIndex: 406,
        sourceFaceNodeIndex: 798,
        sourceFaceSide: target.side,
        sourceFaceYM: target.faceY,
        backplateContactYM: target.faceY,
        frontFacesTowardYSign: target.sign,
        wallBackplateAirGapM: 0,
        fitOriginalPresentationSourceWallPlanePassed: true,
        fitExactPhysicalWallHostVerified: false,
        exactXYClaim: false,
        exactZClaim: false,
        currentGeometryClaim: false,
        wallHostPhysicalAsBuiltClaim: false,
        presentationOnly: true,
        ...noPromotion,
      },
    };
  }
  nodes[1107] = {
    name: rootName,
    children: [1106, 1091, 1096, 1101],
    // Babylon Y-up: +Y -> world -Z, +Z -> world +Y.
    rotation: [-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
    extras: {
      Pass: 'P137E',
      sourceOriginalWallNode: 798,
      sourceOriginalWallMesh: 406,
      WORK_TEST_ONLY: true,
      oldMarkersSuppressedInNewSceneOnly: true,
      ...noPromotion,
    },
  };

  const meshes = Array.from({ length: 407 }, (_, index) => ({
    primitives: [{ attributes: { POSITION: index === 406 ? 0 : 1 } }],
  }));
  const scenes = Array.from({ length: 68 }, (_, index) => ({
    name: 'UNRELATED_SCENE_' + index,
    nodes: [] as number[],
  }));
  // The actual source GLB contains this separately named interior scene.
  // Without it, activateDPlan cannot select D1F and the P137E viewer must
  // reject the test fixture before any NORTH/SOUTH/RASTI/MITTAA assertions.
  scenes[0] = { name: 'D CURRENT INTERIOR - BABYLON Y-UP', nodes: [1] };
  scenes[67] = {
    name: sceneName,
    nodes: [1107],
    extras: {
      sourceSceneIndex: 66,
      sourceOriginalWallMeshIndex: 406,
      targetLogicalDeviceCount: 3,
      workTestOnly: true,
      noCurrentPromotion: true,
      HUMAN_REVIEW: 'NOT_RUN',
    },
  } as typeof scenes[number];

  const manifest = {
    asset: { version: '2.0' },
    scene: 67,
    scenes,
    nodes,
    meshes,
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3',
        min: [-2, 0, 0], max: [2, 0, 2] },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC3',
        min: [-0.047, 0, 0], max: [0.047, 0, 0.094] },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: wallPositions.length * 4, target: 34962 },
      { buffer: 0, byteOffset: wallPositions.length * 4,
        byteLength: devicePositions.length * 4, target: 34962 },
    ],
    buffers: [{ byteLength: binary.length }],
  };
  const json = Buffer.from(JSON.stringify(manifest));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
  const header = Buffer.alloc(12);
  header.write('glTF');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBinary.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(paddedBinary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
};

test('real Chromium toggles scene67 wall faces and restores top-plan RASTI/MITTAA tools', async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 1536, height: 768 });
  const glb = makeScene67Glb();
  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId, label: 'P137E original wall and Themos WORK_TEST',
        path: candidatePath }] }),
    });
  });
  await page.route('**' + candidatePath, async (route) => {
    await route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb });
  });
  await page.goto('/private-model/?review=' + reviewId);

  const canvas = page.locator('#private-model-canvas');
  await expect.poll(async () => {
    const actual = await canvas.getAttribute('data-work-test-review-mode');
    if (actual === reviewId) return actual;
    const phase = await canvas.getAttribute('data-work-test-load-failure-phase');
    const error = await canvas.getAttribute('data-work-test-load-error');
    return phase ? 'LOAD_FAILURE[' + phase + '] ' + error : actual || '';
  }, { timeout: 20_000 }).toBe(reviewId);

  await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', 'NORTH');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-visible-device-ids',
    'D_THEMO_CURRENT_LOBBY_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-hidden-device-ids',
    'D_THEMO_CURRENT_BEDROOM_01,D_THEMO_CURRENT_BATHROOM_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-device-face-mask',
    'NORTH_SOURCE_ONLY_RESTOREABLE');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-wall-presentation',
    'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED');
  await expect(canvas).toHaveAttribute('data-p137e-wall-mounted-themo-count', '3');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-source-housing-roi-status',
    'SOURCE_ONLY_PROJECTED');
  const northRegions = JSON.parse(
    (await canvas.getAttribute('data-p137e-scene67-source-housing-rois')) ?? 'null',
  );
  expect(northRegions.side).toBe('NORTH');
  expect(northRegions.projectedTargets.map((r: { logicalDeviceId: string }) =>
    r.logicalDeviceId)).toEqual(['D_THEMO_CURRENT_LOBBY_01']);
  expect(northRegions.individualRenderedPixelsVerified).toBe(false);
  await expect(page.locator('#axis-measure-tool-button')).toBeDisabled();
  await expect(page.locator('#p137e-place-tool-button')).toBeDisabled();

  // Actual Chromium event exercises temporary housing visibility on the
  // synthetic scene67 fixture. This is NOT original production pixel QA.
  const housingProbe = (id: string | null) => page.evaluate((hiddenLogicalDeviceId) => {
    window.dispatchEvent(new CustomEvent('p137e-scene67-housing-probe', {
      detail: { hiddenLogicalDeviceId },
    }));
  }, id);
  await housingProbe('D_THEMO_CURRENT_LOBBY_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id',
    'D_THEMO_CURRENT_LOBBY_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-state',
    'SOURCE_ONLY_UNVERIFIED_PIXELS');
  await housingProbe('NOT_A_THEMO_SOURCE_ID');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-state', 'REJECTED');
  await expect(canvas).not.toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id', /./);
  await housingProbe(null);
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id', 'NONE');

  await page.locator('#view-menu > summary').click();
  await page.locator('#p137e-south-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', 'SOUTH');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-wall-presentation',
    'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-visible-device-ids',
    'D_THEMO_CURRENT_BEDROOM_01,D_THEMO_CURRENT_BATHROOM_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-hidden-device-ids',
    'D_THEMO_CURRENT_LOBBY_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-device-face-mask',
    'SOUTH_SOURCE_ONLY_RESTOREABLE');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-source-housing-roi-status',
    'SOURCE_ONLY_PROJECTED');
  const southRegions = JSON.parse(
    (await canvas.getAttribute('data-p137e-scene67-source-housing-rois')) ?? 'null',
  );
  expect(southRegions.side).toBe('SOUTH');
  expect(southRegions.projectedTargets.map((r: { logicalDeviceId: string }) =>
    r.logicalDeviceId)).toEqual([
      'D_THEMO_CURRENT_BEDROOM_01',
      'D_THEMO_CURRENT_BATHROOM_01',
    ]);
  await housingProbe('D_THEMO_CURRENT_BEDROOM_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id',
    'D_THEMO_CURRENT_BEDROOM_01');
  await housingProbe('D_THEMO_CURRENT_BATHROOM_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id',
    'D_THEMO_CURRENT_BATHROOM_01');
  // Wrong-face NORTH ID is already hidden by the trusted SOUTH face mask.
  await housingProbe('D_THEMO_CURRENT_LOBBY_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-state',
    'SOURCE_ONLY_UNVERIFIED_PIXELS');
  await housingProbe(null);
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id', 'NONE');

  const [bedroom, bathroom] = southRegions.projectedTargets;
  expect(Math.hypot(bedroom.x - bathroom.x, bedroom.y - bathroom.y))
    .toBeGreaterThan(bedroom.radius + bathroom.radius);
  expect(southRegions.individualRenderedPixelsVerified).toBe(false);

  // The real toolbar closes its <details> after each button click.
  // Reopen the visible menu as a person would before selecting the plan.
  await expect(page.locator('#view-menu')).not.toHaveAttribute('open', '');
  await page.locator('#view-menu > summary').click();
  await expect(page.locator('#p137e-plan-face-button')).toBeVisible();
  await page.locator('#p137e-plan-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-top-plan-tools-ready', 'true');
  await expect(canvas).not.toHaveAttribute('data-p137e-scene67-source-housing-rois', /./);
  await expect(canvas).not.toHaveAttribute('data-p137e-scene67-visible-device-ids', /./);
  await expect(canvas).not.toHaveAttribute('data-p137e-scene67-hidden-device-ids', /./);
  await expect(canvas).not.toHaveAttribute('data-p137e-scene67-device-face-mask', /./);
  await expect(canvas).not.toHaveAttribute('data-p137e-scene67-housing-probe-hidden-id', /./);
  await housingProbe('D_THEMO_CURRENT_LOBBY_01');
  await expect(canvas).toHaveAttribute('data-p137e-scene67-housing-probe-state', 'REJECTED');
  await expect(canvas).toHaveAttribute('data-p137e-review-camera-mode',
    'ORTHOGRAPHIC_SOURCE_WALL_D1F_TOP');
  await expect(page.locator('#axis-measure-tool-button')).toBeEnabled();
  await expect(page.locator('#p137e-place-tool-button')).toBeEnabled();
  await page.locator('#p137e-place-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'place');

  // Actual pointer placement on the source-root D1F plan, not only enabled
  // buttons. Three native Themo IDs must produce three separate temporary
  // annotations; they must never silently persist into original G2.
  const viewport = await canvas.boundingBox();
  expect(viewport).not.toBeNull();
  const clickPlan = (u: number, v: number) =>
    page.mouse.click(viewport!.x + viewport!.width * u,
      viewport!.y + viewport!.height * v);
  for (const [i, targetId] of [
    'D_THEMO_CURRENT_LOBBY_01',
    'D_THEMO_CURRENT_BEDROOM_01',
    'D_THEMO_CURRENT_BATHROOM_01',
  ].entries()) {
    await page.locator('#p137e-place-target').selectOption(targetId);
    await clickPlan(0.55 + i * 0.05, 0.49);
    await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', String(i + 1));
  }
  await expect(page.locator('#p137e-place-list')).toContainText('Aula: X ');
  await expect(page.locator('#p137e-place-list')).toContainText('Makuuhuone: X ');
  await expect(page.locator('#p137e-place-list')).toContainText('Kylpyhuone: X ');
  await expect(page.locator('#p137e-place-status')).toContainText('ei tallennettu G2:een');

  // This browser fixture is HTTP, not the authenticated HTTPS G2 release.
  // Even with all three source-bound draft markers, preview must fail closed.
  const g2Requests: string[] = [];
  const onG2Request = (request: { url: () => string }) => {
    if (request.url().includes('/private-model/review-placement/g2/')) {
      g2Requests.push(request.url());
    }
  };
  page.on('request', onG2Request);
  await page.locator('#p137e-g2-check').click();
  await expect(page.locator('#p137e-g2-status')).toContainText(
    /G2 ei ole käytettävissä|G2-tallennuspalvelua tai lähdevastausta ei varmennettu/,
  );
  expect(g2Requests).toEqual([]);
  page.off('request', onG2Request);
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  await expect(page.locator('#p137e-place-status')).toContainText('ei tallennettu G2:een');

  await page.locator('#axis-measure-tool-button').click();
  await expect(canvas).toHaveAttribute('data-interaction-mode', 'measure');
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  await clickPlan(0.56, 0.49);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'FIRST');
  await clickPlan(0.64, 0.49);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'DYNAMIC');
  const measuredMm = Number(await canvas.getAttribute('data-axis-measure-mm'));
  expect(measuredMm).toBeGreaterThan(0);
  await expect(page.locator('#axis-measure-output')).toContainText('mm (mallista)');
  await clickPlan(0.66, 0.49);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'LOCKED');
  await clickPlan(0.60, 0.49);
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');

  // The ruler is outside the view menu: use the actual visible menu again.
  await page.locator('#view-menu > summary').click();
  await expect(page.locator('#p137e-north-face-button')).toBeVisible();
  await page.locator('#p137e-north-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', 'NORTH');
  await expect(page.locator('#axis-measure-tool-button')).toBeDisabled();
  await expect(page.locator('#p137e-place-tool-button')).toBeDisabled();
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '0');
  await expect(canvas).toHaveAttribute('data-axis-measure-phase', 'EMPTY');
  await expect(canvas).toHaveAttribute('data-p137e-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p137e-current-claim', 'false');
});
