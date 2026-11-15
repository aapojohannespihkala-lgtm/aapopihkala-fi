/**
 * Exact C80 590 K09 switch + independent Themo/ALL5/K12 3D receipt.
 * Authenticated source-only WORK_TEST; never a CURRENT/as-built or
 * production/publisher/sourceLinks authorization.
 * Caller must compute SHA256 from the whole original GLB bytes.
 */
export const C80_590_GLB_SHA256='ff044811bf0f6277c3268c90dd134d73d7ce286b3946a6bab85d94a627e61dd9';
export const C80_590_GLB_BYTES=56661700;
export const C80_590_ZIP_SHA256='cfa1573dedafc7c440d137a470844fda89b4db17f3b112b5e67175fe7089726c';
export const C80_590_ZIP_DRIVE_ID='1qfmULhkxKfNWh9H9XUI4XczVwXIv8XoT';
export const C80_590_PARENT_GLB_SHA256='7867f0fe2c62c923cfd2ede3875c70ab04ab307bf3c49dd63155e65c2355c96b';
export const C80_590_K09_DONOR_GLB_SHA256='8453d2c2995f6d8d1d6b6d1da0ad42b302234f5ba3c485745be61f1bb748ded5';
const rows=[
 [584,578,'1F',293,'b9fa4dc2','241cbdae',true],
 [585,579,'2F',191,'922e7205','922e7205',false],
 [586,580,'BOTH',477,'ab0f78e5','50273df9',true],
 [587,581,'BOTH',477,'716a5adb','2c4098e3',true],
 [588,582,'BOTH',477,'00330a53','17504be7',true],
 [589,583,'BOTH',477,'630b1f2c','1466dbce',true],
];
export const C80_590_SCENES=Object.freeze(Object.fromEntries(rows.map(
 ([scene,parent,floor,count,rootHash,parentHash,hasK09])=>[
  scene,Object.freeze({scene,parent,floor,count,rootHash,parentHash,hasK09}),
 ])));
export function c80590Fnv32(ids){
 if(!Array.isArray(ids)||ids.some(i=>!Number.isInteger(i)||i<0))return null;
 let hash=2166136261;
 for(const id of ids)hash=Math.imul(hash^id,16777619)>>>0;
 return hash.toString(16).padStart(8,'0');
}
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===b.length&&a.every((v,i)=>v===b[i]);
const near=(x,y)=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x-y)<1e-6;
function reachable(nodes,roots){
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const i=todo.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes.length||!nodes[i])return null;
  if(seen.has(i))continue;
  seen.add(i);
  const kids=nodes[i].children;
  if(kids!==undefined&&!Array.isArray(kids))return null;
  if(kids)todo.push(...kids);
 }
 return seen;
}
/** C80 590 changes exactly two root instances and excludes old SW04. */
export function isC80590RootReplacement(current,prior,hasK09){
 if(!Array.isArray(prior)||!Array.isArray(current))return false;
 if(!hasK09)return equal(current,prior)&&!prior.includes(12329)&&!prior.includes(12331);
 for(const i of [6365,12322,11779])
  if(prior.filter(v=>v===i).length!==1)return false;
 if(prior.some(v=>v===12329||v===12331))return false;
 const next=prior.map(v=>v===6365?12331:v===12322?12329:v)
  .filter(v=>v!==11779);
 return equal(current,next)&&new Set(current).size===current.length;
}
/** Exact active geometry and owner placement, not a physical survey. */
export function isC80590K09ThemoEvidence(json){
 const nodes=json?.nodes;
 if(!Array.isArray(nodes)||nodes.length!==12332)return false;
 const prior=nodes[12322],root=nodes[12329],themo=nodes[12330],assembly=nodes[12331];
 const r=root?.extras,t=themo?.extras,a=assembly?.extras;
 if(root?.name!=='C80_590_K12_100x100_TILES_AND_K09_OWNER20CM_KPH_CONTROLS_COW_ROOT'||
    !equal(root.translation,[6.53,0,0])||
    r?.K09ThemoX!==5.05||
    r?.approval!=='OWNER_ESTIMATED_CENTER20CM_TOP102CM_AND_SAME_VERTICAL_THEMO'||
    r?.sourceLinksBound!==false||r?.sourceLinksBoundNewSHA!==false||
    r?.current!==false||r?.asBuilt!==false||r?.HUMAN_REVIEW!=='NOT_RUN'||
    r?.status!=='WORK_TEST_HOST_HOLD')return false;
 const old=prior?.children,now=root.children;
 if(!Array.isArray(old)||old.length!==now?.length)return false;
 const replaced=old.map(id=>id>=1669&&id<=1674?12323+id-1669:id);
 if(!equal(now,replaced)||!now.includes(1712)||!now.includes(1713)||
    !now.includes(12320)||!now.includes(12321))return false;
 for(let i=0;i<6;i++){
  const n=nodes[12323+i],e=n?.extras;
  if(n?.mesh!==773+i||
     !n.name?.startsWith('K09_D1F_KPH_OWNER20CM_102CM_REHOST_')||
     !equal(n.translation,[-0.164,-0.08,0])||
     e?.sourceLinksBoundNewSHA!==false||e?.asBuilt!==false||
     e?.status!=='WORK_TEST_HOST_HOLD')return false;
 }
 if(themo?.name!=='C80_590_D_THEMO_BATHROOM_ALIGNED_X5p050_WITH_K09_OWNER20CM_WORK_TEST'||
    !equal(themo.children,[6361,6362,6363,6364])||
    !equal(themo.translation,[5.05,5.032,1.48])||
    t?.workAssumption!==true||t?.asBuilt!==false||
    t?.fitExactPhysicalWallHostVerified!==false||
    assembly?.name!=='C80_590_D1F_THEMO3_BATHROOM_X5p050_ALIGN_K09_COPY_ON_WRITE'||
    !equal(assembly.children,[6350,6355,12330])||
    a?.WORK_TEST_ONLY!==true||a?.current!==false||
    a?.asBuilt!==false||a?.physicalHost!=='HOST_HOLD'||
    a?.publishToCURRENT!==false)return false;
 for(const [id,mesh] of [[12320,4630],[12321,4631]]){
  if(nodes[id]?.mesh!==mesh||nodes[id]?.extras?.sourceLinksBound!==false)return false;
 }
 return true;
}
export function isC80590K09ThemoSourceScene(json,sha,sceneIndex,floor){
 const s=C80_590_SCENES[sceneIndex],ex=json?.asset?.extras;
 if(sha!==C80_590_GLB_SHA256||!s||
    (floor!==undefined&&floor!==s.floor)||
    json?.scene!==292||ex?.ModelStage!=='WORK_TEST'||
    ex?.current!==false||ex?.asBuilt!==false||
    ex?.HUMAN_REVIEW!=='NOT_RUN'||
    json?.scenes?.length!==590||json?.nodes?.length!==12332||
    json?.meshes?.length!==4632||json?.materials?.length!==751||
    json?.accessors?.length!==10431||json?.bufferViews?.length!==10437||
    !isC80590K09ThemoEvidence(json))return false;
 const row=json.scenes[sceneIndex],parent=json.scenes[s.parent],e=row?.extras;
 const roots=row?.nodes,base=parent?.nodes;
 if(row?.name!=='C80_590_ALL5_K12_K09_20CM_THEMO_VERTICAL_COFIT_FROM_'+s.parent+'_'+s.floor+'_WORK_TEST_HOST_HOLD'||
    !Array.isArray(roots)||roots.length!==s.count||
    c80590Fnv32(roots)!==s.rootHash||
    c80590Fnv32(base)!==s.parentHash||
    !isC80590RootReplacement(roots,base,s.hasK09)||
    e?.stage!=='WORK_TEST_HOST_HOLD'||e?.floor!==s.floor||
    e?.HOST_HOLD!==true||e?.sourceLinksBound!==false||
    e?.sourceLinksBoundNewSHA!==false||e?.productionWebGLVerified!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.current!==false||
    e?.asBuilt!==false||e?.K09ControlsRoot!==12329||
    e?.Themo3CopyRoot!==12331||!near(e?.bathThemoXMetres,5.05)||
    e?.switchAndThemoSameVerticalX!==true||
    !near(e?.ownerEstimateK09FrameTopY,1.02)||
    !near(e?.ownerEstimateK09CenterFromDoorJambM,0.2)||
    e?.K09OwnerDonorC80542SHA256!==C80_590_K09_DONOR_GLB_SHA256)return false;
 const live=reachable(json.nodes,roots);
 if(!live)return false;
 if(s.hasK09){
  if(![12329,12331,12330,12320,12321,1712,1713]
    .every(id=>live.has(id))||
    ![6365,6360,12322,11779,1669,1670,1671,1672,1673,1674]
    .every(id=>!live.has(id)))return false;
  if(![12323,12324,12325,12326,12327,12328]
    .every(id=>live.has(id)))return false;
 }else if([12329,12331,12330,12323,12324,12325,12326,12327,12328]
  .some(id=>live.has(id)))return false;
 return true;
}
export function c80590K09ThemoReceipt(json,sha,sceneIndex,floor){
 return Object.freeze({
  exactSource:isC80590K09ThemoSourceScene(json,sha,sceneIndex,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,
  current:false,asBuilt:false,physicalHostVerified:false,
  productionWebGLVerified:false,humanReview:'NOT_RUN'
 });
}
