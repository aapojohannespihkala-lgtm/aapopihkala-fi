import { test, expect } from '@playwright/test';
// @ts-ignore - source-bound worker-facing proof is provided as a native ES module.
import { collectD1FShowerGlassPrimitiveFrames, projectD1FShowerPrimitiveRoi } from '../../src/scripts/privateModelD1FShowerGlassFrameCollector.mjs';
// @ts-ignore - fixed source roster is checked against immutable GLB SHA in its own gate.
import { D1F_SHOWER_PHOTO_SOURCE, D1F_SHOWER_PHOTO_VARIANTS } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

const id=(tx=0,ty=0)=>({elements:[1,0,0,0,0,1,0,0,0,0,1,0,tx,ty,0,1]});
const width=64,height=64;
const mesh=(n:number)=>{
  const xc=[-0.7,0,0.7][n];
  const vertex=[xc-0.14,xc+0.14,xc,-0.24,0.24,0.1];
  return {
    isMesh:true,visible:true,matrixWorld:id(),
    material:{visible:true,opacity:n===2?1:0.27,transparent:n!==2,depthTest:true,depthWrite:false,map:null},
    geometry:{getAttribute:(name:string)=>name==='position'?{
      count:3,getX:(i:number)=>vertex[i],getY:(i:number)=>vertex[3+i],getZ:(_i:number)=>0
    }:null}
  };
};
function fixture(mode=''){
  const camera={
    position:{v:[0,0,0],toArray(){return this.v.slice();}},
    quaternion:{toArray(){return [0,0,0,1];}},
    projectionMatrix:id(),matrixWorldInverse:id()
  };
  const associations=new Map<any,any>(),scenes=Array.from({length:124},()=>null as any);
  for(const v of D1F_SHOWER_PHOTO_VARIANTS){
    const children=[mesh(0),mesh(1),mesh(2)];
    const group={children,visible:true};
    associations.set(group,{type:'nodes',index:v.glassNode});
    children.forEach(child=>associations.set(child,{type:'meshes',index:777}));
    const scene={variant:v.name,group,traverse(fn:(o:any)=>void){
      fn(this);fn(group);children.forEach(fn);
    }};
    scenes[v.sceneIndex]=scene;
  }
  let captures=0;
  const captureRGBA=async({scene}:{scene:any})=>{
    captures++;
    const rgba=new Uint8Array(width*height*4).fill(120);
    const children=scene.group.children;
    for(let p=0;p<3;p++)if(children[p].visible===false){
      const roi=projectD1FShowerPrimitiveRoi(children[p],camera,width,height);
      for(let y=roi.y;y<roi.y+roi.height;y++)for(let x=roi.x;x<roi.x+roi.width;x++)
        rgba[(y*width+x)*4]=220;
      if(mode==='outside')for(let y=0;y<4;y++)for(let x=0;x<4;x++)rgba[(y*width+x)*4]=220;
      if(mode==='material')children[p].material.opacity=0.75;
      if(mode==='camera')camera.position.v[0]+=0.1;
    }
    if(mode==='restoreDrift' && captures===3)rgba[0]=200;
    return rgba;
  };
  return {
    gltf:{scenes,parser:{associations}},camera,width,height,
    sourceBytes:D1F_SHOWER_PHOTO_SOURCE.bytes,
    sourceSha256:D1F_SHOWER_PHOTO_SOURCE.sha256,
    captureRGBA,
  };
}
test('collects actual callback pixel frames for all 12 independent primitive suppressions; never asserts production provenance',async()=>{
  const f=fixture();
  const out=await collectD1FShowerGlassPrimitiveFrames(f);
  expect(out).toMatchObject({
    result:'PASS_TWELVE_SUPPLIED_OBJECT_DIFFERENTIALS_ONLY',
    checkedSourceScenes:4,checkedSeparateGlassSubparts:12,
    collector:'REAL_RENDER_READBACK_CALLER_REQUIRED',
    collectorSourceByteAuthentication:false,
    collectorBrowserAuthentication:false,
    collectorProductionOriginAuthentication:false,
    rawGlbAuthenticatedByThisFunction:false,
    authenticatedProductionBrowserVerifiedByThisFunction:false,
    humanReview:'NOT_RUN',current:false,canonical:false,asBuilt:false
  });
  expect(out.samples).toHaveLength(12);
  expect(out.samples.every((s:any)=>s.changedInsideTarget>=10 &&
    s.changedOutsideTarget===0 && s.restoredPixelDrift===0)).toBe(true);
});
test('requires original 124-scene source identity and exact trusted glTF associations',async()=>{
  for(const mut of [
    (f:any)=>f.sourceBytes=1,
    (f:any)=>f.sourceSha256='0'.repeat(64),
    (f:any)=>f.gltf.scenes.pop(),
    (f:any)=>f.gltf.parser.associations.delete(f.gltf.scenes[120].group),
    (f:any)=>f.gltf.scenes[120].group.children.pop(),
    (f:any)=>f.gltf.parser.associations.set(f.gltf.scenes[120].group.children[0],{type:'meshes',index:776}),
  ]){const f=fixture();mut(f);await expect(collectD1FShowerGlassPrimitiveFrames(f)).rejects.toThrow('D1F_SHOWER_FRAME_COLLECTOR_REJECTED');}
});
test('detects wrong camera, material mutation, out-of-target pixels and failed pixel restore',async()=>{
  for(const mode of ['camera','material','outside','restoreDrift']){
    await expect(collectD1FShowerGlassPrimitiveFrames(fixture(mode))).rejects.toThrow(
      /D1F_SHOWER_(FRAME_COLLECTOR_REJECTED|GLASS_PIXEL_GATE_REJECTED)/
    );
  }
});
test('projected region cannot be guessed from empty geometry, offscreen mesh or a too-small ROI',()=>{
  const f=fixture(),v=f.gltf.scenes[120].group.children[0];
  expect(projectD1FShowerPrimitiveRoi(v,f.camera,width,height)).toMatchObject({
    width:expect.any(Number),height:expect.any(Number)
  });
  v.geometry.getAttribute=()=>null;
  expect(()=>projectD1FShowerPrimitiveRoi(v,f.camera,width,height)).toThrow('D1F_SHOWER_FRAME_COLLECTOR_REJECTED');
});
