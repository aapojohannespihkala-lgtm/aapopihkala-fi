// Source-specific screenshot evidence for the five M5B R1109 viewer-only cyan locators.
// This runs on screenshot pixels, not on GLB node counts or runtime metadata alone.
export function detectM5BR1109CyanLocatorComponents(rgba, width, height) {
  if (
    !Number.isInteger(width) || width <= 0 ||
    !Number.isInteger(height) || height <= 0 ||
    rgba?.length !== width * height * 4
  ) {
    throw new Error('M5B R1109 pixel proof requires an exact RGBA image');
  }

  const minComponentPixels = 20;
  const mask = new Uint8Array(width * height);
  let qualifyingColorPixels = 0;
  for (let i = 0; i < mask.length; i += 1) {
    const p = i * 4;
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const a = rgba[p + 3];
    // Cyan locator RGB 0,234,255, tolerant of antialiasing but not blue bars.
    if (
      a >= 220 && r <= 84 && g >= 165 && b >= 170 &&
      g - r >= 90 && b - r >= 90 && Math.abs(b - g) <= 95
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
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
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
    requiredCount: 5,
    componentCount: components.length,
    minComponentPixels,
    qualifyingColorPixels,
    components,
  };
}

// Playwright injects this exact tested module into the authenticated page.
// No external script or network request is needed by the production viewer.
globalThis.detectM5BR1109CyanLocatorComponents =
  detectM5BR1109CyanLocatorComponents;
