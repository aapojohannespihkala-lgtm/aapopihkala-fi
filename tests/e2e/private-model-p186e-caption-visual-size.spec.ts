import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {p186eSourceCaptionFontPx,p186eExpectedCounts} from '../../src/scripts/privateModelP186EReviewPresentation';

const source=readFileSync(fileURLToPath(new URL(
  '../../src/scripts/privateModelP186EReviewPresentation.ts',import.meta.url)),'utf8');

test('caption change retains source identity, 34 anchor counts and nonphysical status',()=>{
  expect(p186eSourceCaptionFontPx).toBe(68);
  expect(p186eExpectedCounts.D1F.total).toBe(18);
  expect(p186eExpectedCounts.D2F.total).toBe(16);
  expect(source).toContain('context.font = `bold ${p186eSourceCaptionFontPx}px system-ui, sans-serif`');
  expect(source).toContain('sprite.scale.set(1.06, 0.16, 1)');
  expect(source).toContain('sprite.position.copy(center).add(new THREE.Vector3(0, 0.17, 0))');
  expect(source).toContain('presentationOnly: true, physicalPlacementClaim: false');
  expect(source).toContain('currentGeometryClaim: false');
  expect(source).toContain("HUMAN_REVIEW: 'NOT_RUN'");
});

test('real Chromium 68px canvas glyphs have larger ink height than historical 34px',async({page})=>{
  const result=await page.evaluate((newFont)=>{
    function ink(font:number){
      const canvas=document.createElement('canvas');
      canvas.width=640;canvas.height=96;
      const ctx=canvas.getContext('2d');
      if(!ctx)throw new Error('Canvas 2D unavailable');
      ctx.fillStyle='rgba(24,32,43,0.96)';
      ctx.fillRect(0,0,640,96);
      ctx.fillStyle='#ffe4a3';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold '+font+'px system-ui, sans-serif';
      ctx.fillText('R17',320,48,612);
      const rgba=ctx.getImageData(0,0,640,96).data;
      let top=96,bottom=-1,colored=0;
      for(let y=0;y<96;y++)for(let x=0;x<640;x++){
        const i=(y*640+x)*4;
        if(rgba[i]>200&&rgba[i+1]>150&&rgba[i+2]>80){
          top=Math.min(top,y);bottom=Math.max(bottom,y);colored++;
        }
      }
      return {top,bottom,height:bottom-top+1,colored};
    }
    return {old:ink(34),current:ink(newFont)};
  },p186eSourceCaptionFontPx);
  expect(result.old.colored).toBeGreaterThan(50);
  expect(result.current.colored).toBeGreaterThan(result.old.colored);
  expect(result.current.height).toBeGreaterThan(result.old.height*1.45);
  expect(result.current.top).toBeGreaterThanOrEqual(0);
  expect(result.current.bottom).toBeLessThan(96);
});

test('canvas 68px raster fits 96px source sprite texture without clipping for sample caption',async({page})=>{
  const proof=await page.evaluate((font)=>{
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=96;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('Canvas 2D unavailable');
    ctx.fillStyle='#18202b';ctx.fillRect(0,0,640,96);
    ctx.fillStyle='#ffe4a3';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold '+font+'px system-ui, sans-serif';
    ctx.fillText('D15 SOURCE R17',320,48,612);
    const rgba=ctx.getImageData(0,0,640,96).data;
    let first=96,last=-1,count=0;
    for(let y=0;y<96;y++)for(let x=0;x<640;x++){
      const k=(y*640+x)*4;
      if(rgba[k]>200&&rgba[k+1]>150&&rgba[k+2]>80){
        first=Math.min(first,y);last=Math.max(last,y);count++;
      }
    }
    return {first,last,count};
  },p186eSourceCaptionFontPx);
  expect(proof.count).toBeGreaterThan(100);
  expect(proof.first).toBeGreaterThan(0);
  expect(proof.last).toBeLessThan(95);
});
