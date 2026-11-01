import { expect, test } from '@playwright/test';

test('Pupu position under Windows display scale and browser zoom', async ({browser}) => {
  test.setTimeout(180_000);
  for(const dpr of [1,1.25,1.5,2]) {
    const context=await browser.newContext({viewport:{width:1638,height:775},deviceScaleFactor:dpr});
    const page=await context.newPage();
    for(const scale of [1,1.25]) {
      await page.goto('https://aapopihkala.fi/pupu/',{waitUntil:'networkidle',timeout:30000});
      await page.addStyleTag({content:'body{zoom:'+scale+'}'});
      await page.waitForTimeout(600);
      const png=(await page.screenshot()).toString('base64');
      const data=await page.evaluate(async encoded=>{
        const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
        const bmp=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
        const cn=document.createElement('canvas'); cn.width=bmp.width; cn.height=bmp.height;
        const ctx=cn.getContext('2d')!;ctx.drawImage(bmp,0,0);
        const pixels=ctx.getImageData(0,0,cn.width,cn.height).data;
        let count=0,sum=0,minX=cn.width,maxX=0;
        for(let y=100;y<cn.height-50;y+=3)for(let x=0;x<cn.width;x+=3){
          const i=(y*cn.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
          if((r>205&&g>55&&g<190&&b<155)||(b>135&&g>85&&g<240&&r<160)){
            count++;sum+=x;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
          }
        }
        const frame=document.querySelector('#pupu-canvas-frame')!.getBoundingClientRect();
        return {dpr:devicePixelRatio,zoom:getComputedStyle(document.body).zoom,innerWidth,shotWidth:cn.width,frame:[frame.x,frame.width],pixels:{count,meanX:sum/count,minX,maxX},meta:document.querySelector('meta[name="pupu-viewer-version"]')?.getAttribute('content')};
      },png);
      console.log('DPR_RESULT',JSON.stringify(data));
      expect(data.pixels.count).toBeGreaterThan(150);
    }
    await context.close();
  }
});
