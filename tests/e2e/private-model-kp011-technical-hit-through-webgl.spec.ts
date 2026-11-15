import { test, expect, chromium } from '@playwright/test';
import { build } from 'esbuild';

// Real Chromium/ANGLE WebGL, but deliberately synthetic 3D geometry.
// This is NOT an authentic C80 GLB, protected production WebGL, or HUMAN_REVIEW.
const browserSource = `
import * as THREE from 'three';
import { createTechnicalReviewPresentation } from './src/scripts/privateModelTechnicalReviewPresentation.mjs';
import { pickVisibleWorkTest3DPoint } from './src/scripts/privateModelWorkTest3DPoint.ts';
import { pickSelectableObjectAtClientPoint } from './src/scripts/privateModelSelectionPicking.ts';
import { isEffectivelyVisible, hasVisibleMaterial } from './src/scripts/privateModelObjectVisibility.ts';

window.kp011GpuFixture = () => {
  const width = 240, height = 160;
  const renderer = new THREE.WebGLRenderer({ antialias:false, alpha:false });
  renderer.setPixelRatio(1);
  renderer.setSize(width,height,false);
  renderer.setClearColor(0xffffff,1);
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.id = 'source-pick-canvas';
  renderer.domElement.dataset.interactionMode = 'select';
  document.body.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(45, width/height, .01, 20);
  camera.position.set(0,0,4);
  camera.lookAt(0,0,0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  root.name = 'SYNTHETIC_NOT_SOURCE_GLB';
  scene.add(root);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5,2.3),
    new THREE.MeshBasicMaterial({color:0xa0a0a0, side:THREE.DoubleSide})
  );
  wall.name = 'opaque-wall';
  const techGroup = new THREE.Group();
  techGroup.name = 'source-gated-simulation';
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(.36,.36,1.1,32,1),
    new THREE.MeshBasicMaterial({color:0x2277e5, side:THREE.DoubleSide})
  );
  pipe.name = 'technical-pipe';
  pipe.userData.m5System='VESI';
  pipe.rotation.x=Math.PI/2;
  pipe.position.z=-1.4;
  techGroup.add(pipe);
  root.add(wall,techGroup);
  root.updateMatrixWorld(true);
  const originalWall = wall.material;
  const originalPipe = pipe.material;
  const review = createTechnicalReviewPresentation(root,[techGroup],()=>{
    const grey = new THREE.MeshBasicMaterial({
      color:0x9aa1a9,transparent:true,opacity:.05,depthWrite:false,side:THREE.DoubleSide
    });
    const line = new THREE.LineBasicMaterial({
      color:0x9aa1a9,transparent:true,opacity:.14,depthWrite:false
    });
    const blue = new THREE.MeshBasicMaterial({
      color:0x2277e5,transparent:true,opacity:1,depthWrite:true,side:THREE.DoubleSide
    });
    return {surface:grey,line,systems:{VESI:blue}};
  },object=>object.userData?.m5System??null);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canvas=renderer.domElement;
  const target = new THREE.WebGLRenderTarget(width,height);
  let last=null;
  let measure=[];

  const render=()=>{renderer.setRenderTarget(null);renderer.render(scene,camera);};
  const pickPoint=(event)=>pickVisibleWorkTest3DPoint({
    clientX:event.clientX,clientY:event.clientY,rect:canvas.getBoundingClientRect(),
    camera,modelRoot:root,raycaster,
  });
  canvas.addEventListener('click',event=>{
    const mode=canvas.dataset.interactionMode;
    if(mode==='select'){
      const object=pickSelectableObjectAtClientPoint({
        canvas,camera,modelRoot:root,raycaster,pointer,clientX:event.clientX,
        clientY:event.clientY,isEffectivelyVisible,hasVisibleMaterial
      });
      last={mode,object:object?.name??null};
    }else{
      const point=pickPoint(event);
      if(mode==='measure'){
        measure.push(point);
        last={mode,object:point?.surfaceObjectName??null,count:measure.length,
          distanceM:measure.length===2&&measure.every(Boolean)
            ? Math.hypot(
                measure[1].xM-measure[0].xM,
                measure[1].yM-measure[0].yM,
                measure[1].sourceHeightYUpM-measure[0].sourceHeightYUpM
              ) : null};
      }else{
        last={mode,object:point?.surfaceObjectName??null,
          interpretation:point?.interpretation??null,current:point?.current??null};
      }
    }
  });
  const setMode=mode=>{canvas.dataset.interactionMode=mode;measure=[];last=null;};
  const setReview=on=>{
    review.apply(on);
    canvas.dataset.technicalReview=on?'on':'off';
    render();
    return {wallRestored:wall.material===originalWall,pipeRestored:pipe.material===originalPipe};
  };
  const setFloor=floor=>{
    if(!['1F','2F','BOTH'].includes(floor))throw Error('synthetic floor not allowed');
    pipe.visible=floor!=='2F';
    render();
  };
  const setClip=on=>{
    const clip=on?[new THREE.Plane(new THREE.Vector3(0,1,0),-.06)]:[];
    for(const material of [pipe.material])material.clippingPlanes=clip;
    render();
  };
  const pixel=()=>{
    renderer.setRenderTarget(target);
    renderer.render(scene,camera);
    const buf=new Uint8Array(width*height*4);
    renderer.readRenderTargetPixels(target,0,0,width,height,buf);
    renderer.setRenderTarget(null);
    const offset=((height/2)*width+width/2)*4;
    return [...buf.slice(offset,offset+3)];
  };
  render();
  return {
    setReview,setFloor,setClip,setMode,pixel,
    snapshot:()=>({last,glError:renderer.getContext().getError(),pixel:pixel()}),
    dispose:()=>{review.dispose();target.dispose();wall.geometry.dispose();pipe.geometry.dispose();
      originalWall.dispose();originalPipe.dispose();renderer.dispose();renderer.forceContextLoss();}
  };
};
`;

test('KP011 synthetic wall/pipe real WebGL clicks favor only source-palette systems', async () => {
  const bundle=await build({
    stdin:{contents:browserSource,resolveDir:process.cwd(),sourcefile:'kp011-pick-webgl.mjs'},
    bundle:true,platform:'browser',format:'iife',target:'es2022',write:false,logLevel:'silent'
  });
  const browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'
  ]});
  try {
    const page=await browser.newPage({viewport:{width:480,height:320},deviceScaleFactor:1});
    await page.goto('about:blank');
    await page.addScriptTag({content:bundle.outputFiles[0]!.text});
    await page.evaluate(()=>{document.body.style.margin='0';
      (window as any).harness=(window as any).kp011GpuFixture();});
    const canvas=page.locator('#source-pick-canvas');
    const click=async (x=120,y=80)=>{await page.mouse.click(x,y);
      return page.evaluate(()=>(window as any).harness.snapshot());};
    const state=(name:string,...args:any[])=>page.evaluate(({name,args})=>
      (window as any).harness[name](...args),{name,args});

    // Normal opaque room: a real wall occludes the concealed service.
    let actual=await click();
    expect(actual.last).toEqual({mode:'select',object:'opaque-wall'});
    expect(actual.glError).toBe(0);
    const normal=actual.pixel as number[];
    expect(Math.max(...normal)-Math.min(...normal)).toBeLessThan(20);

    await state('setMode','point');
    actual=await click();
    expect(actual.last.object).toBe('opaque-wall');
    expect(actual.last.interpretation).toBe('WORK_TEST_MODEL_POINT_ONLY');
    expect(actual.last.current).toBe(false);

    // A real Three.js renderer and actual picker share the review palette.
    await state('setReview',true);
    await state('setMode','select');
    actual=await click();
    expect(actual.last.object).toBe('technical-pipe');
    expect(actual.glError).toBe(0);
    expect(actual.pixel[2]).toBeGreaterThan(actual.pixel[0]+35);

    await state('setMode','point');
    actual=await click();
    expect(actual.last.object).toBe('technical-pipe');
    expect(actual.last.interpretation).toBe('WORK_TEST_MODEL_POINT_ONLY');

    await state('setMode','measure');
    await click(112,80);
    actual=await click(128,80);
    expect(actual.last.object).toBe('technical-pipe');
    expect(actual.last.count).toBe(2);
    expect(actual.last.distanceM).toBeGreaterThan(0.03);
    expect(actual.last.distanceM).toBeLessThan(1);

    // Clipped tech is NOT selectable through the visible wall.
    await state('setClip',true);
    await state('setMode','select');
    actual=await click();
    expect(actual.last.object).toBe('opaque-wall');
    await state('setMode','point');
    actual=await click();
    expect(actual.last.object).toBe('opaque-wall');
    await state('setClip',false);

    // Switching to another floor cannot select a hidden prior-floor pipe.
    await state('setFloor','2F');
    await state('setMode','select');
    actual=await click();
    expect(actual.last.object).toBe('opaque-wall');
    await state('setFloor','BOTH');
    actual=await click();
    expect(actual.last.object).toBe('technical-pipe');
    await state('setFloor','1F');
    actual=await click();
    expect(actual.last.object).toBe('technical-pipe');

    // Reversibility: normal scene materials and original selection return.
    const restored=await state('setReview',false) as {wallRestored:boolean,pipeRestored:boolean};
    expect(restored).toEqual({wallRestored:true,pipeRestored:true});
    actual=await click();
    expect(actual.last.object).toBe('opaque-wall');
    expect(actual.glError).toBe(0);
    expect(actual.pixel).toEqual(normal);
    await state('dispose');
  } finally {
    await browser.close();
  }
});
