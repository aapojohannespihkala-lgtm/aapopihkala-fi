/**
 * C80 584 = C80 578 ALL5 + 1F/BOTH K12 KPH and sauna tile work model.
 * Source-only immutable evidence gate. This module is NOT mounted in the
 * production viewer and cannot approve installation, CURRENT or publication.
 * The original KPH colour is PHOTO_WORK_ASSUMPTION, sauna is 2015 plan only.
 */
export const C80_584_GLB_SHA256='7867f0fe2c62c923cfd2ede3875c70ab04ab307bf3c49dd63155e65c2355c96b';
export const C80_584_GLB_BYTES=56608100;
export const C80_584_ZIP_DRIVE_ID='1hKwKUxNZu-Azdvc6TqbfU59mNx0RVlvG';
export const C80_584_ZIP_SHA256='d7ca0035c230b1d0dbdcf6fc219e721bdf71fbd0ea7f5187c011350849bb4c84';
export const C80_584_PARENT_GLB_SHA256='26157dedc60d1c48b1c0e94b83d713e82324931a9ae866a032456a263c9b09bc';
export const C80_584_DONOR_GLB_SHA256='944d2972baa171c9d402283c21a53ec06189468edbf34b630bf4ced198502a0a';
const K12_2015_GLB_SHA256='1a99cc32c80e1b87bbefcf9e6f373af42aee7e72ede574eabafe375298fd9f9e';
const scenes=[
 [578,572,'1F',294,'241cbdae','a81cdbe9',true],
 [579,573,'2F',191,'922e7205','922e7205',false],
 [580,574,'BOTH',478,'50273df9','d5fd1952',true],
 [581,575,'BOTH',478,'2c4098e3','1a0dbbec',true],
 [582,576,'BOTH',478,'17504be7','ecb6146c',true],
 [583,577,'BOTH',478,'1466dbce','7e74ff1d',true],
];
export const C80_584_SCENES=Object.freeze(Object.fromEntries(scenes.map(
 ([scene,parent,floor,count,rootHash,parentHash,tiles])=>
 [scene,Object.freeze({scene,parent,floor,count,rootHash,parentHash,tiles})]
)));
const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const sameTransform=(a,b)=>['translation','scale','rotation','matrix'].every(k=>a?.[k]===undefined&&b?.[k]===undefined||eq(a?.[k],b?.[k]));
export function c80584RootHash(ids){
 if(!Array.isArray(ids))return null;
 let h=2166136261;
 for(const n of ids){
  if(!Number.isInteger(n)||n<0)return null;
  h=Math.imul(h^n,16777619)>>>0;
 }
 return h.toString(16).padStart(8,'0');
}
function reachable(nodes,roots){
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const seen=new Set(),todo=[...roots];
 while(todo.length){
  const i=todo.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes.length||!nodes[i])return null;
  if(seen.has(i))continue;
  seen.add(i);
  const children=nodes[i].children;
  if(children!==undefined&&!Array.isArray(children))return null;
  if(children)todo.push(...children);
 }
 return seen;
}
export function isC80584K12Evidence(json){
 const n=json?.nodes,m=json?.meshes;
 if(!Array.isArray(n)||n.length!==12323||!Array.isArray(m)||m.length!==4632)return false;
 const old=n[11613],root=n[12322],tile=n[12320],sauna=n[12321];
 if(root?.name!=='K12_WETROOM_SAUNA_TILE100_SOURCE_EXACT_COW_FROM11613_WORK_TEST_HOST_HOLD__C80_584_ALL5_COFIT'||
  !sameTransform(root,old)||!eq(root.children,
   old?.children?.filter(i=>![1724,1725,6613].includes(i))
    .map(i=>i===1714?12320:i===1715?12321:i))||
  !root.children.includes(1712)||!root.children.includes(1713)||
  root.extras?.sourceNodeIndex!==11613||root.extras?.sourceLinksBound!==false||
  root.extras?.physicalRoofOrDrainOrSlopeChange!==false||
  root.extras?.current!==false||root.extras?.asBuilt!==false||
  root.extras?.cofitBaseOriginalGLBSHA256!==C80_584_PARENT_GLB_SHA256||
  root.extras?.cofitDonorOriginalGLBSHA256!==C80_584_DONOR_GLB_SHA256)return false;
 const checkTile=(node,mesh,oldMesh,material,uv,name,evidence,sourceNode)=>
  node?.name===name&&node.mesh===mesh&&
  node.extras?.stage==='WORK_TEST_HOST_HOLD'&&
  node.extras?.sourceNodeIndex===sourceNode&&
  node.extras?.sourceMeshIndex===oldMesh&&
  node.extras?.sourceParentGLBSHA256===K12_2015_GLB_SHA256&&
  node.extras?.sourceTileEvidence===evidence&&
  node.extras?.tileNominalM===0.1&&
  node.extras?.groutMeasured===false&&
  node.extras?.floorSlopeChanged===false&&
  node.extras?.drainOpeningGeometryChanged===false&&
  node.extras?.physicalTileInstallationVerified===false&&
  node.extras?.sourceLinksBound===false&&
  node.extras?.current===false&&node.extras?.asBuilt===false&&
  node.extras?.cofitBaseOriginalGLBSHA256===C80_584_PARENT_GLB_SHA256&&
  node.extras?.cofitDonorOriginalGLBSHA256===C80_584_DONOR_GLB_SHA256&&
  m[mesh]?.primitives?.length===1&&
  m[mesh].primitives[0].material===material&&
  m[mesh].primitives[0].attributes?.TEXCOORD_0===uv&&
  m[mesh].primitives[0].attributes?.POSITION===m[oldMesh]?.primitives?.[0]?.attributes?.POSITION&&
  m[mesh].primitives[0].indices===m[oldMesh]?.primitives?.[0]?.indices;
 return checkTile(tile,4630,818,749,10429,
   'K12_KPH_FLOOR_100x100_TILE_SOURCE_GEOMETRY_PRESERVED_WORK_TEST_HOST_HOLD__C80_584_ALL5_COFIT',
   'PHOTO_WORK_ASSUMPTION',1714)&&
  checkTile(sauna,4631,819,750,10430,
   'K12_SAUNA_FLOOR_100x100_TILE_SOURCE_GEOMETRY_PRESERVED_WORK_TEST_HOST_HOLD__C80_584_ALL5_COFIT',
   '2015_PRODUCT_LIST_PLAN_NOT_AS_BUILT',1715);
}
export function isC80584ExactSourceScene(json,sha,index,floor){
 const spec=C80_584_SCENES[index],a=json?.asset?.extras;
 if(sha!==C80_584_GLB_SHA256||!spec||(floor!==undefined&&floor!==spec.floor)||
    json?.scene!==292||a?.ModelStage!=='WORK_TEST'||a?.current!==false||
    a?.asBuilt!==false||a?.HUMAN_REVIEW!=='NOT_RUN'||
    json?.scenes?.length!==584||json?.nodes?.length!==12323||
    json?.meshes?.length!==4632||json?.materials?.length!==751||
    json?.accessors?.length!==10431||json?.bufferViews?.length!==10437||
    json?.images?.length!==6||json?.textures?.length!==6||
    !isC80584K12Evidence(json))return false;
 const s=json.scenes[index],parent=json.scenes[spec.parent];
 const roots=s?.nodes,prior=parent?.nodes,e=s?.extras;
 if(s?.name!=='C80_584_ALL5_K12_KPH_SAUNA_TILE100_COFIT_FROM_SCENE_'+spec.parent+'_'+spec.floor+'_WORK_TEST_HOST_HOLD'||
    !Array.isArray(roots)||!Array.isArray(prior)||roots.length!==spec.count||
    c80584RootHash(roots)!==spec.rootHash||
    c80584RootHash(prior)!==spec.parentHash||
    e?.stage!=='WORK_TEST_HOST_HOLD'||e?.cofitFromScene!==spec.parent||
    e?.cofitFromGLBSHA256!==C80_584_PARENT_GLB_SHA256||
    e?.K12DonorGLBSHA256!==C80_584_DONOR_GLB_SHA256||
    e?.K12RootOriginal!==11613||e?.K12Tile100Active!==spec.tiles||
    e?.WC_DARK_GREY_ORIGINAL_FLOOR_PRESERVED!==true||
    e?.K12KPHPhotoWorkAssumption!==true||
    e?.K12Sauna2015ProductListNot2026AsBuilt!==true||
    e?.physicalTileInstallationVerified!==false||
    e?.sourceLinksBound!==false||e?.newSourceLinksBound!==false||
    e?.CURRENT!=='NOT_APPROVED'||e?.current!==false||e?.asBuilt!==false||
    e?.HUMAN_REVIEW!=='NOT_RUN'||e?.productionWebGL!=='NOT_VERIFIED')return false;
 const expected=spec.tiles?prior.map(i=>i===11613?12322:i):prior;
 if(!eq(roots,expected)||roots.includes(11613)||new Set(roots).size!==roots.length||
    (spec.tiles?e.K12RootNew!==12322:e.K12RootNew!==null))return false;
 const live=reachable(json.nodes,roots);
 if(!live||live.has(11613)||live.has(12251)||live.has(12262)||live.has(12263)||
    !live.has(12315))return false;
 for(const i of [12322,12320,12321,1712,1713]){
  if(live.has(i)!==spec.tiles)return false;
 }
 for(const i of [1714,1715,1724,1725,6613])if(live.has(i))return false;
 const upper=spec.floor!=='1F';
 return [12312,12316,12264,12271].every(i=>live.has(i)===upper);
}
export function c80584SourceOnlyReceipt(json,sha,index,floor){
 return Object.freeze({
  exactSource:isC80584ExactSourceScene(json,sha,index,floor),
  stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,sourceLinksBound:false,
  publishAllowed:false,current:false,asBuilt:false,
  physicalTileInstallationVerified:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN'
 });
}
