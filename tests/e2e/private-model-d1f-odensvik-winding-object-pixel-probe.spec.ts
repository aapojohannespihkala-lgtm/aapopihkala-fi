import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {
  ORIGINAL_OBJECT_KINDS,
  exactCorrectedWindingReviewUrl,
  countCorrectedWindingObjectPixels,
} from '../../.github/scripts/private-model-d1f-odensvik-winding-object-pixel-probe.mjs';

const variants=[
  'WEST_ANCHOR_725_895_740',
  'WEST_ANCHOR_740_895_725',
  'EAST_ANCHOR_725_895_740',
  'EAST_ANCHOR_740_895_725',
];
const review='d1f-odensvik-00193937-counter-winding-fixed-20261018-review';
test('corrected ODENSVIK links only four genuine 116-scene variants',()=>{
  expect(ORIGINAL_OBJECT_KINDS).toEqual(['BOWL','COUNTER','CABINET']);
  for(const variant of variants){
    expect(exactCorrectedWindingReviewUrl(variant))
      .toBe('https://aapopihkala.fi/private-model/?review='+review+'&wallVariant='+variant);
  }
  expect(()=>exactCorrectedWindingReviewUrl('OLD_SCENE108')).toThrow('D1F_ODENSVIK_WINDING_PIXEL_REJECTED');
  expect(()=>exactCorrectedWindingReviewUrl('')).toThrow('D1F_ODENSVIK_WINDING_PIXEL_REJECTED');
});
test('object pixel counter uses actual RGBA changes, rejects identical or wrong-size frames',()=>{
  const mk=()=>({width:120,height:120,rgba:new Uint8Array(120*120*4).fill(45)});
  const before=mk(),hidden=mk();
  for(let pixel=0;pixel<149;pixel++){
    const p=pixel*4;hidden.rgba[p]=0;hidden.rgba[p+1]=0;hidden.rgba[p+2]=0;
  }
  // Difference 135 in RGB, above 48; 149 source-object pixels.
  expect(countCorrectedWindingObjectPixels(before,hidden)).toBe(149);
  expect(countCorrectedWindingObjectPixels(before,mk())).toBe(0);
  expect(()=>countCorrectedWindingObjectPixels(before,{width:119,height:120,rgba:new Uint8Array(119*120*4)}))
    .toThrow('D1F_ODENSVIK_WINDING_PIXEL_REJECTED');
  expect(()=>countCorrectedWindingObjectPixels(before,hidden,1))
    .toThrow('D1F_ODENSVIK_WINDING_PIXEL_REJECTED');
});
test('main-only read-only workflow has distinct corrected source object pixel gate',()=>{
  const yaml=readFileSync('.github/workflows/private-model-d1f-service-review.yml','utf8');
  expect(yaml).toContain('- odensvik-winding-pixels');
  expect(yaml).toContain("inputs.review_mode == 'odensvik-winding-pixels'");
  expect(yaml).toContain('PROBE_MODE: d1f-odensvik-winding-pixels');
  expect(yaml).toContain('private-model-d1f-odensvik-winding-object-pixel-probe.mjs');
  expect(yaml).toContain("github.ref == 'refs/heads/main'");
  expect(yaml).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_ID');
  expect(yaml).toContain('CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET');
  expect(yaml).toContain('d1f-odensvik-winding-original-object-pixels');
});
