// P186F-X4 WORK_TEST screenshot-only check: a visibly green source wall must
// occupy an appreciable area in the *authenticated canvas screenshot*.
// This is additive to exact GLB/candidate/review/source-node dataset checks.
// Green pixels alone are NOT a proof of source identity or wall-host approval.
// Original P123C material36 baseColorFactor: [0.08, 1, 0.18, 0.38].
export function detectP186FX4GreenWallPixels(rgba, width, height) {
  if (!Number.isInteger(width) || width <= 0 ||
      !Number.isInteger(height) || height <= 0 ||
      rgba?.length !== width * height * 4) {
    throw new Error('P186F-X4 green-wall proof requires an exact RGBA image');
  }

  const mask = new Uint8Array(width * height);
  let qualifyingColorPixels = 0;
  for (let n = 0; n < width * height; n += 1) {
    const p = n * 4;
    const r = rgba[p];
    const g = rgba[p + 1];
    const b = rgba[p + 2];
    const a = rgba[p + 3];
    // Exclude cyan Themo halos, white canvas background, and translucent noise.
    // Accommodates glTF alpha-blend (material36) over light or dark canvas.
    if (a >= 220 && g >= 82 && g - r >= 30 && g - b >= 27 && b <= 220) {
      mask[n] = 1;
      qualifyingColorPixels += 1;
    }
  }

  // Require both nontrivial colored area and two-dimensional spatial extent.
  // This rejects a single green label, cursor, or 1-pixel rule as a wall.
  const minPixels = Math.max(80, Math.ceil(width * height * 0.0004));
  const minSpanX = Math.max(16, Math.ceil(width * 0.035));
  const minSpanY = Math.max(16, Math.ceil(height * 0.035));
  // A long one-pixel line plus a separate cursor cannot impersonate a wall.
  // Require one 8-connected green structure to satisfy area AND both spans.
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let largest = { pixelCount: 0, spanX: 0, spanY: 0, bounds: null };
  for (let seed = 0; seed < mask.length; seed += 1) {
    if (!mask[seed] || visited[seed]) continue;
    let head = 0, tail = 1;
    queue[0] = seed;
    visited[seed] = 1;
    let count = 0, minX = width, minY = height, maxX = -1, maxY = -1;
    while (head < tail) {
      const at = queue[head++];
      const x = at % width, y = Math.floor(at / width);
      count += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const pos = ny * width + nx;
          if (mask[pos] && !visited[pos]) {
            visited[pos] = 1;
            queue[tail++] = pos;
          }
        }
      }
    }
    if (count > largest.pixelCount) {
      largest = { pixelCount: count, spanX: maxX-minX+1,
        spanY: maxY-minY+1, bounds: { minX, minY, maxX, maxY } };
    }
  }
  const { pixelCount, spanX, spanY, bounds } = largest;
  return {
    sourceWallNodeExpected: 798,
    sourceWallMaterialExpected: 36,
    minPixels,
    minSpanX,
    minSpanY,
    qualifyingColorPixels,
    pixelCount,
    spanX,
    spanY,
    bounds,
    renderedWallEvidence: pixelCount >= minPixels &&
      spanX >= minSpanX && spanY >= minSpanY,
    // Only the production backend/canvas datasets can establish exact identity.
    exactSourceIdentityEstablishedByPixelsAlone: false,
    humanReview: 'NOT_RUN',
  };
}
