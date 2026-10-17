/**
 * R1125 source-scene frame collection for the already established per-source
 * footprint verifier. This is NOT browser, source-byte or production evidence.
 * The caller must separately authenticate scene63, original GLB bytes and the
 * live renderer before treating the returned frames as technical evidence.
 */
import { m5aR1125SourcePixelKinds } from './privateModelM5AR1125SourceRoiPixelProof.mjs';
import { snapshotM5AR1125RenderCamera } from './privateModelM5AR1125PerSourceRenderDelta.mjs';

const keys = Object.keys(m5aR1125SourcePixelKinds);
const fail = why => { throw new Error('R1125_CAPTURE_SEQUENCE: ' + why); };
const need = (condition, why) => { if (!condition) fail(why); };

function ancestry(node, root) {
  let current = node;
  const seen = new Set();
  for (let depth = 0; current && depth < 128; depth++) {
    need(!seen.has(current) && current.visible !== false, 'invisible or cyclic ancestor');
    seen.add(current);
    if (current === root) return [...seen];
    current = current.parent;
  }
  fail('target outside source root or parent depth exceeded');
}
function materialSafe(object) {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  need(materials.length > 0 && materials.every(m => m && m.visible !== false &&
    Number.isFinite(Number(m.opacity ?? 1)) && Number(m.opacity ?? 1) > 0 &&
    m.colorWrite !== false),
    'hidden/invalid source material');
}
function rgbacopy(raw, width, height) {
  need((raw instanceof Uint8Array || raw instanceof Uint8ClampedArray) &&
    raw.length === width * height * 4, 'RGBA exact byte length');
  return Uint8Array.from(raw); // renderers may reuse their readPixels backing buffer
}
function identical(a,b) {
  return a.length === b.length && a.every((v,i) => v === b[i]);
}
// Public render-material state must not drift during an awaited readPixels.
// Internal shader/GPU state remains outside this explicit snapshot contract.
const FIELDS=['visible','opacity','colorWrite','depthTest','depthWrite','alphaTest','side',
  'transparent','blending','map','color','emissive'];
const rgb=c=>c&&typeof c==='object'?['r','g','b'].map(k=>c[k]):null;
// Track both UV vector identity and its coordinates. Merely comparing x/y
// misses a replaced Vector2 that happens to have identical coordinates.
const uvVectorState=(texture,key)=>({
  owned:Object.hasOwn(texture,key),ref:texture[key],
  xy:texture[key]&&typeof texture[key]==='object'?[texture[key].x,texture[key].y]:null,
});
const uvState=t=>t&&typeof t==='object'?{
  t,offset:uvVectorState(t,'offset'),repeat:uvVectorState(t,'repeat'),
  center:uvVectorState(t,'center'),
  rotation:t.rotation,flipY:t.flipY,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,
}:null;
const matState=m=>({
  fields:FIELDS.map(k=>[k,Object.hasOwn(m,k),m[k]]),
  color:rgb(m.color),emissive:rgb(m.emissive),map:uvState(m.map),
});
const sameVec=(texture,key,s)=>Object.hasOwn(texture,key)===s.owned&&
  texture[key]===s.ref&&(s.xy===null||
  !!texture[key]&&texture[key].x===s.xy[0]&&texture[key].y===s.xy[1]);
const sameRGB=(value,s)=>s===null?!value:!!value&&['r','g','b'].every((k,i)=>value[k]===s[i]);
const sameUV=(value,s)=>s===null?!value:!!value&&value===s.t&&
  sameVec(value,'offset',s.offset)&&sameVec(value,'repeat',s.repeat)&&sameVec(value,'center',s.center)&&
  ['rotation','flipY','colorSpace','wrapS','wrapT'].every(k=>value[k]===s[k]);
const sameMat=(m,s)=>s.fields.every(([k,owned,value])=>
    Object.hasOwn(m,k)===owned&&m[k]===value) &&
  sameRGB(m.color,s.color)&&sameRGB(m.emissive,s.emissive)&&sameUV(m.map,s.map);
const restoreMat=(m,s)=>{
  for(const [key,owned,value] of s.fields){
    if(owned)m[key]=value;else delete m[key];
  }
  for(const [c,values] of [[m.color,s.color],[m.emissive,s.emissive]]){
    if(c&&values)['r','g','b'].forEach((k,i)=>{c[k]=values[i];});
  }
  if(s.map&&m.map){
    for(const k of ['offset','repeat','center']){
      const v=s.map[k];
      if(v.owned)m.map[k]=v.ref;else delete m.map[k];
      if(v.xy&&v.ref&&typeof v.ref==='object'){
        v.ref.x=v.xy[0];v.ref.y=v.xy[1];
      }
    }
    for(const k of ['rotation','flipY','colorSpace','wrapS','wrapT']){
      if(s.map[k]===undefined)delete m.map[k];else m.map[k]=s.map[k];
    }
  }
};

/**
 * targets: exact 13 map entries key -> live renderer object from scene63.
 * captureRGBA(): actual caller-provided WebGL readback, never a fake pixel oracle.
 * Output feeds detectM5AR1125PerSourceRenderDelta({ ...result, projections,
 *   sourceScene }), but does not authenticate anything on its own.
 */
export async function captureM5AR1125FrameSequence({
  sceneRoot, camera, sceneIndex, width, height, targets, captureRGBA,
} = {}) {
  need(sceneIndex === 63 && sceneRoot && camera &&
    Number.isInteger(width) && width >= 128 && Number.isInteger(height) && height >= 128 &&
    width * height <= 2304000 && typeof captureRGBA === 'function',
    'exact scene63/canvas/renderer contract');
  need(targets && typeof targets === 'object' && !Array.isArray(targets) &&
    Object.keys(targets).length === 13 && keys.every(key => Object.hasOwn(targets,key)),
    'exact 13 source objects');
  const objects = keys.map(key => targets[key]);
  need(new Set(objects).size === 13 && objects.every(o => o && typeof o === 'object'),
    'distinct source objects');
  const snapshot = () => [...snapshotM5AR1125RenderCamera({camera,width,height})];
  const originalCamera = snapshot();
  const sameCamera = () => need(identical(snapshot(), originalCamera), 'camera/viewport drift');
  const originalVisibility = new Map();
  const originalMaterialState = new Map();
  const originalBindings=objects.map(object=>({object,geometry:object.geometry,
    material:object.material,parent:object.parent,
    members:Array.isArray(object.material)?[...object.material]:null}));
  const unchangedBindings=()=>{
    for(const b of originalBindings){
      need(b.object.geometry===b.geometry&&b.object.material===b.material&&
        b.object.parent===b.parent&&(!b.members||(Array.isArray(b.material)&&
          b.material.length===b.members.length&&b.members.every((v,i)=>b.material[i]===v))),
        'source object material/geometry/parent binding drift');
    }
  };
  for (const object of objects) {
    for (const node of ancestry(object, sceneRoot)) {
      originalVisibility.set(node, node.visible);
    }
    materialSafe(object);
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of mats) {
      originalMaterialState.set(material, matState(material));
    }
  }
  const unchangedMaterials=()=>{
    unchangedBindings();
    for(const [material,state] of originalMaterialState){
      need(sameMat(material,state),'source material color/depth/texture state drift');
    }
  };
  const unchanged = () => {
    sameCamera();
    for (const [node,visible] of originalVisibility) {
      need(node.visible === visible, 'source/peer/parent visibility changed');
    }
    unchangedMaterials();
  };
  const grab = async () => {
    unchanged();
    const frame = rgbacopy(await captureRGBA(),width,height);
    unchanged();
    return frame;
  };
  const cameraStates={baseline:originalCamera,muted:{},restored:{}};
  const mutedFrames={}, restoredFrames={};
  try {
    const baseline=await grab();
    for (let i=0;i<13;i++) {
      const key=keys[i], object=objects[i];
      unchanged();
      // Mute only the target; every ancestor and all twelve peers remain live.
      object.visible=false;
      let frame;
      try {
        sameCamera();
        need(!object.visible && objects.every(peer => peer===object ||
          peer.visible !== false && ancestry(peer,sceneRoot)),
          'selective visibility');
        frame=rgbacopy(await captureRGBA(),width,height);
        need(!identical(frame,baseline),'muting target did not change RGBA');
        sameCamera();
        unchangedMaterials();
        need(object.visible === false && objects.every(peer=>peer===object ||
          peer.visible !== false && ancestry(peer,sceneRoot)),
          'peer changed while target hidden');
      } finally {
        // Fail closed, even if the WebGL readback throws.
        object.visible=originalVisibility.get(object);
      }
      mutedFrames[key]=frame;
      cameraStates.muted[key]=snapshot();
      const restored=await grab();
      need(identical(restored,baseline),'restore differs at pixel level');
      restoredFrames[key]=restored;
      cameraStates.restored[key]=snapshot();
    }
    return {
      baseline, mutedFrames, restoredFrames, width, height, cameraStates,
      sourceObjectCount:13, captureScope:'CALLER_RENDERER_ONLY',
      originalGlbDigestAuthenticated:false, productionProvenanceVerified:false,
      humanReview:'NOT_RUN',
    };
  } finally {
    // Restore visibility even after a callback modifies a parent or peer.
    for (const [node,visible] of originalVisibility) node.visible=visible;
    for(const b of originalBindings){
      b.object.geometry=b.geometry;b.object.material=b.material;
      if(b.members&&Array.isArray(b.material))b.material.splice(0,b.material.length,...b.members);
    }
    for (const [material,state] of originalMaterialState) restoreMat(material,state);
  }
}
