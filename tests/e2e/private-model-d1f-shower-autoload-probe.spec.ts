import { test, expect } from '@playwright/test';
import { deflateSync } from 'node:zlib';
// @ts-ignore - production smoke helper is a Node ESM script with pure exports.
import {
  exactD1FShowerAutoloadUrl,
  expectedD1FShowerAutoloadDataset,
  countD1FShowerGenericScreenChanges,
  decodeD1FShowerScreenshotPng,
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

const crcTable=Uint32Array.from({length:256},(_,i)=>{
  let v=i;for(let j=0;j<8;j++)v=v&1?0xedb88320^(v>>>1):v>>>1;
  return v>>>0;
});
function pngChunk(name:string,content:Buffer){
  const header=Buffer.alloc(8);
  header.writeUInt32BE(content.length,0);header.write(name,4,'ascii');
  const payload=Buffer.concat([header,content]);
  let crc=0xffffffff;
  for(const b of payload.subarray(4))crc=crcTable[(crc^b)&255]^(crc>>>8);
  const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([payload,tail]);
}
function representativePng(width=128,height=128){
  const header=Buffer.alloc(13);
  header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);
  header[8]=8;header[9]=6; // Chromium RGBA, 8-bit, no interlace
  const raw=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++){
    const base=y*(width*4+1);
    raw[base]=0; // PNG filter none, original top-to-bottom row order
    for(let x=0;x<width;x++){
      const offset=base+1+x*4;
      raw[offset]=y%256;
      raw[offset+1]=x%256;
      raw[offset+2]=77;
      raw[offset+3]=255;
    }
  }
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR',header),
    pngChunk('IDAT',deflateSync(raw)),
    pngChunk('IEND',Buffer.alloc(0)),
  ]);
}

test('same original PNG screenshot decodes locally with exact top-left RGBA and dimensions',()=>{
  const png=representativePng();
  const {width,height,rgba}=decodeD1FShowerScreenshotPng(png);
  expect([width,height]).toEqual([128,128]);
  expect(rgba).toHaveLength(128*128*4);
  expect([...rgba.slice(0,4)]).toEqual([0,0,77,255]);
  expect([...rgba.slice((127*128+127)*4,(127*128+127)*4+4)]).toEqual([127,127,77,255]);
  expect([...rgba.slice((47*128+93)*4,(47*128+93)*4+4)]).toEqual([47,93,77,255]);
  expect(countD1FShowerGenericScreenChanges({width,height,rgba},{width,height,rgba}))
    .toBe(0);
});

test('local screenshot decoder rejects corrupt CRC, undersized frames and arbitrary bytes',()=>{
  const correct=representativePng();
  const badCrc=Buffer.from(correct);
  badCrc[43]^=1;
  expect(()=>decodeD1FShowerScreenshotPng(badCrc))
    .toThrow('D1F_SCREENSHOT_PNG_REJECTED');
  expect(()=>decodeD1FShowerScreenshotPng(representativePng(100,128)))
    .toThrow('D1F_SHOWER_AUTOLOAD_REJECTED');
  expect(()=>decodeD1FShowerScreenshotPng(Buffer.alloc(128)))
    .toThrow('D1F_SCREENSHOT_PNG_REJECTED');
});
