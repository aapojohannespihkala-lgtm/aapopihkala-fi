import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';

// Optional second R1125 technical gate. The caller supplies ONE original
// scene63 screenshot with all 13 source objects visible and one same-camera,
// same-size screenshot for EACH source object hidden in isolation. This cannot
// authenticate the GLB, a screenshot, renderer state, or a production viewer.
// Never claim production visibility or HUMAN_REVIEW from caller-supplied frames.
const kinds = m5aR1125SourcePixelKinds;
const names = Object.keys(kinds);

// Match the exact single-class precedence in the existing R1125 source ROI
// detector. One RGB sample must never prove two overlapping color identities.
const sourcePixelKind = (pixels, off) => {
  if (pixels[off + 3] < 220) return null;
  const r = pixels[off], g = pixels[off + 1], b = pixels[off + 2];
  const gray = r > 75 && r < 215 && g > 80 && g < 225 &&
    b > 85 && b < 235 && Math.abs(r - g) < 42 && Math.abs(g - b) < 44;
  const cyan = g > 92 && b > 110 && r < g * 0.62 &&
    b > g * 1.04 && b < g * 1.9;
  const yellow = r > 120 && g > 78 && r > g * 1.07 &&
    b < g * 0.73 && r < g * 1.9;
  return cyan ? 'routeCyan' : yellow ? 'boundaryYellow' :
    gray ? 'wellGray' : null;
};
const colored = (kind, pixels, off) => sourcePixelKind(pixels, off) === kind;

const frameValid = (pixels, length) =>
  (pixels instanceof Uint8Array || pixels instanceof Uint8ClampedArray) &&
  pixels.length === length;

/**
 * Compare thirteen real per-object toggle screenshots against the unchanged
 * original frame. A shared cyan patch cannot prove a separate route: its
 * pixels must visibly disappear specifically when THAT route is hidden.
 *
 * Each source must have a distinct source-derived projected center from the
 * authenticated viewer. Synthetic frames only test this helper's behavior.
 */
export function detectM5AR1125PerSourceRenderDelta({
  baseline, mutedFrames, projections, width, height,
}) {
  if (!Number.isInteger(width) || width < 128 ||
      !Number.isInteger(height) || height < 128 ||
      width * height > 16_000_000 ||
      !frameValid(baseline, width * height * 4) ||
      !mutedFrames || typeof mutedFrames !== 'object' ||
      Array.isArray(mutedFrames) ||
      Object.keys(mutedFrames).length !== 13 ||
      !Array.isArray(projections) || projections.length !== 13) {
    throw new Error('R1125 requires exact original RGBA and 13 source-isolation frames');
  }
  const positions = new Map();
  for (const p of projections) {
    if (!p || !Object.hasOwn(kinds, p.key) || positions.has(p.key) ||
        !Number.isFinite(p.u) || !Number.isFinite(p.v) ||
        p.u <= 0 || p.u >= 1 || p.v <= 0 || p.v >= 1) {
      throw new Error('R1125 invalid/duplicate projected source identity');
    }
    positions.set(p.key, {
      x: Math.round(p.u * (width - 1)), y: Math.round(p.v * (height - 1)),
    });
  }
  if (positions.size !== names.length ||
      names.some(key => !positions.has(key) ||
        !Object.hasOwn(mutedFrames, key) ||
        !frameValid(mutedFrames[key], baseline.length))) {
    throw new Error('R1125 missing source identity or an exact muted frame');
  }
  const radius = Math.max(12, Math.round(Math.min(width, height) * 0.035));
  const radius2 = radius * radius;
  const entries = names.map(key => ({ key, kind: kinds[key], ...positions.get(key) }));
  for (let a = 0; a < entries.length; a++) {
    for (let b = a + 1; b < entries.length; b++) {
      const x = entries[a], y = entries[b];
      if (x.kind === y.kind &&
          (x.x - y.x) ** 2 + (x.y - y.y) ** 2 <= (2 * radius) ** 2) {
        throw new Error('R1125 ambiguous same-color source projections');
      }
    }
  }
  const stableOutsideLimit = Math.max(8, Math.floor(width * height * 0.001));
  const observations = entries.map(target => {
    const muted = mutedFrames[target.key];
    const minimum = target.kind === 'boundaryYellow' ? 2 : 8;
    let originalClassPixels = 0, isolatedClassPixels = 0;
    let remainingClassPixels = 0, localChangedPixels = 0, outsideChangedPixels = 0;
    for (let i = 0; i < width * height; i++) {
      const off = i * 4, x = i % width, y = (i / width) | 0;
      const dx = x - target.x, dy = y - target.y;
      const inside = dx * dx + dy * dy <= radius2;
      const changed = Math.max(
        Math.abs(baseline[off] - muted[off]),
        Math.abs(baseline[off + 1] - muted[off + 1]),
        Math.abs(baseline[off + 2] - muted[off + 2]),
        Math.abs(baseline[off + 3] - muted[off + 3]),
      ) > 36;
      if (inside) {
        if (colored(target.kind, baseline, off)) {
          originalClassPixels++;
          // Even a sub-threshold RGB delta can remove the SOURCE color class.
          if (!colored(target.kind, muted, off)) isolatedClassPixels++;
        }
        // A partly hidden or relocated target must not pass on its lost count.
        if (colored(target.kind, muted, off)) remainingClassPixels++;
        if (changed) localChangedPixels++;
      } else if (changed) {
        outsideChangedPixels++;
      }
    }
    // The target itself may be fully hidden, but all OTHER 12 source objects
    // must retain their own color class. Check peer ROIs even where they overlap
    // this target ROI or have a different palette. Count color loss directly:
    // RGB changes below the >36 global noise threshold can still erase a peer.
    const peerClassLossPixels = {};
    let peersPreserved = true;
    for (const peer of entries) {
      if (peer.key === target.key) continue;
      let baselinePeerPixels = 0, remainingPeerPixels = 0, peerLossPixels = 0;
      const minY = Math.max(0, peer.y - radius), maxY = Math.min(height - 1, peer.y + radius);
      for (let py = minY; py <= maxY; py++) {
        const dy = py - peer.y;
        const reach = Math.floor(Math.sqrt(radius2 - dy * dy));
        const minX = Math.max(0, peer.x - reach), maxX = Math.min(width - 1, peer.x + reach);
        for (let px = minX; px <= maxX; px++) {
          const off = (py * width + px) * 4;
          const before = colored(peer.kind, baseline, off);
          const after = colored(peer.kind, muted, off);
          if (before) {
            baselinePeerPixels++;
            if (!after) peerLossPixels++;
          }
          if (after) remainingPeerPixels++;
        }
      }
      peerClassLossPixels[peer.key] = peerLossPixels;
      const peerMinimum = peer.kind === 'boundaryYellow' ? 2 : 8;
      if (baselinePeerPixels < peerMinimum ||
          remainingPeerPixels < peerMinimum || peerLossPixels !== 0) {
        peersPreserved = false;
      }
    }
    return {
      key: target.key, kind: target.kind,
      originalClassPixels, isolatedClassPixels, remainingClassPixels,
      localChangedPixels, outsideChangedPixels,
      peerClassLossPixels, peersPreserved,
      minimum, passed: originalClassPixels >= minimum &&
        isolatedClassPixels >= minimum && remainingClassPixels === 0 &&
        localChangedPixels >= minimum && peersPreserved &&
        outsideChangedPixels <= stableOutsideLimit,
    };
  });
  return {
    requiredSourceCount: 13,
    sourceIsolation: observations,
    allSourceTargetsIsolated: observations.every(x => x.passed),
    // A positive result remains technical evidence awaiting exact source,
    // browser authentication, same-camera capture and production provenance.
    productionProvenanceVerified: false,
    humanReview: 'NOT_RUN',
  };
}
