import { D1F_SHOWER_PHOTO_SOURCE, D1F_SHOWER_PHOTO_VARIANTS } from './privateModelD1FShowerPhotoSourceContract.mjs';
import { D1F_SHOWER_GLASS_PARTS, D1F_SHOWER_GLASS_PIXEL_CANDIDATE, evaluateD1FShowerGlassPixelEvidence } from './privateModelD1FShowerGlassPixelEvidence.mjs';

/**
 * Collects frames from a caller's REAL renderer, with a distinct suppression of
 * each source primitive. This module cannot independently attest that the
 * caller is an authenticated production browser or that input GLB bytes are
 * original; those attestations belong to the outer browser/byte collector.
 * Synthetic tests of this module NEVER count as production pixel evidence.
 */
const fail = why => { throw new Error('D1F_SHOWER_FRAME_COLLECTOR_REJECTED: ' + why); };
const need = (condition, why) => { if (!condition) fail(why); };
const finite = n => typeof n === 'number' && Number.isFinite(n);
const matrix = o => Array.isArray(o?.elements) && o.elements.length === 16 &&
  o.elements.every(finite) ? o.elements : null;
const mul = (m, p) => [
  m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12]*p[3],
  m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13]*p[3],
  m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]*p[3],
  m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15]*p[3],
];
function cameraState(camera) {
  const position = camera?.position?.toArray?.();
  const quaternion = camera?.quaternion?.toArray?.();
  const projection = matrix(camera?.projectionMatrix);
  const inverse = matrix(camera?.matrixWorldInverse);
  need(Array.isArray(position) && position.length===3 && position.every(finite) &&
    Array.isArray(quaternion) && quaternion.length===4 && quaternion.every(finite) &&
    projection && inverse, 'missing exact render camera state');
  return JSON.stringify({position, quaternion, projection, inverse});
}
function sameMaterials(meshes, original) {
  return meshes.every((mesh,i) => {
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    return materials.length===original[i].length && materials.every((m,j) => {
      const a=original[i][j];
      return m===a.ref && m.visible===a.visible && m.opacity===a.opacity &&
        m.transparent===a.transparent && m.depthTest===a.depthTest &&
        m.depthWrite===a.depthWrite && m.map===a.map;
    });
  });
}
function materialState(meshes) {
  return meshes.map(mesh => {
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    need(mats.length===1 && mats[0] && mats[0].visible!==false &&
      finite(Number(mats[0].opacity ?? 1)) && Number(mats[0].opacity ?? 1)>0,
      'unrenderable source primitive material');
    return mats.map(m=>({ref:m,visible:m.visible,opacity:m.opacity,
      transparent:m.transparent,depthTest:m.depthTest,depthWrite:m.depthWrite,map:m.map}));
  });
}
/** Projects actual source-primitive POSITION vertices, never guessed screen ROIs. */
export function projectD1FShowerPrimitiveRoi(mesh,camera,width,height) {
  const attr=mesh?.geometry?.getAttribute?.('position');
  const model=matrix(mesh?.matrixWorld);
  const view=matrix(camera?.matrixWorldInverse);
  const projection=matrix(camera?.projectionMatrix);
  need(attr && Number.isInteger(attr.count) && attr.count>=3 && attr.count<=100000 &&
    model && view && projection && width>=32 && height>=32 && width<=4096 && height<=4096,
    'missing original primitive vertices or matrices');
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(let i=0;i<attr.count;i++){
    const xyz=[attr.getX(i),attr.getY(i),attr.getZ(i),1];
    need(xyz.slice(0,3).every(finite),'nonfinite original primitive vertex');
    const clip=mul(projection,mul(view,mul(model,xyz)));
    need(clip.every(finite) && clip[3]>1e-6,'primitive projection behind camera');
    const x=(clip[0]/clip[3]+1)*width/2;
    const y=(1-clip[1]/clip[3])*height/2; // top-left RGBA row origin required
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);
    minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  const x=Math.max(0,Math.floor(minX)-2),y=Math.max(0,Math.floor(minY)-2);
  const right=Math.min(width,Math.ceil(maxX)+2),bottom=Math.min(height,Math.ceil(maxY)+2);
  const roi={x,y,width:right-x,height:bottom-y};
  need(roi.width>=8 && roi.height>=8 && roi.width<width && roi.height<height,
    'primitive not framed well enough to prove separate visibility');
  return roi;
}
async function cameraHash(snapshot) {
  need(typeof globalThis.crypto?.subtle?.digest==='function','no strong camera fingerprint');
  const b=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(snapshot));
  return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
}
function frame(rgba,width,height,common) {
  need(rgba instanceof Uint8Array && rgba.length===width*height*4,
    'expected real top-left-origin RGBA readback');
  return {...common,width,height,rgba:rgba.slice()};
}

/**
 * The caller must provide a GLTFLoader-parsed gltf with parser.associations,
 * a real scene render readback function captureRGBA({scene,camera}), and the
 * exact 8,914,072-byte already-verified source identity. All four variants
 * must be selected, loaded and rendered. This does not fetch or publish.
 */
export async function collectD1FShowerGlassPrimitiveFrames({
  gltf,camera,width,height,sourceBytes,sourceSha256,captureRGBA
}={}) {
  need(gltf?.scenes?.length===124 && gltf?.parser?.associations instanceof Map &&
    sourceBytes===D1F_SHOWER_PHOTO_SOURCE.bytes &&
    sourceSha256===D1F_SHOWER_PHOTO_SOURCE.sha256 &&
    Number.isInteger(width) && Number.isInteger(height) &&
    width>=32 && height>=32 && width<=4096 && height<=4096 &&
    typeof captureRGBA==='function', 'original GLB identity, scene roster or renderer');
  const samples=[];
  for(const v of D1F_SHOWER_PHOTO_VARIANTS) {
    const scene=gltf.scenes[v.sceneIndex];
    need(scene && typeof scene.traverse==='function','missing requested scene');
    let group=null,duplicates=0;
    scene.traverse(object=>{
      const match=gltf.parser.associations.get(object);
      // Three.js 0.185 GLTFLoader associations are { nodes: N, meshes: M },
      // not invented { type: 'nodes', index: N } descriptors.
      if(match?.nodes===v.glassNode && match?.meshes===777 &&
         Object.keys(match).length===2){group=object;duplicates++;}
    });
    need(duplicates===1 && group?.children?.length===3 &&
      group.children.every(child=>child?.isMesh===true),'source glass node and 3 exact primitive children');
    const meshes=group.children;
    for(let i=0;i<3;i++){
      const pair=gltf.parser.associations.get(meshes[i]);
      // Actual parser association is { meshes: 777, primitives: i }.
      // Strict primitive-index identity prevents left/right/frame interchange.
      need(pair?.meshes===777 && pair?.primitives===i &&
        Object.keys(pair).length===2,
        'primitive is not the indexed source primitive from glTF mesh 777');
    }
    const vis=meshes.map(m=>m.visible);
    need(vis.every(Boolean),'source glass primitive initially invisible');
    const materials=materialState(meshes);
    const state=cameraState(camera),fingerprint=await cameraHash(state);
    const common={sourceSha256,sceneIndex:v.sceneIndex,variant:v.name,
      cameraFingerprint:fingerprint};
    const grab=async()=>{
      need(cameraState(camera)===state && meshes.every((m,i)=>m.visible===vis[i]) &&
        sameMaterials(meshes,materials),'camera, peer visibility or material drift');
      return frame(await captureRGBA({scene,camera}),width,height,common);
    };
    const baseline=await grab();
    for(const p of D1F_SHOWER_GLASS_PARTS) {
      const mesh=meshes[p.primitiveIndex],roi=projectD1FShowerPrimitiveRoi(mesh,camera,width,height);
      need(cameraState(camera)===state,'camera moved during primitive projection');
      let suppressed;
      try {
        mesh.visible=false;
        need(meshes.every((m,i)=>i===p.primitiveIndex?m.visible===false:m.visible===vis[i]),
          'muted an unrelated source primitive');
        suppressed=frame(await captureRGBA({scene,camera}),width,height,common);
        need(cameraState(camera)===state && sameMaterials(meshes,materials) &&
          meshes.every((m,i)=>i===p.primitiveIndex?m.visible===false:m.visible===vis[i]),
          'muted source material or camera drift');
      } finally {mesh.visible=vis[p.primitiveIndex];}
      const restored=await grab();
      samples.push({
        candidateId:D1F_SHOWER_GLASS_PIXEL_CANDIDATE,sourceBytes,sourceSha256,
        variant:v.name,sceneIndex:v.sceneIndex,rootNode:v.rootNode,glassNode:v.glassNode,
        meshIndex:777,primitiveIndex:p.primitiveIndex,part:p.part,
        targetIsolationMethod:'SOURCE_GLTF_MESH_777_PRIMITIVE_'+p.primitiveIndex+'_ONLY',
        targetIdentityVerified:true,singlePrimitiveSuppressionVerified:true,
        sameCameraVerified:true,suppressionRestoredVerified:true,
        roiProvenance:'PROJECTED_EXACT_GLASS_PRIMITIVE_GEOMETRY',
        cameraFingerprint:fingerprint,roi,frames:{baseline,suppressed,restored}
      });
    }
    need(meshes.every((m,i)=>m.visible===vis[i]) &&
      sameMaterials(meshes,materials),'source scene not restored');
  }
  const evaluated=evaluateD1FShowerGlassPixelEvidence(samples);
  return Object.freeze({...evaluated,collector:'REAL_RENDER_READBACK_CALLER_REQUIRED',
    collectorSourceByteAuthentication:false,collectorBrowserAuthentication:false,
    collectorProductionOriginAuthentication:false,humanReview:'NOT_RUN',
    current:false,canonical:false,asBuilt:false});
}
