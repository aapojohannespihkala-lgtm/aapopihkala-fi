// V85 D2F island plinth: source-exact acceptance for a WHITE, material-only COW.
// Caller must independently hash the full raw GLB bytes.
// Render only nodes reachable from an actual glTF scene, never every indexed node.
// No publication, sourceLinks binding, HUMAN_REVIEW or CURRENT authorization.
export const V85_WHITE_PLINTH = Object.freeze({
  driveId:'1bkmnD-Bv5uKl9Q2Ys690i91UuCqygJp7',
  zipSha256:'85df888bdc5e4aad4a82cd22f7360b76af7583e9f3fe4d24e0f7c59f6a26f35f',
  zipBytes:12282894,
  glbSha256:'bda300630c8e6d31221a8ba84e837dfd9868dcadfeb53534d696e9040ccec43c',
  glbBytes:54052344,
  parentGlbSha256:'31dc12c484fcf951c4373387b9653e26206a8ac3bc4978d5d980daeac3a6ade2',
  parentDriveId:'152JZBJ5VtfvtQUXwgUuy27dhsDv7GXHV',
  sceneCount:376,nodeCount:12109,meshCount:4557,materialCount:724,defaultScene:292,
  oldNode:11298,newNode:12108,oldMesh:4194,newMesh:4556,oldMaterial:536,whiteMaterial:534,
  inactiveLegacyNodes:Object.freeze([9258,9399]),
  sceneMap:Object.freeze({
    369:Object.freeze({from:361,rootCount:184,replacedAt:120}),
    370:Object.freeze({from:362,rootCount:464,replacedAt:364}),
    371:Object.freeze({from:363,rootCount:184,replacedAt:119}),
    372:Object.freeze({from:364,rootCount:464,replacedAt:363}),
    373:Object.freeze({from:365,rootCount:184,replacedAt:112}),
    374:Object.freeze({from:366,rootCount:464,replacedAt:356}),
    375:Object.freeze({from:368,rootCount:464,replacedAt:364})
  }),
  stage:'WORK_TEST_HOST_HOLD',sourceLinks:'NOT_BOUND_NEW_SHA',
  productionWebGL:'NOT_RUN',humanReview:'NOT_RUN',current:false,asBuilt:false
});
const indexOK=(n,l)=>Number.isInteger(n)&&n>=0&&n<l;
const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
/** Only scene-root descendants may be drawn; fail closed on a bad graph. */
export function v85ActiveSceneNodes(gltf,sceneIndex){
  const nodes=gltf?.nodes, scene=gltf?.scenes?.[sceneIndex];
  if(!Array.isArray(nodes)||!Array.isArray(scene?.nodes))
    return {ok:false,reason:'SCENE_UNAVAILABLE'};
  const seen=new Set(),visiting=new Set();let reason=null;
  function walk(index){
    if(!indexOK(index,nodes.length)){reason='INVALID_NODE_INDEX';return;}
    if(visiting.has(index)){reason='SCENE_CYCLE';return;}
    if(seen.has(index)||reason)return;
    visiting.add(index);
    const children=nodes[index]?.children??[];
    if(!Array.isArray(children))reason='INVALID_CHILDREN';
    else for(const child of children){walk(child);if(reason)break;}
    visiting.delete(index);seen.add(index);
  }
  for(const index of scene.nodes){walk(index);if(reason)break;}
  return reason?{ok:false,reason}:{ok:true,nodes:seen};
}
export function verifyV85WhitePlinthSource({sha256,bytes,driveId,gltf}={}){
  const p=V85_WHITE_PLINTH;
  if(sha256!==p.glbSha256||bytes!==p.glbBytes||driveId!==p.driveId)
    return {ok:false,reason:'SOURCE_IDENTITY_MISMATCH'};
  if(gltf?.scene!==p.defaultScene||gltf?.scenes?.length!==p.sceneCount||
     gltf?.nodes?.length!==p.nodeCount||gltf?.meshes?.length!==p.meshCount||
     gltf?.materials?.length!==p.materialCount)
    return {ok:false,reason:'STRUCTURE_MISMATCH'};
  const old=gltf.nodes[p.oldNode],repl=gltf.nodes[p.newNode];
  const oldMesh=gltf.meshes[p.oldMesh],newMesh=gltf.meshes[p.newMesh];
  const white=gltf.materials[p.whiteMaterial];
  if(old?.mesh!==p.oldMesh||repl?.mesh!==p.newMesh||
     old?.name!=='V85_D2F_ISLAND_PLINTH_100MM_DARK_RECESSED_30MM'||
     repl?.name!=='V85_D2F_ISLAND_PLINTH_100MM_WHITE_RECESSED_30MM_OWNER_WORK_TEST'||
     oldMesh?.primitives?.length!==1||newMesh?.primitives?.length!==1)
    return {ok:false,reason:'PLINTH_NODE_MISMATCH'};
  const before=oldMesh.primitives[0],after=newMesh.primitives[0];
  if(before.material!==p.oldMaterial||after.material!==p.whiteMaterial||
     before.indices!==after.indices||
     !same(Object.keys(before.attributes).sort(),Object.keys(after.attributes).sort())||
     Object.keys(before.attributes).some(k=>before.attributes[k]!==after.attributes[k])||
     white?.name!=='C80R2_V17_KVIK_FRONT_BRIGHT_WHITE_VIEW'||
     !same(white?.pbrMetallicRoughness?.baseColorFactor,[0.97,0.97,0.965,1])||
     repl?.extras?.current!==false||repl?.extras?.asBuilt!==false||
     repl?.extras?.ownerCorrection?.includes('white')!==true)
    return {ok:false,reason:'MATERIAL_ONLY_COW_MISMATCH'};
  const unchangedKeys=o=>Object.keys(o).filter(k=>!['name','mesh','extras'].includes(k)).sort();
  if(!same(unchangedKeys(old),unchangedKeys(repl))||
     unchangedKeys(old).some(k=>JSON.stringify(old[k])!==JSON.stringify(repl[k])))
    return {ok:false,reason:'PLINTH_TRANSFORM_MISMATCH'};
  for(const [key,m] of Object.entries(p.sceneMap)){
    const index=Number(key);
    const sourceRoots=gltf.scenes[m.from]?.nodes;
    const target=gltf.scenes[index],roots=target?.nodes;
    if(!Array.isArray(sourceRoots)||!Array.isArray(roots)||
       sourceRoots.length!==m.rootCount||roots.length!==m.rootCount||
       sourceRoots[m.replacedAt]!==p.oldNode||roots[m.replacedAt]!==p.newNode||
       new Set(roots).size!==roots.length||
       sourceRoots.some((node,i)=>i!==m.replacedAt&&node!==roots[i]))
      return {ok:false,reason:'SCENE_'+index+'_ROOT_MISMATCH'};
    const ex=target.extras?.islandPlinthCorrection;
    if(ex?.parentScene!==m.from||ex?.originalNode!==p.oldNode||
       ex?.replacementNode!==p.newNode||ex?.originalMesh!==p.oldMesh||
       ex?.replacementMesh!==p.newMesh||ex?.originalMaterial!==p.oldMaterial||
       ex?.replacementMaterial!==p.whiteMaterial||ex?.geometryChanged!==false||
       ex?.sourceGlbSha256!==p.parentGlbSha256||
       ex?.productionWebGLVerified!==false||ex?.humanReview!=='NOT_RUN'||ex?.stage!==p.stage)
      return {ok:false,reason:'SCENE_'+index+'_PROVENANCE_MISMATCH'};
    const active=v85ActiveSceneNodes(gltf,index);
    if(!active.ok||!active.nodes.has(p.newNode)||active.nodes.has(p.oldNode)||
       p.inactiveLegacyNodes.some(n=>active.nodes.has(n)))
      return {ok:false,reason:'SCENE_'+index+'_VISIBILITY_MISMATCH'};
  }
  return {ok:true,scenes:Object.keys(p.sceneMap).map(Number),stage:p.stage,
    sourceLinks:p.sourceLinks,productionWebGL:p.productionWebGL,
    humanReview:p.humanReview,current:p.current,asBuilt:p.asBuilt};
}
