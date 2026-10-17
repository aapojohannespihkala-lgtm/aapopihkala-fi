import { Box3, DirectionalLight, HemisphereLight, Vector3 } from 'three';
import { createD1FShowerGlassWebGLCapture } from './privateModelD1FShowerGlassWebGLCapture.mjs';

// ODENSVIK original-GLB diagnostic; never authenticates the production origin.
const EXPECTED_SHA = '362f5dce1041e8f529ed8f69a10d06dad58b59d8bfad0fe9db31c62d870f2e25';
const EXPECTED_SIZE = 8876156;
const WC_SHA = '43d2a17e3f551afb552adbc87d05618e1d22aacd5cbbdd0ffa15625e588264ab';
export const D1F_ODENSVIK_PIXEL_TARGETS = Object.freeze([
  { variant:'WEST_ANCHOR_725_895_740',scene:108,root:2428,targets:[['counter',2467,765,1],['bowl',2478,766,3],['cabinet',2469,624,1]] },
  { variant:'WEST_ANCHOR_740_895_725',scene:109,root:2484,targets:[['counter',2523,765,1],['bowl',2534,766,3],['cabinet',2525,633,1]] },
  { variant:'EAST_ANCHOR_725_895_740',scene:110,root:2540,targets:[['counter',2579,765,1],['bowl',2590,767,3],['cabinet',2581,642,1]] },
  { variant:'EAST_ANCHOR_740_895_725',scene:111,root:2596,targets:[['counter',2635,765,1],['bowl',2646,767,3],['cabinet',2637,651,1]] },
]);
const reject = why => { throw new Error('D1F_ODENSVIK_TARGET_PIXELS_REJECTED: '+why); };
const check = (condition,why) => { if(!condition)reject(why); };
const bytesOf = raw => raw instanceof Uint8Array?raw:raw instanceof ArrayBuffer?new Uint8Array(raw):null;
const strDigest = bytes => [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
const descendants=(nodes,root)=>{
  const found=new Set(),queue=[root];
  while(queue.length){
    const i=queue.pop();
    check(Number.isInteger(i)&&i>=0&&i<nodes.length&&!found.has(i),'malformed source scene graph');
    found.add(i);
    const kids=nodes[i]?.children??[];
    check(Array.isArray(kids),'invalid child roster');queue.push(...kids);
  }
  return found;
};
export async function verifyD1FOdensvikPixelSource(raw){
  const bytes=bytesOf(raw);
  check(bytes?.byteLength===EXPECTED_SIZE && globalThis.crypto?.subtle?.digest,'raw source unavailable');
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  check(v.getUint32(0,true)===0x46546c67&&v.getUint32(4,true)===2&&
    v.getUint32(8,true)===EXPECTED_SIZE&&v.getUint32(16,true)===0x4e4f534a,'GLB header');
  const jsonEnd=20+v.getUint32(12,true);
  check(jsonEnd+8<EXPECTED_SIZE&&v.getUint32(jsonEnd+4,true)===0x004e4942&&
    jsonEnd+8+v.getUint32(jsonEnd,true)===EXPECTED_SIZE,'GLB chunks');
  const actual=strDigest(await globalThis.crypto.subtle.digest('SHA-256',bytes));
  check(actual===EXPECTED_SHA,'obsolete four-pointer or other untrusted source SHA');
  let rawJson;
  try{rawJson=JSON.parse(new TextDecoder().decode(bytes.subarray(20,jsonEnd)));}
  catch{reject('invalid source JSON');}
  check(rawJson.scenes?.length===112&&rawJson.nodes?.length===2652,'GLB roster');
  for(const v of D1F_ODENSVIK_PIXEL_TARGETS){
    const scene=rawJson.scenes[v.scene],root=rawJson.nodes[v.root]?.extras;
    check(scene?.nodes?.length===1&&scene.nodes[0]===v.root&&
      scene.name?.includes(v.variant)&&scene.extras?.WORK_TEST_ONLY===true&&
      scene.extras.current===false&&scene.extras.Canonical===false&&
      scene.extras.asBuilt===false&&scene.extras.publishToCURRENT===false&&
      scene.extras.HUMAN_REVIEW==='NOT_RUN'&&
      scene.extras.parentApprovedWCModelSha256===WC_SHA&&
      root?.WORK_TEST_ONLY===true&&root.current===false&&root.Canonical===false&&
      root.asBuilt===false&&root.publishToCURRENT===false&&root.HUMAN_REVIEW==='NOT_RUN',
      'non-WORK_TEST scene or WC approval mismatch');
    const reachable=descendants(rawJson.nodes,v.root);
    const links=[root.counterNode,root.cabinetNode,...Object.values(root.surfaceNodes??{}),...Object.values(root.themoNodes??{})];
    check(links.length===10&&new Set(links).size===10&&links.every(i=>reachable.has(i))&&
      root.counterNode===v.targets[0][1]&&root.cabinetNode===v.targets[2][1]&&
      v.targets.every(([,node,mesh,count])=>reachable.has(node)&&
        rawJson.nodes[node]?.mesh===mesh&&rawJson.meshes[mesh]?.primitives?.length===count),
      'stale semantic pointers or wrong source mesh');
  }
  return Object.freeze({sha256:actual,bytes:bytes.byteLength,semanticPointersVerified:40,workTestOnly:true});
}
// Conservative object-space footprint in the *bottom-left-origin* RGBA
// coordinates used by WebGLRenderer.readRenderTargetPixels. A changed pixel
// elsewhere in the frame cannot prove that this original source mesh rendered.
export function projectD1FOdensvikObjectPixelRoi(object,camera,width,height,{padding=6}={}){
  check(object?.isObject3D&&camera?.isCamera&&
    Number.isInteger(width)&&width>=32&&width<=4096&&
    Number.isInteger(height)&&height>=32&&height<=4096&&
    Number.isInteger(padding)&&padding>=0&&padding<=64,
    'real source object/camera/framebuffer required for projected ROI');
  object.updateWorldMatrix(true,true);
  camera.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(object);
  check(!bounds.isEmpty()&&
    [...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite),
    'original target has no finite world bounds');
  let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
  for(const x of [bounds.min.x,bounds.max.x])
    for(const y of [bounds.min.y,bounds.max.y])
      for(const z of [bounds.min.z,bounds.max.z]){
        const p=new Vector3(x,y,z).project(camera);
        // Do not extrapolate an AABB across the near/far clipping planes.
        check([p.x,p.y,p.z].every(Number.isFinite)&&p.z>-1&&p.z<1,
          'original target crosses camera clipping planes');
        const px=(p.x+1)*width/2,py=(p.y+1)*height/2;
        left=Math.min(left,px);right=Math.max(right,px);
        bottom=Math.min(bottom,py);top=Math.max(top,py);
      }
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const roi=Object.freeze({
    left:clamp(Math.floor(left-padding),0,width),
    right:clamp(Math.ceil(right+padding),0,width),
    bottom:clamp(Math.floor(bottom-padding),0,height),
    top:clamp(Math.ceil(top+padding),0,height),
  });
  check(roi.right>roi.left&&roi.top>roi.bottom,
    'original target projected completely outside framebuffer');
  return roi;
}
export function countD1FOdensvikPixelDiff(before,hidden,restored,{
  threshold=12,minimum=32,roi=null,width=null,height=null,
}={}){
  check(before instanceof Uint8Array&&hidden instanceof Uint8Array&&restored instanceof Uint8Array&&
    before.length===hidden.length&&hidden.length===restored.length&&before.length%4===0,
    'invalid framebuffer lengths');
  if(roi!==null)check(Number.isInteger(width)&&Number.isInteger(height)&&
    width>=1&&height>=1&&before.length===width*height*4&&
    [roi.left,roi.right,roi.bottom,roi.top].every(Number.isInteger)&&
    roi.left>=0&&roi.right<=width&&roi.right>roi.left&&
    roi.bottom>=0&&roi.top<=height&&roi.top>roi.bottom,
    'invalid source-object pixel ROI');
  let changed=0,drift=0;
  for(let i=0;i<before.length;i+=4){
    const pixel=i/4;
    const inside=!roi||(
      pixel%width>=roi.left&&pixel%width<roi.right&&
      Math.floor(pixel/width)>=roi.bottom&&Math.floor(pixel/width)<roi.top);
    if(inside&&Math.max(...[0,1,2].map(n=>Math.abs(before[i+n]-hidden[i+n])))>threshold)changed++;
    // Restoration must be exact everywhere, not only inside the source ROI.
    if(Math.max(...[0,1,2,3].map(n=>Math.abs(before[i+n]-restored[i+n])))>2)drift++;
  }
  return Object.freeze({changedPixels:changed,restoredDriftPixels:drift,visible:changed>=minimum&&drift===0});
}
function associatedTarget(gltf,scene,[name,node,mesh,parts]){
  let result=null,count=0;
  scene.traverse(object=>{
    const assoc=gltf.parser.associations.get(object);
    if(assoc?.nodes===node&&assoc?.meshes===mesh&&Object.keys(assoc).length===2){result=object;count++;}
  });
  check(count===1&&result?.visible===true,'target missing or invisible '+name);
  if(parts===1)check(result.isMesh===true,'wrong source mesh '+name);
  else check(result.children?.length===3&&result.children.every((c,i)=>{
    const a=gltf.parser.associations.get(c);
    return c.isMesh===true&&a?.meshes===mesh&&a?.primitives===i&&Object.keys(a).length===2;
  }),'bowl primitives not from expected original GLB');
  return result;
}
const capture=async (take,scene,camera,width,height)=>{
  const rgba=await take({scene,camera});
  check(rgba instanceof Uint8Array&&rgba.byteLength===width*height*4,'not an RGBA framebuffer');
  return rgba.slice();
};
/** Caller must supply a real WebGLRenderer, render target, GLTFLoader and
 * a camera that actually exposes all three original source objects.
 * This does not claim production authentication or original autoload. */
export async function runD1FOdensvikSourcePixelProof({
  rawGlb,loader,renderer,target,camera,width,height,
}={}){
  const verified=await verifyD1FOdensvikPixelSource(rawGlb);
  check(typeof loader?.parseAsync==='function'&&renderer?.isWebGLRenderer&&
    target?.isWebGLRenderTarget&&camera?.isCamera&&
    Number.isInteger(width)&&width>=32&&width<=4096&&
    Number.isInteger(height)&&height>=32&&height<=4096,'real renderer/parser/camera required');
  const raw=bytesOf(rawGlb).slice();
  const gltf=await loader.parseAsync(raw.buffer,'/private-model/work-test/');
  check(gltf?.scenes?.length===112&&gltf.parser?.associations instanceof Map,'GLTFLoader parser association roster');
  const take=createD1FShowerGlassWebGLCapture({renderer,target,width,height});
  const results=[];
  for(const v of D1F_ODENSVIK_PIXEL_TARGETS){
    const scene=gltf.scenes[v.scene];
    check(scene?.isObject3D&&scene.children?.length===1&&scene.children[0].name?.includes(v.variant),
      'wrong GLTFLoader scene '+v.scene);
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const original=v.targets.map(t=>associatedTarget(gltf,scene,t));
    const ambient=new HemisphereLight(0xffffff,0x777777,2.2);
    const key=new DirectionalLight(0xffffff,2);key.position.set(8,14,10);
    scene.add(ambient,key);
    const cameraState=JSON.stringify([camera.position.toArray(),camera.quaternion.toArray(),
      camera.projectionMatrix.elements,camera.matrixWorldInverse.elements]);
    const stable=()=>JSON.stringify([camera.position.toArray(),camera.quaternion.toArray(),
      camera.projectionMatrix.elements,camera.matrixWorldInverse.elements])===cameraState;
    try{
      for(let k=0;k<v.targets.length;k++){
        const [name,node,mesh]=v.targets[k],obj=original[k];
        check(stable()&&original.every(x=>x.visible),'camera or target state drift');
        const before=await capture(take,scene,camera,width,height);
        let hidden;
        try{obj.visible=false;hidden=await capture(take,scene,camera,width,height);}
        finally{obj.visible=true;}
        const restored=await capture(take,scene,camera,width,height);
        check(stable()&&original.every(x=>x.visible),'target not restored');
        const pixelRoi=projectD1FOdensvikObjectPixelRoi(obj,camera,width,height);
        results.push({variant:v.variant,sceneIndex:v.scene,target:name,node,mesh,
          pixelRoi,
          ...countD1FOdensvikPixelDiff(before,hidden,restored,{roi:pixelRoi,width,height})});
      }
    }finally{scene.remove(ambient,key);original.forEach(x=>x.visible=true);}
  }
  return Object.freeze({...verified,targetProofCount:results.length,targets:results,
    sourcePixelProof:results.length===12&&results.every(x=>x.visible)?'PASS_SOURCE_ONLY':'FAIL',
    authenticatedProductionOriginVerified:false,oneLinkAutoloadVerified:false,
    individualProductionPixelsVerified:false,humanReview:'NOT_RUN',
    current:false,canonical:false,asBuilt:false});
}
