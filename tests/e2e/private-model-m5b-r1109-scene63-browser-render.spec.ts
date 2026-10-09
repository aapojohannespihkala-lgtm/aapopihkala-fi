import { expect, test } from '@playwright/test';

import {
  m5bR1109CandidateId,
  m5bR1109ReviewId,
} from '../../src/scripts/privateModelWorkTest';
import { m5bR1109PersistedTargetIds } from '../../src/scripts/privateModelM5BReviewPresentation';

// Synthetic WebGL fixture only: this is not the raw Drive R1109 GLB or production evidence.
// Preserve its source-presence/no-promotion semantics so the real scene63 review path runs.
const makeScene63Glb = () => {
  const cubeVertices = [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
  ];
  const cubeTriangles = [
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2,
    1, 2, 6, 1, 6, 5, 0, 4, 7, 0, 7, 3,
  ];
  const vertexBytes = Buffer.alloc(cubeVertices.length * 3 * 4);
  cubeVertices.flat().forEach((value, i) => vertexBytes.writeFloatLE(value, i * 4));
  const indexBytes = Buffer.alloc(cubeTriangles.length * 2);
  cubeTriangles.forEach((value, i) => indexBytes.writeUInt16LE(value, i * 2));
  const bin = Buffer.concat([vertexBytes, indexBytes]);

  const noPromotion = {
    representationKind: 'downspoutPresenceZoneWork',
    sourcePresenceConfirmed: true,
    presentationOnly: true,
    workAssumption: true,
    reviewTarget: true,
    proxyDimensionsStatus: 'WORK_ASSUMPTION_NOT_SOURCE_DIMENSION',
    physicalDownspoutHostClaim: false,
    exactXYClaim: false,
    exactZClaim: false,
    physicalRouteClaim: false,
    physicalDiameterClaim: false,
    physicalElevationClaim: false,
    currentGeometryClaim: false,
    asBuiltClaim: false,
    Canonical: false,
    canonical: false,
    publishToCURRENT: false,
    hydraulicConnectionToM5A: false,
    downspoutPresenceToCurrentRouteLinkCount: 0,
    sourceBoundaryContract: 'G2_R1108',
    HUMAN_REVIEW: 'NOT_RUN',
  };
  const positions = [
    [-4.6, 0, -2.2],
    [4.6, 0, -2.2],
    [-4.6, 0, 2.2],
    [4.6, 0, 2.2],
    [0, 0, 2.2],
  ];
  const nodes = [
    {
      name: 'BUILDING_CONTEXT_SYNTHETIC',
      mesh: 0,
      scale: [10, 1, 5],
      extras: { G2Id: 'SYNTHETIC_BUILDING_CONTEXT' },
    },
    ...m5bR1109PersistedTargetIds.map((id, i) => ({
      name: 'R1109_' + id,
      mesh: 1,
      translation: positions[i],
      scale: [1.3, 5, 1.3],
      extras: { ...noPromotion, G2Id: id },
    })),
  ];
  const primitive = (material: number) => ({
    attributes: { POSITION: 0 },
    indices: 1,
    material,
    mode: 4,
  });
  const gltf = {
    asset: { version: '2.0', generator: 'R1109 browser-only scene63 smoke fixture' },
    scene: 0,
    scenes: Array.from({ length: 64 }, (_, i) => ({
      name: i === 63 ? 'M5B R1109 SOURCE PRESENCE REVIEW' : 'NON_REVIEW_SCENE_' + i,
      nodes: i === 63 ? [0, 1, 2, 3, 4, 5] : [],
    })),
    nodes,
    meshes: [{ primitives: [primitive(0)] }, { primitives: [primitive(1)] }],
    materials: [
      { doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.1, 0.42, 0.5, 1], metallicFactor: 0, roughnessFactor: 1 } },
      { doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 0.32, 0.07, 1], metallicFactor: 0, roughnessFactor: 1 } },
    ],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: vertexBytes.length, target: 34962 },
      { buffer: 0, byteOffset: vertexBytes.length, byteLength: indexBytes.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
  };
  const jsonRaw = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonChunk = Buffer.concat([jsonRaw, Buffer.alloc((4 - jsonRaw.length % 4) % 4, 0x20)]);
  const binChunk = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const header = Buffer.alloc(12);
  header.write('glTF', 0, 'ascii');
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
};

test('R1109 one-link scene63 browser renders five source zones and fails no-promotion open', async ({ page }) => {
  test.setTimeout(45_000);
  const candidatePath = '/private-model/work-test/' + m5bR1109CandidateId + '.glb';
  const fixture = makeScene63Glb();

  await page.route('**/private-model/model.glb', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: makeScene63Glb(),
    }),
  );
  await page.route('**/private-model/work-test/catalog.json', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [{ id: m5bR1109CandidateId, label: 'M5B R1109 synthetic review', path: candidatePath }],
      }),
    }),
  );
  await page.route('**' + candidatePath, (route) =>
    route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: fixture }),
  );

  // A single persistent review URL: no local GLB selection, seed fragment or upload.
  await page.goto('/private-model/?review=' + m5bR1109ReviewId);
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-model-source', 'work-test', { timeout: 20_000 });
  await expect(canvas).toHaveAttribute('data-work-test-review-mode', m5bR1109ReviewId);
  await expect(canvas).toHaveAttribute('data-m5b-review-variant', 'R1109_PERSISTED_ZONES');
  await expect(canvas).toHaveAttribute('data-m5b-scene-index', '63');
  await expect(canvas).toHaveAttribute('data-m5b-target-g2-ids', m5bR1109PersistedTargetIds.join(','));
  await expect(canvas).toHaveAttribute('data-m5b-review-target-renderable-count', '5');
  await expect(canvas).toHaveAttribute('data-m5b-human-review', 'NOT_RUN');
  await expect(page).not.toHaveURL(/workTestImport=|workTestCandidate=/);

  const countOrangeRenderedPixels = async () => {
    const png = await canvas.screenshot();
    return page.evaluate(async (dataUrl) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const probe = document.createElement('canvas');
      probe.width = image.naturalWidth;
      probe.height = image.naturalHeight;
      const context = probe.getContext('2d', { willReadFrequently: true });
      if (!context) return 0;
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, probe.width, probe.height).data;
      let orange = 0;
      for (let i = 0; i < rgba.length; i += 16) {
        const red = rgba[i], green = rgba[i + 1], blue = rgba[i + 2];
        if (red > 75 && red > green * 1.25 && red > blue * 1.4) orange++;
      }
      return orange;
    }, 'data:image/png;base64,' + png.toString('base64'));
  };

  // Browser-level pixel evidence from the synthetic review scene, not just metadata.
  await expect.poll(countOrangeRenderedPixels, { timeout: 12_000 }).toBeGreaterThan(100);
});
