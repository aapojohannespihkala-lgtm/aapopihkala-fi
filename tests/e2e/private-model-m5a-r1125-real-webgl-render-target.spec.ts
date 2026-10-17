import { test, expect, chromium } from '@playwright/test';
import { build } from 'esbuild';

// Real, software-backed Chromium WebGL GPU path for the existing offscreen
// capture adapter. All THREE objects here are SYNTHETIC WORK_TEST fixtures.
// A passing test does NOT authenticate original GLB bytes, production
// transport, the viewer canvas, surveyed geometry or HUMAN_REVIEW.
test('Chromium WebGLRenderTarget yields 27 reversible same-camera source frames', async () => {
  const bundle = await build({
    stdin: {
      resolveDir: process.cwd(),
      sourcefile: 'm5a-r1125-real-webgl-fixture.mjs',
      contents: `
import * as THREE from 'three';
import { captureM5AR1125FocusOffscreenFrames as capture }
  from './src/scripts/privateModelM5AR1125RenderTargetCapture.mjs';
import { m5aR1125SourcePixelKinds as sourceKinds }
  from './src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

window.runR1125SyntheticWebGL = async () => {
  const width = 500, height = 400;
  const renderer = new THREE.WebGLRenderer({
    antialias: false, alpha: false, preserveDrawingBuffer: false,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 1);
  const gl = renderer.getContext();
  if (!gl || typeof gl.readPixels !== 'function') {
    throw new Error('actual Chromium WebGL context unavailable');
  }
  const scene = new THREE.Group();
  scene.userData = {
    Canonical: false, presentationOnly: true,
    currentGeometryClaim: false, asBuiltClaim: false,
    publishToCURRENT: false,
  };
  const root = new THREE.Group();
  scene.add(root);
  const associations = new Map([[root, {nodes:1125}]]);
  const keys = Object.keys(sourceKinds);
  const nodes = [1104,1105,1106,1107,1118,1119,1120,1121,1122,1123,1124,1115,1116];
  const meshes = [555,556,557,558,559,560,561,562,563,564,565,534,534];
  const targets = {};
  const originalMaterialRefs = [];
  for (const [i,key] of keys.entries()) {
    const well = key.startsWith('G2_DRAIN_WELL_');
    const boundary = key.startsWith('boundary:');
    const material = boundary
      ? new THREE.LineBasicMaterial({color:0xffaa22})
      : new THREE.MeshBasicMaterial({color:well?0x999da1:0x168fbd});
    const object = boundary
      ? new THREE.LineSegments(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.34, 0, 0),
            new THREE.Vector3(0.34, 0, 0),
          ]), material)
      : new THREE.Mesh(new THREE.BoxGeometry(0.48,0.48,0.1),material);
    object.position.set((i%5-2)*1.7,(1-Math.floor(i/5))*1.6,0);
    object.userData = {
      presentationOnly:true,Canonical:false,currentGeometryClaim:false,
      asBuiltClaim:false,publishToCURRENT:false,
      ...(boundary ? {representationKind:'unresolvedBoundaryMarker',
        boundaryRole:key.substring(9)} : {G2IdCandidate:key}),
    };
    targets[key] = object;
    root.add(object);
    originalMaterialRefs.push(material);
    associations.set(object,{nodes:nodes[i],meshes:meshes[i],primitives:0});
  }
  const context = new THREE.Mesh(
    new THREE.PlaneGeometry(30,30),
    new THREE.MeshBasicMaterial({color:0x777777}),
  );
  context.position.z=-2;
  scene.add(context);
  const camera = new THREE.OrthographicCamera(-5,5,4,-4,0.1,50);
  camera.position.set(0,0,10);
  camera.lookAt(0,0,0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const gltf = {scenes:Array.from({length:64},(_,i)=>i===63?scene:null),
    parser:{associations}};
  const binding = {
    sourceRoot:root,targets,sourceSceneIndex:63,sourceTargetCount:13,
    originalGlbDigestAuthenticated:true,
    originalSourceDigest:'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  };
  let out;
  try {
    out = await capture({gltf,binding,renderer,camera,THREE,width,height});
    let changes = 0;
    let fullyRestored = 0;
    for (const key of keys) {
      const hidden = out.mutedFrames[key];
      const restored = out.restoredFrames[key];
      let different = false, identical = true;
      for (let px=0;px<out.baseline.length;px++) {
        if (hidden[px] !== out.baseline[px]) different = true;
        if (restored[px] !== out.baseline[px]) identical = false;
      }
      if(different) changes++;
      if(identical) fullyRestored++;
    }
    return {
      contextCreated:!!gl, realRenderer:renderer.isWebGLRenderer === true,
      frameCount:out.capturedFrameCount, sourceCount:out.sourceObjectCount,
      changes, fullyRestored, currentTargetRestored:renderer.getRenderTarget()===null,
      materialsRestored:keys.every((key,i)=>targets[key].material===originalMaterialRefs[i]),
      originalVisibilityRestored:keys.every(key=>targets[key].visible),
      productionProvenanceVerified:out.productionProvenanceVerified,
      individualSourcePixelsVerified:out.individualSourcePixelsVerified,
      humanReview:out.humanReview,
    };
  } finally {
    renderer.dispose();
    context.geometry.dispose();
    context.material.dispose();
    for (const object of Object.values(targets)) {
      object.geometry.dispose();
      object.material.dispose();
    }
  }
};
`,
    },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    write: false,
    logLevel: 'silent',
  });
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl', '--use-gl=angle',
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    ],
  });
  try {
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.addScriptTag({content:bundle.outputFiles[0]!.text});
    const result = await page.evaluate(async () =>
      (window as any).runR1125SyntheticWebGL());
    expect(result).toMatchObject({
      contextCreated:true,realRenderer:true,
      frameCount:27,sourceCount:13,changes:13,fullyRestored:13,
      currentTargetRestored:true,materialsRestored:true,
      originalVisibilityRestored:true,
      productionProvenanceVerified:false,
      individualSourcePixelsVerified:false,
      humanReview:'NOT_RUN',
    });
  } finally {
    await browser.close();
  }
});
