// Screenshot evidence helper for the two persisted M5A R1115 planned-raise markers.
// The source marker material is unlit orange (baseColorFactor 0.94, 0.48, 0.11);
// the viewer preserves that color while applying 80% opacity and 2.5x viewer-only scale.
export function detectM5AR1115OrangeMarkerComponents(rgba, width, height) {
  if (
    !Number.isInteger(width) || width <= 0 ||
    !Number.isInteger(height) || height <= 0 ||
    rgba?.length !== width * height * 4
  ) {
    throw new Error('M5A R1115 pixel proof requires an exact RGBA image');
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

    // Tolerant orange gate for source RGB ~240,122,28 after alpha blending/AA.
    // Rejects red warning bars, yellow highlights, neutral building context and blue/cyan aids.
    if (
      a >= 220 &&
      r >= 155 &&
      g >= 55 && g <= 185 &&
      b <= 115 &&
      r - g >= 45 &&
      g - b >= 18
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

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let pixels = 0;

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
          const nx = x + dx;
          const ny = y + dy;
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
        pixels,
        minX,
        minY,
        maxX,
        maxY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
      });
    }
  }

  components.sort((a, b) => a.minX - b.minX || a.minY - b.minY);

  return {
    requiredCount: 2,
    componentCount: components.length,
    minComponentPixels,
    qualifyingColorPixels,
    components,
  };
}

globalThis.detectM5AR1115OrangeMarkerComponents =
  detectM5AR1115OrangeMarkerComponents;
