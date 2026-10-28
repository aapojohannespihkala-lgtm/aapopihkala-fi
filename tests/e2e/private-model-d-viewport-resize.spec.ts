import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { selectUnobstructedRect, solvePerspectiveSafeFit } from '../../src/scripts/privateModelMobileSafeRect.js';

// Separate from the existing D runtime integration suite reserved by Sol.
// Real R4E bytes are required for a WebGL PASS, never a synthetic replacement.
const R4E_SHA = '2f42444401224f7b5bd62663c4227d78e3af0618c58c1961e317598cf7886680';

test('actual R4E D/1F stays fitted when live viewport changes desktop -> portrait -> desktop', async ({ page }, info) => {
  const path = process.env.YLIS_R4E_GLB;
  if (process.env.YLIS_REQUIRE_REAL === '1') expect(path, 'R4E source required for real-model QA').toBeTruthy();
  test.skip(!path, 'R4E source absent: responsive actual-model WebGL NOT_RUN, never PASS.');
  test.setTimeout(120_000);
  const bytes = readFileSync(path!);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(R4E_SHA);

  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.route('**/private-model/work-test/catalog.json', route => route.fulfill({ json: { candidates: [] } }));
  await page.route('**/private-model/source-cards.json', route => route.fulfill({ json: { modules: {} } }));
  await page.route('**/private-model/model.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: bytes }));
  await page.goto('/private-model/');
  const canvas = page.locator('#private-model-canvas');
  await expect(page.getByRole('status')).toContainText('Malli ladattu', { timeout: 60_000 });
  await expect(canvas).toHaveAttribute('data-main-view-source-sha256', R4E_SHA);
  if (await page.locator('#preset-menu').getAttribute('open') === null) {
    await page.locator('#preset-menu > summary').click();
  }
  await page.locator('#main-view-area').selectOption('D');
  // The real area change closes toolbar menus. Reopen before the next user
  // action instead of timing out on a hidden select in trusted-main WebGL CI.
  await page.locator('#preset-menu > summary').click();
  await page.locator('#main-view-floor').selectOption('1F');
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  await expect(canvas).toHaveAttribute('data-main-view-t04-status', 'T04_CLIPPED_SOURCE');

  const pixels = async () => canvas.evaluate((element: HTMLCanvasElement) =>
    new Promise<{ colored: number; border: number; width: number }>(resolve => {
      requestAnimationFrame(() => {
        const gl = element.getContext('webgl2')!;
        const width = gl.drawingBufferWidth, height = gl.drawingBufferHeight;
        const rgba = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
        let colored = 0, border = 0;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const difference = Math.abs(rgba[offset] - rgba[0]) +
            Math.abs(rgba[offset + 1] - rgba[1]) + Math.abs(rgba[offset + 2] - rgba[2]);
          if (difference > 30) {
            colored++;
            if (x < 4 || x >= width - 4) border++;
          }
        }
        resolve({ colored, border, width });
      });
    }));
  const wideBefore = await pixels();
  expect(wideBefore.colored).toBeGreaterThan(100);

  await page.setViewportSize({ width: 390, height: 900 });
  await expect.poll(async () => canvas.evaluate((c: HTMLCanvasElement) => c.clientWidth)).toBeLessThan(500);
  await expect.poll(async () => (await pixels()).border, {
    message: 'The actual R4E floor must not be cropped by either portrait horizontal border',
    timeout: 20_000,
  }).toBe(0);
  const portrait = await pixels();
  expect(portrait.colored).toBeGreaterThan(100);
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(async () => canvas.evaluate((c: HTMLCanvasElement) => c.clientWidth)).toBeGreaterThan(700);
  const wideAfter = await pixels();
  expect(wideAfter.colored).toBeGreaterThan(100);
  // A pure resize must preserve the selected floor and its rendered geometry.
  // Allow minor GPU sampling differences without relaxing the portrait edge gate.
  expect(Math.abs(wideAfter.colored - wideBefore.colored))
    .toBeLessThan(Math.max(50, wideBefore.colored * 0.02));
  await expect(canvas).toHaveAttribute('data-main-view-floor', '1F');
  expect(errors).toEqual([]);
  await info.attach('d-live-viewport-fit-report', {
    body: JSON.stringify({ sourceSha256: R4E_SHA, floor: '1F', wideBefore, portrait, wideAfter,
      production: 'NOT_RUN', sourceLevel: 'WORK_TEST_SOURCE_ONLY_STAGING_HOLD' }),
    contentType: 'application/json',
  });
});

// Always-on camera regression. Execute the REAL production resize handler and
// its visible-bounds fit function, with tiny deterministic renderer/scene stubs.
// This guard must run in ordinary PR CI even when the private R4E GLB is absent.
// It is a Node camera-contract check, NOT a Three.js/WebGL or source-model PASS.
class TestFitVector {
  constructor(public x = 0, public y = 0, public z = 0) {}
  clone() { return new TestFitVector(this.x, this.y, this.z); }
  copy(v: TestFitVector) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  sub(v: TestFitVector) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v: TestFitVector, scale: number) {
    this.x += v.x * scale; this.y += v.y * scale; this.z += v.z * scale; return this;
  }
  length() { return Math.hypot(this.x, this.y, this.z); }
  lengthSq() { return this.x*this.x+this.y*this.y+this.z*this.z; }
  normalize() { const n=this.length(); this.x/=n; this.y/=n; this.z/=n; return this; }
}

function createActualResizeHandler(mode: 'D' | 'WHOLE' | 'PLAN', applyMobile = false) {
  const source = readFileSync('src/pages/private-model/index.astro', 'utf8');
  const start = source.indexOf('const updateSize = () => {');
  const end = source.indexOf('const fitModel = () => {', start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const parsed = ts.createSourceFile('viewer-resize.ts', source.slice(start, end), ts.ScriptTarget.Latest, true);
  const names = new Set(['updateSize', 'refreshFullModelFitMetrics',
    'mobileSafeBaseDistance', 'mobileSafeNormalBaseDistance', 'mobileHudElements', 'applyMobileSafeCamera']);
  const declarations = parsed.statements.filter(statement => ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.some(declaration => ts.isIdentifier(declaration.name) && names.has(declaration.name.text)));
  expect(declarations).toHaveLength(6);
  const printer = ts.createPrinter();
  const liveFunctions = ts.transpileModule(declarations.map(statement =>
    printer.printNode(ts.EmitHint.Unspecified, statement, parsed)).join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  expect(liveFunctions).toContain('const refreshFullModelFitMetrics =');
  expect(liveFunctions).not.toContain('sceneRoot: any');

  const radius = 5, angle = 38 * Math.PI / 360;
  const initialFit = Math.max(radius / Math.tan(angle) * 1.3, 2);
  const canvas = {
    width: 1280, height: 900, clientWidth: 1280, clientHeight: 900,
    dataset: {} as Record<string, string>,
    getBoundingClientRect() { return { left:0,top:0,width:this.clientWidth,height:this.clientHeight }; },
  };
  const target = new TestFitVector(2, 1, -3);
  const camera = {
    aspect: 1280 / 900, fov: 38, near: .01, far: 5000, projectionUpdates: 0,
    position: target.clone().addScaledVector(new TestFitVector(.72, .55, .72), initialFit * .88),
    updateProjectionMatrix() { this.projectionUpdates++; },
    view: null as null | number[],
    setViewOffset(...values: number[]) { this.view=values; },
    clearViewOffset() { this.view=null; },
  };
  const renderer = {
    getPixelRatio: () => 1,
    setSize(width: number, height: number) { canvas.width = width; canvas.height = height; },
  };
  const controls = { target, updates: 0, update() { this.updates++; } };
  const fullModelScene = {};
  const modelCenter = new TestFitVector();
  const THREE = {
    Sphere: class { radius = 0; },
    Vector3: TestFitVector,
    MathUtils: { degToRad: (degrees: number) => degrees * Math.PI / 180 },
  };
  const computeVisibleBounds = (root: unknown) => root !== fullModelScene ? null : ({
    min: {x:-2,y:-1,z:-3}, max: {x:2,y:1,z:3},
    getCenter(v: TestFitVector) { return v.copy(new TestFitVector(0, 0, 0)); },
    getBoundingSphere(s: { radius: number }) { s.radius = radius; return s; },
  });
  const mainViewScope = { active: mode !== 'WHOLE' };
  const activePlanFloor = mode === 'PLAN' ? '1F' : null;
  const isoCamera = {};
  let planRefits = 0;
  const mobileFitRequests: string[] = [];
  const viewport = { innerWidth:1280,innerHeight:900 };
  // Compile only the two current production declarations, never a copy of
  // their implementation. All other viewer dependencies are unreachable in
  // D/WHOLE/PLAN when no ISO/elevation mode is active.
  const factory = new Function(
    'canvas', 'renderer', 'camera', 'controls', 'mainViewScope', 'activeCamera',
    'activePlanFloor', 'fullModelScene', 'computeVisibleBounds', 'modelCenter',
    'THREE', 'fitPlanCamera', 'isoCamera', 'queueMobileSafeFit',
    'window', 'document', 'getComputedStyle', 'selectUnobstructedRect', 'solvePerspectiveSafeFit', 'modelRoot',
    'let fitDistance = 0;\n' + liveFunctions +
    '\nreturn { updateSize, applyMobileSafeCamera, getMobileBase: () => mobileSafeBaseDistance, getFit: () => fitDistance, setFit: value => { fitDistance = value; } };',
  );
  const live = factory(canvas, renderer, camera, controls, mainViewScope, camera,
    activePlanFloor, fullModelScene, computeVisibleBounds, modelCenter, THREE,
    () => { planRefits++; }, isoCamera, (mode: string) => {
      mobileFitRequests.push(mode); if (applyMobile) live.applyMobileSafeCamera(mode);
    }, viewport, {querySelector:()=>null}, ()=>({display:'none'}),
    selectUnobstructedRect, solvePerspectiveSafeFit, {children:[fullModelScene]});
  live.setFit(initialFit);
  return { canvas, camera, controls, radius, angle, initialFit,
    updateSize: live.updateSize as () => void, getFit: live.getFit as () => number,
    planRefits: () => planRefits, mobileFitRequests, viewport, getMobileBase:live.getMobileBase as () => number };
}

test('production D orbit live resize preserves fit-relative zoom, look direction and pan without private GLB', () => {
  const h = createActualResizeHandler('D');
  const startTarget = h.controls.target.clone();
  const offsetBefore = h.camera.position.clone().sub(h.controls.target);
  const originalZoom = offsetBefore.length() / h.initialFit;
  h.canvas.clientWidth = 390;
  h.updateSize();
  const portraitFit = Math.max(
    h.radius / Math.tan(Math.atan(Math.tan(h.angle) * 390 / 900)) * 1.3, 2,
  );
  expect(h.camera.aspect).toBeCloseTo(390 / 900, 12);
  expect(h.getFit()).toBeCloseTo(portraitFit, 12);
  expect(h.camera.position.clone().sub(h.controls.target).length() / h.getFit())
    .toBeCloseTo(originalZoom, 12);
  const portraitOffset = h.camera.position.clone().sub(h.controls.target);
  for (const axis of ['x', 'y', 'z'] as const) {
    expect(portraitOffset[axis] / portraitOffset.length())
      .toBeCloseTo(offsetBefore[axis] / offsetBefore.length(), 12);
    expect(h.controls.target[axis]).toBe(startTarget[axis]);
  }
  expect(h.camera.near).toBeCloseTo(Math.max(portraitFit / 10000, .001), 12);
  expect(h.camera.far).toBeCloseTo(Math.max(portraitFit * 50, 1000), 12);

  h.canvas.clientWidth = 1280;
  h.updateSize();
  expect(h.getFit()).toBeCloseTo(h.initialFit, 12);
  for (const axis of ['x', 'y', 'z'] as const) {
    expect(h.camera.position[axis])
      .toBeCloseTo(startTarget[axis] + offsetBefore[axis], 11);
  }
  expect(h.controls.updates).toBe(2);
  expect(h.mobileFitRequests).toEqual(['preserve', 'preserve']);
});

test('actual mobile fit controller preserves zoom, pan and direction across portrait/landscape/desktop', () => {
  const h=createActualResizeHandler('D',true), target=h.controls.target.clone();
  const offset=h.camera.position.clone().sub(target), defaultLength=Math.hypot(.72,.55,.72);
  let zoom=offset.length()/(h.initialFit*defaultLength);
  h.canvas.clientWidth=390; h.viewport.innerWidth=390;
  h.updateSize();
  expect(h.camera.position.clone().sub(target).length()/h.getMobileBase()).toBeCloseTo(zoom,11);
  expect(h.camera.view).not.toBeNull();
  const mobileOffset=h.camera.position.clone().sub(target);
  h.camera.position.copy(target).addScaledVector(mobileOffset,.74); zoom*=.74;
  h.canvas.clientWidth=760; h.canvas.clientHeight=390;
  h.viewport.innerWidth=760; h.viewport.innerHeight=390;
  h.updateSize();
  expect(h.camera.position.clone().sub(target).length()/h.getMobileBase()).toBeCloseTo(zoom,11);
  h.canvas.clientWidth=1280; h.canvas.clientHeight=900;
  h.viewport.innerWidth=1280; h.viewport.innerHeight=900;
  h.updateSize();
  const restored=h.camera.position.clone().sub(target);
  expect(restored.length()/(h.getFit()*defaultLength)).toBeCloseTo(zoom,11);
  expect(h.camera.view).toBeNull();
  expect(h.getMobileBase()).toBe(0);
  for(const axis of ['x','y','z'] as const) {
    expect(h.controls.target[axis]).toBe(target[axis]);
    expect(restored[axis]/restored.length()).toBeCloseTo(offset[axis]/offset.length(),11);
  }
});

test('production D resize leaves WHOLE orbit framing and active plan camera alone', () => {
  for (const mode of ['WHOLE', 'PLAN'] as const) {
    const h = createActualResizeHandler(mode);
    const before = h.camera.position.clone();
    h.canvas.clientWidth = 390;
    h.updateSize();
    expect(h.camera.aspect).toBeCloseTo(390 / 900, 12);
    expect(h.getFit()).toBeCloseTo(h.initialFit, 12);
    expect(h.camera.position.x).toBe(before.x);
    expect(h.camera.position.y).toBe(before.y);
    expect(h.camera.position.z).toBe(before.z);
    expect(h.controls.updates).toBe(0);
    expect(h.planRefits()).toBe(mode === 'PLAN' ? 1 : 0);
    expect(h.mobileFitRequests).toEqual(mode === 'WHOLE' ? [] : ['preserve']);
  }
});

