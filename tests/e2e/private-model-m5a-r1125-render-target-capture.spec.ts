import { test, expect } from '@playwright/test';
import { Group, Mesh, LineSegments, BoxGeometry, BufferGeometry,
  MeshBasicMaterial, LineBasicMaterial, Vector3, OrthographicCamera,
  WebGLRenderTarget } from 'three';
// @ts-ignore -- WORK_TEST-only standalone ESM implementation.
import { captureM5AR1125FocusOffscreenFrames as capture }
  from '../../src/scripts/privateModelM5AR1125RenderTargetCapture.mjs';
// @ts-ignore -- source palette/identity keys from existing regression contract.
import { m5aR1125SourcePixelKinds as kinds }
  from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys = Object.keys(kinds);
const nodes = [1104,1105,1106,1107,1118,1119,1120,1121,1122,1123,1124,1115,1116];
const meshes = [555,556,557,558,559,560,561,562,563,564,565,534,534];
const digest = 'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48';
const flags = { Canonical:false, presentationOnly:true,
  currentGeometryClaim:false, asBuiltClaim:false, publishToCURRENT:false };
const width = 192, height = 160;
const fixture = () => {
  const scene = new Group();
  scene.userData = { ...flags };
  const root = new Group();
  scene.add(root);
  const targets: Record<string, Mesh | LineSegments> = {};
  const associations = new Map<object, {nodes:number;meshes?:number;primitives?:number}>();
  associations.set(root, { nodes:1125 });
  keys.forEach((key, index) => {
    const boundary = key.startsWith('boundary:');
    const object = boundary
      ? new LineSegments(new BufferGeometry().setFromPoints([
          new Vector3(0,0,0),new Vector3(1,0,0),
        ]), new LineBasicMaterial({color:0xffaa22}))
      : new Mesh(new BoxGeometry(1,1,1),
          new MeshBasicMaterial({color:0x44bbcc}));
    object.userData = { ...flags,
      ...(boundary ? {representationKind:'unresolvedBoundaryMarker',
        boundaryRole:key.slice('boundary:'.length)} : {G2IdCandidate:key}) };
    root.add(object);
    targets[key] = object;
    associations.set(object, {
      nodes:nodes[index]!,meshes:meshes[index]!,primitives:0,
    });
  });
  const context = new Mesh(new BoxGeometry(2,2,2),
    new MeshBasicMaterial({color:0xeeeeee}));
  scene.add(context);
  const camera = new OrthographicCamera(-2,2,2,-2,0.1,100);
  camera.position.z = 10;
  camera.lookAt(0,0,0);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const binding = {sourceSceneIndex:63,sourceTargetCount:13,sourceRoot:root,targets,
    originalGlbDigestAuthenticated:true,originalSourceDigest:digest,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN'};
  const gltf = {scenes:Array.from({length:64},(_,i)=>i===63?scene:null),
    parser:{ associations }};
  let current: WebGLRenderTarget | null = null;
  let reads = 0;
  let clears = 0;
  let failAt = 0;
  const renderer = {
    isWebGLRenderer:true,
    getRenderTarget:()=>current,
    setRenderTarget:(rt:WebGLRenderTarget|null)=>{current=rt;},
    clear:(color:boolean,depth:boolean,stencil:boolean)=>{
      if(!current || !color || !depth || !stencil) throw Error('source target not fully cleared');
      clears++;
    },
    render:(activeScene: Group, activeCamera: OrthographicCamera)=>{
      if(activeScene!==scene || activeCamera!==camera) throw Error('wrong model render');
    },
    readRenderTargetPixels:(rt:WebGLRenderTarget,x:number,y:number,w:number,h:number,out:Uint8Array)=>{
      reads++;
      if (failAt === reads) throw Error('mock WebGL readPixels failure');
      if(rt!==current || x!==0 || y!==0 || w!==width || h!==height)
        throw Error('wrong render target');
      for(let i=0;i<out.length;i+=4)out.set([7,11,13,255],i);
      for (const [i,key] of keys.entries()) {
        if(!targets[key]!.visible)continue;
        const px=8+(i%7)*25, py=12+Math.floor(i/7)*36;
        for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++) {
          const off=((py+dy)*width+px+dx)*4;
          out.set([200,99,44,255],off);
        }
      }
    },
  };
  const firstMaterials=Object.values(targets).map(x=>x.material);
  return {scene,targets,context,camera,binding,gltf,renderer,associations,
    initialMaterials:firstMaterials,reads:()=>reads,clears:()=>clears,
    current:()=>current, setFailure:(at:number)=>{failAt=at;},
    params:{gltf,binding,renderer,camera,THREE:{WebGLRenderTarget},width,height}};
};

test('original 13 glTF identities produce 27 actual renderer callbacks with top-left orientation',async()=>{
  const f=fixture();
  const output=await capture(f.params);
  expect(f.reads()).toBe(27);
  expect(f.clears()).toBe(27);
  expect(output).toMatchObject({
    captureMode:'SOURCE_BOUND_OFFSCREEN_THREE_RENDER_TARGET',
    capturedFrameCount:27,sourceObjectCount:13,presentationState:'WORK_TEST_PRESENTATION_ONLY',
    readPixelsTopLeftReoriented:true,
    productionProvenanceVerified:false,actualViewerCanvasPixelsVerified:false,
    individualSourcePixelsVerified:false,originalGlbDigestAuthenticated:false,
    humanReview:'NOT_RUN',current:false,canonical:false,asBuilt:false,
  });
  expect(Object.keys(output.mutedFrames)).toEqual(keys);
  for(const key of keys){
    const muted=(output.mutedFrames as Record<string,Uint8Array>)[key]!;
    const restored=(output.restoredFrames as Record<string,Uint8Array>)[key]!;
    expect(muted).not.toEqual(output.baseline);
    expect(restored).toEqual(output.baseline);
  }
  // Fake readPixels puts row 12 nearest the bottom; the adapter flips it.
  const topOffset=((height-1-12)*width+8)*4;
  expect([...output.baseline.slice(topOffset,topOffset+4)]).toEqual([200,99,44,255]);
  expect(f.current()).toBeNull();
  expect(Object.values(f.targets).every(x=>x.visible)).toBe(true);
  expect(Object.values(f.targets).map(x=>x.material)).toEqual(f.initialMaterials);
});

test('offscreen GPU exception restores 13 source materials and original renderer target',async()=>{
  const f=fixture();
  f.setFailure(2);
  await expect(capture(f.params)).rejects.toThrow('mock WebGL readPixels failure');
  expect(f.reads()).toBe(2);
  expect(f.current()).toBeNull();
  expect(Object.values(f.targets).every(x=>x.visible)).toBe(true);
  expect(Object.values(f.targets).map(x=>x.material)).toEqual(f.initialMaterials);
});

test('forged glTF source node and missing genuine WebGL renderer reject before captures',async()=>{
  const a=fixture();
  a.associations.set(a.targets[keys[0]]!,{nodes:1105,meshes:555});
  await expect(capture(a.params)).rejects.toThrow('original glTF node/mesh association mismatch');
  expect(a.reads()).toBe(0);
  expect(Object.values(a.targets).map(x=>x.material)).toEqual(a.initialMaterials);
  const b=fixture();
  b.renderer.isWebGLRenderer=false;
  await expect(capture(b.params)).rejects.toThrow('real Three source scene');
  expect(b.reads()).toBe(0);
});

test('source viewport memory limit rejects before allocating render target',async()=>{
  const f=fixture();
  await expect(capture({...f.params,width:1920,height:1201}))
    .rejects.toThrow('bounded dimensions required');
  expect(f.reads()).toBe(0);
});

test('autoClear=false reuses the GPU buffer safely only because every source frame clears it',async()=>{
  const f=fixture();
  const stickyGpu = new Uint8Array(width*height*4);
  let explicitClears=0, readyToDraw=false, captures=0;
  (f.renderer as any).autoClear=false;
  f.renderer.clear=(color:boolean,depth:boolean,stencil:boolean)=>{
    expect([color,depth,stencil]).toEqual([true,true,true]);
    expect(f.current()).not.toBeNull();
    stickyGpu.fill(0);
    for(let i=3;i<stickyGpu.length;i+=4) stickyGpu[i]=255;
    explicitClears++;
    readyToDraw=true;
  };
  f.renderer.render=(activeScene:Group,activeCamera:OrthographicCamera)=>{
    expect(activeScene).toBe(f.scene);
    expect(activeCamera).toBe(f.camera);
    expect(readyToDraw).toBe(true);
    readyToDraw=false;
    for (const [i,key] of keys.entries()) {
      if(!f.targets[key]!.visible)continue;
      const px=8+(i%7)*25,py=12+Math.floor(i/7)*36;
      for(let dy=0;dy<8;dy++)for(let dx=0;dx<8;dx++)
        stickyGpu.set([200,99,44,255],((py+dy)*width+px+dx)*4);
    }
  };
  f.renderer.readRenderTargetPixels=(rt:WebGLRenderTarget,x:number,y:number,w:number,h:number,out:Uint8Array)=>{
    expect(rt).toBe(f.current());
    expect([x,y,w,h]).toEqual([0,0,width,height]);
    out.set(stickyGpu);
    captures++;
  };
  const output=await capture(f.params);
  expect(captures).toBe(27);
  expect(explicitClears).toBe(27);
  expect(output.sourceObjectCount).toBe(13);
  expect(f.current()).toBeNull();
  for(const [i,key] of keys.entries()){
    const x=8+(i%7)*25, bottomY=12+Math.floor(i/7)*36;
    const offset=((height-1-bottomY)*width+x)*4;
    expect([...output.baseline.slice(offset,offset+4)]).toEqual([200,99,44,255]);
    const muted=output.mutedFrames as Record<string,Uint8Array>;
    const restored=output.restoredFrames as Record<string,Uint8Array>;
    expect([...muted[key]!.slice(offset,offset+4)]).toEqual([0,0,0,255]);
    expect(restored[key]).toEqual(output.baseline);
  }
});

test('capture refuses a renderer without an explicit offscreen clear contract',async()=>{
  const f=fixture();
  (f.renderer as any).clear=undefined;
  await expect(capture(f.params)).rejects.toThrow('real Three source scene');
  expect(f.reads()).toBe(0);
  expect(f.current()).toBeNull();
});
