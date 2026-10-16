const expectedCounts = {D1F: 18, D2F: 16};
export class P186ECaptionFailure extends Error {
  constructor(code) { super('P186E_CAPTION_' + code); this.code = code; }
}
const fail = code => { throw new P186ECaptionFailure(code); };
const need = (value, code) => { if (!value) fail(code); };
const normalize = text => String(text ?? '').trim().replace(/\s+/g, ' ');

// Caller authenticates the complete original GLB before invoking this parser.
export function deriveP186EOriginalCaptionRoster(bytes) {
  need(bytes instanceof Uint8Array && bytes.length >= 24 && bytes.length <= 6000000, 'GLB');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  need(view.getUint32(0, true) === 0x46546c67 && view.getUint32(4, true) === 2 &&
    view.getUint32(8, true) === bytes.length && view.getUint32(16, true) === 0x4e4f534a, 'GLB');
  const length = view.getUint32(12, true);
  need(length > 0 && 20 + length <= bytes.length, 'GLB');
  const gltf = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + length)));
  /** @type {Record<'D1F' | 'D2F', Array<{sourceKey: string, text: string}>>} */
  const result = {D1F: [], D2F: []};
  const seen = new Set();
  const visit = index => {
    need(Number.isInteger(index) && gltf.nodes?.[index] && !seen.has(index), 'SOURCE_TREE');
    seen.add(index);
    const node = gltf.nodes[index], d = node.extras ?? {};
    const floor = d.hostStorey === 'D_1F' ? 'D1F' : d.hostStorey === 'D_2F' ? 'D2F' : null;
    if (d.Pass === 'P186E-X1' && floor) {
      const group = d.representationKind === 'electricalGroupSourceLabelAnchor';
      const special = d.representationKind === 'electricalSpecialSourceLabelAnchor';
      if (group || special) {
        const key = group ? d.annotationStableKey : d.sourceLabelId;
        const text = group ? 'Ryhmä ' + normalize(d.sourceGroupKey) : normalize(d.sourceText);
        need(typeof key === 'string' && key.length > 0 && text.length > 0 && text.length <= 512, 'SOURCE_TEXT');
        result[floor].push({sourceKey: key, text});
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes;
  need(Array.isArray(roots), 'SOURCE_TREE');
  for (const index of roots) visit(index);
  for (const floor of Object.keys(result)) need(result[floor].length === expectedCounts[floor] &&
    new Set(result[floor].map(c => c.sourceKey)).size === expectedCounts[floor], 'SOURCE_ROSTER');
  return result;
}

export function verifyP186ECaptionFrame({floor, layout, originalCaptions, width, height, rgba}) {
  const count = expectedCounts[floor];
  need(count && layout?.state === 'READABLE' && layout.floor === floor && layout.width === width &&
    layout.height === height && layout.expectedCount === count && layout.laidOutCount === count &&
    layout.allSourceCaptionsInView === true && layout.humanReview === 'NOT_RUN', 'LAYOUT');
  need(Number.isInteger(width) && Number.isInteger(height) && width * height <= 4000000 &&
    rgba instanceof Uint8Array && rgba.length === width * height * 4, 'RGBA');
  need(Array.isArray(originalCaptions) && originalCaptions.length === count &&
    Array.isArray(layout.captions) && layout.captions.length === count &&
    new Set(originalCaptions.map(c => c.sourceKey)).size === count &&
    new Set(layout.captions.map(c => c.sourceKey)).size === count, 'ROSTER');
  const rects = [], evidence = [];
  for (const caption of layout.captions) {
    const original = originalCaptions.find(c => c.sourceKey === caption.sourceKey);
    need(original && caption.text === original.text && caption.fontPx === 14 &&
      Array.isArray(caption.lines) && caption.lines.length > 0 && caption.lines.join(' ') === original.text, 'TEXT');
    const r = caption.rect;
    need(r && [r.x, r.y, r.width, r.height].every(Number.isFinite) &&
      r.x >= 0 && r.y >= 0 && r.width >= 12 && r.height === caption.lines.length * 18 + 8 &&
      r.x + r.width <= width && r.y + r.height <= height, 'RECT');
    need(!rects.some(b => r.x < b.x + b.width && b.x < r.x + r.width &&
      r.y < b.y + b.height && b.y < r.y + r.height), 'OVERLAP');
    rects.push(r);
    let darkPixels = 0;
    const linePixels = caption.lines.map(() => ({glyphPixels: 0, rows: new Set()}));
    for (let y = Math.ceil(r.y); y < Math.floor(r.y + r.height); y++) {
      for (let x = Math.ceil(r.x); x < Math.floor(r.x + r.width); x++) {
        const i = (y * width + x) * 4;
        const red = rgba[i], green = rgba[i + 1], blue = rgba[i + 2];
        if (red <= 65 && green <= 75 && blue <= 85 && rgba[i + 3] >= 200) darkPixels++;
        if (x < r.x + 4 || x > r.x + r.width - 4 || rgba[i + 3] < 200 ||
          red < 215 || green < 175 || blue < 110 || red - green < 12 || green - blue < 30) continue;
        const line = Math.floor((y - r.y - 4) / 18);
        if (line >= 0 && line < linePixels.length) {
          linePixels[line].glyphPixels++; linePixels[line].rows.add(y);
        }
      }
    }
    need(darkPixels >= r.width * r.height * 0.25 && linePixels.every((line, index) =>
      line.glyphPixels >= Math.max(10, caption.lines[index].length * 2) && line.rows.size >= 8), 'GLYPH_PIXELS');
    evidence.push({sourceKey: caption.sourceKey, text: caption.text, rect: r, fontPx: caption.fontPx,
      lines: linePixels.map(l => ({glyphPixels: l.glyphPixels, glyphRows: l.rows.size})), darkPixels});
  }
  return {floor, captionCount: count, completeSourceTextVerified: true, nonOverlapping: true,
    readableSizeGlyphPixelsVerified: true, glyphShapeOcrVerified: false,
    captions: evidence, humanReview: 'NOT_RUN'};
}

// Compare the caption-visible overview to the same camera's authenticated
// caption-hidden source isolation baseline. A readable label must not cover a cue.
export function verifyP186ECuesWithCaptions({layout, rgba, width, height, session}) {
  need(session?.baseline?.width === width && session.baseline.height === height &&
    session.baseline.pixels instanceof Uint8Array && session.baseline.pixels.length === rgba.length &&
    session.targets?.length === expectedCounts[session.floor], 'CUE_FRAME');
  const amber = (pixels, i) => pixels[i + 3] >= 200 && pixels[i] >= 145 && pixels[i + 1] >= 85 &&
    pixels[i + 2] <= 165 && pixels[i] - pixels[i + 1] >= 18 && pixels[i + 1] - pixels[i + 2] >= 18;
  const targets = [];
  for (const target of session.targets) {
    const r = target.roi;
    need(r && [r.x, r.y, r.width, r.height].every(Number.isInteger) &&
      r.x >= 0 && r.y >= 0 && r.x + r.width <= width && r.y + r.height <= height, 'CUE_ROI');
    need(!layout.captions.some(c => {
      const b = c.rect;
      return r.x < b.x + b.width && b.x < r.x + r.width && r.y < b.y + b.height && b.y < r.y + r.height;
    }), 'CUE_OCCLUSION');
    let baselineAmber = 0, lostAmber = 0;
    for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++) {
      const i = (y * width + x) * 4;
      if (amber(session.baseline.pixels, i)) { baselineAmber++; if (!amber(rgba, i)) lostAmber++; }
    }
    need(baselineAmber >= 4 && lostAmber === 0, 'CUE_OCCLUSION');
    targets.push({sourceKey: target.sourceKey, baselineAmber, lostAmber});
  }
  return {floor: session.floor, sourceCuesUnobstructed: targets.length, targets};
}
