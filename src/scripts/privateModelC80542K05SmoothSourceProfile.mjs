/**
 * Source-only C80 542 K05 ROOM3 smooth-lever receiver, owner correction 15.11.2026.
 * The caller MUST authenticate the full original GLB SHA-256 before passing its JSON.
 * Does not register sourceLinks, mount a viewer, certify physical hardware or publish.
 */
export const C80_542_K05_SMOOTH = Object.freeze({
  zipDriveId: '1-QAFBIt4QnPsNwfnbLryp03zlI39Gjmq',
  zipSha256: 'f4b3aaa49ceafec85ff4cded59bf0058670c620349b169c51ddd253176ceab69',
  glbSha256: '3e5426d8626ce57d4ab2fe95e097f60cb6c0f06f7c68767bad08dde9687623d1',
  glbBytes: 55698080,
  sourceGlbSha256: 'fe385142516a82d179a4b72f0f34b65521d6734d9908c3ef86bd7630108ed0e6',
  sourceZipDriveId: '1kjUpRz7Jf4fclyQawNiw6hf3ny3KF1X8',
  stage: 'WORK_TEST_HOST_HOLD',
});
export const K05_REJECTED_OLD_GLB_SHA256 = Object.freeze([
  C80_542_K05_SMOOTH.sourceGlbSha256,
  '61538f95f06a7405592c5d1949437c626eef10dfc5a0c25112e454a09591745d',
]);
const rows = [
  [536,530,'1F',294,'ef21913f','ef21913f',1364],
  [537,531,'2F',188,'39a2c2df','b708650b',808],
  [538,532,'BOTH',475,'f0f0beaa','17026826',2156],
  [539,533,'BOTH',475,'fb29744e','5d6d4b82',2156],
  [540,534,'BOTH',475,'f308d930','bc3198bc',2156],
  [541,535,'BOTH',475,'87f27dcb','30fea9ff',2155],
];
export const C80_542_K05_SCENES = Object.freeze(Object.fromEntries(
  rows.map(([index,parent,floor,roots,rootFnv,parentRootFnv,liveNodes])=>[
    index,Object.freeze({index,parent,floor,roots,rootFnv,parentRootFnv,liveNodes})
  ])
));
export const K05_BLACK_RECESS_NODES = Object.freeze([12199,12200,12201,12205,12206,12207]);
export const K05_PHOTO_HANDLE_NODES = Object.freeze([12195,12196,12197,12198,12202,12203,12204,12208,12209]);
const SAME=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
export function c80542K05Fnv32(ids){
  if(!Array.isArray(ids)||ids.some(v=>!Number.isInteger(v)||v<0))return null;
  let h=2166136261;
  for(const id of ids)h=Math.imul(h^id,16777619)>>>0;
  return h.toString(16).padStart(8,'0');
}
export function c80542K05RootDelta(oldRoots,newRoots,door){
  if(!Array.isArray(oldRoots)||!Array.isArray(newRoots)||
     new Set(oldRoots).size!==oldRoots.length||
     new Set(newRoots).size!==newRoots.length)return false;
  if(!door)return SAME(oldRoots,newRoots);
  if(oldRoots.filter(id=>id===12222).length!==1||
     oldRoots.some(id=>id===12258))return false;
  return SAME(newRoots,oldRoots.map(id=>id===12222?12258:id));
}
export function c80542K05Reachable(nodes,roots){
  if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
  const todo=[...roots],seen=new Set();
  while(todo.length){
    const id=todo.pop();
    if(!Number.isInteger(id)||id<0||id>=nodes.length||!nodes[id])return null;
    if(seen.has(id))continue;
    seen.add(id);
    const children=nodes[id].children;
    if(children!==undefined&&!Array.isArray(children))return null;
    if(children)todo.push(...children);
  }
  return seen;
}
function cleanCloneChain(nodes){
  const old=nodes[12219],b=nodes[12220],c=nodes[12221],d=nodes[12222];
  const a2=nodes[12255],b2=nodes[12256],c2=nodes[12257],d2=nodes[12258];
  if([old,b,c,d,a2,b2,c2,d2].some(v=>!v))return false;
  const original=Array.from({length:15},(_,i)=>12195+i);
  if(!SAME(old.children,original)||
     !SAME(a2.children,K05_PHOTO_HANDLE_NODES)||
     !Array.isArray(b.children)||!Array.isArray(c.children)||
     !SAME(d.children,[12221])||
     !SAME(b2.children,b.children.map(n=>n===12219?12255:n))||
     !SAME(c2.children,c.children.map(n=>n===12220?12256:n))||
     !SAME(d2.children,[12257]))return false;
  for(const id of [12255,12256,12257,12258]){
    const e=nodes[id].extras;
    if(e?.stage!=='WORK_TEST_HOST_HOLD'||
       e?.sourceGLBSHA256!==C80_542_K05_SMOOTH.sourceGlbSha256||
       e?.sourceZIPDriveId!==C80_542_K05_SMOOTH.sourceZipDriveId||
       e?.ownerCorrection!=='K05_REAL_LEVER_HAS_NO_BLACK_INLAY_BARS'||
       e?.current!==false||e?.asBuilt!==false||
       e?.sourceLinksBound!==false||e?.productionWebGLVerified!==false||
       e?.physicalHardwareExactProductVerified!==false||
       e?.HUMAN_REVIEW!=='NOT_RUN')return false;
  }
  return true;
}
export function isC80542K05SmoothSourceScene(json,glbSha256,index,floor){
  const spec=C80_542_K05_SCENES[index],asset=json?.asset?.extras;
  if(!spec||glbSha256!==C80_542_K05_SMOOTH.glbSha256||
     (floor!==undefined&&floor!==spec.floor)||
     json?.scene!==292||json?.scenes?.length!==542||
     json?.nodes?.length!==12259||json?.meshes?.length!==4621||
     json?.materials?.length!==744||json?.accessors?.length!==10408||
     json?.bufferViews?.length!==10412||
     asset?.ModelStage!=='WORK_TEST'||asset?.asBuilt!==false||
     asset?.HUMAN_REVIEW!=='NOT_RUN'||!cleanCloneChain(json.nodes))return false;
  const scene=json.scenes[index],parent=json.scenes[spec.parent],e=scene?.extras;
  if(scene?.name!=='C80_542_K05_SMOOTH_METALLIC_LEVER_NO_BLACK_INLAY_FROM_536_'+
     spec.parent+'_'+spec.floor+'_WORK_TEST_HOST_HOLD'||
     !Array.isArray(scene.nodes)||scene.nodes.length!==spec.roots||
     c80542K05Fnv32(scene.nodes)!==spec.rootFnv||
     c80542K05Fnv32(parent?.nodes)!==spec.parentRootFnv||
     !c80542K05RootDelta(parent?.nodes,scene.nodes,index!==536)||
     e?.stage!=='WORK_TEST_HOST_HOLD'||
     e?.sourceGLBSHA256!==C80_542_K05_SMOOTH.sourceGlbSha256||
     e?.sourceZIPDriveId!==C80_542_K05_SMOOTH.sourceZipDriveId||
     e?.sourceSceneIndex!==spec.parent||e?.newSceneIndex!==index||
     e?.floor!==spec.floor||
     e?.ownerCorrection!=='REAL_K05_HANDLE_HAS_NO_BLACK_INLAY_MARKS'||
     e?.current!==false||e?.asBuilt!==false||
     e?.HUMAN_REVIEW!=='NOT_RUN'||e?.newSourceLinksBound!==false||
     e?.productionWebGLVerified!==false||e?.publishAllowed!==false||
     e?.sourceDoorLeafAndHardwareRetained!==true||
     !SAME(e?.removedSourceRecessNodes,index===536?[]:K05_BLACK_RECESS_NODES))return false;
  const live=c80542K05Reachable(json.nodes,scene.nodes),
        old=c80542K05Reachable(json.nodes,parent.nodes);
  if(!live||!old||live.size!==spec.liveNodes)return false;
  if(index===536){
    return !live.has(12258)&&!old.has(12258)&&
      SAME(scene.nodes,parent.nodes)&&live.size===old.size;
  }
  if(![12255,12256,12257,12258,9197,9198,...K05_PHOTO_HANDLE_NODES].every(id=>live.has(id))||
     [12219,12220,12221,12222,9195,9196,...K05_BLACK_RECESS_NODES].some(id=>live.has(id))||
     !K05_BLACK_RECESS_NODES.every(id=>old.has(id))||
     live.size!==old.size-6)return false;
  for(const id of K05_BLACK_RECESS_NODES){
    const mesh=json.nodes[id]?.mesh;
    if(!Number.isInteger(mesh)||json.meshes[mesh]?.primitives?.[0]?.material!==734)return false;
  }
  return true;
}
export function c80542K05SmoothReceipt(json,sha,index,floor){
  return Object.freeze({
    exactSource:isC80542K05SmoothSourceScene(json,sha,index,floor),
    stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
    viewerMounted:false,sourceLinksBound:false,publishAllowed:false,
    current:false,asBuilt:false,physicalHardwareVerified:false,
    productionWebGLVerified:false,humanReview:'NOT_RUN'
  });
}
