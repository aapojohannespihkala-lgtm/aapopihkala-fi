import receipt from './privateModelC80437Receipt.json' with {type:'json'};
import { c80437Fingerprint } from './privateModelC80437SourceProfile.mjs';
import {
  C80_SUCC455_SAVO483_GLB_SHA256,
  isC80Succ455Savo483SourceScene,
} from './privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import { isC80Succ455Savo483FirstFloorScene } from './privateModelC80Succ455Savo483FirstFloorGate.mjs';
import {
  C80_WW74_L150_GLB_SHA256, C80_WW74_L150_VIEWER_ROLES,
  isC80Ww74L150SourceScene,
} from './privateModelC80Ww74L150FloorRuntime.mjs';
import {
  C80_495_GLB_SHA256, C80_495_VIEWER_ROLES,
  isC80495SavoSewerSourceScene,
} from './privateModelC80495SavoSewerFloorRuntime.mjs';
import {
  C80_500_GLB_SHA256, C80_500_VIEWER_ROLES,
  isC80500ABCSourceScene,
} from './privateModelC80500WW1974ABCSourceProfile.mjs';
import {
  C80_524_RAIN_GLB_SHA256, C80_524_RAIN_SCENES, isC80524RainSourceScene,
} from './privateModelC80524RainZonesSourceProfile.mjs';
import {
  C80_530_V27_GLB_SHA256, C80_530_V27_SCENES, isC80530V27SourceScene,
} from './privateModelC80530V27SourceProfile.mjs';
import {
  C80_602_GLB_SHA256, C80_602_SCENES, isC80602SourceScene,
} from './privateModelC80602SourceProfile.mjs';
import {
  C80_608C_GLB_SHA256, C80_608C_SCENES, C80_608C_COW_ALIASES, C80_608C_DUCT_ROOT,
  isC80608CSourceScene,
} from './privateModelC80608CSourceProfile.mjs';
import {
  C80_614_GLB_SHA256, C80_614_SCENES, C80_614_COW_ALIASES, C80_614_DUCT_ROOT,
  isC80614SourceScene,
} from './privateModelC80614SourceProfile.mjs';

// Work-test identity only. The outer loader MUST authenticate the entire GLB
// bytes before supplying sha. This never approves a new physical/as-built part.
const V483 = Object.freeze({
  467:{floor:'1F',glazing:'CLOSED',cutaway:false},
  476:{floor:'2F',glazing:'CLOSED',cutaway:false},
  477:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  478:{floor:'2F',glazing:'ONE_OPEN',cutaway:false},
  479:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  480:{floor:'2F',glazing:'STACKED',cutaway:false},
  481:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  482:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
// glTF scenes 518..523 of C80 524 (floor runtime roles: 1F, 2F, BOTH
// CLOSED/ONE_OPEN/STACKED and the CLOSED cutaway).
const V524 = Object.freeze({
  518:{floor:'1F',glazing:'CLOSED',cutaway:false},
  519:{floor:'2F',glazing:'CLOSED',cutaway:false},
  520:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  521:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  522:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  523:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V530 = Object.freeze({
  524:{floor:'1F',glazing:'CLOSED',cutaway:false},
  525:{floor:'2F',glazing:'CLOSED',cutaway:false},
  526:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  527:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  528:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  529:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V602 = Object.freeze({
  596:{floor:'1F',glazing:'CLOSED',cutaway:false},
  597:{floor:'2F',glazing:'CLOSED',cutaway:false},
  598:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  599:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  600:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  601:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V608C = Object.freeze({
  602:{floor:'1F',glazing:'CLOSED',cutaway:false},
  603:{floor:'2F',glazing:'CLOSED',cutaway:false},
  604:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  605:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  606:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  607:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V614 = Object.freeze({
  608:{floor:'1F',glazing:'CLOSED',cutaway:false},
  609:{floor:'2F',glazing:'CLOSED',cutaway:false},
  610:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  611:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  612:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  613:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
// SHA-locked copy-on-write aliases: a COW node keeps the receipt identity of
// its original node only when its own JSON fingerprint matches exactly.
const COW_ALIASES = Object.freeze({
  [C80_608C_GLB_SHA256]: C80_608C_COW_ALIASES,
  [C80_614_GLB_SHA256]: C80_614_COW_ALIASES,
});
const aliasOf = (sha,node) => COW_ALIASES[sha]?.[node] ?? null;
const toOrig = (sha,node) => aliasOf(sha,node)?.orig ?? node;
const forwardAliases = new Map(Object.entries(COW_ALIASES).map(([sha,table])=>
  [sha,new Map(Object.entries(table).map(([n,a])=>[a.orig,Number(n)]))]));
const toCow = (sha,node) => forwardAliases.get(sha)?.get(node) ?? node;
export const isC80LayerSuccessorSha = sha => [
  C80_SUCC455_SAVO483_GLB_SHA256, C80_WW74_L150_GLB_SHA256,
  C80_495_GLB_SHA256, C80_500_GLB_SHA256, C80_524_RAIN_GLB_SHA256,
  C80_530_V27_GLB_SHA256, C80_602_GLB_SHA256, C80_608C_GLB_SHA256,
  C80_614_GLB_SHA256,
].includes(sha);
const specFor = (sha,index) => {
  if (sha===C80_SUCC455_SAVO483_GLB_SHA256) return V483[index];
  if (sha===C80_WW74_L150_GLB_SHA256) return C80_WW74_L150_VIEWER_ROLES[index];
  if (sha===C80_495_GLB_SHA256) return C80_495_VIEWER_ROLES[index];
  if (sha===C80_500_GLB_SHA256) return C80_500_VIEWER_ROLES[index];
  if (sha===C80_530_V27_GLB_SHA256) return V530[index];
  if (sha===C80_602_GLB_SHA256) return V602[index];
  if (sha===C80_608C_GLB_SHA256) return V608C[index];
  if (sha===C80_614_GLB_SHA256) return V614[index];
  if (sha===C80_524_RAIN_GLB_SHA256) return V524[index];
  return null;
};
const acceptedScene = (json,sha,index) => {
  if (sha===C80_SUCC455_SAVO483_GLB_SHA256)
    return index===467
      ? isC80Succ455Savo483FirstFloorScene(json,sha,index)
      : isC80Succ455Savo483SourceScene(json,sha,index);
  if (sha===C80_WW74_L150_GLB_SHA256) return isC80Ww74L150SourceScene(json,sha,index);
  if (sha===C80_495_GLB_SHA256) return isC80495SavoSewerSourceScene(json,sha,index);
  if (sha===C80_500_GLB_SHA256) return isC80500ABCSourceScene(json,sha,index);
  if (sha===C80_530_V27_GLB_SHA256) return !!C80_530_V27_SCENES[index] &&
    isC80530V27SourceScene(json,sha,index,C80_530_V27_SCENES[index].floor);
  if (sha===C80_614_GLB_SHA256) return !!C80_614_SCENES[index] &&
    isC80614SourceScene(json,sha,index,C80_614_SCENES[index].floor);
  if (sha===C80_608C_GLB_SHA256) return !!C80_608C_SCENES[index] &&
    isC80608CSourceScene(json,sha,index,C80_608C_SCENES[index].floor);
  if (sha===C80_602_GLB_SHA256) return !!C80_602_SCENES[index] &&
    isC80602SourceScene(json,sha,index,C80_602_SCENES[index].floor);
  if (sha===C80_524_RAIN_GLB_SHA256) return !!C80_524_RAIN_SCENES[index] &&
    isC80524RainSourceScene(json,sha,index,C80_524_RAIN_SCENES[index].floor);
  return false;
};
const equalPath = (left,right) => Array.isArray(left)&&Array.isArray(right)&&
  left.length===right.length&&left.every((n,i)=>n===right[i]);

// Viewer performance (owner 15.11.2026: stutter on view switches). A layer
// pass resolves ~2000 meshes against one immutable parser JSON, and each call
// used to re-authenticate the whole scene. withC80SuccessorMemo() scopes a
// cache to one synchronous pass only; outside it every call is uncached, so
// callers that mutate JSON between calls keep exact fail-closed semantics.
let activeMemo = null;
/** @template T @param {() => T} run @returns {T} */
export function withC80SuccessorMemo(run) {
  if (activeMemo) return run();
  activeMemo = { scenes: new WeakMap(), fingerprints: new WeakMap() };
  try { return run(); } finally { activeMemo = null; }
}
const nodeFingerprint = node => {
  if (!activeMemo || !node || typeof node !== 'object') return c80437Fingerprint(node);
  let value = activeMemo.fingerprints.get(node);
  if (value === undefined) {
    value = c80437Fingerprint(node);
    activeMemo.fingerprints.set(node, value);
  }
  return value;
};
export function resolveC80437SuccessorReceiptScene(json,sha,sceneIndex){
  if (!activeMemo || !json || typeof json !== 'object') return uncachedReceiptScene(json,sha,sceneIndex);
  let byKey = activeMemo.scenes.get(json);
  if (!byKey) { byKey = new Map(); activeMemo.scenes.set(json, byKey); }
  const key = `${sha}:${sceneIndex}`;
  if (!byKey.has(key)) byKey.set(key, uncachedReceiptScene(json,sha,sceneIndex));
  return byKey.get(key);
}
function uncachedReceiptScene(json,sha,sceneIndex){
  if (!Number.isInteger(sceneIndex) || !json?.scenes?.[sceneIndex] ||
      json?.asset?.extras?.current!==false || json.asset.extras.asBuilt!==false ||
      json.asset.extras.HUMAN_REVIEW!=='NOT_RUN') return null;
  const role=specFor(sha,sceneIndex);
  if (!role || !acceptedScene(json,sha,sceneIndex)) return null;
  const matches=Object.entries(receipt.scenes).filter(([,source])=>
    source.floor===role.floor && source.glazing===role.glazing &&
    source.cutaway===role.cutaway);
  return matches.length===1 ? matches[0][1] : null;
}
function exactInheritedPath(json,sceneIndex,path,sha=null) {
  if (!Array.isArray(path)||!path.length||path.length>128 ||
      new Set(path).size!==path.length) return false;
  const roots=json.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(roots)||roots.filter(n=>n===path[0]).length!==1) return false;
  for (let i=0;i<path.length;i++){
    const n=path[i],alias=aliasOf(sha,n),expected=receipt.nodes[alias?.orig??n],actual=json.nodes?.[n];
    if (!Number.isInteger(n)||!expected||!actual||
        // Receipt stores a group node's mesh as null; glTF omits the key.
        actual.name!==expected.name || (actual.mesh??null)!==(expected.mesh??null) ||
        nodeFingerprint(actual)!==(alias?alias.fnv:expected.fnv)) return false;
    if (i>0 && json.nodes[path[i-1]]?.children?.filter(n0=>n0===n).length!==1)
      return false;
  }
  return true;
}
export function resolveC80437SuccessorBuildingNode(json,sha,sceneIndex,node,path){
  const receiptScene=resolveC80437SuccessorReceiptScene(json,sha,sceneIndex);
  if (!receiptScene || !Number.isInteger(node)) return null;
  const src=toOrig(sha,node);
  const entry=receiptScene.building?.[src];
  if (!entry || !Array.isArray(path)||path.at(-1)!==node ||
      !entry.paths?.some(p=>equalPath(p,path.map(n=>toOrig(sha,n)))) ||
      !exactInheritedPath(json,sceneIndex,path,sha)) return null;
  return {...entry,...receipt.nodes[src]};
}
// Preserve 437's authored per-device storey, even in a BOTH scene.
// Never derive a technical identity from a mesh name alone.
export function resolveC80437SuccessorTechnicalNode(json,sha,sceneIndex,node){
  const receiptScene=resolveC80437SuccessorReceiptScene(json,sha,sceneIndex);
  if (!receiptScene || !Number.isInteger(node)) return null;
  const src=toOrig(sha,node);
  const entry=receiptScene.technical?.[src];
  if (!entry || !entry.paths?.some(p=>p.at(-1)===src &&
    exactInheritedPath(json,sceneIndex,p.map(n=>toCow(sha,n)),sha))) return null;
  return {...entry,...receipt.nodes[src]};
}
const overrides = Object.freeze([
  { root:12193, id:'technical-electrical',storey:'1F',min:483 },
  { root:12194, id:'technical-electrical',storey:'2F',min:483 },
  { root:12224, id:'technical-electrical',storey:'2F',min:483,max:488 },
  { root:12228, id:'technical-drainage',storey:'1F',apartment:'SHARED_OTHER',min:488 },
  { root:12230, id:'technical-electrical',storey:'2F',min:495 },
  { root:12237, id:'technical-drainage',storey:'1F',apartment:'SHARED_OTHER',min:500 },
  { root:12239, id:'technical-drainage',storey:'2F',min:524 },
  { root:12242, id:'technical-drainage',storey:'2F',min:524 },
  ...[12243,12245,12247].map(root=>({ root, id:'technical-water',storey:'1F',apartment:'SHARED_OTHER',min:524 })),
  ...[12244,12246,12248].map(root=>({ root, id:'technical-water',storey:'2F',apartment:'SHARED_OTHER',min:524 })),
  { root:C80_608C_DUCT_ROOT, id:'technical-ventilation',storey:'2F',min:608 },
  { root:C80_614_DUCT_ROOT, id:'technical-ventilation',storey:'2F',min:614 },
]);
const modelNumber = sha => sha===C80_SUCC455_SAVO483_GLB_SHA256 ? 483
  : sha===C80_WW74_L150_GLB_SHA256 ? 488
  : sha===C80_495_GLB_SHA256 ? 495
  : sha===C80_500_GLB_SHA256 ? 500
  : sha===C80_524_RAIN_GLB_SHA256 ? 524
  : sha===C80_530_V27_GLB_SHA256 ? 530
  : sha===C80_602_GLB_SHA256 ? 602
  : sha===C80_608C_GLB_SHA256 ? 608
  : sha===C80_614_GLB_SHA256 ? 614 : -1;
function withinRoot(json,root,node) {
  const seen=new Set(),queue=[root];
  while (queue.length) {
    const i=queue.pop();
    if (i===node) return true;
    if (seen.has(i)||seen.size>10000)return false;
    seen.add(i);
    const children=json.nodes?.[i]?.children;
    if (children!==undefined&&!Array.isArray(children))return false;
    for (const child of children??[]) {
      if (!Number.isInteger(child)||child<0||child>=json.nodes.length)return false;
      queue.push(child);
    }
  }
  return false;
}
export function resolveC80SuccessorNewTechnicalNode(json,sha,sceneIndex,node){
  if (!Number.isInteger(node) ||
      !resolveC80437SuccessorReceiptScene(json,sha,sceneIndex)) return null;
  const version=modelNumber(sha),roots=json.scenes[sceneIndex].nodes;
  for (const item of overrides) {
    if(version<item.min || version>(item.max??Infinity)||
       !Array.isArray(roots)||roots.filter(n=>n===item.root).length!==1)continue;
    if(withinRoot(json,item.root,node)) return {
      id:item.id,storey:item.storey,apartment:item.apartment??'D',kind:'WORK_TEST_NEW_ROOT',
    };
  }
  return null;
}
export function resolveC80SuccessorTechnicalNode(json,sha,sceneIndex,node){
  return resolveC80437SuccessorTechnicalNode(json,sha,sceneIndex,node) ??
    resolveC80SuccessorNewTechnicalNode(json,sha,sceneIndex,node);
}
