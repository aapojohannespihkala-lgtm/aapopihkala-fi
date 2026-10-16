import {expect, test} from '@playwright/test';
import {layoutP186ECaptions} from '../../src/scripts/privateModelP186ECaptionLayout.mjs';
import {deriveP186EOriginalCaptionRoster, verifyP186ECaptionFrame, verifyP186ECuesWithCaptions}
  from '../../src/scripts/privateModelP186ECaptionPixelEvidence.mjs';

test('readable captions separate close anchors and viewport edges without moving source points', () => {
  const input = Array.from({length: 18}, (_, i) => ({key: 'source-' + i,
    x: 14 + (i % 3) * 180, y: 24 + Math.floor(i / 3) * 80,
    width: i === 17 ? 278 : 104, height: i === 17 ? 44 : 26}));
  input[2].x = input[1].x; input[2].y = input[1].y + 20;
  const before = JSON.stringify(input);
  const result = layoutP186ECaptions(input, 600, 650);
  expect(result.state).toBe('READABLE'); expect(result.placements).toHaveLength(18);
  expect(JSON.stringify(input)).toBe(before);
  expect(layoutP186ECaptions([...input].reverse(), 600, 650)).toEqual(result);
  for (const [i, p] of result.placements.entries()) {
    const original = input.find(v => v.key === p.key)!;
    expect(p.anchor).toEqual({x: original.x, y: original.y});
    expect(p.x).toBeGreaterThanOrEqual(4); expect(p.y).toBeGreaterThanOrEqual(4);
    expect(p.x + p.width).toBeLessThanOrEqual(596);
    expect(p.y + p.height).toBeLessThanOrEqual(646);
    for (const q of result.placements.slice(i + 1)) expect(
      p.x < q.x + q.width && q.x < p.x + p.width && p.y < q.y + q.height && q.y < p.y + p.height,
    ).toBe(false);
    for (const q of input) expect(q.x >= p.x - 8 && q.x <= p.x + p.width + 8 &&
      q.y >= p.y - 8 && q.y <= p.y + p.height + 8).toBe(false);
  }
});

test('an impossible viewport never reports readable complete layout', () => {
  expect(layoutP186ECaptions([{key: 'wide', x: 10, y: 10, width: 300, height: 44}], 200, 200))
    .toEqual({state: 'NO_SPACE', placements: []});
});

// Deliberately synthetic pixel/metadata fixtures test rejection boundaries.
// They authenticate neither source files nor production glyphs.
function pixelFixture() {
  const width = 640, height = 640, rgba = new Uint8Array(width * height * 4);
  const originalCaptions = Array.from({length: 18}, (_, i) => ({sourceKey: 'source-' + i, text: 'Ryhmä ' + i}));
  const captions = originalCaptions.map((c, i) => ({...c, fontPx: 14, lines: [c.text],
    rect: {x: 8 + (i % 4) * 150, y: 8 + Math.floor(i / 4) * 100, width: 110, height: 26},
    anchor: {x: 0, y: 0}}));
  for (const c of captions) {
    const r = c.rect;
    for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++)
      rgba.set([24, 32, 43, 255], (y * width + x) * 4);
    for (let y = r.y + 7; y < r.y + 17; y++) for (let x = r.x + 10; x < r.x + 70; x += 2)
      rgba.set([255, 228, 163, 255], (y * width + x) * 4);
  }
  return {floor: 'D1F', width, height, rgba, originalCaptions,
    layout: {state: 'READABLE', floor: 'D1F', width, height, expectedCount: 18, laidOutCount: 18,
      allSourceCaptionsInView: true, humanReview: 'NOT_RUN', captions}};
}

test('caption evidence requires source text, nonoverlap and readable glyph rows for every source key', () => {
  expect(verifyP186ECaptionFrame(pixelFixture())).toMatchObject({captionCount: 18,
    completeSourceTextVerified: true, readableSizeGlyphPixelsVerified: true, glyphShapeOcrVerified: false,
    humanReview: 'NOT_RUN'});
});

for (const failure of ['truncated', 'duplicate', 'overlap', 'small-font', 'blank', 'tiny-glyphs', 'partial'])
  test('rejects caption evidence with ' + failure, () => {
    const f = pixelFixture(), c = f.layout.captions[0];
    if (failure === 'truncated') c.text = 'Ryh…';
    if (failure === 'duplicate') c.sourceKey = f.layout.captions[1].sourceKey;
    if (failure === 'overlap') c.rect = {...f.layout.captions[1].rect};
    if (failure === 'small-font') c.fontPx = 8;
    if (failure === 'partial') f.layout.allSourceCaptionsInView = false;
    if (failure === 'blank' || failure === 'tiny-glyphs') {
      const r = c.rect;
      for (let y = r.y; y < r.y + r.height; y++) for (let x = r.x; x < r.x + r.width; x++)
        if (failure === 'blank' || y >= r.y + 10) f.rgba.set([24, 32, 43, 255], (y * f.width + x) * 4);
    }
    expect(() => verifyP186ECaptionFrame(f)).toThrow(/P186E_CAPTION_/);
  });

test('raw caption roster follows only default-scene original keys and preserves full special text', () => {
  const nodes: any[] = [];
  for (const floor of ['D1F', 'D2F']) for (let i = 0; i < (floor === 'D1F' ? 18 : 16); i++) {
    const group = i > 0;
    nodes.push({extras: {Pass: 'P186E-X1', hostStorey: floor === 'D1F' ? 'D_1F' : 'D_2F',
      representationKind: group ? 'electricalGroupSourceLabelAnchor' : 'electricalSpecialSourceLabelAnchor',
      annotationStableKey: floor + '-group-' + i, sourceLabelId: floor + '-special-' + i,
      sourceGroupKey: '10.' + i, sourceText: '  A complete  historical note longer than thirty characters  '}});
  }
  const encode = () => {
    const text = Buffer.from(JSON.stringify({scene: 0, scenes: [{nodes: nodes.map((_, i) => i)}], nodes}));
    const padded = Buffer.concat([text, Buffer.alloc((4 - text.length % 4) % 4, 32)]);
    const glb = Buffer.alloc(20 + padded.length);
    glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
    glb.writeUInt32LE(padded.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); padded.copy(glb, 20);
    return glb;
  };
  const roster = deriveP186EOriginalCaptionRoster(encode());
  expect(roster.D1F).toHaveLength(18); expect(roster.D2F).toHaveLength(16);
  expect(roster.D1F[0]).toEqual({sourceKey: 'D1F-special-0',
    text: 'A complete historical note longer than thirty characters'});
  nodes[1].extras.annotationStableKey = nodes[2].extras.annotationStableKey;
  expect(() => deriveP186EOriginalCaptionRoster(encode())).toThrow(/SOURCE_ROSTER/);
});

test('a readable caption cannot hide any source cue from the paired isolation baseline', () => {
  const f = pixelFixture(), baseline = new Uint8Array(f.rgba);
  const targets = f.originalCaptions.map((c, i) => ({sourceKey: c.sourceKey,
    roi: {x: 10 + i * 20, y: 600, width: 10, height: 10}}));
  for (const t of targets) for (let y = 601; y < 609; y++) for (let x = t.roi.x + 1; x < t.roi.x + 9; x++) {
    const i = (y * f.width + x) * 4; baseline.set([255, 211, 77, 255], i); f.rgba.set([255, 211, 77, 255], i);
  }
  const session = {floor: f.floor, targets, baseline: {width: f.width, height: f.height, pixels: baseline}};
  const input = {...f, session};
  expect(verifyP186ECuesWithCaptions(input)).toMatchObject({sourceCuesUnobstructed: 18});
  const i = (601 * f.width + targets[0].roi.x + 1) * 4;
  f.rgba.set([24, 32, 43, 255], i);
  expect(() => verifyP186ECuesWithCaptions(input)).toThrow(/CUE_OCCLUSION/);
  f.rgba.set([255, 211, 77, 255], i);
  f.layout.captions[0].rect = {x: targets[0].roi.x, y: 590, width: 30, height: 26};
  expect(() => verifyP186ECuesWithCaptions(input)).toThrow(/CUE_OCCLUSION/);
});
