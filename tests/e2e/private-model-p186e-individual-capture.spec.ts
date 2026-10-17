import {test,expect} from '@playwright/test';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {decodeD1FScreenshotPng} from '../../.github/scripts/private-model-d1f-screenshot-png.mjs';
import {deriveP186EOriginalRoster,captureP186EIndividualFloor as capture} from '../../.github/scripts/private-model-p186e-individual-capture.mjs';
import {verifyP186E34SourcePixelEvidence as verify,p186ePixelCandidateId as candidate,
  p186ePixelExpected as counts,p186ePixelRepresentationKinds as kinds,
  p186ePixelSourcePdfDriveId as graphic,p186ePixelSchedulePdfDriveId as schedule} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';

function rawFixture(){
  const nodes:any[]=[];
  for(const floor of ['D1F','D2F'] as const)for(let i=0;i<counts[floor].total;i++){
    const kind=i<counts[floor].group?'group':'special';
    nodes.push({mesh:0,extras:{Pass:'P186E-X1',hostStorey:floor==='D1F'?'D_1F':'D_2F',
      representationKind:kinds[kind],annotationStableKey:floor+'_GROUP_'+String(i).padStart(2,'0'),
      sourceLabelId:floor+'_SPECIAL_'+String(i).padStart(2,'0'),sourcePdfDriveId:graphic,
      schedulePdfDriveId:schedule,presentationOnly:true,sourceDerived:true,sourceLabelAnchor:true,
      Canonical:false,canonical:false,current:false,currentGeometryClaim:false,asBuilt:false,
      publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN',deviceGeometryClaim:false,socketGeometryClaim:false,
      switchOrFixtureClaim:false,physicalCableRouteClaim:false,connectionTopologyClaim:false,
      exactCurrentXYClaim:false,exactZClaim:false}});
  }
  return {scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes:[{primitives:[{mode:1}]}]};
}
function glb(gltf:any){
  const raw=Buffer.from(JSON.stringify(gltf)),length=Math.ceil(raw.length/4)*4;
  const b=Buffer.alloc(20+length,32);b.writeUInt32LE(0x46546c67,0);b.writeUInt32LE(2,4);
  b.writeUInt32LE(b.length,8);b.writeUInt32LE(length,12);b.writeUInt32LE(0x4e4f534a,16);raw.copy(b,20);return b;
}
test('expected 18+16 roster comes only from reachable original GLB source nodes',()=>{
  const fixture=rawFixture(),roster=deriveP186EOriginalRoster(glb(fixture));
  expect(roster.D1F).toHaveLength(18);expect(roster.D2F).toHaveLength(16);
  fixture.nodes.push({...fixture.nodes[0],extras:{...fixture.nodes[0].extras,annotationStableKey:'UNREACHABLE_EXTRA'}});
  expect(deriveP186EOriginalRoster(glb(fixture))).toEqual(roster);
});
for(const mutation of ['duplicate','missing','promotion','wrong-pdf','cycle','header'])test('raw source roster rejects '+mutation,()=>{
  const g=rawFixture();
  if(mutation==='duplicate')g.nodes[1].extras.annotationStableKey=g.nodes[0].extras.annotationStableKey;
  if(mutation==='missing')g.scenes[0].nodes.pop();
  if(mutation==='promotion')g.nodes[0].extras.currentGeometryClaim=true;
  if(mutation==='wrong-pdf')g.nodes[0].extras.sourcePdfDriveId='other-source';
  if(mutation==='cycle')g.nodes[0].children=[0];
  const bytes=glb(g);if(mutation==='header')bytes.writeUInt32LE(1,4);
  expect(()=>deriveP186EOriginalRoster(bytes)).toThrow(/P186E_PROD_INDIVIDUAL_/);
});


// Synthetic PNG fixture writer. The browser case below separately checks a
// genuine Chromium screenshot at the actual production canvas dimensions.
function fixturePng(pixels:Buffer,width:number,height:number){
  const table=Uint32Array.from({length:256},(_,i)=>{let n=i;for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc=(b:Buffer)=>{let c=0xffffffff;for(const x of b)c=table[(c^x)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const chunk=(name:string,body:Buffer)=>{
    const out=Buffer.alloc(body.length+12);out.writeUInt32BE(body.length,0);out.write(name,4,'ascii');body.copy(out,8);
    out.writeUInt32BE(crc(out.subarray(4,out.length-4)),out.length-4);return out;
  };
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const scan=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++)pixels.copy(scan,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),
    chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}

// Deliberately synthetic browser adapter. Never production/authentication proof.
function browserFixture(floor:'D1F'|'D2F',scenario='normal'){
  const originalRoster=deriveP186EOriginalRoster(glb(rawFixture()))[floor];
  const targets=originalRoster.map((t:any,i:number)=>({...t,roi:{x:8+i%6*23,y:8+Math.floor(i/6)*23,width:10,height:10}}));
  if(scenario==='substitution')targets[0].sourceKey='FORGED_SOURCE_KEY';
  let hidden:string|null=null,finished=false,shots=0,bulkRgbaRequests=0;
  const manifest=()=>({state:'PREPARED',requestId:0,floor,width:160,height:112,targets,
    sourceCandidateId:candidate,cameraKey:floor+'_camera',sceneKey:floor+'_scene',
    cameraFingerprint:scenario==='drift'&&shots>=2?'changed-synthetic-camera':'fixed-synthetic-camera',
    hiddenSourceKey:hidden,captionsTemporarilyHidden:true,captionPixelsVerified:false,
    pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN',
    temporaryCuePointSizePx:scenario==='cue-invalid-initial'?15:
      scenario==='cue-drift-hide'&&hidden!==null?11:
      scenario==='cue-drift-frame'&&shots>=1?11:13});
  const page={evaluate:async(_fn:Function,arg:any)=>{
    if(arg?.action){
      if(arg.action==='hide')hidden=arg.sourceKey;
      if(arg.action==='restore')hidden=null;
      if(arg.action==='finish'){
        hidden=null;finished=true;return {state:'FINISHED',requestId:arg.requestId,
          sourceVisibilityRestored:true,captionVisibilityRestored:true,cameraRestored:true,
          cueSizeRestored:scenario!=='cue-not-restored'};
      }
      return {...manifest(),requestId:arg.requestId};
    }
    if(typeof arg==='string'){bulkRgbaRequests++;throw Error('Bulk browser RGBA extraction is forbidden');}
  }};
  const canvas={screenshot:async()=>{
    shots++;const p=Buffer.alloc(160*112*4);
    for(let i=0;i<p.length;i+=4)p.set([32,38,43,255],i);
    for(const t of targets)if(t.sourceKey!==hidden){
      for(let y=t.roi.y;y<t.roi.y+t.roi.height;y++)for(let x=t.roi.x;x<t.roi.x+t.roi.width;x++)
        p.set([255,190,20,255],(y*160+x)*4);
    }
    if(scenario==='restore-mismatch'&&shots===3)p[0]^=127;
    if(scenario==='outside'&&hidden)p.set([255,0,255,255],(160*112-2)*4);
    const png=fixturePng(p,160,112);
    if(scenario==='png-corrupt')png[png.length-1]^=1;
    if(scenario==='png-shape')png.writeUInt32BE(159,16);
    return png;
  }};
  return {page,canvas,floor,originalRoster,state:()=>({hidden,finished,shots,bulkRgbaRequests})};
}
test('the production collector captures 70 before/hidden/restored frames and verifies all34 synthetic source anchors',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'p186e-individual-'));
  try{
    const sessions=[],shots=[];
    for(const floor of ['D1F','D2F'] as const){
      const f=browserFixture(floor),result=await capture({...f,outputDirectory:dir});
      sessions.push(result.session);shots.push(f.state().shots);
      expect(result.summary).toMatchObject({exactRestoresVerified:true,sourceRosterBoundToOriginalGlb:true,
        captionsTemporarilyHidden:true,captionPixelsVerified:false,rgbaDecodeMethod:'node-lossless-png'});
      expect(f.state()).toMatchObject({finished:true,hidden:null,bulkRgbaRequests:0});
    }
    expect(shots).toEqual([37,33]);
    expect(verify({sourceCandidateId:candidate,floors:sessions} as any)).toMatchObject({targetCount:34,
      D1F:{visuallyIsolated:18},D2F:{visuallyIsolated:16},sourceAuthenticated:false,productionScreenshotVerified:false});
  }finally{rmSync(dir,{recursive:true,force:true});}
});
for(const scenario of ['substitution','restore-mismatch','drift'])test('collector rejects '+scenario+' and finishes temporary visibility state',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'p186e-individual-negative-')),f=browserFixture('D1F',scenario);
  try{
    await expect(capture({...f,outputDirectory:dir})).rejects.toThrow(/ORIGINAL_ROSTER_BINDING|EXACT_PIXEL_RESTORE|FRAME_DRIFT/);
    expect(f.state()).toMatchObject({finished:true,hidden:null});
    if(scenario==='substitution')expect(f.state().shots).toBe(0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
for(const scenario of ['cue-invalid-initial','cue-drift-hide','cue-drift-frame','cue-not-restored'])
  test('individual source capture rejects temporary viewer cue fault '+scenario,async()=>{
    const dir=mkdtempSync(join(tmpdir(),'p186e-cue-size-'));
    const f=browserFixture('D1F',scenario);
    try{
      const expected=scenario==='cue-invalid-initial'?'ORIGINAL_ROSTER_BINDING':
        scenario==='cue-drift-hide'?'SELECTIVE_HIDE':
        scenario==='cue-drift-frame'?'FRAME_DRIFT':'FINISH_RESTORE';
      await expect(capture({...f,outputDirectory:dir})).rejects.toThrow(expected);
      expect(f.state()).toMatchObject({finished:true,hidden:null});
      if(scenario==='cue-invalid-initial')expect(f.state().shots).toBe(0);
      if(scenario==='cue-not-restored')expect(f.state().shots).toBe(37);
    }finally{rmSync(dir,{recursive:true,force:true});}
  });

test('pixel verifier rejects external changes in a completed synthetic capture stack',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'p186e-outside-'));
  try{
    const one=await capture({...browserFixture('D1F','outside'),outputDirectory:dir});
    const two=await capture({...browserFixture('D2F'),outputDirectory:dir});
    expect(()=>verify({sourceCandidateId:candidate,floors:[one.session,two.session]} as any)).toThrow('outside-ROI');
  }finally{rmSync(dir,{recursive:true,force:true});}
});


for(const scenario of ['png-corrupt','png-shape'])test('invalid actual screenshot bytes fail closed and restore visibility '+scenario,async()=>{
  const dir=mkdtempSync(join(tmpdir(),'p186e-png-negative-')),f=browserFixture('D1F',scenario);
  try{
    await expect(capture({...f,outputDirectory:dir})).rejects.toThrow(/PNG_DECODE|FRAME_SHAPE/);
    expect(f.state()).toMatchObject({finished:true,hidden:null,bulkRgbaRequests:0});
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('actual Chromium production-size PNG is decoded losslessly in Node',async({page})=>{
  const width=1254,height=1089;
  await page.setContent('<canvas width="1254" height="1089"></canvas>');
  await page.locator('canvas').evaluate(el=>{
    const canvas=el as HTMLCanvasElement;
    const ctx=canvas.getContext('2d',{alpha:false})!;
    ctx.fillStyle='rgb(32,38,43)';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='rgb(255,190,20)';ctx.fillRect(30,40,19,17);
  });
  const bytes=await page.locator('canvas').screenshot();
  const decoded=decodeD1FScreenshotPng(bytes);
  expect([decoded.width,decoded.height]).toEqual([width,height]);
  const expected=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4,yellow=x>=30&&x<49&&y>=40&&y<57;
    expected[i]=yellow?255:32;expected[i+1]=yellow?190:38;expected[i+2]=yellow?20:43;expected[i+3]=255;
  }
  const digest=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
  expect(digest(decoded.rgba)).toBe(digest(expected));
});
