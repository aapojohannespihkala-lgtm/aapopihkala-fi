import {
  C80_SUCC455_SAVO483_GLB_SHA256,
  c80Succ455Savo483Fnv32,
} from './privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import {nameMatches, sameSourceName} from './privateModelSourceNodeAssociations.mjs';

// These are inherited, unchanged 1F roots inside the verified 483-scene bytes.
// This receiver does not change the original model, sourceLinks or publication.
export const C80_SUCC455_SAVO483_1F_SCENES = Object.freeze({
  467:Object.freeze({
    name:'C80_SUCC455_PLAN2015_LED_SPACING_1000_1015_FROM_SCENE437_WORK_TEST_HOST_HOLD',
    rootFnv:'0836d5c2',sourceSceneIndex:410,parentScene:437,
  }),
  468:Object.freeze({
    name:'C80_SUCC455_PLAN2015_LED_SPACING_1000_1015_FROM_SCENE444_WORK_TEST_HOST_HOLD',
    rootFnv:'f3be6c43',sourceSceneIndex:417,parentScene:444,
  }),
});
export const C80_SUCC455_SAVO483_1F_DEFAULT_SCENE = 467;
// 468 is a separate inherited presentation variant, NOT inferred "cutaway".
const prohibited = Object.freeze([8028,10156,10157,10158,10159,12057,12195,12222,12223,12224]);
const reachableFrom = (nodes,roots) => {
  const seen=new Set(),queue=[...roots];
  while(queue.length){
    const id=queue.pop();
    if(!Number.isInteger(id)||id<0||id>=nodes.length)return null;
    if(seen.has(id))continue;
    seen.add(id);
    const children=nodes[id]?.children;
    if(children!==undefined&&!Array.isArray(children))return null;
    if(children)queue.push(...children);
  }
  return seen;
};
const contains=(nodes,parent,child)=>Array.isArray(nodes[parent]?.children)&&
  nodes[parent].children.includes(child);

/** Inherited 1F presentation identity for THIS 483 GLB only.
 * The authenticated SHA must come from the actual GLB bytes, not a filename.
 * No physical host, sourceLinks, CURRENT, publication or WebGL approval.
 */
export function isC80Succ455Savo483FirstFloorScene(json,sha,sceneIndex=467){
  const spec=C80_SUCC455_SAVO483_1F_SCENES[sceneIndex];
  const asset=json?.asset?.extras,scene=json?.scenes?.[sceneIndex];
  const roots=scene?.nodes,e=scene?.extras,plan=e?.plan2015SpacingCorrection;
  if(!spec||sha!==C80_SUCC455_SAVO483_GLB_SHA256||
     json?.scene!==292||asset?.ModelStage!=='WORK_TEST'||
     asset.current!==false||asset.asBuilt!==false||
     asset.HUMAN_REVIEW!=='NOT_RUN'||json.scenes?.length!==483||
     json.nodes?.length!==12225||json.meshes?.length!==4601||
     scene.name!==spec.name||!Array.isArray(roots)||roots.length!==288||
     new Set(roots).size!==288||
     c80Succ455Savo483Fnv32(roots)!==spec.rootFnv||
     e?.stage!=='WORK_TEST_HOST_HOLD'||e.floor!=='1F'||
     e.sourceSceneIndex!==spec.sourceSceneIndex||
     e.sourceGlbSHA256!=='720c7d2cf65c15fb196c44454eda2f71b07eab1c0f52b106a2099ac818a4fd9a'||
     e.sourceLinksBindingVerified!==false||
     e.physicalHiddenRouteVerified!==false||
     e.productionWebGLVerified!==false||
     e.humanReviewApproved!==false||e.asBuilt!==false||
     plan?.stage!=='WORK_TEST_HOST_HOLD'||plan.parentScene!==spec.parentScene||
     plan.ownerConfirmedUnchangedSince2015!==true||
     plan.spacing1Fmm!==1015||plan['1FgridAllThreeRows']!==true||
     plan.root1F!==12193||plan.sourceLinksBound!==false||
     plan.productionWebGL!=='NOT_RUN'||plan.humanReview!=='NOT_RUN'||
     plan.CURRENT!==false||plan.asBuilt!==false||
     ![5224,12160,12193].every(i=>roots.includes(i))||
     json.nodes[5224]?.mesh!==4013||
     json.nodes[12146]?.mesh!==4572||
     json.nodes[12158]?.mesh!==4575||
     !contains(json.nodes,12160,12150)||
     !contains(json.nodes,12160,12159)||
     !contains(json.nodes,12150,12146)||
     !contains(json.nodes,12159,12158))return false;
  const active=reachableFrom(json.nodes,roots);
  return !!active&&[5224,12146,12158,12160,12193].every(i=>active.has(i))&&
    prohibited.every(i=>!active.has(i))&&
    (sceneIndex===467 ? roots.includes(2220)&&!roots.includes(12097)
                      : roots.includes(12097)&&!roots.includes(2220));
}
/** Returns only a source-matched scene object; no registration or mount. */
export function resolveC80Succ455Savo483FirstFloorScene(gltf,sha,sceneIndex=467){
  const json=gltf?.parser?.json;
  if(!gltf||gltf.scenes?.length!==483||
     !isC80Succ455Savo483FirstFloorScene(json,sha,sceneIndex))return null;
  const source=json.scenes[sceneIndex],rendered=gltf.scenes[sceneIndex];
  if(!rendered||!sameSourceName(rendered.name,source.name)||
     !Array.isArray(rendered.children)||
     rendered.children.length<source.nodes.length||
     !source.nodes.every((node,i)=>nameMatches(rendered.children[i],json.nodes[node])))
    return null;
  return rendered;
}
