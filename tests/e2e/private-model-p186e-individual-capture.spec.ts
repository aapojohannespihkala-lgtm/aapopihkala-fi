import {test,expect} from '@playwright/test';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
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

// Deliberately synthetic browser adapter. Never production/authentication proof.
function browserFixture(floor:'D1F'|'D2F',scenario='normal'){
  const originalRoster=deriveP186EOriginalRoster(glb(rawFixture()))[floor];
  const targets=originalRoster.map((t:any,i:number)=>({...t,roi:{x:8+i%6*23,y:8+Math.floor(i/6)*23,width:10,height:10}}));
  if(scenario==='substitution')targets[0].sourceKey='FORGED_SOURCE_KEY';
  let hidden:string|null=null,finished=false,shots=0,lastPixels=Buffer.alloc(0);
  const manifest=()=>({state:'PREPARED',requestId:0,floor,width:160,height:112,targets,
    sourceCandidateId:candidate,cameraKey:floor+'_camera',sceneKey:floor+'_scene',
    cameraFingerprint:scenario==='drift'&&shots>=2?'changed-synthetic-camera':'fixed-synthetic-camera',
    hiddenSourceKey:hidden,captionsTemporarilyHidden:true,captionPixelsVerified:false,
    pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'});
  const page={evaluate:async(_fn:Function,arg:any)=>{
    if(arg?.action){
      if(arg.action==='hide')hidden=arg.sourceKey;
      if(arg.action==='restore')hidden=null;
      if(arg.action==='finish'){
        hidden=null;finished=true;return {state:'FINISHED',requestId:arg.requestId,
          sourceVisibilityRestored:true,captionVisibilityRestored:true,cameraRestored:true};
      }
      return {...manifest(),requestId:arg.requestId};
    }
    if(typeof arg==='string')return {width:160,height:112,rgbaBase64:lastPixels.toString('base64')};
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
    lastPixels=p;
    return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),createHash('sha256').update(p).digest()]);
  }};
  return {page,canvas,floor,originalRoster,state:()=>({hidden,finished,shots})};
}
test('the production collector captures 70 before/hidden/restored frames and verifies all34 synthetic source anchors',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'p186e-individual-'));
  try{
    const sessions=[],shots=[];
    for(const floor of ['D1F','D2F'] as const){
      const f=browserFixture(floor),result=await capture({...f,outputDirectory:dir});
      sessions.push(result.session);shots.push(f.state().shots);
      expect(result.summary).toMatchObject({exactRestoresVerified:true,sourceRosterBoundToOriginalGlb:true,
        captionsTemporarilyHidden:true,captionPixelsVerified:false});
      expect(f.state()).toMatchObject({finished:true,hidden:null});
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
test('pixel verifier rejects external changes in a completed synthetic capture stack',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'p186e-outside-'));
  try{
    const one=await capture({...browserFixture('D1F','outside'),outputDirectory:dir});
    const two=await capture({...browserFixture('D2F'),outputDirectory:dir});
    expect(()=>verify({sourceCandidateId:candidate,floors:[one.session,two.session]} as any)).toThrow('outside-ROI');
  }finally{rmSync(dir,{recursive:true,force:true});}
});
