import {expect,test} from '@playwright/test';
// @ts-ignore - Node ESM probe pure helpers need no network access.
import {
  exactD1FOdensvikReviewUrl,
  countD1FOdensvikGenericPixelChanges,
} from '../../.github/scripts/private-model-d1f-odensvik-autoload-probe.mjs';
import {readFileSync} from 'node:fs';

const variants=[
 {variant:'WEST_ANCHOR_725_895_740',sceneIndex:108},
 {variant:'WEST_ANCHOR_740_895_725',sceneIndex:109},
 {variant:'EAST_ANCHOR_725_895_740',sceneIndex:110},
 {variant:'EAST_ANCHOR_740_895_725',sceneIndex:111},
];

test('ODENSVIK trusted probe links exact four source scene variants, no guessed fifth variant',()=>{
  const review='d1f-odensvik-00193937-basin-correction-20261017-review';
  expect(variants.map(v=>v.sceneIndex)).toEqual([108,109,110,111]);
  for(const v of variants) {
    expect(exactD1FOdensvikReviewUrl(review,v.variant,variants))
      .toBe('https://aapopihkala.fi/private-model/?review='+review+'&wallVariant='+v.variant);
  }
  expect(()=>exactD1FOdensvikReviewUrl(review,'UNKNOWN_VARIANT',variants))
    .toThrow('D1F_ODENSVIK_PRODUCTION_AUTOLOAD_REJECTED');
  expect(()=>exactD1FOdensvikReviewUrl('some-current-model-review',variants[0].variant,variants))
    .toThrow('D1F_ODENSVIK_PRODUCTION_AUTOLOAD_REJECTED');
});

test('generic pixel changes require two authentic-sized RGBA frames but cannot prove individual basin objects',()=>{
  const w=128,h=128;
  const first=new Uint8Array(w*h*4),second=first.slice();
  for(let y=40;y<70;y++)for(let x=35;x<65;x++) {
    const off=(y*w+x)*4;second[off]=65;second[off+1]=33;second[off+2]=41;
  }
  expect(countD1FOdensvikGenericPixelChanges(
    {width:w,height:h,rgba:first},{width:w,height:h,rgba:second},
  )).toBe(900);
  expect(()=>countD1FOdensvikGenericPixelChanges(
    {width:w,height:h,rgba:first},{width:w,height:h+1,rgba:second},
  )).toThrow('D1F_ODENSVIK_PRODUCTION_AUTOLOAD_REJECTED');
});

test('ODENSVIK production probe is explicitly source-contract gated and never claims product pixels',()=>{
  const body=readFileSync(new URL('../../.github/scripts/private-model-d1f-odensvik-autoload-probe.mjs',
    import.meta.url),'utf8');
  expect(body).toContain("await import('../../src/scripts/privateModelD1FOdensvikSourceReview.mjs')");
  expect(body).toContain("GITHUB_REF==='refs/heads/main'");
  expect(body).toContain("GITHUB_EVENT_NAME==='workflow_dispatch'");
  expect(body).toContain("CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET");
  expect(body).toContain("sha(raw)===expectedSource.sha256");
  expect(body).toContain("d1fOdensvikSceneIndex:String(selected.sceneIndex)");
  expect(body).toContain("d1fOdensvikSourceAuthenticated:'true'");
  expect(body).toContain("bowlPixelsVerified:false");
  expect(body).toContain("counterPixelsVerified:false");
  expect(body).toContain("cabinetPixelsVerified:false");
  expect(body).toContain("userReview:'NOT_RUN'");
  expect(body).toContain("PASS_ONE_LINK_EXACT_RAW_AND_GENERAL_WEBGL_ONLY");
  expect(body).not.toContain("PASS_OBJECT_PIXELS");
});
