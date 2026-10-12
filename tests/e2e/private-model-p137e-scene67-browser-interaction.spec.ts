import { expect, test, type Route } from '@playwright/test';
import type { PlacementReviewHandoff } from '../../src/scripts/privateModelReviewPlacementDraft';

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


test('simulated HTTPS viewer resaves edited Themo notes with exact snapshots and independent readbacks', async ({ page }) => {
  // This is an end-to-end browser interaction against an entirely mocked
  // HTTPS origin. It is NOT a production release, real Access identity,
  // Google Docs write, original scene67 pixel proof or HUMAN_REVIEW approval.
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1536, height: 768 });

  const origin = 'https://p137e-review.test';
  const source = 'http://127.0.0.1:4321';
  const glb = makeScene67Glb();
  const calls: string[] = [];
  const records = new Map<string, PlacementReviewHandoff>();
  const delayedReadback: { route?: Route; recordId?: string } = {};

  // Serve the actual built viewer from the local Playwright webServer while
  // giving its browser document an HTTPS origin. Nothing reaches a real
  // Cloudflare, Worker or G2 server. Register this catch-all BEFORE mock APIs.
  await page.route(origin + '/**', async (route) => {
    const u = new URL(route.request().url());
    const response = await route.fetch({
      url: source + u.pathname + u.search,
    });
    await route.fulfill({ response });
  });
  await page.route(origin + '/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route(origin + '/private-model/work-test/catalog.json', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ candidates: [{
        id: candidateId, label: 'P137E three Themos synthetic fixture',
        path: candidatePath,
      }] }),
    }));
  await page.route(origin + candidatePath, route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));

  const targetIds = [
    'D1F_USER_CURRENT_DOOR_A', 'D1F_USER_CURRENT_DOOR_B',
    'D_THEMO_CURRENT_LOBBY_01',
    'D_THEMO_CURRENT_BEDROOM_01',
    'D_THEMO_CURRENT_BATHROOM_01',
  ];
  const themoIds = targetIds.slice(2);
  const api = origin + '/private-model/review-placement/g2';
  await page.route(api + '/targets', route => {
    calls.push('TARGETS');
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        status: 'WORK_TEST_TARGETS_ONLY',
        documentRevision: 'SIMULATED_NOT_NATIVE_G2',
        targets: targetIds.map(targetId => ({
          targetId, approvedWallHosts: [], currentGeometry: false,
          canonical: false, asBuilt: false, exactXY: false,
        })),
      }),
    });
  });
  await page.route(api + '/observations', async route => {
    expect(route.request().method()).toBe('POST');
    const durablePayload = route.request().postDataJSON().payload as PlacementReviewHandoff;
    const targetId = themoIds[Math.floor(records.size / 2)];
    const edited = records.size % 2 === 1;
    const recordId = 'P137E_G2_browser_simulation_' + (records.size + 1) + '_20261012';
    calls.push('POST:' + targetId);
    expect(durablePayload).toMatchObject({
      kind: 'P137E_G2_REVIEW_OBSERVATION',
      stage: 'WORK_TEST_ONLY',
      persisted: false, humanReview: 'NOT_RUN',
      currentGeometry: false, canonical: false, asBuilt: false,
      anchor: { targetId, floor: '1F', coordinateFrame: 'YLIS-G1-LOCAL', exactXY: false },
      observation: { noteRaw: (edited ? 'Korjattu testihavainto ' : 'Testihavainto ') +
        targetId + ', vain WORK_TEST.' },
      resolution: { status: 'UNMAPPED', proposal: null },
    });
    expect(Number.isFinite(durablePayload.anchor.xM)).toBe(true);
    expect(Number.isFinite(durablePayload.anchor.yM)).toBe(true);
    records.set(recordId, durablePayload);
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
        readback: { recordId, payload: durablePayload },
      }),
    });
  });
  await page.route(api + '/observations/*', route => {
    const recordId = new URL(route.request().url()).pathname.split('/').pop()!;
    calls.push('GET:' + recordId);
    expect(route.request().method()).toBe('GET');
    expect(records.has(recordId)).toBe(true);
    const durablePayload = records.get(recordId);
    if (recordId === 'P137E_G2_browser_simulation_1_20261012' && !delayedReadback.route) {
      delayedReadback.route = route;
      delayedReadback.recordId = recordId;
      return;
    }
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ recordId, payload: durablePayload }),
    });
  });

  await page.goto(origin + '/private-model/?review=' + reviewId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId, {
    timeout: 20_000,
  });
  await page.locator('#view-menu > summary').click();
  await page.locator('#p137e-plan-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-top-plan-tools-ready', 'true');
  await page.locator('#p137e-place-tool-button').click();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  for (const [i, targetId] of themoIds.entries()) {
    await page.locator('#p137e-place-target').selectOption(targetId);
    await page.mouse.click(box!.x + box!.width * (0.55 + i * 0.05),
      box!.y + box!.height * 0.49);
    await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', String(i + 1));
  }

  await page.locator('#p137e-g2-check').click();
  await expect(page.locator('#p137e-g2-status')).toContainText(
    'G2:n kolme nykylaiteidentiteettiä',
  );
  const note = page.locator('#p137e-review-placement-note');
  await expect(note).toBeVisible();
  const save = page.getByRole('button', { name: 'Tallenna havainto' });
  for (const [i, targetId] of themoIds.entries()) {
    await page.locator('#p137e-place-target').selectOption(targetId);
    await expect(page.locator('[data-review-placement-status="draft"]'))
      .toContainText('Kohde: ' + targetId);
    await expect(note).toHaveValue('');
    const originalNote = 'Testihavainto ' + targetId + ', vain WORK_TEST.';
    const editedNote = 'Korjattu testihavainto ' + targetId + ', vain WORK_TEST.';
    await note.fill(originalNote);
    await save.click();
    if (i === 0) {
      // Hold the real client's first independent GET so pending-state checks
      // cannot pass or fail merely because a mocked response was too fast.
      await expect.poll(() => Boolean(delayedReadback.route)).toBe(true);
      await expect(page.locator('[data-review-placement-status="persisting"]')).toBeVisible();
      await expect(note).toBeDisabled();
      await expect(save).toBeDisabled();
      await delayedReadback.route!.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ recordId: delayedReadback.recordId,
          payload: records.get(delayedReadback.recordId!) }) });
    }
    await expect(page.locator('[data-review-placement-status="persisted"]')).toBeVisible();
    await expect(note).toBeEnabled();
    await expect(save).toBeDisabled();

    await note.fill(editedNote);
    await expect(page.locator('[data-review-placement-status="draft"]')).toContainText(
      'Huomio muuttui. Muutosta ei ole tallennettu G2:een.',
    );
    await expect(save).toBeEnabled();
    expect(records.size).toBe(i * 2 + 1);
    // Returning to the already verified snapshot needs no extra POST or GET.
    await note.fill(originalNote);
    await expect(page.locator('[data-review-placement-status="persisted"]')).toBeVisible();
    await expect(save).toBeDisabled();
    expect(records.size).toBe(i * 2 + 1);
    await note.fill(editedNote);
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.locator('[data-review-placement-status="persisted"]')).toContainText(
      'Havainto tallennettu ja varmennettu G2:sta.',
    );
    await expect(note).toHaveValue(editedNote);
    await expect(note).toBeEnabled();
    await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  }

  // Client-side persistence cannot pass on a POST echo: real browser code
  // must make one independent GET, and the UI adapter makes a second one.
  expect(records.size).toBe(6);
  expect(calls).toEqual(['TARGETS', ...themoIds.flatMap((targetId, i) =>
    [0, 1].flatMap(version => {
      const recordId = 'P137E_G2_browser_simulation_' + (i * 2 + version + 1) + '_20261012';
      return ['POST:' + targetId, 'GET:' + recordId, 'GET:' + recordId];
    }),
  )]);
  const payloads = [...records.values()];
  expect(payloads.map(payload => payload.anchor.targetId)).toEqual(themoIds.flatMap(id => [id, id]));
  for (let i = 0; i < 3; i++) {
    expect(payloads[i * 2 + 1].anchor).toEqual(payloads[i * 2].anchor);
    expect(payloads[i * 2].observation.noteRaw).toBe('Testihavainto ' + themoIds[i] + ', vain WORK_TEST.');
    expect(payloads[i * 2 + 1].observation.noteRaw).toBe('Korjattu testihavainto ' + themoIds[i] + ', vain WORK_TEST.');
  }
  expect(new Set(payloads.map(payload => payload.anchor.xM + ',' + payload.anchor.yM)).size)
    .toBe(3);
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '3');
  await expect(canvas).toHaveAttribute('data-p137e-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p137e-current-claim', 'false');
  expect(payloads.every(payload => payload.persisted === false &&
    payload.humanReview === 'NOT_RUN' && !payload.currentGeometry &&
    !payload.canonical && !payload.asBuilt)).toBe(true);
});


test('simulated HTTPS viewer recovers a stalled independent G2 readback without claiming persistence', async ({ page }) => {
  // Use the actual built viewer and its default 30-second client deadline.
  // All HTTPS APIs and geometry are synthetic. No native G2 is contacted.
  test.setTimeout(75_000);
  await page.setViewportSize({ width: 1536, height: 768 });
  const origin = 'https://p137e-timeout.test';
  const source = 'http://127.0.0.1:4321';
  const glb = makeScene67Glb();
  const recordId = 'P137E_G2_browser_timeout_20261012';
  const targetId = 'D_THEMO_CURRENT_LOBBY_01';
  const noteText = 'Aulan testihuomio säilyy, kun takaisinluku katkeaa.';
  const calls: string[] = [];
  let postedPayload: PlacementReviewHandoff | undefined;
  let stalledReadback: Route | undefined;
  let readbackAborted = false;
  const api = origin + '/private-model/review-placement/g2';

  await page.route(origin + '/**', async route => {
    const u = new URL(route.request().url());
    const response = await route.fetch({ url: source + u.pathname + u.search });
    await route.fulfill({ response });
  });
  await page.route(origin + '/private-model/model.glb', route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route(origin + '/private-model/work-test/catalog.json', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ candidates: [{ id: candidateId,
        label: 'P137E synthetic timeout fixture', path: candidatePath }] }) }));
  await page.route(origin + candidatePath, route =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
  await page.route(api + '/targets', route => {
    calls.push('TARGETS');
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ status: 'WORK_TEST_TARGETS_ONLY',
        documentRevision: 'SIMULATED_TIMEOUT_NOT_NATIVE_G2',
        targets: ['D1F_USER_CURRENT_DOOR_A', 'D1F_USER_CURRENT_DOOR_B',
          'D_THEMO_CURRENT_LOBBY_01', 'D_THEMO_CURRENT_BEDROOM_01',
          'D_THEMO_CURRENT_BATHROOM_01'].map(id => ({
          targetId: id, approvedWallHosts: [], currentGeometry: false,
          canonical: false, asBuilt: false, exactXY: false,
        })) }) });
  });
  await page.route(api + '/observations', route => {
    calls.push('POST');
    expect(route.request().method()).toBe('POST');
    postedPayload = route.request().postDataJSON().payload as PlacementReviewHandoff;
    expect(postedPayload).toMatchObject({
      anchor: { targetId, floor: '1F' }, observation: { noteRaw: noteText },
      persisted: false, humanReview: 'NOT_RUN', currentGeometry: false,
      canonical: false, asBuilt: false,
    });
    return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ receipt: { status: 'PERSISTED_TO_EXISTING_G2', recordId },
        readback: { recordId, payload: postedPayload } }) });
  });
  await page.route(api + '/observations/' + recordId, route => {
    calls.push('GET');
    expect(route.request().method()).toBe('GET');
    stalledReadback = route;
    // Deliberately leave the request unanswered. The browser's real client
    // must abort it and release the UI without a POST retry or fake success.
  });
  page.on('requestfailed', request => {
    if (request.url() === api + '/observations/' + recordId) readbackAborted = true;
  });

  await page.goto(origin + '/private-model/?review=' + reviewId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId, { timeout: 20_000 });
  await page.locator('#view-menu > summary').click();
  await page.locator('#p137e-plan-face-button').click();
  await expect(canvas).toHaveAttribute('data-p137e-scene67-top-plan-tools-ready', 'true');
  await page.locator('#p137e-place-tool-button').click();
  await page.locator('#p137e-place-target').selectOption(targetId);
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width * 0.55, box!.y + box!.height * 0.49);
  await page.locator('#p137e-g2-check').click();
  await expect(page.locator('#p137e-g2-status')).toContainText('G2:n kolme nykylaiteidentiteettiä');
  const note = page.locator('#p137e-review-placement-note');
  await note.fill(noteText);
  const save = page.getByRole('button', { name: 'Tallenna havainto' });
  await save.click();
  await expect(page.locator('[data-review-placement-status="persisting"]')).toBeVisible();
  await expect(save).toBeDisabled();
  await expect(note).toBeDisabled();
  await expect.poll(() => calls).toEqual(['TARGETS', 'POST', 'GET']);

  await expect(page.locator('[data-review-placement-status="draft"]')).toContainText(
    'Tallennus ei varmistunut. Tarkista tila ennen uutta yritystä.', { timeout: 35_000 },
  );
  await expect.poll(() => readbackAborted).toBe(true);
  await expect(save).toBeEnabled();
  await expect(note).toBeEnabled();
  await expect(note).toHaveValue(noteText);
  await expect(page.locator('[data-review-placement-status="draft"]')).toContainText('Kohde: ' + targetId);
  await expect(page.locator('[data-review-placement-status="persisted"]')).toHaveCount(0);
  await expect(canvas).toHaveAttribute('data-p137e-place-draft-count', '1');
  await expect(canvas).toHaveAttribute('data-p137e-human-review', 'NOT_RUN');
  await expect(canvas).toHaveAttribute('data-p137e-current-claim', 'false');
  expect(postedPayload?.persisted).toBe(false);
  expect(calls).toEqual(['TARGETS', 'POST', 'GET']);
  expect(stalledReadback).toBeDefined();
  // Release the synthetic route after the real browser abort, if still held.
  await stalledReadback?.abort().catch(() => {});
});


for (const [phoneWidth, phoneHeight] of [[390, 844], [320, 740]]) {
  test(`real Chromium scene67 narrow phone ${phoneWidth}x${phoneHeight} keeps three source-only Themo ROIs`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: phoneWidth, height: phoneHeight });
    const glb = makeScene67Glb();
    await page.route('**/private-model/model.glb', route =>
      route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
    await page.route('**/private-model/work-test/catalog.json', route =>
      route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ id: candidateId, label: 'Themo source WORK_TEST',
          path: candidatePath }] }) }));
    await page.route('**' + candidatePath, route =>
      route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: glb }));
    await page.goto('/private-model/?review=' + reviewId);
    const canvas = page.locator('#private-model-canvas');
    await expect(canvas).toHaveAttribute('data-work-test-review-mode', reviewId, { timeout: 20_000 });

    // The source camera reads the actual canvas CSS aspect. Force a bounded
    // phone-shaped viewer canvas to exercise the formerly rejected <0.5 case
    // even if a responsive parent otherwise supplies a wider aspect.
    await canvas.evaluate((node, dimensions) => {
      const element = node as HTMLCanvasElement;
      element.style.width = dimensions.width + 'px';
      element.style.height = dimensions.height + 'px';
    }, { width: phoneWidth - 24, height: phoneHeight - 28 });
    await expect.poll(async () => canvas.evaluate(element =>
      element.clientWidth / Math.max(element.clientHeight, 1))).toBeLessThan(0.5);
    const assertFace = async (
      face: 'NORTH' | 'SOUTH',
      expectedIds: string[],
    ) => {
      await expect(canvas).toHaveAttribute('data-p137e-scene67-camera-face', face);
      await expect(canvas).toHaveAttribute('data-p137e-scene67-source-housing-roi-status',
        'SOURCE_ONLY_PROJECTED');
      await expect(canvas).toHaveAttribute('data-p137e-scene67-wall-presentation',
        'ORIGINAL_P123C_SOURCE_ALPHA_0_38_UNMODIFIED');
      await expect(canvas).toHaveAttribute('data-p137e-scene67-visible-device-ids',
        expectedIds.join(','));
      const sourceRois = JSON.parse((await canvas.getAttribute(
        'data-p137e-scene67-source-housing-rois')) ?? 'null');
      expect(sourceRois.side).toBe(face);
      expect(sourceRois.individualRenderedPixelsVerified).toBe(false);
      expect(sourceRois.projectedTargets.map((r: { logicalDeviceId: string }) =>
        r.logicalDeviceId)).toEqual(expectedIds);
      for (const roi of sourceRois.projectedTargets) {
        expect(roi.radius).toBeGreaterThanOrEqual(4);
        expect(roi.radius).toBeLessThanOrEqual(96);
        expect(roi.x - roi.radius).toBeGreaterThanOrEqual(0);
        expect(roi.x + roi.radius).toBeLessThan(sourceRois.width);
        expect(roi.y - roi.radius).toBeGreaterThanOrEqual(0);
        expect(roi.y + roi.radius).toBeLessThan(sourceRois.height);
      }
      if (face === 'SOUTH') {
        const [bedroom, bathroom] = sourceRois.projectedTargets;
        expect((bedroom.x - bathroom.x) ** 2 + (bedroom.y - bathroom.y) ** 2)
          .toBeGreaterThan((bedroom.radius + bathroom.radius) ** 2);
      }
    };
    await assertFace('NORTH', ['D_THEMO_CURRENT_LOBBY_01']);
    await page.locator('#view-menu > summary').click();
    await page.locator('#p137e-south-face-button').click();
    await assertFace('SOUTH', [
      'D_THEMO_CURRENT_BEDROOM_01', 'D_THEMO_CURRENT_BATHROOM_01',
    ]);
    await expect(canvas).toHaveAttribute('data-p137e-human-review', 'NOT_RUN');
    await expect(canvas).toHaveAttribute('data-p137e-current-claim', 'false');
    // Synthetic GLB + local browser ROI is not authenticated production proof.
  });
}
