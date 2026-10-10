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
