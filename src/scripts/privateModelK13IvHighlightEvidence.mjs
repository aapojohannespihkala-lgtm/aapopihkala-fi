/**
 * K13 owner's 15 Nov 2026 technical-highlight correction, SOURCE_ONLY.
 * Pure presentation role evidence for exact C80 602 GLB only.
 * Caller MUST calculate glbSha256 from the full original GLB bytes.
 *
 * This is NOT a production viewer renderer, sourceLinks binding,
 * geometry edit, current/as-built identification or release approval.
 * WP-T4 owns the separate viewer palette implementation.
 */
export const K13_C80602_SOURCE=Object.freeze({
  zipDriveId:'1FH4aHwm24niQbVMMK5keZotms1lUYUM7',
  zipSha256:'538c6800dec2a495f51bc8afdc35ef21607bc3306c4eabe3e6a9e43a815a6f9f',
  glbSha256:'68022663faeca35955cf2822a34fc531dc6a446bdd4a13bad0169e16ec80bcfc',
  glbBytes:56765356,
  stage:'WORK_TEST_HOST_HOLD',
});
const specRows=[
 [596,590,'1F',293,'b1a93af0',true],
 [597,591,'2F',191,'1e7d348d',false],
 [598,592,'BOTH',477,'8ff773e7',true],
 [599,593,'BOTH',477,'86e37071',true],
 [600,594,'BOTH',477,'4a369f9d',true],
 [601,595,'BOTH',477,'1526d9e2',true],
];
export const K13_C80602_SCENES=Object.freeze(Object.fromEntries(
 specRows.map(([index,parent,floor,rootCount,rootHash,k13Active])=>[
  index,Object.freeze({index,parent,floor,rootCount,rootHash,k13Active}),
 ])));
export function k13SourceRootHash(roots){
 if(!Array.isArray(roots)||roots.some(n=>!Number.isInteger(n)||n<0))return null;
 let h=2166136261;
 for(const n of roots)h=Math.imul(h^n,16777619)>>>0;
 return h.toString(16).padStart(8,'0');
}
function activeNodes(nodes,roots){
 if(!Array.isArray(nodes)||!Array.isArray(roots))return null;
 const seen=new Set(),pending=[...roots];
 while(pending.length){
  const i=pending.pop();
  if(!Number.isInteger(i)||i<0||i>=nodes.length||!nodes[i])return null;
  if(seen.has(i))continue;
  seen.add(i);
  const kids=nodes[i].children;
  if(kids!==undefined&&!Array.isArray(kids))return null;
  if(kids)pending.push(...kids);
 }
 return seen;
}
/** Identity evidence of the two different technical presentation roles. */
export function isK13SourceRolePair(json){
 const nodes=json?.nodes,meshes=json?.meshes,materials=json?.materials;
 const shell=nodes?.[1730],route=nodes?.[10060];
 const shellMaterial=materials?.[121],root=nodes?.[12329],routeParent=nodes?.[11728];
 if(!Array.isArray(nodes)||!Array.isArray(meshes)||!Array.isArray(materials)||
    shell?.mesh!==4015||meshes[4015]?.primitives?.length!==1||
    meshes[4015].primitives[0]?.material!==121||
    shellMaterial?.name!=='D1F_KPH11_IV_BOX_SMOOTH_OFFWHITE_VISUAL_WORK_ASSUMPTION'||
    !shell.name?.includes('KPH11_IV_18MM_REARWALL_END_WORKFIT')||
    shell.extras?.ylisViewScope?.role!=='CONTENT'||
    Object.hasOwn(shell.extras??{},'m5System')||
    route?.mesh!==3788||
    route.name!=='C80_KV17_IV15_OPTIN__D1F_IV2015_3PORT_TCOLLECTOR_XMIRROR_WORK_TEST'||
    route.extras?.m5System!=='IV'||
    route.extras?.modelStage!=='WORK_TEST'||
    route.extras?.hostHold!==true||
    route.extras?.verifiedConnections!==0||
    !root?.children?.includes(1730)||
    !routeParent?.children?.includes(10060)||
    root.children.filter(n=>n===1730).length!==1||
    routeParent.children.filter(n=>n===10060).length!==1)return false;
 return true;
}
/**
 * Fail closed against wrong SHA, glTF scene index, root composition,
 * inactive floor, source metadata or an invented physical approval.
 * Roles identify a white work-assumption ENCLOSURE and an unverified IV ROUTE.
 */
export function k13C80602IvHighlightEvidence(json,glbSha256,sceneIndex){
 const s=K13_C80602_SCENES[sceneIndex],asset=json?.asset?.extras,scene=json?.scenes?.[sceneIndex];
 if(glbSha256!==K13_C80602_SOURCE.glbSha256||!s||
    json?.scene!==292||json?.scenes?.length!==602||
    json?.nodes?.length!==12347||json?.meshes?.length!==4635||
    json?.materials?.length!==751||json?.accessors?.length!==10434||
    json?.bufferViews?.length!==10440||
    asset?.ModelStage!=='WORK_TEST'||asset?.current!==false||asset?.asBuilt!==false||
    asset?.HUMAN_REVIEW!=='NOT_RUN'||
    scene?.name!=='C80_602_ALL5_K12_K09_THEMO_K16_K18_K04_WALLHOST_COFIT_FROM_'+
      s.parent+'_'+s.floor+'_WORK_TEST_HOST_HOLD'||
    !Array.isArray(scene?.nodes)||scene.nodes.length!==s.rootCount||
    k13SourceRootHash(scene.nodes)!==s.rootHash||
    scene.extras?.stage!=='WORK_TEST_HOST_HOLD'||
    scene.extras?.floor!==s.floor||
    scene.extras?.HOST_HOLD!==true||
    scene.extras?.sourceLinksBound!==false||
    scene.extras?.current!==false||scene.extras?.asBuilt!==false||
    scene.extras?.HUMAN_REVIEW!=='NOT_RUN'||
    !isK13SourceRolePair(json))return null;
 const live=activeNodes(json.nodes,scene.nodes);
 if(!live||[1730,10060,12329,11728].some(i=>live.has(i)!==s.k13Active))return null;
 if(s.k13Active){
  if(!scene.nodes.includes(12329)||!scene.nodes.includes(11728)||
     ![1704,1708,11730].every(i=>live.has(i)))return null;
 }
 const roles=s.k13Active?Object.freeze([
  Object.freeze({nodeIndex:1730,meshIndex:4015,system:'IV',role:'ENCLOSURE',
   appearance:'LIGHT_TRANSLUCENT',evidence:'VISUAL_WORK_ASSUMPTION'}),
  Object.freeze({nodeIndex:10060,meshIndex:3788,system:'IV',role:'ROUTE',
   appearance:'SYSTEM_COLOUR',evidence:'WORK_TEST_UNVERIFIED_CONNECTIONS'}),
 ]):Object.freeze([]);
 return Object.freeze({
  sourceExact:true,sceneIndex,floor:s.floor,
  roles,sourceOnly:true,stage:'WORK_TEST_HOST_HOLD',
  physicalHostVerified:false,routeContinuityVerified:false,
  sourceLinksBound:false,viewerMounted:false,publishAllowed:false,
  current:false,asBuilt:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
 });
}
