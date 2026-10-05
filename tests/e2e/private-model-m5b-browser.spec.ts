import { expect, test } from '@playwright/test';

const pad4 = (buffer: Buffer, fill = 0x20) => {
  const padding = (4 - (buffer.length % 4)) % 4;
  return padding === 0 ? buffer : Buffer.concat([buffer, Buffer.alloc(padding, fill)]);
};

const makeGlb = (json: Record<string, unknown>, bin = Buffer.alloc(0)) => {
  const jsonChunk = pad4(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const binChunk = pad4(bin, 0x00);
  const totalLength = 12 + 8 + jsonChunk.length + (binChunk.length ? 8 + binChunk.length : 0);

  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const chunks = [header, jsonHeader, jsonChunk];
  if (binChunk.length) {
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    chunks.push(binHeader, binChunk);
  }
  return Buffer.concat(chunks);
};

const makeCurrentGlb = () =>
  makeGlb({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ name: 'CURRENT ROOT', nodes: [] }],
    nodes: [],
  });

const makeM5bGlb = () => {
  const positions = Buffer.alloc(6 * 4);
  const values = [0, 0, 0, 1, 0, 0];
  values.forEach((value, index) => positions.writeFloatLE(value, index * 4));

  const noPromotion = {
    presentationOnly: true,
    workAssumption: true,
    exactXYClaim: false,
    exactZClaim: false,
    physicalRouteClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    Canonical: false,
    publishToCURRENT: false,
  };

  const scenes = Array.from({ length: 58 }, (_, index) => ({
    name: `M5B TEST SCENE ${index}`,
    nodes: [] as number[],
  }));
  scenes[56] = {
    name: 'M5B ROOF STORMWATER CURRENT WORK_TEST ON M5A - BABYLON Y-UP',
    nodes: [4, 5],
  };
  scenes[57] = {
    name: 'PLANNED_SOK2_COMPARISON',
    nodes: [4, 6],
  };

  return makeGlb(
    {
      asset: { version: '2.0' },
      scene: 56,
      scenes,
      nodes: [
        {
          name: 'M5B_G2_STORM_CURRENT_ROUTE_SOK1_001_REFERENCE_ROUTE_WORK',
          mesh: 0,
          extras: {
            ...noPromotion,
            G2IdCandidate: 'G2_STORM_CURRENT_ROUTE_SOK1_001',
          },
        },
        {
          name: 'M5B_G2_STORM_CURRENT_ROUTE_SOK2_001_REFERENCE_ROUTE_WORK',
          mesh: 0,
          extras: {
            ...noPromotion,
            G2IdCandidate: 'G2_STORM_CURRENT_ROUTE_SOK2_001',
          },
        },
        {
          name: 'M5B_G2_STORM_PLANNED_GULLY_SOK2_001_PLANNED_GULLY_MARKER_WORK',
          mesh: 0,
          extras: {
            ...noPromotion,
            G2IdCandidate: 'G2_STORM_PLANNED_GULLY_SOK2_001',
            planned: true,
            ordered: false,
            implemented: false,
            current: false,
            presentationOnlyComparison: true,
          },
        },
        {
          name: 'M5B_G2_STORM_PLANNED_ROUTE_SOK2_001_PLANNED_REFERENCE_ROUTE_WORK',
          mesh: 0,
          extras: {
            ...noPromotion,
            G2IdCandidate: 'G2_STORM_PLANNED_ROUTE_SOK2_001',
            planned: true,
            ordered: false,
            implemented: false,
            current: false,
            presentationOnlyComparison: true,
          },
        },
        {
          name: 'M5B_BUILDING_CONTEXT',
          mesh: 0,
          extras: { presentationGroup: 'ARCHITECTURE' },
        },
        {
          name: 'M5B_STORM_CURRENT_WORK_ROOT_BABYLON_Y_UP',
          children: [0, 1],
          extras: { presentationOnly: true, workAssumption: true },
        },
        {
          name: 'M5B_STORM_PLANNED_SOK2_COMPARISON_ROOT_BABYLON_Y_UP',
          children: [0, 2, 3],
          extras: { presentationOnly: true, workAssumption: true },
        },
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: { POSITION: 0 },
              material: 0,
              mode: 1,
            },
          ],
        },
      ],
      materials: [
        {
          name: 'M5B_TEST_LINE',
          pbrMetallicRoughness: {
            baseColorFactor: [0.3, 0.5, 0.8, 1],
            metallicFactor: 0,
            roughnessFactor: 1,
          },
        },
      ],
      buffers: [{ byteLength: positions.length }],
      bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: positions.length }],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: 5126,
          count: 2,
          type: 'VEC3',
          min: [0, 0, 0],
          max: [1, 0, 0],
        },
      ],
    },
    positions,
  );
};

test('M5B one-link current review autoloads through catalog, GLTFLoader and runtime using G2IdCandidate', async ({ page }) => {
  const currentModel = makeCurrentGlb();
  const candidateModel = makeM5bGlb();
  const candidateId = 'm5b-roof-stormwater-current-planned';
  const candidateLabel = 'M5B roof stormwater current/planned variants - WORK_TEST';
  const candidatePath = '/private-model/work-test/m5b-roof-stormwater-current-planned.glb';

  await page.route('**/private-model/model.glb', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: currentModel,
    });
  });
  await page.route('**/private-model/work-test/catalog.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: candidateId, label: candidateLabel, path: candidatePath }],
      }),
    });
  });
  await page.route(`**${candidatePath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: candidateModel,
    });
  });

  await page.goto('/private-model/?review=m5b-roof-stormwater-current-review');

  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test');
  await expect(canvas).toHaveAttribute(
    'data-work-test-review-mode',
    'm5b-roof-stormwater-current-review',
  );
  await expect(canvas).toHaveAttribute('data-m5b-review-variant', 'CURRENT');
  await expect(canvas).toHaveAttribute('data-m5b-scene-index', '56');
  await expect(canvas).toHaveAttribute('data-m5b-review-target-renderable-count', '2');
  await expect(canvas).toHaveAttribute(
    'data-m5b-target-g2-ids',
    'G2_STORM_CURRENT_ROUTE_SOK1_001,G2_STORM_CURRENT_ROUTE_SOK2_001',
  );
  await expect(page.locator('#model-source-badge')).toHaveText(`WORK_TEST: ${candidateLabel}`);
  await expect(page.locator('#viewer-status')).toContainText(
    'M5B roof stormwater current route - WORK_TEST',
  );
  await expect(page.locator('#viewer-status')).not.toContainText(
    'WORK_TEST-kandidaattia ei voitu avata',
  );
});
