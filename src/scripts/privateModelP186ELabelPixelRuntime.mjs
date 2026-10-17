import {
  p186ePixelCandidateId, p186ePixelExpected, p186ePixelRepresentationKinds,
  p186ePixelSourcePdfDriveId, p186ePixelSchedulePdfDriveId,
} from './privateModelP186E34PixelEvidence.mjs';

export const p186eLabelRuntimeFailureCodes=Object.freeze(['INPUT','PARENT_TREE','SOURCE','SOURCE_CHILDREN',
  'ROSTER','BOUNDS','DISPOSED','SOURCE_DRIFT','CAMERA_OR_VIEWPORT_DRIFT','PROJECTION','CUE_SIZE',
  'ROI_OUTSIDE','ROI_OVERLAP','PREPARE_STATE','VIEWPORT','HIDE_KEY','RESTORE_STATE','INSPECT_STATE']);
export class P186ELabelRuntimeFailure extends Error {
  constructor(code){super('P186E_LABEL_RUNTIME_'+code);this.code=code;}
}
const need=(value,code)=>{if(!value)throw new P186ELabelRuntimeFailure(code);};
const identifier=/^[A-Za-z0-9_.:-]{3,128}$/;
const noPromotion=data=>data.presentationOnly===true && data.sourceDerived===true &&
  data.sourceLabelAnchor===true && data.Canonical===false && data.canonical===false &&
  data.current===false && data.currentGeometryClaim===false && data.asBuilt===false &&
  data.publishToCURRENT===false && data.HUMAN_REVIEW==='NOT_RUN' &&
  ['deviceGeometryClaim','socketGeometryClaim','switchOrFixtureClaim',
    'physicalCableRouteClaim','connectionTopologyClaim','exactCurrentXYClaim',
    'exactZClaim'].every(key=>data[key]===false);
const ancestorsVisible=object=>{
  const seen=new Set();
  for(let parent=object.parent;parent;parent=parent.parent){
    need(!seen.has(parent)&&seen.size<100,'PARENT_TREE');seen.add(parent);
    if(parent.visible===false)return false;
  }
  return true;
};
const materialState=material=>JSON.stringify((Array.isArray(material)?material:[material]).map(m=>({
  // WebGLRenderer increments Material.version twice per transparent DoubleSide
  // render. Compare the appearance, not that renderer-owned invalidation count.
  uuid:m?.uuid,color:m?.color?.toArray(),emissive:m?.emissive?.toArray(),
  visible:m?.visible,colorWrite:m?.colorWrite,
  opacity:m?.opacity,transparent:m?.transparent,depthTest:m?.depthTest,depthWrite:m?.depthWrite,
  alphaTest:m?.alphaTest,side:m?.side,blending:m?.blending,map:m?.map?.uuid,
  mapVersion:m?.map?.version,forceSinglePass:m?.forceSinglePass,vertexColors:m?.vertexColors,
  linewidth:m?.linewidth,toneMapped:m?.toneMapped,defines:m?.defines,
})));
// Pixel-isolation evidence cannot claim a source line or cue that WebGL would
// never paint, even when the caller supplies plausible screenshot bytes.
const materialCanPaint=material=>{
  const materials=Array.isArray(material)?material:[material];
  return materials.length>0&&materials.some(m=>m?.visible===true&&m.colorWrite===true&&
    Number.isFinite(m.opacity)&&m.opacity>0&&m.opacity<=1&&
    Number.isFinite(m.alphaTest)&&m.alphaTest>=0&&m.alphaTest<m.opacity);
};
const geometryState=geometry=>JSON.stringify({
  positions:Array.from(geometry.attributes.position.array),
  index:geometry.index?Array.from(geometry.index.array):null,
  range:[geometry.drawRange.start,geometry.drawRange.count],
});
const pose=camera=>({position:camera.position.clone(),quaternion:camera.quaternion.clone(),
  up:camera.up.clone(),projection:camera.projectionMatrix.clone(),
  inverse:camera.projectionMatrixInverse.clone(),
  values:Object.fromEntries(['left','right','top','bottom','near','far','zoom'].map(k=>[k,camera[k]])),
});
const applyPose=(camera,saved)=>{
  camera.position.copy(saved.position);camera.quaternion.copy(saved.quaternion);camera.up.copy(saved.up);
  Object.assign(camera,saved.values);camera.projectionMatrix.copy(saved.projection);
  camera.projectionMatrixInverse.copy(saved.inverse);camera.updateMatrixWorld(true);
};

/** Temporary, source-only visibility control. This runtime authenticates no
 * browser/GLB/pixels. The external production driver supplies those proofs.
 */
export function createP186ELabelPixelRuntime({THREE,root,floor,canvas,camera,controls,render}){
  const expected=p186ePixelExpected[floor];
  need(expected&&root?.traverse&&camera?.isOrthographicCamera&&typeof render==='function','INPUT');
  root.updateMatrixWorld(true);
  const targets=[];
  root.traverse(object=>{
    const d=object.userData??{};
    if(d.Pass!=='P186E-X1'||d.hostStorey!==(floor==='D1F'?'D_1F':'D_2F'))return;
    const kind=Object.entries(p186ePixelRepresentationKinds).find(([,value])=>value===d.representationKind)?.[0];
    if(!kind)return;
    const sourceKey=kind==='group'?d.annotationStableKey:d.sourceLabelId;
    need((object.isLine===true||object.isLineSegments===true)&&object.geometry?.attributes?.position&&
      object.visible===true&&ancestorsVisible(object)&&materialCanPaint(object.material)&&
      identifier.test(sourceKey??'')&&noPromotion(d)&&
      d.sourcePdfDriveId===p186ePixelSourcePdfDriveId&&
      (kind!=='group'||d.schedulePdfDriveId===p186ePixelSchedulePdfDriveId)&&
      d.p186eReviewRole==='QUESTION_TARGET_80'&&d.p186eReviewVariant===floor,'SOURCE');
    const cue=object.children.find(child=>child.userData?.p186eViewOnlyCue===true);
    const caption=object.children.find(child=>child.userData?.p186eViewerSourceCaption===true);
    need(cue?.isPoints&&cue.visible===true&&materialCanPaint(cue.material)&&
      caption?.isSprite&&caption.visible===true,'SOURCE_CHILDREN');
    targets.push({object,cue,caption,sourceKey,kind,representationKind:d.representationKind,
      sourcePdfDriveId:d.sourcePdfDriveId,schedulePdfDriveId:kind==='group'?d.schedulePdfDriveId:null,
      presentationOnly:true,sourceDerived:true,currentGeometryClaim:false,asBuilt:false,
      canonical:false,publishToCURRENT:false,humanReview:'NOT_RUN',
      original:{geometry:object.geometry,material:object.material,data:JSON.stringify(d),
        geometryState:geometryState(object.geometry),materialState:materialState(object.material),
        matrix:JSON.stringify(object.matrixWorld.toArray()),cueGeometry:cue.geometry,cueMaterial:cue.material,
        cueGeometryState:geometryState(cue.geometry),cueMaterialState:materialState(cue.material),
        cuePointSize:cue.material?.size,
        captionVisible:caption.visible,visible:object.visible},
    });
  });
  targets.sort((a,b)=>a.sourceKey.localeCompare(b.sourceKey));
  need(targets.length===expected.total&&new Set(targets.map(t=>t.sourceKey)).size===expected.total&&
    targets.filter(t=>t.kind==='group').length===expected.group&&
    targets.filter(t=>t.kind==='special').length===expected.special,'ROSTER');
  const sourceBounds=new THREE.Box3();
  for(const {object} of targets){
    const attribute=object.geometry.attributes.position;
    for(let i=0;i<attribute.count;i++)sourceBounds.expandByPoint(new THREE.Vector3()
      .fromBufferAttribute(attribute,i).applyMatrix4(object.matrixWorld));
  }
  need(!sourceBounds.isEmpty()&&[...sourceBounds.min.toArray(),...sourceBounds.max.toArray()].every(Number.isFinite),'BOUNDS');
  let prepared=null,hidden=null,disposed=false,finished=null;
  const size=()=>{const rect=canvas.getBoundingClientRect();return {width:Math.round(rect.width),height:Math.round(rect.height)};};
  const fingerprint=()=>{camera.updateMatrixWorld(true);return JSON.stringify({
    pose:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),...size(),
  });};
  const validate=()=>{
    need(!disposed,'DISPOSED');root.updateMatrixWorld(true);
    for(const t of targets){
      const o=t.object,b=t.original;
      need(o.visible===(t.sourceKey!==hidden)&&ancestorsVisible(o)&&o.geometry===b.geometry&&
        o.material===b.material&&JSON.stringify(o.userData)===b.data&&noPromotion(o.userData)&&
        geometryState(o.geometry)===b.geometryState&&materialState(o.material)===b.materialState&&
        JSON.stringify(o.matrixWorld.toArray())===b.matrix&&t.cue.parent===o&&t.cue.visible===true&&
        t.cue.geometry===b.cueGeometry&&t.cue.material===b.cueMaterial&&
        b.cuePointSize===13&&t.cue.material.size===(prepared?.cueSize??13)&&
        geometryState(t.cue.geometry)===b.cueGeometryState&&materialState(t.cue.material)===b.cueMaterialState&&
        t.caption.parent===o&&t.caption.visible===(prepared?false:b.captionVisible),'SOURCE_DRIFT');
    }
    if(prepared)need(JSON.stringify(size())===JSON.stringify(prepared.size)&&
      fingerprint()===prepared.fingerprint,'CAMERA_OR_VIEWPORT_DRIFT');
  };
  const pinFrame=()=>{if(prepared&&!disposed)applyPose(camera,prepared.lock);};
  const result=()=>{
    validate();
    const {width,height}=size();
    const projectedTargets=targets.map(t=>{
      const points=[];
      const attr=t.object.geometry.attributes.position;
      for(let i=0;i<attr.count;i++)points.push(new THREE.Vector3().fromBufferAttribute(attr,i)
        .applyMatrix4(t.object.matrixWorld).project(camera));
      t.cue.updateWorldMatrix(true,false);
      const center=new THREE.Vector3().fromBufferAttribute(t.cue.geometry.attributes.position,0)
        .applyMatrix4(t.cue.matrixWorld).project(camera);
      need([...points,center].every(p=>[p.x,p.y,p.z].every(Number.isFinite)&&p.z>=-1&&p.z<=1),'PROJECTION');
      const xs=points.map(p=>(p.x+1)*width/2),ys=points.map(p=>(1-p.y)*height/2);
      const cx=(center.x+1)*width/2,cy=(1-center.y)*height/2;
      const radius=t.cue.material.size/2;
      need(t.cue.material.sizeAttenuation===false&&radius===(prepared?.cueSize??13)/2,'CUE_SIZE');
      const x=Math.floor(Math.min(...xs,cx-radius))-2,y=Math.floor(Math.min(...ys,cy-radius))-2;
      const right=Math.ceil(Math.max(...xs,cx+radius))+2,bottom=Math.ceil(Math.max(...ys,cy+radius))+2;
      need(x>=0&&y>=0&&right<=width&&bottom<=height,'ROI_OUTSIDE');
      const {object,cue,caption,original,...metadata}=t;
      return {...metadata,roi:{x,y,width:right-x,height:bottom-y}};
    });
    for(let i=0;i<projectedTargets.length;i++)for(let j=i+1;j<projectedTargets.length;j++){
      const a=projectedTargets[i].roi,b=projectedTargets[j].roi;
      need(!(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height),'ROI_OVERLAP');
    }
    return {state:'PREPARED',floor,width,height,sourceCandidateId:p186ePixelCandidateId,
      cameraKey:floor+'_p186e_source_plan',sceneKey:floor+'_p186e_original_source',
      cameraFingerprint:fingerprint(),targets:projectedTargets,hiddenSourceKey:hidden,
      temporaryCuePointSizePx:prepared?.cueSize??13,
      captionsTemporarilyHidden:Boolean(prepared),captionPixelsVerified:false,
      pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};
  };
  const restore=()=>{
    if(hidden){targets.find(t=>t.sourceKey===hidden).object.visible=true;hidden=null;}
  };
  const dispose=()=>{
    if(disposed)return finished;
    restore();for(const t of targets){
      t.object.visible=t.original.visible;t.caption.visible=t.original.captionVisible;
      t.cue.material.size=t.original.cuePointSize;
    }
    const before=prepared?.before;
    if(prepared){applyPose(camera,prepared.before);
      Object.assign(controls,prepared.controls);controls.target.copy(prepared.target);}
    prepared=null;disposed=true;render();
    finished={state:'FINISHED',sourceVisibilityRestored:targets.every(t=>t.object.visible===t.original.visible),
      captionVisibilityRestored:targets.every(t=>t.caption.visible===t.original.captionVisible),
      cueSizeRestored:targets.every(t=>t.cue.material.size===t.original.cuePointSize),
      cameraRestored:!before||JSON.stringify(camera.matrixWorld.toArray())===JSON.stringify((()=>{
        const copy=camera.clone();applyPose(copy,before);return copy.matrixWorld.toArray();})()),
      pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};
    return finished;
  };
  return {
    sourceBounds:()=>sourceBounds.clone().expandByScalar(0.4),pinFrame,dispose,
    prepare(){
      need(!prepared&&!disposed,'PREPARE_STATE');validate();
      const dimensions=size();
      need(dimensions.width>=320&&dimensions.height>=320&&dimensions.width*dimensions.height<=2304000,'VIEWPORT');
      const before=pose(camera),target=controls.target.clone();
      const settings={enabled:controls.enabled,enableDamping:controls.enableDamping,autoRotate:controls.autoRotate};
      controls.enabled=false;controls.enableDamping=false;controls.autoRotate=false;controls.update();
      const lock=pose(camera);
      prepared={before,lock,target,controls:settings,size:dimensions,fingerprint:fingerprint(),cueSize:13};
      for(const t of targets)t.caption.visible=false;
      // Original source labels and 13px human-view cues remain unchanged outside
      // this proof session. Smaller temporary cues are tried ONLY when the full
      // source ROI check rejects an overlap; never bypass source/peer guards.
      let overlapError;
      for(const cueSize of [13,11,9]){
        prepared.cueSize=cueSize;
        for(const t of targets)t.cue.material.size=cueSize;
        try{render();return result();}catch(error){
          if(!(error instanceof P186ELabelRuntimeFailure) || error.code!=='ROI_OVERLAP'){
            dispose();throw error;
          }
          overlapError=error;
        }
      }
      dispose();throw overlapError;
    },
    hide(sourceKey){
      need(prepared&&!hidden&&targets.some(t=>t.sourceKey===sourceKey),'HIDE_KEY');validate();
      targets.find(t=>t.sourceKey===sourceKey).object.visible=false;hidden=sourceKey;
      render();return result();
    },
    restore(){need(prepared,'RESTORE_STATE');restore();render();return result();},
    inspect(){need(prepared,'INSPECT_STATE');return result();},
  };
}
