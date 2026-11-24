/**
 * C80 R31 D-roof 746 / E220S 747: SHA-locked, read-only WORK_TEST receipts.
 *
 * Caller MUST calculate authenticatedSha from every byte of the loaded GLB.
 * These receipts do not register a viewer candidate, rebind sourceLinks,
 * authorize a physical roof penetration, or approve publication / CURRENT.
 * glTF scene index is not inferred from the ZIP's __scene suffix.
 */
export const C80_R31_ROOF_SOURCES=Object.freeze({
  746:Object.freeze({
    glbSha256:'f44b81535992ca3cf0b14fb496d335b3eae327a8be09482c85f00318b6031d4e',
    glbBytes:62482200,zipDriveId:'1ErTC-QoSLWRkn6ohPTKqsg1JcQyPhuv3',
    zipSha256:'bd95ddfed92144b76e2a96fce6464cd8b5f36d7e8a0b1a396a83b907d88dfe5b',
    parentGlbSha256:'bc4f67a081719c76f01a6211e2edce16220a47b61eb0d5b13e24f107791b6c63',
    parentScene:744,sceneCount:747,nodeCount:13338,meshCount:5108,
    materialCount:810,accessorCount:11124,bufferViewCount:11130,
    roofRoot:13337,rootHash:'b0aefdc2',parentRootHash:'4193186f',
    sceneName:'Ylisrinne_C80_620R31_D_KATOLLA_WORK_TEST_HOST_HOLD__scene746',
  }),
  747:Object.freeze({
    glbSha256:'9272d407e2a323811a7f116fcd384b4284417ade08e05e2b759be5aacb982d3b',
    glbBytes:62675200,zipDriveId:'1FSpI1aCfJvm85JmEU9cZroo7NNl3eHtK',
    zipSha256:'d0e0c7f0120273e40eaa0ca624ffafce7a4ec69007413564fe3523af941858a6',
    parentGlbSha256:'f44b81535992ca3cf0b14fb496d335b3eae327a8be09482c85f00318b6031d4e',
    parentScene:746,sceneCount:748,nodeCount:13360,meshCount:5111,
    materialCount:810,accessorCount:11134,bufferViewCount:11140,
    roofRoot:13359,rootHash:'f11132fc',parentRootHash:'b0aefdc2',
    sceneName:'Ylisrinne_C80_R31_D_KATTO_E220S_PLAN_WORK_TEST_HOST_HOLD__scene747',
  }),
});
export function c80R31RoofRootsFnv32(values){
  if(!Array.isArray(values))return null;
  let hash=2166136261;
  for(const id of values){
    if(!Number.isInteger(id)||id<0)return null;
    hash=Math.imul(hash^id,16777619)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const onlyOnce=(values)=>new Set(values).size===values.length;
const isMesh=(node,mesh)=>node?.mesh===mesh;
export function isC80R31RoofSourceScene(json,authenticatedSha,sceneIndex,floor){
  const s=C80_R31_ROOF_SOURCES[sceneIndex],asset=json?.asset?.extras;
  if(!s||authenticatedSha!==s.glbSha256||
    (floor!==undefined&&floor!=='BOTH')||json?.scene!==292||
    asset?.ModelStage!=='WORK_TEST'||asset.current!==false||
    asset.asBuilt!==false||asset.HUMAN_REVIEW!=='NOT_RUN'||
    json.scenes?.length!==s.sceneCount||
    json.nodes?.length!==s.nodeCount||json.meshes?.length!==s.meshCount||
    json.materials?.length!==s.materialCount||
    json.accessors?.length!==s.accessorCount||
    json.bufferViews?.length!==s.bufferViewCount)return false;
  const scene=json.scenes[sceneIndex],parent=json.scenes[s.parentScene];
  const roots=scene?.nodes,old=parent?.nodes,e=scene?.extras;
  if(scene?.name!==s.sceneName||!Array.isArray(roots)||!Array.isArray(old)||
    roots.length!==490||old.length!==(sceneIndex===746?489:490)||
    !onlyOnce(roots)||!onlyOnce(old)||
    c80R31RoofRootsFnv32(roots)!==s.rootHash||
    c80R31RoofRootsFnv32(old)!==s.parentRootHash||
    e?.stage!=='WORK_TEST'||e.HOST_HOLD!==true||
    e.floor!=='BOTH'||e.scope!=='d-apartment'||
    e.current!==false||e.asBuilt!==false||
    e.sourceScene!==s.parentScene||
    e.sourceGLBSHA256!==s.parentGlbSha256||
    e.intendedViewerLayer!=='roof'||e.roofRoot!==s.roofRoot||
    e.HUMAN_REVIEW!=='NOT_RUN'||e.productionWebGLVerified!==false||
    e.sourceLinksBoundForOutputSHA!==false)return false;
  const expected=sceneIndex===746
    ? [...old,13337]
    : old.map(n=>n===13322?13358:n===13337?13359:n);
  if(!same(roots,expected))return false;
  const root=json.nodes[s.roofRoot];
  const expectedRoofChildren=sceneIndex===746
    ? [13332,13333,13334,13335,13336]
    : [13338,13333,13334,13335,13336];
  if(root?.name!=='C80_R31_D_ASUNTO_KATOLLA_ROOT_WORK_TEST'||
    !same(root.children,expectedRoofChildren)||
    root.extras?.HOST_HOLD!==true||
    root.extras?.stage!=='WORK_TEST'||
    root.extras?.presentationOnly!==true||
    root.extras?.asBuilt!==false||
    root.extras?.intendedViewerLayer!=='roof')return false;
  if(sceneIndex===746){
    for(let i=0;i<5;i++){
      const part=json.nodes[13332+i];
      if(!isMesh(part,5103+i)||part.extras?.HOST_HOLD!==true||
        part.extras?.presentationOnly!==true||
        part.extras?.intendedViewerLayer!=='roof')return false;
    }
  }else{
    if(e.E220SRoofModelFit!=='PLAN_DERIVED_WORK_ASSUMPTION'||
      e.verifiedConnections!==0||roots.includes(13322)||roots.includes(13337)||
      !roots.includes(13358)||
      !isMesh(json.nodes[13338],5108)||
      !isMesh(json.nodes[13339],5109)||
      !isMesh(json.nodes[13340],5110))return false;
    const iv=json.nodes[13358],children=iv?.children;
    if(!Array.isArray(children)||iv.extras?.sourceLinksBoundForOutputSHA!==false||
      !children.includes(13339)||!children.includes(13340)||
      Array.from({length:17},(_,i)=>13341+i).some(n=>!children.includes(n)))return false;
    for(const n of [13338,13339,13340]){
      if(json.nodes[n].extras?.physicalVerified!==false||
        json.nodes[n].extras?.verifiedConnections!==0)return false;
    }
    for(let i=0;i<4;i++){
      if(!isMesh(json.nodes[13333+i],5104+i))return false;
    }
  }
  return true;
}
export function c80R31RoofSourceReceipt(json,authenticatedSha,sceneIndex,floor){
  return Object.freeze({
    exactSource:isC80R31RoofSourceScene(json,authenticatedSha,sceneIndex,floor),
    stage:'WORK_TEST_HOST_HOLD',floor:'BOTH',sourceLinksBound:false,
    publishAllowed:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
    current:false,asBuilt:false,physicalRoofOpeningVerified:false,
  });
}
