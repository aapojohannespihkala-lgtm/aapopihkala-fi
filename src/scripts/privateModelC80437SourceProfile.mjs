import receipt from './privateModelC80437Receipt.json' with {type:'json'};
export const C80_437_GLB_SHA256=receipt.sha256;
export const C80_437_GLB_BYTES=receipt.bytes;
export const C80_437_SCENES=receipt.scenes;
export const c80437Fingerprint=value=>[...JSON.stringify(value??null)].reduce((h,c)=>
  Math.imul(h^c.codePointAt(0),16777619)>>>0,2166136261).toString(16).padStart(8,'0');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const rootsFnv=ids=>ids.reduce((h,n)=>Math.imul(h^n,16777619)>>>0,2166136261).toString(16).padStart(8,'0');

// The caller authenticates the complete inner binary GLB. This receiver only
// permits its nine authored WORK_TEST scenes, never a CURRENT/as-built claim.
export function isC80437SourceScene(json,sha,index,floor=null,glazing=null,cutaway=null){
 if(!Number.isInteger(index))return false;
 const s=receipt.scenes[index],scene=json?.scenes?.[index],a=json?.asset?.extras;
 return sha===receipt.sha256 && !!s && !!scene &&
  (floor===null||floor===s.floor)&&(glazing===null||glazing===s.glazing)&&(cutaway===null||cutaway===s.cutaway)&&
  json.scene===292&&json.scenes.length===437&&json.nodes?.length===12164&&json.meshes?.length===4576&&
  a?.ModelStage==='WORK_TEST'&&a?.current===false&&a?.asBuilt===false&&a?.HUMAN_REVIEW==='NOT_RUN'&&
  scene.name===s.name&&Array.isArray(scene.nodes)&&scene.nodes.length===s.count&&new Set(scene.nodes).size===s.count&&
  scene.nodes.every(n=>Number.isInteger(n)&&n>=0&&n<12164)&&rootsFnv(scene.nodes)===s.rootFnv&&
  c80437Fingerprint(scene.extras)===s.extrasFNV;
}
function exactPath(json,sha,index,node,path){
 if(!isC80437SourceScene(json,sha,index)||!Array.isArray(path)||path.at(-1)!==node)return false;
 for(let i=0;i<path.length;i++){
  const n=path[i],expected=receipt.nodes[n];
  if(!expected||c80437Fingerprint(json.nodes[n])!==expected.fnv||
    (i===0?json.scenes[index].nodes:json.nodes[path[i-1]]?.children)?.filter(id=>id===n).length!==1)return false;
 }
 return true;
}
export function resolveC80437BuildingNode(json,sha,index,node,path){
 if(!Number.isInteger(index)||!Number.isInteger(node))return null;
 const e=receipt.scenes[index]?.building[node];
 return e?.paths.some(p=>same(p,path))&&exactPath(json,sha,index,node,path)?{...e,...receipt.nodes[node]}:null;
}
export function resolveC80437TechnicalNode(json,sha,index,node){
 if(!Number.isInteger(index)||!Number.isInteger(node))return null;
 const e=receipt.scenes[index]?.technical[node];
 return e?.paths.some(p=>exactPath(json,sha,index,node,p))?{...e,...receipt.nodes[node]}:null;
}
export function resolveC80437CardNode(json,sha,index,node){
 if(!Number.isInteger(index)||!Number.isInteger(node))return null;
 const e=receipt.scenes[index]?.cards[node]?.find(e=>exactPath(json,sha,index,node,e.path));
 return e?{...e,...receipt.nodes[node],links:json.nodes[e.linkNode].extras.sourceLinks}:null;
}
export function c80437ReviewProfile(json,sha,index){
 if(!Number.isInteger(index))return null;
 const e=receipt.scenes[index];
 if(!isC80437SourceScene(json,sha,index)||!e.review.every(n=>exactPath(json,sha,index,n,[n])))return null;
 return {count:437,floors:{'1F':350,'2F':351,BOTH:352},scenes:{[index]:{name:e.name}},
  roots:{[index]:e.review.map(node=>({node,name:receipt.nodes[node].name}))}};
}
