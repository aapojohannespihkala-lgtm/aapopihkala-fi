import { HemisphereLight, DirectionalLight } from 'three';
import { D1F_ODENSVIK_PIXEL_TARGETS, countD1FOdensvikPixelDiff } from './privateModelD1FOdensvikTargetPixelProof.mjs';
import { createD1FShowerGlassWebGLCapture } from './privateModelD1FShowerGlassWebGLCapture.mjs';

// Only the independently persisted WORK_TEST derivative. Its midpoint/3 mm seam
// is an UNMEASURED display assumption. Do not publish or approve from this proof.
export const GODMORGON_DRAWER_DERIVED_SOURCE = Object.freeze({
  driveId:'1wXIBORielM6_5UOuD0_-sxrVVlvu_j8h',
  sha256:'9d47f55b6a3c3615566876fd77263bd0fe527337ae5490706ae9e92923ff0b69',
  bytes:8879048,sceneCount:112,nodeCount:2656,seamMesh:768,
  seamNodes:Object.freeze([2652,2653,2654,2655]),
  seamWidthMm:3,drawerCountUserConfirmed:2,seamPositionUserConfirmed:false,
  workTestOnly:true,humanReview:'NOT_RUN',
});
const reject=why=>{throw Error('D1F_GODMORGON_DRAWER_SEAM_REJECTED: '+why);};
const check=(yes,why)=>{if(!yes)reject(why);};
const asBytes=b=>b instanceof Uint8Array?b:b instanceof ArrayBuffer?new Uint8Array(b):null;
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
function subtree(nodes,root){
  const seen=new Set(),pending=[root];
  while(pending.length){
    const n=pending.pop();check(Number.isInteger(n)&&n>=0&&n<nodes.length&&!seen.has(n),'invalid source hierarchy');
    seen.add(n);const children=nodes[n]?.children??[];
    check(Array.isArray(children),'bad source children');pending.push(...children);
  }
  return seen;
}
export async function verifyGodmorgonTwoDrawerDerivedSource(rawGlb){
  const b=asBytes(rawGlb),e=GODMORGON_DRAWER_DERIVED_SOURCE;
  check(b?.byteLength===e.bytes&&globalThis.crypto?.subtle?.digest,'raw source missing');
  const d=new DataView(b.buffer,b.byteOffset,b.byteLength);
  check(d.getUint32(0,true)===0x46546c67&&d.getUint32(4,true)===2&&
    d.getUint32(8,true)===e.bytes&&d.getUint32(16,true)===0x4e4f534a,'GLB header');
  const end=20+d.getUint32(12,true);
  check(end+8<e.bytes&&d.getUint32(end+4,true)===0x004e4942&&
    end+8+d.getUint32(end,true)===e.bytes,'GLB JSON/BIN chunks');
  const sha=hex(await globalThis.crypto.subtle.digest('SHA-256',b));
  check(sha===e.sha256,'untrusted GLB SHA');
  let g;
  try{g=JSON.parse(new TextDecoder().decode(b.subarray(20,end)));}
  catch{reject('invalid GLB JSON');}
  check(g.scenes?.length===112&&g.nodes?.length===2656&&
    g.meshes?.[768]?.name==='WORK_TEST_GODMORGON_TWO_DRAWER_FRONT_SEAM_3MM'&&
    g.meshes[768].primitives?.length===1,'derived model roster');
  const variants=[];
  for(let i=0;i<4;i++){
    const v=D1F_ODENSVIK_PIXEL_TARGETS[i],seamNode=e.seamNodes[i];
    const scene=g.scenes[v.scene],root=g.nodes[v.root],seam=g.nodes[seamNode];
    check(scene?.nodes?.length===1&&scene.nodes[0]===v.root&&scene.name?.includes(v.variant)&&
      scene.extras?.WORK_TEST_ONLY===true&&scene.extras?.current===false&&
      scene.extras?.Canonical===false&&scene.extras?.asBuilt===false&&
      scene.extras?.publishToCURRENT===false&&scene.extras?.HUMAN_REVIEW==='NOT_RUN',
      'scene review/source boundary');
    check(root?.children?.at(-1)===seamNode&&seam?.mesh===768&&
      seam.name==='WORK_TEST_GODMORGON_TWO_DRAWER_FRONT_SEAM_SCENE'+v.scene&&
      seam.extras?.originalCabinetNode===v.targets[2][1]&&
      seam.extras?.WORK_TEST_ONLY===true&&seam.extras?.twoDrawersUserConfirmed===true&&
      seam.extras?.drawerDividerExactPositionConfirmed===false&&seam.extras?.humanReview==='NOT_RUN',
      'seam attachment or false approval');
    const reachable=subtree(g.nodes,v.root);
    const refs=[root.extras?.counterNode,root.extras?.cabinetNode,
      ...Object.values(root.extras?.surfaceNodes??{}),
      ...Object.values(root.extras?.themoNodes??{})];
    check(reachable.has(seamNode)&&refs.length===10&&new Set(refs).size===10&&
      refs.every(x=>reachable.has(x))&&root.extras?.counterNode===v.targets[0][1]&&
      root.extras?.cabinetNode===v.targets[2][1]&&
      v.targets.every(([,node,mesh,parts])=>reachable.has(node)&&
        g.nodes[node]?.mesh===mesh&&g.meshes[mesh]?.primitives?.length===parts),
      'stale 40/40 semantic pointers');
    variants.push(Object.freeze({variant:v.variant,scene:v.scene,root:v.root,
      seamNode,seamMesh:768,cabinetNode:v.targets[2][1],semanticPointers:10}));
  }
  return Object.freeze({sha256:sha,bytes:b.byteLength,sceneCount:112,
    semanticPointersVerified:40,seamNodesVerified:4,workTestOnly:true,
    productionPublicationVerified:false,authenticatedProductionVerified:false,
    humanReview:'NOT_RUN',variants:Object.freeze(variants)});
}
// This renders ORIGINAL GLTFLoader seam objects; it never replaces them with proxies.
// Production login, one-link autoload, and human review are separate evidence gates.
export async function runGodmorgonDrawerSeamSourcePixelProof({
  rawGlb,loader,renderer,target,cameras,width,height,
}={}){
  const verified=await verifyGodmorgonTwoDrawerDerivedSource(rawGlb);
  check(typeof loader?.parseAsync==='function'&&renderer?.isWebGLRenderer===true&&
    target?.isWebGLRenderTarget===true&&Array.isArray(cameras)&&cameras.length===4&&
    cameras.every(c=>c?.isCamera===true)&&Number.isInteger(width)&&width>=32&&width<=4096&&
    Number.isInteger(height)&&height>=32&&height<=4096,'real render dependencies required');
  const gltf=await loader.parseAsync(asBytes(rawGlb).slice().buffer,'/private-model/work-test/');
  check(gltf?.scenes?.length===112&&gltf.parser?.associations instanceof Map,'GLTFLoader source unavailable');
  const take=createD1FShowerGlassWebGLCapture({renderer,target,width,height});
  const pixels=[];
  for(let i=0;i<4;i++){
    const v=verified.variants[i],scene=gltf.scenes[v.scene],camera=cameras[i];
    check(scene?.isObject3D&&scene.children?.length===1&&
      scene.children[0].name?.includes(v.variant),'wrong loaded variant');
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const hits=[];
    scene.traverse(obj=>{
      const a=gltf.parser.associations.get(obj);
      if(a?.nodes===v.seamNode&&a?.meshes===v.seamMesh&&
        Object.keys(a).length===2)hits.push(obj);
    });
    check(hits.length===1&&hits[0].isMesh===true&&hits[0].visible===true,'seam mesh missing');
    const mesh=hits[0],cameraState=JSON.stringify([camera.position.toArray(),
      camera.quaternion.toArray(),camera.projectionMatrix.elements,camera.matrixWorldInverse.elements]);
    const capture=async()=>{
      const rgba=await take({scene,camera});
      check(rgba instanceof Uint8Array&&rgba.length===width*height*4,'invalid framebuffer');
      return rgba.slice();
    };
    // GLTF scene carries no source light objects. PBR seam material is
    // non-emissive, so use stable temporary lighting for baseline/hide/restore.
    // These diagnostic lights do not alter the persisted source scene.
    const ambient=new HemisphereLight(0xffffff,0x777777,2.2);
    const key=new DirectionalLight(0xffffff,2);
    key.position.set(8,14,10);
    scene.add(ambient,key);
    try{
      const before=await capture();
      let hidden;
      try{mesh.visible=false;hidden=await capture();}
      finally{mesh.visible=true;}
      const restored=await capture();
      check(mesh.visible===true&&JSON.stringify([camera.position.toArray(),
        camera.quaternion.toArray(),camera.projectionMatrix.elements,camera.matrixWorldInverse.elements])===cameraState,
        'camera/mesh not restored');
      pixels.push(Object.freeze({...v,
        ...countD1FOdensvikPixelDiff(before,hidden,restored,{threshold:8,minimum:12})}));
    }finally{
      mesh.visible=true;
      scene.remove(ambient,key);
    }
  }
  return Object.freeze({...verified,individualSourcePixels:pixels,
    sourcePixelProof:pixels.length===4&&pixels.every(x=>x.visible)?'PASS_SOURCE_ONLY':'FAIL',
    authenticatedProductionVerified:false,oneLinkAutoloadVerified:false,
    individualProductionPixelsVerified:false,humanReview:'NOT_RUN'});
}
