import { test, expect } from '@playwright/test';

// Investigate why the user's actual Chrome screenshot shows the face cut by the
// right-hand canvas edge despite prior framebuffer checks passing.
test('diagnose Pupu actual visible page capture and canvas geometry', async ({page}) => {
  test.setTimeout(120_000);
  for (const [width,height] of [[1654,928],[2048,1149],[390,844]]) {
    await page.setViewportSize({width,height});
    for (const path of ['/pupu/','https://aapopihkala.fi/pupu/']) {
      try {
        await page.goto(path,{waitUntil:'networkidle',timeout:25000});
        await expect(page.locator('#pupu-canvas-frame canvas')).toBeVisible();
        await page.waitForTimeout(400);
        const screenshot=await page.screenshot();
        const data=screenshot.toString('base64');
        const result=await page.evaluate(async (b64:string)=>{
          const canvas=document.querySelector('#pupu-canvas-frame canvas') as HTMLCanvasElement;
          const frame=document.querySelector('#pupu-canvas-frame') as HTMLElement;
          const root=document.querySelector('#pupu-viewer') as HTMLElement;
          const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
          const bmp=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
          const c=document.createElement('canvas'); c.width=bmp.width;c.height=bmp.height;
          const ctx=c.getContext('2d')!;ctx.drawImage(bmp,0,0);
          const pixels=ctx.getImageData(0,0,c.width,c.height).data;
          let n=0,sumX=0,minX=c.width,maxX=0,minY=c.height,maxY=0;
          const fr=frame.getBoundingClientRect(),cr=canvas.getBoundingClientRect();
          for(let y=Math.max(0,Math.floor(fr.top));y<Math.min(c.height,Math.ceil(fr.bottom));y+=2)
            for(let x=Math.max(0,Math.floor(fr.left));x<Math.min(c.width,Math.ceil(fr.right));x+=2){
              const p=(y*c.width+x)*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];
              const red=r>205&&g>45&&g<190&&b<145;
              const blue=b>130&&g>85&&g<235&&r<150;
              if(red||blue){n++;sumX+=x;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
            }
          return {href:location.href,version:document.querySelector('meta[name="pupu-viewer-version"]')?.getAttribute('content'),
            inner:[innerWidth,innerHeight],frame:{left:fr.left,width:fr.width,top:fr.top,height:fr.height},
            root:{left:root.getBoundingClientRect().left,width:root.clientWidth},canvas:{left:cr.left,width:cr.width,height:cr.height,draw:[canvas.width,canvas.height]},
            screenshot:[c.width,c.height],colored:{n,meanX:n?sumX/n:null,minX,maxX,minY,maxY}};
        },data);
        console.log('PUPU_DIAGNOSTIC',JSON.stringify(result));
        expect(result.colored.n).toBeGreaterThan(200);
      } catch (error) {
        console.log('PUPU_DIAGNOSTIC_ERROR',path,width,height,String(error));
        if(path==='/pupu/') throw error;
      }
    }
  }
});
