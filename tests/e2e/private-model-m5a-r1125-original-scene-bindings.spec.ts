import { test, expect } from '@playwright/test';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Group, Object3D } from 'three';
import * as THREE from 'three';
// @ts-ignore - pure internal ESM source binder
import { bindR1125Scene63SourceObjects as bind,
  bindAuthenticatedR1125Scene63 as authenticate,
  projectR1125BoundSourceObjects as project,
  projectAuthenticatedR1125BoundSourceObjects as authenticateProjection } from
  '../../src/scripts/privateModelM5AR1125OriginalSceneBindings.mjs';
// @ts-ignore - source-key registry is the existing R1125 pixel proof, not a new map
import { m5aR1125SourcePixelKinds as sourceKinds } from
  '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys=Object.keys(sourceKinds);
const limits=['Canonical','physicalRouteClaim','exactXYClaim',
  'exactZClaim','physicalElevationClaim','currentGeometryClaim',
  'asBuiltClaim','publishToCURRENT'];
function makeSyntheticOriginalGltf() {
  const src={
    asset:{version:'2.0'},scene:63,
    buffers:[{byteLength:60}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:36},
                 {buffer:0,byteOffset:36,byteLength:24}],
    accessors:[
      {bufferView:0,componentType:5126,count:3,type:'VEC3',min:[0,0,0],max:[1,1,0]},
      {bufferView:1,componentType:5126,count:2,type:'VEC3',min:[0,0,0],max:[1,0,0]},
    ],
    meshes:[
      {primitives:[{attributes:{POSITION:0},mode:4}]},
      {primitives:[{attributes:{POSITION:1},mode:1}]},
    ],
    nodes:[{name:'M5A_R1125_DIAMETER_SOURCE_SPLIT_WORK_TEST_ROOT_BABYLON_Y_UP',
      children:Array.from({length:13},(_,i)=>i+1),
      rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2],
      extras:Object.fromEntries([...limits.map(k=>[k,false]),
        ['presentationOnly',true],['workAssumption',true],['humanReview','NOT_RUN']])}],
    scenes:Array.from({length:64},(_,i)=>({
      nodes:i===63?[0]:[],name:'SYNTHETIC_TEST_SCENE_'+i,
    })),
  } as any;
  for(let i=0;i<keys.length;i++){
    const key=keys[i],boundary=key.startsWith('boundary:');
    const data={
      G2IdCandidate:boundary?undefined:key,
      representationKind:boundary?'unresolvedBoundaryMarker':key.includes('_WELL_')
        ?'wellDiameterPresentationWork':'pipeDiameterPresentationWork',
      Pass:'M5A-Z2D-R1090',...(boundary?{boundaryRole:key.slice(9)}:{}),
      presentationOnly:true,workAssumption:true,
      ...Object.fromEntries(limits.map(k=>[k,false])),
    };
    const extras=Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined));
    src.nodes.push({name:'SOURCE_'+i,mesh:boundary?1:0,extras} as any);
  }
  const floats=new Float32Array([0,0,0,1,0,0,0,1,0,0,0,0,1,0,0]);
  const bin=Buffer.from(floats.buffer);
  const raw=Buffer.from(JSON.stringify(src));
  const padded=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,0x20)]);
  const glb=Buffer.alloc(12+8+padded.length+8+bin.length);
  glb.write('glTF',0,'ascii');glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);
  glb.writeUInt32LE(padded.length,12);glb.writeUInt32LE(0x4e4f534a,16);
  padded.copy(glb,20);
  const next=20+padded.length;
  glb.writeUInt32LE(bin.length,next);glb.writeUInt32LE(0x004e4942,next+4);
  bin.copy(glb,next+8);
  return {src,glb};
}
async function fixture(){
  const {src,glb}=makeSyntheticOriginalGltf();
  const gltf=await new GLTFLoader().parseAsync(
    glb.buffer.slice(glb.byteOffset,glb.byteOffset+glb.byteLength),'');
  return {sourceDoc:src,gltf};
}

test('real GLTFLoader scene63 binds 13 exact source-node and mesh associations with no source mutation',async()=>{
  const input=await fixture();
  const originalNodes=[...input.gltf.scenes[63].children];
  const result=bind(input);
  expect(result.sourceSceneIndex).toBe(63);
  expect(result.sourceTargetCount).toBe(13);
  expect(Object.keys(result.targets)).toEqual(keys);
  expect(new Set(Object.values(result.targets)).size).toBe(13);
  // The GLTFLoader scene is Group, but its no-mesh glTF source root is
  // a plain Object3D. Do not substitute a synthetic Group as proof.
  expect(input.gltf.scenes[63]).toBeInstanceOf(Group);
  expect(result.sourceRoot).toBeInstanceOf(Object3D);
  expect(result.sourceRoot.isMesh).not.toBe(true);
  expect(result.sourceRoot.isScene).not.toBe(true);
  expect(result.sourceRoot.children).toHaveLength(13);
  expect(input.gltf.scenes[63].children).toEqual(originalNodes);
  expect(result).toMatchObject({
    originalGlbDigestAuthenticated:false,productionPixelsVerified:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  });
});

test('reject association for the wrong source mesh or swapped nodes',async()=>{
  const a=await fixture(),keys=Object.keys(a.gltf.parser.associations);
  expect(keys.length).toBeGreaterThanOrEqual(0);
  const root=a.gltf.scenes[63].children[0],target=root.children[0];
  a.gltf.parser.associations.set(target,{nodes:1,meshes:98765});
  expect(()=>bind(a)).toThrow('R1125_ORIGINAL_SCENE_BINDINGS_REJECTED');
  const b=await fixture(),first=b.gltf.scenes[63].children[0].children[0];
  b.gltf.parser.associations.set(first,{nodes:2,meshes:0});
  expect(()=>bind(b)).toThrow('R1125_ORIGINAL_SCENE_BINDINGS_REJECTED');
});

test('missing, duplicate and promoted source objects are rejected',async()=>{
  const cases=[
    (f:any)=>f.gltf.scenes[63].children[0].children[1].visible=false,
    (f:any)=>f.gltf.scenes[63].children[0].children[2].userData.Canonical=true,
    (f:any)=>f.gltf.scenes[63].children[0].children[3].userData.Pass='CURRENT',
    (f:any)=>f.gltf.scenes[63].children[0].children[5].geometry.deleteAttribute('position'),
    (f:any)=>f.gltf.scenes[63].children[0].add(new Group()),
    (f:any)=>f.sourceDoc.nodes[1].extras.G2IdCandidate='G2_FORGED',
    (f:any)=>f.sourceDoc.nodes[0].rotation=[0,0,0,1],
    (f:any)=>f.gltf.scenes[63].children[0].quaternion.set(0,0,0,1),
  ];
  for(const mutate of cases){const f=await fixture();mutate(f);
    expect(()=>bind(f)).toThrow('R1125_ORIGINAL_SCENE_BINDINGS_REJECTED');
  }
});


test('original 13 GLTFLoader node identities require painting material, hierarchy and draw range', async () => {
  const invalid: Array<{ label: string; mutate: (f: any) => void }> = [
    { label: 'hidden source glTF scene', mutate: f => { f.gltf.scenes[63].visible = false; } },
    { label: 'hidden original root', mutate: f => { f.gltf.scenes[63].children[0].visible = false; } },
    { label: 'hidden original material', mutate: f => {
      f.gltf.scenes[63].children[0].children[0].material.visible = false;
    } },
    { label: 'colorWrite=false source', mutate: f => {
      f.gltf.scenes[63].children[0].children[0].material.colorWrite = false;
    } },
    { label: 'zero source opacity', mutate: f => {
      f.gltf.scenes[63].children[0].children[0].material.opacity = 0;
    } },
    { label: 'nonfinite source opacity', mutate: f => {
      f.gltf.scenes[63].children[0].children[0].material.opacity = NaN;
    } },
    { label: 'alphaTest consumes all source alpha', mutate: f => {
      const m = f.gltf.scenes[63].children[0].children[0].material;
      m.opacity = 0.8; m.alphaTest = 0.8;
    } },
    { label: 'empty draw range', mutate: f => {
      f.gltf.scenes[63].children[0].children[0].geometry.setDrawRange(0, 0);
    } },
    { label: 'draw range past all original primitives', mutate: f => {
      f.gltf.scenes[63].children[0].children[0].geometry.setDrawRange(1000, 3);
    } },
    { label: 'material array without real primitive groups', mutate: f => {
      const target = f.gltf.scenes[63].children[0].children[0];
      target.material = [target.material, target.material.clone()];
    } },
    { label: 'second material has drawable group but cannot paint', mutate: f => {
      const target = f.gltf.scenes[63].children[0].children[0];
      const second = target.material.clone(); second.colorWrite = false;
      target.material = [target.material, second];
      target.geometry.addGroup(0, 3, 0);
      target.geometry.addGroup(0, 3, 1);
    } },
  ];
  for (const { label, mutate } of invalid) {
    const input = await fixture();
    const target = input.gltf.scenes[63].children[0].children[0];
    const originalAssociation = input.gltf.parser.associations.get(target);
    mutate(input);
    expect(() => bind(input), label).toThrow(/original source node\/mesh cannot paint into the viewer/);
    expect(input.gltf.parser.associations.get(target), label).toEqual(originalAssociation);
  }
});

test('positive original GLTFLoader source paintability accepts ordinary and multi-material drawings without review promotion', async () => {
  for (const multi of [false, true]) {
    const input = await fixture();
    const target = input.gltf.scenes[63].children[0].children[0] as THREE.Mesh;
    expect(target.isMesh).toBe(true);
    if (multi) {
      target.material = [target.material, (target.material as THREE.Material).clone()];
      target.geometry.addGroup(0, 3, 0);
      target.geometry.addGroup(0, 3, 1);
    }
    const before = target.material;
    const bound = bind(input);
    expect(bound.sourceTargetCount).toBe(13);
    expect(bound.targets[keys[0]!]).toBe(target);
    expect(target.material).toBe(before);
    expect(bound).toMatchObject({
      originalGlbDigestAuthenticated: false, productionPixelsVerified: false,
      current: false, canonical: false, asBuilt: false, humanReview: 'NOT_RUN',
    });
  }
});

test('a synthetic scene, regardless of perfect associations, never authenticates original R1125 bytes',async()=>{
  const input=await fixture();
  expect(bind(input).originalGlbDigestAuthenticated).toBe(false);
  expect(()=>authenticate({originalRaw:Buffer.alloc(3_112_432),gltf:input.gltf}))
    .toThrow(/original raw SHA-256/);
  expect(()=>authenticate({originalRaw:Buffer.alloc(8),gltf:input.gltf}))
    .toThrow(/original raw bytes/);
});


async function cameraFixture() {
  const f = await fixture();
  const exactScene = {
    sourceDiameterCorrectionContract: 'G2_R1125',
    sourceDiameterClassBreakdown: '5_SALAOJA_AGGREGATE_NOMINAL_100MM__2_PVK_UNKNOWN',
    Canonical: false, presentationOnly: true, workAssumption: true,
    humanReview: 'NOT_RUN',
    currentGeometryClaim: false, asBuiltClaim: false, publishToCURRENT: false,
  };
  f.sourceDoc.scenes[63].extras = { ...exactScene };
  f.gltf.scenes[63].userData = { ...exactScene };
  const root = f.gltf.scenes[63].children[0];
  root.children.forEach((target: THREE.Object3D, i: number) => {
    // Present all 13 source nodes separately, including the two yellow
    // unresolved boundaries, within a genuine THREE camera frustum.
    target.position.set(-6 + 3 * (i % 5), 0, -4 + 4 * Math.floor(i / 5));
    if (i >= 11) {
      target.userData.boundaryStatus = 'UNRESOLVED_BOUNDARY';
      f.sourceDoc.nodes[i+1].extras.boundaryStatus = 'UNRESOLVED_BOUNDARY';
    }
  });
  const camera = new THREE.PerspectiveCamera(50, 1200/800, .1, 100);
  camera.position.set(0,0,30);
  camera.lookAt(0,0,0);
  camera.updateProjectionMatrix();
  return { ...f, camera, THREE, imageWidth:1200, imageHeight:800 };
}

test('real GLTFLoader 13 source-bound objects map to same-camera projected IDs without promotion',async()=>{
  const f=await cameraFixture();
  const originalNodes=f.gltf.scenes[63].children[0].children.slice();
  const result=project(f);
  expect(result.sourceTargetCount).toBe(13);
  expect(result.originalSourceObjectIdentityVerified).toBe(true);
  expect(result.projectedCenters.map((x:{key:string})=>x.key)).toEqual(keys);
  expect(result.projectedCenters.every((x:{u:number;v:number})=>
    x.u>0 && x.u<1 && x.v>0 && x.v<1)).toBe(true);
  expect(new Set(Object.values(result.sourceTargets))).toEqual(new Set(originalNodes));
  expect(result).toMatchObject({
    originalGlbDigestAuthenticated:false,productionScreenshotVerified:false,
    individualSourcePixelsVerified:false,humanReview:'NOT_RUN',
    current:false,canonical:false,asBuilt:false,
  });
  expect(f.gltf.scenes[63].children[0].children).toEqual(originalNodes);
});

test('source-camera integration rejects forged screenshot aspect, source objects and clipped markers',async()=>{
  const alters=[
    (f:any)=>{ f.camera.aspect=1; f.camera.updateProjectionMatrix(); },
    (f:any)=>{ f.gltf.scenes[63].userData.publishToCURRENT=true; },
    (f:any)=>{ f.sourceDoc.scenes[63].extras.humanReview='PASS'; },
    (f:any)=>{ f.gltf.scenes[63].children[0].children[0].position.x=100; },
    (f:any)=>{ f.gltf.scenes[63].children[0].children[1].position.copy(
      f.gltf.scenes[63].children[0].children[0].position); },
    (f:any)=>{
      const original=f.gltf.scenes[63].children[0].children[0];
      const foreign=original.clone();
      f.gltf.scenes[63].add(foreign);
    },
    (f:any)=>{ f.gltf.scenes[63].children[0].children[2].visible=false; },
  ];
  for(const alter of alters){
    const f=await cameraFixture();
    alter(f);
    expect(()=>project(f)).toThrow();
  }
});

test('projected synthetic scene never becomes original source authenticated or production proof',async()=>{
  const f=await cameraFixture();
  const projected=project(f);
  expect(projected.originalGlbDigestAuthenticated).toBe(false);
  expect(projected.productionScreenshotVerified).toBe(false);
  expect(()=>authenticateProjection({
    ...f,originalRaw:Buffer.alloc(3_112_432),
  })).toThrow();
});
