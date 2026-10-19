import {test,expect} from '@playwright/test';
import {
  ORIGINAL_OBJECT_KINDS,
  exactCorrectedWindingReviewUrl,
  countCorrectedWindingObjectPixels,
  requireCorrectedWindingLocalizedPixels,
  requireCorrectedWindingRestoredPixels,
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

test('original-object RGB difference requires a compact localized footprint, not metadata',()=>{
  const mk=()=>({width:120,height:120,rgba:new Uint8Array(120*120*4).fill(45)});
  const original=mk(),withoutObject=mk();
  for(let y=40;y<52;y++)for(let x=36;x<48;x++){
    const i=4*(y*120+x);
    withoutObject.rgba[i]=0;
    withoutObject.rgba[i+1]=0;
    withoutObject.rgba[i+2]=0;
  }
  const result=requireCorrectedWindingLocalizedPixels(original,withoutObject);
  expect(result).toMatchObject({
    changed:144,roi:{x:36,y:40,width:12,height:12},
    sourceProjectedRoiVerified:false,
  });
  expect(result.changedFraction).toBeLessThan(0.02);
  expect(result.occupiedFraction).toBe(1);
});

test('full-frame or scattered camera drift cannot impersonate one ODENSVIK source object',()=>{
  const mk=()=>({width:120,height:120,rgba:new Uint8Array(120*120*4).fill(45)});
  const original=mk(),allChanged=mk();
  allChanged.rgba.fill(0);
  expect(countCorrectedWindingObjectPixels(original,allChanged)).toBe(14400);
  expect(()=>requireCorrectedWindingLocalizedPixels(original,allChanged))
    .toThrow('global-or-scattered-frame-drift');

  const scattered=mk();
  for(let n=0;n<118;n++){
    const x=(n*17)%118,y=(n*41)%118,i=4*(y*120+x);
    scattered.rgba[i]=0;scattered.rgba[i+1]=0;scattered.rgba[i+2]=0;
  }
  expect(countCorrectedWindingObjectPixels(original,scattered)).toBe(118);
  expect(()=>requireCorrectedWindingLocalizedPixels(original,scattered))
    .toThrow('global-or-scattered-frame-drift');
});

test('alpha-only changes or fewer than 96 RGB pixels do not prove original visibility',()=>{
  const mk=()=>({width:120,height:120,rgba:new Uint8Array(120*120*4).fill(45)});
  const original=mk(),alphaOnly=mk();
  for(let n=0;n<144;n++)alphaOnly.rgba[4*(40*120+20+n)+3]=0;
  expect(()=>requireCorrectedWindingLocalizedPixels(original,alphaOnly))
    .toThrow('no-localized-object-difference');

  const tiny=mk();
  for(let n=0;n<95;n++){
    const i=4*(40*120+20+n);
    tiny.rgba[i]=0;tiny.rgba[i+1]=0;tiny.rgba[i+2]=0;
  }
  expect(()=>requireCorrectedWindingLocalizedPixels(original,tiny))
    .toThrow('no-localized-object-difference');
});

test('restore must reject a still-hidden 96-pixel original and any residual above eight RGB pixels',()=>{
  const mk=()=>({width:120,height:120,rgba:new Uint8Array(120*120*4).fill(45)});
  const baseline=mk();
  const difference=(count: number)=>{
    const frame=mk();
    for(let n=0;n<count;n++){
      const x=20+n%12,y=35+Math.floor(n/12),i=4*(y*120+x);
      frame.rgba[i]=0;frame.rgba[i+1]=0;frame.rgba[i+2]=0;
    }
    return frame;
  };
  expect(requireCorrectedWindingRestoredPixels(baseline,mk())).toBe(0);
  expect(requireCorrectedWindingRestoredPixels(baseline,difference(8))).toBe(8);
  expect(()=>requireCorrectedWindingRestoredPixels(baseline,difference(9)))
    .toThrow('original-source-object-not-visually-restored');
  // The old max(96,hidden*0.12) accepted this entire missing object.
  expect(countCorrectedWindingObjectPixels(baseline,difference(96))).toBe(96);
  expect(()=>requireCorrectedWindingRestoredPixels(baseline,difference(96)))
    .toThrow('original-source-object-not-visually-restored');
});
