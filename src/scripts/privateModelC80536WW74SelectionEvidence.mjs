/**
 * C80 536 historical 1974 WW74 sewer-grade selection evidence.
 * Metadata only: never a current/as-built, sourceLinks or publish authority.
 */
import {
  C80_536_WW74_GLB_SHA256,
  C80_536_WW74_SCENES,
  isC80536WW74GradeEvidence,
  isC80536WW74SourceScene,
} from './privateModelC80536WW74SiteGradeSourceProfile.mjs';

const HISTORICAL_ROWS=Object.freeze([
  Object.freeze(['Viemärin lähderooli','1974 suunnitelma + WORK_TEST-korko-oletus']),
  Object.freeze(['Suunnittelukorot','18,15 m -> 17,90 m (ei toteumamittaus)']),
  Object.freeze(['Fyysinen katuliitos','NOT_VERIFIED']),
  Object.freeze(['Nykytila / as-built','EI VARMENNETTU']),
]);
const DROP_ROWS=Object.freeze([
  ...HISTORICAL_ROWS,
  Object.freeze(['Rakennuspään 2,40 m pudotus','WORK_ASSUMPTION, kaivoa ei varmennettu']),
]);

/** Provenance-bound source-node label. Never use a name or numerical ID alone. */
export function c80536WW74EvidenceForNode(json,index){
  if(!isC80536WW74GradeEvidence(json))return [];
  const n=json?.nodes?.[index];
  if(index===12257&&n?.name==='M5_WW74_BUILDING_TO_1974_SITE_DESIGN_GRADE_WORK_TEST_HOST_HOLD')
    return HISTORICAL_ROWS;
  if(index===12255&&n?.name==='WW74_SITE150_1974_1815_TO_1790_TRANSLATED_WORK_TEST_HOST_HOLD')
    return HISTORICAL_ROWS;
  if(index===12256&&n?.name==='WW74_BUILDING_END_VERTICAL_DROP_2400MM_WORK_ASSUMPTION_NO_WELL_HOST')
    return DROP_ROWS;
  return [];
}
function sceneMembership(json,sceneIndex){
  const roots=json?.scenes?.[sceneIndex]?.nodes,nodes=json?.nodes;
  if(!Array.isArray(roots)||!Array.isArray(nodes))return null;
  const seen=new Set(),todo=[...roots];
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
/** Called with the reconstructed GLTFLoader source-node associations.
 * Requires exact binary SHA, per-scene root signature, true mounted Object3D
 * parent chain and source node association. Never changes materials or geometry.
 */
export function createC80536WW74SelectionEvidenceResolver(gltf,loadedSha){
  const json=gltf?.parser?.json,associations=gltf?.parser?.associations;
  if(loadedSha!==C80_536_WW74_GLB_SHA256||
     !Array.isArray(gltf?.scenes)||gltf.scenes.length!==536||
     typeof associations?.get!=='function')return()=>[];
  const activeByScene=new Map();
  return (selectedObject,mountedScene)=>{
    const sceneIndex=gltf.scenes.indexOf(mountedScene);
    const spec=C80_536_WW74_SCENES[sceneIndex];
    if(!spec||!spec.designRoute||
       !isC80536WW74SourceScene(json,loadedSha,sceneIndex,spec.floor))return [];
    let active=activeByScene.get(sceneIndex);
    if(!active){active=sceneMembership(json,sceneIndex);if(!active)return [];activeByScene.set(sceneIndex,active);}
    // A detached helper, alternate-scene object or same-name donor is not evidence.
    const chain=[];let parent=selectedObject;
    for(let depth=0;parent&&parent!==mountedScene&&depth<128;depth++,parent=parent.parent)
      chain.push(parent);
    if(parent!==mountedScene)return [];
    for(const obj of chain){
      const id=associations.get(obj)?.nodes;
      if(!Number.isInteger(id)||!active.has(id))continue;
      const rows=c80536WW74EvidenceForNode(json,id);
      if(rows.length)return rows;
    }
    return [];
  };
}
