import { test, expect } from '@playwright/test';
// @ts-ignore - production smoke helper is a Node ESM script with pure exports.
import {
  exactD1FShowerAutoloadUrl,
  expectedD1FShowerAutoloadDataset,
  countD1FShowerGenericScreenChanges,
} from '../../.github/scripts/private-model-d1f-shower-autoload-probe.mjs';
// @ts-ignore - original source contract is an ESM module.
import { D1F_SHOWER_PHOTO_VARIANTS, D1F_SHOWER_PHOTO_SOURCE } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

test('all four variants have one immutable candidate review URL and exact source-scene identity', () => {
  expect(D1F_SHOWER_PHOTO_VARIANTS).toHaveLength(4);
  const names=new Set();
  for(const variant of D1F_SHOWER_PHOTO_VARIANTS) {
    const url=exactD1FShowerAutoloadUrl(variant.name);
    const parsed=new URL(url);
    expect(parsed.origin).toBe('https://aapopihkala.fi');
    expect(parsed.pathname).toBe('/private-model/');
    expect(parsed.searchParams.get('review')).toBe('d1f-shower-glass-photo-20261016-review');
    expect(parsed.searchParams.get('wallVariant')).toBe(variant.name);
    expect(parsed.searchParams.keys().toArray()).toEqual(['review','wallVariant']);
    names.add(url);
    const d=expectedD1FShowerAutoloadDataset(variant.name);
    expect(d).toMatchObject({
      workTestReviewAutoload:'true',
      modelSource:'work-test',
      d1fShowerPhotoSceneIndex:String(variant.sceneIndex),
      d1fShowerPhotoGlassNode:String(variant.glassNode),
      d1fShowerPhotoRawBytes:String(D1F_SHOWER_PHOTO_SOURCE.bytes),
      d1fShowerPhotoRawSha256:D1F_SHOWER_PHOTO_SOURCE.sha256,
      d1fShowerPhotoVisibleSourceScene:'true',
      d1fShowerPhotoProductionPixelsVerified:'false',
      d1fShowerPhotoHumanReview:'NOT_RUN',
      d1fShowerPhotoCurrent:'false',
      d1fShowerPhotoAsBuilt:'false',
    });
  }
  expect(names.size).toBe(4);
});

test('rejects unsupported review variants and variant-name injection', () => {
  for(const value of ['', 'scene120', '../../model.glb', 'WEST_ANCHOR_725_895_740&review=CURRENT']) {
    expect(() => exactD1FShowerAutoloadUrl(value)).toThrow('D1F_SHOWER_AUTOLOAD_REJECTED');
    expect(() => expectedD1FShowerAutoloadDataset(value)).toThrow('D1F_SHOWER_AUTOLOAD_REJECTED');
  }
});

test('screen-change count is explicitly generic, dimensions and real RGBA must be equal', () => {
  const width=128,height=128;
  const orig=new Uint8Array(width*height*4).fill(100);
  const moved=orig.slice();
  for(let i=0;i<1000;i++)moved[i*4]=200;
  const a={width,height,rgba:orig};
  expect(countD1FShowerGenericScreenChanges(a,{width,height,rgba:moved})).toBe(1000);
  expect(countD1FShowerGenericScreenChanges(a,a)).toBe(0);
  expect(()=>countD1FShowerGenericScreenChanges(a,{width:height+1,height,rgba:moved}))
    .toThrow('D1F_SHOWER_AUTOLOAD_REJECTED');
  expect(()=>countD1FShowerGenericScreenChanges(a,{width,height,rgba:[]}))
    .toThrow('D1F_SHOWER_AUTOLOAD_REJECTED');
});
