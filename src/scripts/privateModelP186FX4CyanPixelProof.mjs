// Pixel-only evidence for the three P186F-X4 scene 66 Themo viewer halos.
// Source color is 0x22d3ee (RGB 34,211,238) in privateModelP186FReviewPresentation.ts.
// This detector cannot by itself prove production autoload, exact candidate identity,
// camera clarity, room mapping, or HUMAN_REVIEW approval.
export function detectP186FX4CyanTargetComponents(rgba, width, height) {
  if (
    !Number.isInteger(width) || width <= 0 ||
    !Number.isInteger(height) || height <= 0 ||
    rgba?.length !== width * height * 4
  ) {
    throw new Error('P186F-X4 pixel proof requires an exact RGBA image');
  }

  const requiredCount = 3;
  const minComponentPixels = 20;
  const mask = new Uint8Array(width * height);
  let qualifyingColorPixels = 0;
  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4;
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const a = rgba[p + 3];
    // Allow antialiasing of the 34/211/238 target but exclude dark-blue UI.
    if (
      a >= 220 && r <= 90 && g >= 160 && b >= 175 &&
      g - r >= 85 && b - r >= 95 && Math.abs(b - g) <= 90
    ) {
      mask[i] = 1;
      qualifyingColorPixels += 1;
    }
  }

  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const components = [];
  for (let seed = 0; seed < mask.length; seed += 1) {
    if (!mask[seed] || visited[seed]) continue;
    let head = 0;
    let tail = 1;
    queue[0] = seed;
    visited[seed] = 1;
    let minX = width, minY = height, maxX = -1, maxY = -1, pixels = 0;
    while (head < tail) {
      const at = queue[head++];
      const x = at % width;
      const y = Math.floor(at / width);
      pixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const n = ny * width + nx;
          if (mask[n] && !visited[n]) {
            visited[n] = 1;
            queue[tail++] = n;
          }
        }
      }
    }
    if (pixels >= minComponentPixels) {
      components.push({
        pixels, minX, minY, maxX, maxY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
      });
    }
  }
  components.sort((a, b) => a.minX - b.minX || a.minY - b.minY);
  return {
    requiredCount,
    componentCount: components.length,
    minComponentPixels,
    qualifyingColorPixels,
    components,
  };
}

// Can be injected into an authenticated Playwright page in a later,
// separately gated production smoke. No production smoke is run here.
globalThis.detectP186FX4CyanTargetComponents =
  detectP186FX4CyanTargetComponents;


// Separate visual proof for the original P123C green D1F wall.
// The original material is green and semi-transparent; the screenshot is
// already composited, so the predicate uses green-vs-red/blue separation
// rather than an exact source-material RGB value. The caller must ALSO prove
// the exact source node, suppressed P117D footprints and three Themo targets.
// This does not certify geometry identity or HUMAN_REVIEW by itself.
export function detectP186FX4OriginalGreenWallPixels(rgba, width, height) {
  if (
    !Number.isInteger(width) || width <= 0 ||
    !Number.isInteger(height) || height <= 0 ||
    rgba?.length !== width * height * 4
  ) {
    throw new Error('P186F-X4 wall proof requires an exact RGBA image');
  }
  const requiredPixels = 160;
  const requiredSpreadX = 40;
  const requiredSpreadY = 15;
  const requiredRows = 12;
  const requiredColumns = 30;

  const pixelCount = width * height;
  const mask = new Uint8Array(pixelCount);
  const rows = new Uint32Array(height);
  const columns = new Uint32Array(width);
  let qualifyingGreenPixels = 0;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let i = 0; i < pixelCount; i += 1) {
    const p = i * 4;
    const r = rgba[p], g = rgba[p + 1], b = rgba[p + 2], a = rgba[p + 3];
    // Cyan Themo halos, dark UI, gray, and almost-white are excluded.
    if (a < 220 || g < 90 || g - r < 24 || g - b < 22) continue;
    const x = i % width;
    const y = Math.floor(i / width);
    mask[i] = 1;
    qualifyingGreenPixels += 1;
    rows[y] += 1;
    columns[x] += 1;
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }

  // A collection of unrelated green UI/proxy patches must not satisfy the
  // source-wall pixel gate by adding up their distant rows and columns.
  // At least ONE 8-connected source-green region must meet every hard floor.
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const componentRows = new Uint32Array(height);
  const componentColumns = new Uint32Array(width);
  const rowStamps = new Uint32Array(height);
  const columnStamps = new Uint32Array(width);
  let componentCount = 0;
  let largestConnectedGreenPixels = 0;
  let largestConnectedSpreadX = 0;
  let largestConnectedSpreadY = 0;
  let passed = false;

  for (let seed = 0; seed < pixelCount; seed += 1) {
    if (!mask[seed] || visited[seed]) continue;
    const stamp = ++componentCount;
    let head = 0, tail = 1, pixels = 0;
    let cx0 = width, cy0 = height, cx1 = -1, cy1 = -1;
    visited[seed] = 1;
    queue[0] = seed;

    while (head < tail) {
      const at = queue[head++];
      const x = at % width;
      const y = Math.floor(at / width);
      pixels += 1;
      cx0 = Math.min(cx0, x); cx1 = Math.max(cx1, x);
      cy0 = Math.min(cy0, y); cy1 = Math.max(cy1, y);
      if (rowStamps[y] !== stamp) { rowStamps[y] = stamp; componentRows[y] = 0; }
      if (columnStamps[x] !== stamp) { columnStamps[x] = stamp; componentColumns[x] = 0; }
      componentRows[y] += 1;
      componentColumns[x] += 1;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const next = ny * width + nx;
          if (!mask[next] || visited[next]) continue;
          visited[next] = 1;
          queue[tail++] = next;
        }
      }
    }

    const compSpreadX = cx1 - cx0 + 1;
    const compSpreadY = cy1 - cy0 + 1;
    if (pixels > largestConnectedGreenPixels) {
      largestConnectedGreenPixels = pixels;
      largestConnectedSpreadX = compSpreadX;
      largestConnectedSpreadY = compSpreadY;
    }
    if (
      pixels < requiredPixels ||
      compSpreadX < requiredSpreadX ||
      compSpreadY < requiredSpreadY
    ) continue;
    let substantialRows = 0, substantialColumns = 0;
    for (let y = cy0; y <= cy1; y += 1) {
      if (rowStamps[y] === stamp && componentRows[y] >= 5) substantialRows++;
    }
    for (let x = cx0; x <= cx1; x += 1) {
      if (columnStamps[x] === stamp && componentColumns[x] >= 5) substantialColumns++;
    }
    if (substantialRows >= requiredRows && substantialColumns >= requiredColumns) {
      passed = true;
    }
  }

  const spreadX = qualifyingGreenPixels ? maxX - minX + 1 : 0;
  const spreadY = qualifyingGreenPixels ? maxY - minY + 1 : 0;
  const qualifyingRows = rows.reduce((sum, count) => sum + Number(count >= 5), 0);
  const qualifyingColumns = columns.reduce((sum, count) => sum + Number(count >= 5), 0);
  return {
    passed,
    qualifyingGreenPixels,
    qualifyingRows,
    qualifyingColumns,
    spreadX,
    spreadY,
    bounds: qualifyingGreenPixels ? { minX, minY, maxX, maxY } : null,
    hardFloorPixels: requiredPixels,
    hardFloorSpreadX: requiredSpreadX,
    hardFloorSpreadY: requiredSpreadY,
    componentCount,
    largestConnectedGreenPixels,
    largestConnectedSpreadX,
    largestConnectedSpreadY,
  };
}
