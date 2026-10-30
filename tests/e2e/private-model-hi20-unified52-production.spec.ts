import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const candidateId = 'ylisrinne-d-c80-hi20-unified52-both-sc51-work-test-20261030';
const sha = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const size = 15338932;
const candidatePath = '/private-model/work-test/' + candidateId + '.glb';
const sourcePath = process.env.YLIS_UNIFIED52_PRODUCTION_GLB;
const run = process.env.YLIS_UNIFIED52_PRODUCTION_BROWSER === '1';

test('authenticated protected original HI20 52scene 1F/2F/BOTH WebGL2 pixels and three screenshots', async ({page}, info) => {
  test.skip(!run, 'Trusted main protected production proof only, not a local/PR browser claim');
  expect(sourcePath, 'Readback-verified protected GLB must be supplied by trusted main').toBeTruthy();
  const source = readFileSync(sourcePath!);
  const digest = (v: Buffer) => createHash('sha256').update(v).digest('hex');
  expect(source.length).toBe(size);
  expect(digest(source)).toBe(sha);
  const clientId = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_ID;
  const clientSecret = process.env.CF_ACCESS_VIEWER_PROBE_CLIENT_SECRET;
  expect(clientId && clientSecret, 'Actual Cloudflare Access read-only credentials required').toBeTruthy();
  test.setTimeout(540_000);
  await page.setViewportSize({width:1280,height:900});
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  let rawVerified = false, catalogCandidate = false;
  await page.route('https://aapopihkala.fi/private-model/**', async route => {
    const response = await route.fetch({
      maxRedirects:0,
      headers: {
        ...route.request().headers(),
        'cf-access-client-id':clientId!,
        'cf-access-client-secret':clientSecret!,
      },
    });
    expect(response.status(), 'Protected same-origin resource must not redirect/fail').toBeLessThan(300);
    const url = new URL(route.request().url());
    if (url.pathname === candidatePath) {
      const bytes = await response.body();
      expect(bytes.length).toBe(size);
      expect(digest(bytes)).toBe(sha);
      rawVerified = true;
    }
    if (url.pathname === '/private-model/work-test/catalog.json') {
      const catalog = await response.json();
      catalogCandidate = catalog?.candidates?.some((v: any) => v?.id === candidateId) === true;
    }
    await route.fulfill({response});
  });
  await page.goto('https://aapopihkala.fi/private-model/?review=' + candidateId + '-review', {waitUntil:'domcontentloaded'});
  const canvas = page.locator('#private-model-canvas');
  await expect(canvas).toHaveAttribute('data-work-test-review-autoload','true',{timeout:120_000});
  await expect(canvas).toHaveAttribute('data-model-source','work-test');
  await expect(canvas).toHaveAttribute('data-main-view-source-sha256',sha);
  expect(rawVerified,'Authenticated browser must fetch SHA-locked published full GLB').toBe(true);
  expect(catalogCandidate,'Protected catalog must offer this exact candidate').toBe(true);
  const menu = page.locator('#preset-menu');
  if (await menu.getAttribute('open') === null) await menu.locator(':scope > summary').click();
  await page.locator('#main-view-area').selectOption('D');
  const seenHashes = new Set<string>();
  for (const [floor,index] of [['1F',50],['2F',48],['BOTH',51]] as const) {
    // The real viewer intentionally closes its <details> menu when the area
    // or floor changes; reopen it before each user-visible selection.
    if (await menu.getAttribute('open') === null) {
      await menu.locator(':scope > summary').click();
    }
    const floorSelect = page.locator('#main-view-floor');
    await expect(floorSelect).toBeVisible({timeout:10000});
    await expect(floorSelect).toBeEnabled();
    await floorSelect.selectOption(floor,{timeout:10000});
    await expect(canvas).toHaveAttribute('data-main-view-floor',floor);
    await expect(canvas).toHaveAttribute('data-main-view-source-scene-index',String(index));
    await expect(canvas).toHaveAttribute('data-content-scene','C80R2_HI20_UNIFIED52_WORK_TEST');
    await expect(canvas).toHaveAttribute('data-content-floor',floor);
    await expect(canvas).toHaveAttribute('data-main-view-source-sha256',sha);
    await expect(canvas).toHaveAttribute('data-main-view-stair-status','HOST_HOLD');
    const render = await canvas.evaluate((el: HTMLCanvasElement) => new Promise<{
      webgl2:boolean,lost:boolean,error:number,colored:number,pixelDigest:string
    }>(resolve => requestAnimationFrame(() => {
      const gl = el.getContext('webgl2');
      if (!gl) return resolve({webgl2:false,lost:true,error:-1,colored:0,pixelDigest:''});
      const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
      const pixels = new Uint8Array(width*height*4);
      gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      const base = [pixels[0],pixels[1],pixels[2]];
      let colored=0;
      let h=2166136261;
      for (let i=0;i<pixels.length;i+=4){
        if(Math.abs(pixels[i]-base[0])+Math.abs(pixels[i+1]-base[1])+Math.abs(pixels[i+2]-base[2])>30)colored++;
        if(i%64===0){h=Math.imul((h^pixels[i])>>>0,16777619)>>>0;}
      }
      resolve({webgl2:gl instanceof WebGL2RenderingContext,lost:gl.isContextLost(),error:gl.getError(),colored,pixelDigest:h.toString(16)});
    })));
    expect(render.webgl2).toBe(true);
    expect(render.lost).toBe(false);
    expect(render.error).toBe(0);
    expect(render.colored,'Original scene '+index+' must have non-background WebGL pixels').toBeGreaterThan(500);
    seenHashes.add(render.pixelDigest);
    await page.screenshot({path:info.outputPath('hi20-unified52-'+floor+'-authenticated.png')});
    console.log(JSON.stringify({floor,sourceScene:index,sha,render,stage:'WORK_TEST',humanReview:'NOT_RUN'}));
  }
  expect(seenHashes.size,'1F, 2F, BOTH must not render the same frame').toBe(3);
  expect(errors).toEqual([]);
});
