import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeD1FScreenshotPng} from './private-model-d1f-screenshot-png.mjs';
import {
  p186ePixelCandidateId,p186ePixelExpected,p186ePixelRepresentationKinds,
  p186ePixelSourcePdfDriveId,p186ePixelSchedulePdfDriveId,
} from '../../src/scripts/privateModelP186E34PixelEvidence.mjs';
import {p186eLabelRuntimeFailureCodes} from '../../src/scripts/privateModelP186ELabelPixelRuntime.mjs';
export class P186EIndividualCaptureFailure extends Error {}
const need=(value,code)=>{if(!value)throw new P186EIndividualCaptureFailure('P186E_PROD_INDIVIDUAL_'+code);};
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const keys=['sourceKey','kind','representationKind','sourcePdfDriveId','schedulePdfDriveId',
  'presentationOnly','sourceDerived','currentGeometryClaim','asBuilt','canonical','publishToCURRENT','humanReview'];
const canonical=targets=>targets.map(t=>Object.fromEntries(keys.map(k=>[k,t[k]])))
  .sort((a,b)=>a.sourceKey<b.sourceKey?-1:a.sourceKey>b.sourceKey?1:0);

/** Caller MUST verify the fixed raw GLB SHA before calling this parser. Only
 * reachable original source nodes belong to the expected browser roster.
 */
export function deriveP186EOriginalRoster(bytes){
  need(Buffer.isBuffer(bytes)&&bytes.length>=20&&bytes.readUInt32LE(0)===0x46546c67&&
    bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length&&
    bytes.readUInt32LE(16)===0x4e4f534a,'GLB_JSON');
  const length=bytes.readUInt32LE(12);
  need(length>0&&length<=bytes.length-20,'GLB_JSON');
  let gltf;try{gltf=JSON.parse(bytes.subarray(20,20+length).toString('utf8'));}catch{need(false,'GLB_JSON');}
  need(Array.isArray(gltf.nodes)&&Array.isArray(gltf.scenes)&&Number.isSafeInteger(gltf.scene)&&
    Array.isArray(gltf.scenes[gltf.scene]?.nodes),'SOURCE_SCENE');
  const floors={D1F:[],D2F:[]},seen=new Set(),stack=new Set();
  const visit=index=>{
    need(Number.isSafeInteger(index)&&gltf.nodes[index]&&!stack.has(index),'SOURCE_TREE');
    if(seen.has(index))return;seen.add(index);stack.add(index);
    const node=gltf.nodes[index],d=node.extras??{};
    const kind=Object.entries(p186ePixelRepresentationKinds).find(([,v])=>v===d.representationKind)?.[0];
    if(d.Pass==='P186E-X1'&&kind){
      const floor=d.hostStorey==='D_1F'?'D1F':d.hostStorey==='D_2F'?'D2F':null;
      need(floor&&Number.isSafeInteger(node.mesh)&&gltf.meshes?.[node.mesh]?.primitives?.length===1&&
        gltf.meshes[node.mesh].primitives[0].mode===1&&
        d.sourcePdfDriveId===p186ePixelSourcePdfDriveId&&d.sourceDerived===true&&
        d.presentationOnly===true&&d.sourceLabelAnchor===true&&d.Canonical===false&&
        d.canonical===false&&d.currentGeometryClaim===false&&d.current===false&&d.asBuilt===false&&
        d.publishToCURRENT===false&&d.HUMAN_REVIEW==='NOT_RUN'&&
        ['deviceGeometryClaim','socketGeometryClaim','switchOrFixtureClaim','physicalCableRouteClaim',
          'connectionTopologyClaim','exactCurrentXYClaim','exactZClaim'].every(k=>d[k]===false)&&
        (kind!=='group'||d.schedulePdfDriveId===p186ePixelSchedulePdfDriveId),'SOURCE_SEMANTICS');
      const sourceKey=kind==='group'?d.annotationStableKey:d.sourceLabelId;
      need(typeof sourceKey==='string'&&/^[A-Za-z0-9_.:-]{3,128}$/.test(sourceKey),'SOURCE_KEY');
      floors[floor].push({sourceKey,kind,representationKind:d.representationKind,
        sourcePdfDriveId:d.sourcePdfDriveId,schedulePdfDriveId:kind==='group'?d.schedulePdfDriveId:null,
        presentationOnly:true,sourceDerived:true,currentGeometryClaim:false,asBuilt:false,
        canonical:false,publishToCURRENT:false,humanReview:'NOT_RUN'});
    }
    for(const child of node.children??[])visit(child);stack.delete(index);
  };
  for(const index of gltf.scenes[gltf.scene].nodes)visit(index);
  for(const [floor,targets] of Object.entries(floors)){
    const expected=p186ePixelExpected[floor];
    need(targets.length===expected.total&&new Set(targets.map(t=>t.sourceKey)).size===expected.total&&
      targets.filter(t=>t.kind==='group').length===expected.group&&
      targets.filter(t=>t.kind==='special').length===expected.special,'SOURCE_ROSTER');
    floors[floor]=canonical(targets);
  }
  return floors;
}

export async function captureP186EIndividualFloor({page,canvas,floor,originalRoster,outputDirectory}){
  let requestId=0,prepared=false,baseline;
  const command=async(action,sourceKey=null)=>{
    const id=++requestId;
    const result=await page.evaluate(({action,sourceKey,requestId})=>{
      window.dispatchEvent(new CustomEvent('p186e-source-pixel-probe',{
        detail:{action,sourceKey,requestId},
      }));
      return JSON.parse(document.querySelector('#private-model-canvas')?.dataset.p186ePixelProbe??'null');
    },{action,sourceKey,requestId:id});
    need(result?.requestId===id,'RUNTIME_RESPONSE');
    if(result.state==='REJECTED'){
      if(result.cleanup?.sourceVisibilityRestored===true&&result.cleanup?.captionVisibilityRestored===true&&
        result.cleanup?.cameraRestored===true)prepared=false;
      const code=p186eLabelRuntimeFailureCodes.includes(result.failureCode)?result.failureCode:'UNEXPECTED';
      need(false,'RUNTIME_'+action.toUpperCase()+'_'+code);
    }
    return result;
  };
  const frames=[];
  const capture=async(name,manifest)=>{
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const before=await command('inspect');
    need(before.cameraFingerprint===manifest.cameraFingerprint&&before.width===manifest.width&&
      before.height===manifest.height&&before.hiddenSourceKey===manifest.hiddenSourceKey,'FRAME_DRIFT');
    const png=await canvas.screenshot({timeout:30000});
    // Decode the captured lossless PNG in Node. Sending its full RGBA table
    // through browser RPC exhausted the real 240s floor budget after 9 pairs.
    need(Buffer.isBuffer(png)&&png.length>=24&&
      png.readUInt32BE(16)===manifest.width&&png.readUInt32BE(20)===manifest.height&&
      manifest.width*manifest.height<=2304000,'FRAME_SHAPE');
    let rgba;
    try{rgba=decodeD1FScreenshotPng(png);}catch{need(false,'PNG_DECODE');}
    const after=await command('inspect');
    need(after.cameraFingerprint===before.cameraFingerprint&&after.hiddenSourceKey===before.hiddenSourceKey&&
      rgba.width===manifest.width&&rgba.height===manifest.height,'FRAME_DRIFT');
    const pixels=rgba.rgba;
    need(pixels.length===rgba.width*rgba.height*4&&pixels.length<=2304000*4,'FRAME_SHAPE');
    fs.mkdirSync(outputDirectory,{recursive:true});fs.writeFileSync(outputDirectory+'/'+name+'.png',png);
    frames.push({file:name+'.png',pngSha256:sha256(png),hiddenSourceKey:manifest.hiddenSourceKey});
    return {width:rgba.width,height:rgba.height,pixels,floor,cameraKey:manifest.cameraKey,
      sceneKey:manifest.sceneKey,sourceCandidateId:p186ePixelCandidateId};
  };
  try{
    const manifest=await command('prepare');prepared=true;
    need(manifest.floor===floor&&manifest.sourceCandidateId===p186ePixelCandidateId&&
      manifest.captionsTemporarilyHidden===true&&manifest.captionPixelsVerified===false&&
      manifest.pixelsVerifiedByThisRuntime===false&&manifest.humanReview==='NOT_RUN'&&
      manifest.hiddenSourceKey===null&&typeof manifest.cameraFingerprint==='string'&&
      JSON.stringify(canonical(manifest.targets))===JSON.stringify(canonical(originalRoster)),
      'ORIGINAL_ROSTER_BINDING');
    fs.mkdirSync(outputDirectory,{recursive:true});
    fs.writeFileSync(outputDirectory+'/'+floor.toLowerCase()+'-individual-manifest.json',JSON.stringify(manifest,null,2)+'\n');
    baseline=await capture(floor.toLowerCase()+'-individual-baseline',manifest);
    const hiddenFrames=Object.create(null);
    for(let i=0;i<manifest.targets.length;i++){
      const target=manifest.targets[i],name=floor.toLowerCase()+'-'+String(i+1).padStart(2,'0');
      const hidden=await command('hide',target.sourceKey);
      need(hidden.cameraFingerprint===manifest.cameraFingerprint&&hidden.hiddenSourceKey===target.sourceKey,'SELECTIVE_HIDE');
      hiddenFrames[target.sourceKey]=await capture(name+'-hidden',hidden);
      const restoredManifest=await command('restore');
      need(restoredManifest.hiddenSourceKey===null&&restoredManifest.cameraFingerprint===manifest.cameraFingerprint,'RESTORE');
      const restored=await capture(name+'-restored',restoredManifest);
      need(Buffer.from(restored.pixels).equals(Buffer.from(baseline.pixels)),'EXACT_PIXEL_RESTORE');
    }
    return {session:{floor,cameraKey:manifest.cameraKey,sceneKey:manifest.sceneKey,
      targets:manifest.targets,baseline,hiddenFrames},summary:{floor,frames,
      cameraFingerprint:manifest.cameraFingerprint,cameraKey:manifest.cameraKey,sceneKey:manifest.sceneKey,
      width:manifest.width,height:manifest.height,targets:manifest.targets,sourceRosterBoundToOriginalGlb:true,
      exactRestoresVerified:true,captionsTemporarilyHidden:true,captionPixelsVerified:false,
      rgbaDecodeMethod:'node-lossless-png'}};
  }finally{
    if(prepared){
      const finish=await command('finish');
      need(finish.state==='FINISHED'&&finish.sourceVisibilityRestored===true&&
        finish.captionVisibilityRestored===true&&finish.cameraRestored===true,'FINISH_RESTORE');
    }
  }
}
