import {test,expect} from '@playwright/test';
import * as THREE from 'three';
import {deflateSync} from 'node:zlib';
import {D1F_BATHROOM_ID,D1F_BATHROOM_ASSET,D1F_BATHROOM_TARGETS,selectD1FBathroomScene} from '../../src/scripts/privateModelD1FBathroomScene.mjs';
import {createD1FBathroomPixelRuntime,D1F_BATHROOM_SUPPRESSION} from '../../src/scripts/privateModelD1FBathroomPixelRuntime.mjs';
import {evaluateD1FBathroomTargetPixelGate,evaluateD1FFiveTargetPixelGate,evaluateD1FSevenTargetPixelGate} from '../../src/scripts/privateModelD1FFourTargetPixelGate.mjs';
import {decodeD1FScreenshotPng} from '../../.github/scripts/private-model-d1f-screenshot-png.mjs';
import {resolveArchitecturalSemanticDescriptor} from '../../src/scripts/privateModelSceneSemantics';
import {architecturalLayerMembership,isArchitecturalMembershipVisible} from '../../src/scripts/privateModelArchitecturalLayerRuntime';
import {createViewerLayerControlsState,setViewerLayerNodeVisible} from '../../src/scripts/privateModelLayerHierarchyState';
const sha=D1F_BATHROOM_ASSET.sha256;
const variant='WEST_ANCHOR_725_895_740';
function sample(targetId:string){
 const rgba=new Uint8Array(64*64*4).fill(60),other=rgba.slice();
 for(let y=20;y<32;y++)for(let x=20;x<32;x++)other[4*(y*64+x)]=200;
 const frame={width:64,height:64,cameraFingerprint:'source-camera-123456',glbSha256:sha,variant};
 return {targetId,baseline:{...frame,rgba},suppressed:{...frame,rgba:other},roi:{x:20,y:20,width:12,height:12},
  suppressionMethod:D1F_BATHROOM_SUPPRESSION[targetId],targetIdentityVerified:true,roiProvenance:'PROJECTED_EXACT_TARGET_GEOMETRY',suppressionRestored:true};
}
test('bathroom proof requires thirteen distinct targets from the new exact source',()=>{
 const all=D1F_BATHROOM_TARGETS.map(sample),options={candidateId:D1F_BATHROOM_ID};
 expect(evaluateD1FBathroomTargetPixelGate(all,options)).toMatchObject({checkedTargetCount:13,humanReview:'NOT_RUN',actualBrowserWebGlVerifiedByThisFunction:false});
 for(const n of [4,5,7,12])expect(()=>evaluateD1FBathroomTargetPixelGate(all.slice(0,n),options)).toThrow();
 expect(()=>evaluateD1FFiveTargetPixelGate(all.slice(0,5),options)).toThrow();
 expect(()=>evaluateD1FSevenTargetPixelGate(all.slice(0,7),options)).toThrow();
 expect(()=>evaluateD1FBathroomTargetPixelGate([...all.slice(0,12),all[0]],options)).toThrow();
});
test('bathroom proof rejects wrong source, camera, variant, method, restoration and unrelated changes',()=>{
 for(const change of [
  (s:any)=>s.baseline.glbSha256='0'.repeat(64),
  (s:any)=>s.suppressed.variant='EAST_ANCHOR_725_895_740',
  (s:any)=>s.suppressed.cameraFingerprint='other-camera-123456',
  (s:any)=>s.suppressionMethod='WHOLE_WALL_HIDDEN',
  (s:any)=>s.suppressionRestored=false,
  (s:any)=>s.suppressed.rgba=s.baseline.rgba.slice(),
  (s:any)=>{for(let i=0;i<20;i++)s.suppressed.rgba[i*4]=200;},
 ]){
  const all=D1F_BATHROOM_TARGETS.map(sample);change(all[12]);
  expect(()=>evaluateD1FBathroomTargetPixelGate(all,{candidateId:D1F_BATHROOM_ID})).toThrow();
 }
});
test('metadata alone cannot substitute for the exact loaded 92-scene source',()=>{
 expect(()=>selectD1FBathroomScene({parser:{json:{scene:88,scenes:Array(92),nodes:[]}},scenes:Array(92)},variant)).toThrow();
 expect(()=>selectD1FBathroomScene({},'WEST')).toThrow();
});
function fixture(){
 const wall=new THREE.Mesh(),positions:number[]=[],indices:number[]=[],targets:any={};
 const boxes:any={
  I03:[[5.288,3.807,.080],[6.248,4.012,2.760]],
  CORNER_NORTH_X2337:[[2.337,10.544,0],[2.377,10.584,2.760]],
  CORNER_SOUTH_X2337:[[2.337,7.24515,0],[2.377,7.28515,2.760]],
  CORNER_MIDDLE_X2589:[[2.589,3.184,0],[2.629,3.224,2.760]],
  LOBBY_DOOR_REVEALS:[[4.078,5.032,.080],[4.788,5.147,2.015]],
  B_WALL_CONTINUITY:[[3.788,.249,0],[3.888,2.042,2.760]],
 };
 const make=(lo:number[],hi:number[])=>new THREE.BoxGeometry(...hi.map((v,i)=>v-lo[i]) as [number,number,number]).translate(...hi.map((v,i)=>(v+lo[i])/2) as [number,number,number]);
 for(const [id,[lo,hi]]of Object.entries(boxes) as any){
  const g=make(lo,hi),p=g.attributes.position,start=positions.length/3,base=indices.length;
  positions.push(...p.array);indices.push(...Array.from(g.index!.array,i=>i+start));targets[id]=Array.from({length:g.index!.count/3},(_,i)=>base+i*3);
 }
 wall.geometry=new THREE.BufferGeometry();wall.geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));wall.geometry.setIndex(indices);
 const counter=new THREE.Mesh(make([3.888,2.737,.885],[4.383,3.762,.945]));
 const cabinet=new THREE.Mesh(make([3.888,2.752,.300],[4.368,3.747,.885]));
 const surfaces:any={};
 for(const [id,lo,hi]of [
  ['KPH_FLOOR',[3.888,1.902,.08],[6.248,5.032,.08]],
  ['SAUNA_FLOOR',[3.888,.289,.08],[6.248,1.902,.08]],
  ['ORDINARY_FLOOR',[.271,.289,0],[6.248,10.504,0]],
  ['KPH_CEILING',[3.888,2.042,2.43],[6.248,5.032,2.43]],
  ['SAUNA_CEILING',[3.888,.289,2.43],[6.248,1.902,2.43]],
 ] as any){
  const p=new Float32Array([lo[0],lo[1],lo[2],hi[0],lo[1],lo[2],hi[0],hi[1],hi[2],lo[0],hi[1],hi[2]]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setIndex([0,1,2,0,2,3]);
  surfaces[id]=new THREE.Mesh(g);surfaces[id].visible=!id.includes('CEILING');
 }
 const root=new THREE.Group();root.rotation.x=-Math.PI/2;root.add(wall,counter,cabinet,...Object.values(surfaces) as THREE.Object3D[]);
 const scene=new THREE.Scene();scene.add(root);scene.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera(38,1440/889,.01,5000);camera.position.set(9,7,15);
 const controls={target:new THREE.Vector3(),enabled:true,enableDamping:true,autoRotate:false,update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};
 const selected={scene,wall,counter,cabinet,surfaces,surfaceTargets:targets,bathroomReview:true,variant};
 const runtime=createD1FBathroomPixelRuntime({THREE,selected,sourceSha:sha,camera,controls,canvas:{getBoundingClientRect:()=>({width:1440,height:889})},render(){}});
 return {runtime,selected,wall,counter,cabinet,surfaces,camera};
}
test('continuous wall suppression removes only declared patch triangles and restores the same geometry',()=>{
 const f=fixture(),geometry=f.wall.geometry,original=Array.from(geometry.index!.array);
 for(const targetId of Object.keys(f.selected.surfaceTargets)){
  const prep=f.runtime.prepare(targetId,0),removed=new Set(f.selected.surfaceTargets[targetId]);
  f.runtime.suppress(targetId);
  const expected=original.filter((_,i)=>!removed.has(i-i%3));
  expect(Array.from(f.wall.geometry.index!.array)).toEqual(expected);
  expect(prep.sourceTargetIndices?.count).toBe(removed.size*3);
  expect(f.counter.visible&&f.cabinet.visible).toBe(true);
  f.runtime.pinFrame();expect(f.runtime.restore().suppressionRestored).toBe(true);
  expect(f.wall.geometry).toBe(geometry);expect(Array.from(geometry.index!.array)).toEqual(original);
 }
 f.runtime.dispose();
});
test('each new fixture and surface has isolated suppression, with temporary ceiling visibility restored on disposal',()=>{
 const f=fixture(),pose=f.camera.position.clone();
 for(const id of ['BASIN','CABINET','KPH_FLOOR','SAUNA_FLOOR','ORDINARY_FLOOR','KPH_CEILING','SAUNA_CEILING']){
  const o=id==='BASIN'?f.counter:id==='CABINET'?f.cabinet:f.surfaces[id];
  const prep=f.runtime.prepare(id,0);expect(prep.roi.width).toBeGreaterThanOrEqual(8);expect(o.visible).toBe(true);
  const before=new Map([f.wall,f.counter,f.cabinet,...Object.values(f.surfaces)].map((x:any)=>[x,x.visible]));
  f.runtime.suppress(id);expect(o.visible).toBe(false);
  for(const [x,visible]of before as Map<any,boolean>)if(x!==o)expect(x.visible).toBe(visible);
  f.runtime.restore();expect(o.visible).toBe(true);
 }
 f.runtime.dispose();expect(f.camera.position.toArray()).toEqual(pose.toArray());
 expect(f.surfaces.KPH_CEILING.visible).toBe(false);expect(f.surfaces.SAUNA_CEILING.visible).toBe(false);
 expect(f.runtime.inspectCorrections()).toMatchObject({counterThicknessMm:60,wetFloorRelativeMm:80,wallContinuationMeasured:false,saunaCeilingHeightMeasured:false});
});
test('finished floor, interior ceiling and fixture semantics map to independent native layers',()=>{
 let state=createViewerLayerControlsState();
 for(const [prefix,family,node]of [['FLOOR','FLOOR','floors'],['CEILING','CEILING','ceilings'],['FIXTURE','FIXTURE','fixtures']] as const){
  const descriptor=resolveArchitecturalSemanticDescriptor({userData:{G2Id:'G2_'+prefix+'_D1F',workAssumption:true,Canonical:false,storey:'1F'}});
  expect(descriptor).toMatchObject({buildingPartFamily:family,representationRole:'WORK_TEST_ASSUMPTION',physicalClaimStatus:'UNRESOLVED'});
  const membership=architecturalLayerMembership(descriptor);expect(membership.parentNodeId).toBe('architecture-'+node);
  expect(isArchitecturalMembershipVisible(state,membership)).toBe(node!=='ceilings');
 }
 state=setViewerLayerNodeVisible(state,'architecture-ceilings',true);
 expect(state.architectureCeilingsVisible).toBe(true);expect(state.architectureFloorsVisible).toBe(true);
 state=setViewerLayerNodeVisible(state,'architecture',false);
 expect(isArchitecturalMembershipVisible(state,{parentNodeId:'architecture-ceilings',wallChildNodeId:null})).toBe(false);
});
function png(color=6,filter=0){
 const channels=color===6?4:3,width=3,height=2,rows=Buffer.alloc((width*channels+1)*height),pixels=Buffer.from(Array.from({length:width*height*channels},(_,i)=>(i*31+57)&255));
 const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){rows[y*(width*channels+1)]=filter;for(let x=0;x<width*channels;x++){const o=y*width*channels+x,a=x>=channels?pixels[o-channels]:0,b=y?pixels[o-width*channels]:0,c=y&&x>=channels?pixels[o-width*channels-channels]:0;const p=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);rows[y*(width*channels+1)+1+x]=(pixels[o]-p)&255;}}
 const chunk=(type:string,data:Buffer)=>{
  const raw=Buffer.concat([Buffer.from(type),data]),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);raw.copy(out,4);
  let c=0xffffffff;for(const x of raw){c^=x;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;}out.writeUInt32BE((c^0xffffffff)>>>0,out.length-4);return out;
 };
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=color;
 const bytes=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
 return {bytes,pixels,channels};
}
test('bounded screenshot PNG decoder preserves RGB and RGBA bytes across all five PNG filters',()=>{
 for(const color of [2,6])for(let filter=0;filter<5;filter++){
  const f=png(color,filter),d=decodeD1FScreenshotPng(f.bytes);expect([d.width,d.height]).toEqual([3,2]);
  for(let i=0;i<6;i++){expect([...d.rgba.slice(i*4,i*4+3)]).toEqual([...f.pixels.slice(i*f.channels,i*f.channels+3)]);expect(d.rgba[i*4+3]).toBe(f.channels===4?f.pixels[i*4+3]:255);}
 }
});
test('screenshot PNG decoder rejects truncated data, changed CRC and unsupported color mode',()=>{
 const f=png();expect(()=>decodeD1FScreenshotPng(f.bytes.subarray(0,-1))).toThrow();
 const corrupt=Buffer.from(f.bytes);corrupt[45]^=1;expect(()=>decodeD1FScreenshotPng(corrupt)).toThrow();
 expect(()=>decodeD1FScreenshotPng(png(3).bytes)).toThrow();
 expect(()=>decodeD1FScreenshotPng(Buffer.alloc(45))).toThrow();
});
