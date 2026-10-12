import { expect, test } from '@playwright/test';
// @ts-ignore - pure .mjs module, used on the exact authenticated screenshot
import { detectP186FX4GreenWallPixels as detect } from '../../src/scripts/privateModelP186FX4GreenWallPixelProof.mjs';

const frame = (width = 240, height = 180) => {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([235, 241, 247, 255], i);
  const fill = (x: number, y: number, w: number, h: number, c: number[]) => {
    for (let iy = y; iy < y + h; iy += 1)
      for (let ix = x; ix < x + w; ix += 1)
        rgba.set(c, (iy * width + ix) * 4);
  };
  return { rgba, width, height, fill };
};

test('X4 authentic-looking green original wall occupies wide screenshot area', () => {
  const f = frame();f.fill(55, 40, 110, 85, [169, 252, 168, 255]);
  const r=detect(f.rgba,f.width,f.height);
  expect(r.renderedWallEvidence).toBe(true);
  expect(r.sourceWallNodeExpected).toBe(798);
  expect(r.exactSourceIdentityEstablishedByPixelsAlone).toBe(false);
  expect(r.humanReview).toBe('NOT_RUN');
});
test('X4 cyan markers or missing wall cannot pass source-wall pixel gate', () => {
  const f = frame();
  for (const x of [35,95,155]) f.fill(x,55,10,10,[34,211,238,255]);
  expect(detect(f.rgba,f.width,f.height).renderedWallEvidence).toBe(false);
});
test('green thin line, translucent proxy and empty screen fail closed', () => {
  const f=frame();
  expect(detect(f.rgba,f.width,f.height).renderedWallEvidence).toBe(false);
  f.fill(30,65,170,1,[24,211,44,255]);
  f.fill(60,80,110,65,[24,211,44,150]);
  expect(detect(f.rgba,f.width,f.height).renderedWallEvidence).toBe(false);
});
test('invalid dimensions or RGBA length throw', () => {
  const f=frame();
  expect(()=>detect(f.rgba,f.width,f.height-1)).toThrow('exact RGBA');
  expect(()=>detect(f.rgba,NaN,f.height)).toThrow('exact RGBA');
});
