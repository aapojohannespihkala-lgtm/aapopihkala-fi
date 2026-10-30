import { c80SuccessorContractMatches } from './c80SourceProfiles.mjs';
/**
 * D-asunto C70 1F/2F/BOTH WORK_TEST integration adapter (no Three.js dependency).
 * Requires byte-exact source model and explicit staging-preview opt-in.
 * Exports three operations: verifyC70GLB, createC70Router, attachC70Scene.
 * Fail-closed unsupported combinations; no implicit CURRENT/as-built promotion.
 */
const HEX = (data) => Array.from(new Uint8Array(data), x=>x.toString(16).padStart(2,'0')).join('');
const fail = why => { throw new Error('YLIS_C70_FAIL_CLOSED: '+why); };
const isBuffer = v => v instanceof ArrayBuffer || ArrayBuffer.isView(v);
function toBytes(v) {
  if(!isBuffer(v)) fail('Expected GLB ArrayBuffer/TypedArray');
  return v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer,v.byteOffset,v.byteLength);
}
const encode = x=>new TextEncoder().encode(x);
const stringsEqual = (a,b)=>JSON.stringify(a)===JSON.stringify(b);
const valid = (data,contract) => {
  if(contract?.schema!=='ylisrinne.d-floor-selector.v1' || !['D_C70','D_C80'].includes(contract.model)) fail('Invalid contract');
  const c80=contract.model==='D_C80', sceneCount=c80?(c80SuccessorContractMatches(contract)?contract.sourceSceneCount:4):70, defaultScene=c80?0:33;
  if(c80 && !c80SuccessorContractMatches(contract) && (contract.glbSha256!=='c8230e1877a2fc2cd0c633c5247a92975b4669ae685f491fad9f45092fc11b8d' ||
      contract.glbByteLength!==10044500 || contract.viewerWholeScene!==3 || contract.wholeScene?.sceneIndex!==3)) fail('Different C80 source contract');
  if(c80 && (contract.modes.length!==3 || new Set(contract.modes.map(row=>row.floor)).size!==3 ||
      contract.modes.some(row=>row.sceneIndex!==({BOTH:0,'1F':1,'2F':2})[row.floor] ||
        row.doorMode!=='WORK_TEST'||row.gable!=='NONE'||row.k9Reference!==false))) fail('Different C80 floor map');
  if(contract.current!==false || contract.asBuilt!==false || contract.canPublish!==false || contract.productionReady!==false || contract.canApplyToViewer!==false) fail('Unsafe status policy');
  const b=toBytes(data);
  if(b.length !== contract.glbByteLength) fail('GLB length changed');
  const view=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==b.length) fail('Not intact glTF2 GLB');
  const len=view.getUint32(12,true),typ=view.getUint32(16,true);
  if(typ!==0x4e4f534a||20+len+8>b.length) fail('Invalid JSON chunk');
  const src=new TextDecoder('utf-8',{fatal:true}).decode(b.subarray(20,20+len));
  const j=JSON.parse(src);
  if(j.scenes?.length!==sceneCount||j.scene!==defaultScene||j.asset?.extras?.current!==false||j.asset?.extras?.asBuilt!==false) fail('Different or CURRENT model');
  const memo=new Set();
  for(const row of [...contract.modes,...(c80?[contract.wholeScene]:[])]){
    const sc=j.scenes[row.sceneIndex];
    if(!sc||sc.nodes.length!==row.rootCount||sc.name!==row.sceneName) fail('Scene index / name / root-count mismatch: '+row.sceneIndex);
    const hashKey=JSON.stringify([row.floor,row.doorMode,row.gable,row.k9Reference]);
    if(memo.has(hashKey)) fail('Ambiguous route: '+hashKey);
    memo.add(hashKey);
  }
  return j;
};
export async function verifyC70GLB(glb, contract) {
  const b=toBytes(glb), model=valid(b,contract);
  if(!globalThis.crypto?.subtle) fail('Crypto SHA256 unavailable; never skip source check');
  const actual=HEX(await globalThis.crypto.subtle.digest('SHA-256',b));
  if(actual!==contract.glbSha256) fail('Incorrect GLB SHA256 '+actual);
  // Root membership is not trusted solely because the scene names match; compare SHA locks.
  for(const row of [...contract.modes,...(contract.model==='D_C80'?[contract.wholeScene]:[])]) {
    const roots=model.scenes[row.sceneIndex].nodes;
    const got=HEX(await globalThis.crypto.subtle.digest('SHA-256',encode(JSON.stringify(roots))));
    if(got!==row.rootSha256) fail('Scene root membership differs: '+row.sceneIndex);
  }
  return Object.freeze({verified:true,glbSha256:actual,sceneCount:model.scenes.length,contract:contract.schema,safeForProduction:false});
}
function keyFor(s) {
  if(!s||Object.keys(s).sort().join(',')!=='doorMode,floor,gable,k9Reference') fail('Exact selection properties required');
  const {floor,doorMode,gable,k9Reference}=s;
  if(typeof floor!=='string'||typeof doorMode!=='string'||typeof gable!=='string'||typeof k9Reference!=='boolean') fail('Wrong selection types');
  return JSON.stringify([floor,doorMode,gable,k9Reference]);
}
export function createC70Router(contract,verification) {
  if(verification?.verified!==true||verification.glbSha256!==contract?.glbSha256||verification.safeForProduction!==false) fail('SHA gate not passed');
  if(contract.current!==false||contract.canPublish!==false||contract.productionReady!==false) fail('Status gate changed');
  const m=new Map();
  for(const row of contract.modes){
    const k=keyFor({floor:row.floor,doorMode:row.doorMode,gable:row.gable,k9Reference:row.k9Reference});
    if(m.has(k)) fail('Duplicate contract route');
    m.set(k,Object.freeze({...row}));
  }
  return Object.freeze({
    options:()=>Array.from(m.values()).map(v=>({floor:v.floor,doorMode:v.doorMode,gable:v.gable,k9Reference:v.k9Reference,sceneIndex:v.sceneIndex})),
    route:(selection)=>{const v=m.get(keyFor(selection));if(!v)fail('Unsupported combination or unverified physical host. No fallback to other geometry.');return v;},
    stage:'WORK_TEST_SOURCE_ONLY',
    canPublish:false,
    canApplyToViewer:false
  });
}
export function attachC70Scene(router, gltf, mount, selection, {previewGate,currentScene}={}) {
  if(previewGate!=='EXPLICIT_WORK_TEST_PREVIEW') fail('Production and unsanctioned preview are blocked');
  if(!gltf||!Array.isArray(gltf.scenes)||gltf.scenes.length!==70||typeof mount?.add!=='function'||typeof mount?.remove!=='function')fail('Expected Three GLTFLoader scenes and mount.add/remove');
  const info=router.route(selection), next=gltf.scenes[info.sceneIndex];
  if(!next)fail('GLTFLoader missing scene '+info.sceneIndex);
  // This creates a real scene selection, not a mock name mapping. No geometry/transforms are modified.
  if(currentScene&&currentScene!==next)mount.remove(currentScene);
  if(currentScene!==next)mount.add(next);
  return Object.freeze({selectedScene:next,sceneIndex:info.sceneIndex,viewStage:'WORK_TEST_PREVIEW',physicalHost:'HOLD',allowPublish:false});
}


