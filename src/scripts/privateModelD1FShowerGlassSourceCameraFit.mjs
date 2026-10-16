/** Source-scene glass camera framing, presentation-only, not original-byte authentication.
 * The caller MUST authenticate full original GLB and read actual selected mesh bounds first.
 */
export const SHOWER_SOURCE = Object.freeze({
  bytes:8914072, sha256:'992819363a6e368546e870f9ff2a17ddf0904e760269fc20aec509aa310ba35e',
  scenes:Object.freeze([
    Object.freeze({sceneIndex:120,rootNode:2457,glassNode:2456}),
    Object.freeze({sceneIndex:121,rootNode:2459,glassNode:2458}),
    Object.freeze({sceneIndex:122,rootNode:2461,glassNode:2460}),
    Object.freeze({sceneIndex:123,rootNode:2463,glassNode:2462}),
  ]),
});
const fail = why => { throw new Error('D1F_GLASS_CAMERA_SOURCE_REJECTED:'+why); };
const f=n => typeof n==='number'&&Number.isFinite(n);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=a=>Math.sqrt(dot(a,a));
const unit=a=>a.map(x=>x/norm(a));
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
const mul=(a,n)=>a.map(x=>x*n);

/**
 * Returns a nonmutating, FOV-aware THREE.PerspectiveCamera pose for source glass.
 * Input bounds MUST come from actual source mesh777 in selected scene after
 * modelRoot/world transforms. No caller boolean can authenticate those bytes.
 */
export function planD1FSourceGlassCamera({source, sceneIndex, rootNode, glassNode,
    glassMeshIndex, glassWorldBounds, viewportWidth, viewportHeight, verticalFovDeg=38}={}) {
  const row=SHOWER_SOURCE.scenes.find(v=>v.sceneIndex===sceneIndex);
  if(!row||rootNode!==row.rootNode||glassNode!==row.glassNode||glassMeshIndex!==777||
     source?.bytes!==SHOWER_SOURCE.bytes||source?.sha256!==SHOWER_SOURCE.sha256||
     !Number.isInteger(viewportWidth)||!Number.isInteger(viewportHeight)||
     viewportWidth<320||viewportHeight<320||viewportWidth>4096||viewportHeight>4096||
     !f(verticalFovDeg)||verticalFovDeg<20||verticalFovDeg>80) fail('scene, source, viewport or FOV');
  const min=glassWorldBounds?.min,max=glassWorldBounds?.max;
  if(!Array.isArray(min)||!Array.isArray(max)||min.length!==3||max.length!==3||
     !min.concat(max).every(f)||!min.every((x,i)=>max[i]>x)||
     max.some((x,i)=>max[i]-min[i]>4)) fail('source bounds');
  const target=min.map((x,i)=>(x+max[i])/2);
  const radius=norm(max.map((x,i)=>(x-min[i])/2));
  if(radius<.2||radius>3||Math.abs(target[0])>50||Math.abs(target[1])>50||Math.abs(target[2])>50) fail('untrusted bounds scale');
  const aspect=viewportWidth/viewportHeight;
  const vfov=verticalFovDeg*Math.PI/180;
  const hfov=2*Math.atan(Math.tan(vfov/2)*aspect);
  const half=Math.min(vfov,hfov)/2;
  // 1.5x enclosing-sphere margin, guaranteed room for the whole original object.
  const distance=Math.max(2.8,1.5*radius/Math.sin(half));
  const forward=unit([-.78,-.48,-.92]); // camera -> source, view up world +Y
  const position=minus(target,mul(forward,distance));
  const right=unit(cross(forward,[0,1,0]));
  const up=unit(cross(right,forward));
  const near=Math.max(0.001,(distance-radius)/100),far=Math.max(1000,distance+radius+30);
  return Object.freeze({sceneIndex,rootNode,glassNode,glassMeshIndex,viewportWidth,viewportHeight,
    verticalFovDeg,horizontalFovDeg:hfov*180/Math.PI,position:Object.freeze(position),
    target:Object.freeze(target),up:Object.freeze([0,1,0]),cameraForward:Object.freeze(forward),
    cameraRight:Object.freeze(right),cameraTrueUp:Object.freeze(up),near,far,distance,
    sourceSha256:SHOWER_SOURCE.sha256,sourceSizeBytes:SHOWER_SOURCE.bytes,
    presentationOnly:true,sourceWorldBoundsProvenance:'CALLER_BOUND_ORIGINAL_GLTF_MESH_777',
    originalSourceBytesAuthenticatedByHelper:false,productionPixelEvidence:false,
    humanReview:'NOT_RUN',current:false,canonical:false,asBuilt:false});
}
