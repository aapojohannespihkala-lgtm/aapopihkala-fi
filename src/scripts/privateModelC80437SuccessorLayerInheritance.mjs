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
import {
  C80_620R10_GLB_SHA256, C80_620R10_SCENES, C80_620R10_COW_ALIASES,
  isC80620R10SourceScene,
} from './privateModelC80620R10SourceProfile.mjs';
import {
  C80_620R11_GLB_SHA256, C80_620R11_SCENES, C80_620R11_COW_ALIASES,
  isC80620R11SourceScene,
} from './privateModelC80620R11SourceProfile.mjs';
import {
  C80_620R12_GLB_SHA256, C80_620R12_SCENES, C80_620R12_COW_ALIASES, C80_620R12_K10_VALVE_ROOT,
  isC80620R12SourceScene,
} from './privateModelC80620R12SourceProfile.mjs';
import {
  C80_620R13_GLB_SHA256, C80_620R13_SCENES, C80_620R13_COW_ALIASES,
  isC80620R13SourceScene,
} from './privateModelC80620R13SourceProfile.mjs';
import {
  C80_620R14_GLB_SHA256, C80_620R14_SCENES, C80_620R14_COW_ALIASES,
  isC80620R14SourceScene,
} from './privateModelC80620R14SourceProfile.mjs';
import {
  C80_620R15_GLB_SHA256, C80_620R15_SCENES, C80_620R15_COW_ALIASES,
  isC80620R15SourceScene,
} from './privateModelC80620R15SourceProfile.mjs';
import {
  C80_620R16_GLB_SHA256, C80_620R16_SCENES, C80_620R16_COW_ALIASES,
  isC80620R16SourceScene,
} from './privateModelC80620R16SourceProfile.mjs';
import {
  C80_620R17_GLB_SHA256, C80_620R17_SCENES, C80_620R17_COW_ALIASES,
  isC80620R17SourceScene,
} from './privateModelC80620R17SourceProfile.mjs';
import {
  C80_620R18_GLB_SHA256, C80_620R18_SCENES, C80_620R18_COW_ALIASES,
  isC80620R18SourceScene,
} from './privateModelC80620R18SourceProfile.mjs';
import {
  C80_620R19_GLB_SHA256, C80_620R19_SCENES, C80_620R19_COW_ALIASES,
  isC80620R19SourceScene,
} from './privateModelC80620R19SourceProfile.mjs';
import {
  C80_620R20_GLB_SHA256, C80_620R20_SCENES, C80_620R20_COW_ALIASES,
  isC80620R20SourceScene,
} from './privateModelC80620R20SourceProfile.mjs';
import {
  C80_620R21_GLB_SHA256, C80_620R21_SCENES, C80_620R21_COW_ALIASES,
  isC80620R21SourceScene,
} from './privateModelC80620R21SourceProfile.mjs';
import {C80_620R22_GLB_SHA256,C80_620R22_SCENES,C80_620R22_COW_ALIASES,isC80620R22SourceScene} from './privateModelC80620R22SourceProfile.mjs';
import {C80_R31_9E0B_SOURCE,C80_R31_9E0B_VIEWS,r31ViewerLayerSceneReceipt} from './privateModelC80R31ReviewRuntime.mjs';

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
const V620R10 = Object.freeze({
  614:{floor:'1F',glazing:'CLOSED',cutaway:false},
  615:{floor:'2F',glazing:'CLOSED',cutaway:false},
  616:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  617:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  618:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  619:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R11 = Object.freeze({
  620:{floor:'1F',glazing:'CLOSED',cutaway:false},
  621:{floor:'2F',glazing:'CLOSED',cutaway:false},
  622:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  623:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  624:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  625:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R12 = Object.freeze({
  626:{floor:'1F',glazing:'CLOSED',cutaway:false},
  627:{floor:'2F',glazing:'CLOSED',cutaway:false},
  628:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  629:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  630:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  631:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R13 = Object.freeze({
  632:{floor:'1F',glazing:'CLOSED',cutaway:false},
  633:{floor:'2F',glazing:'CLOSED',cutaway:false},
  634:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  635:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  636:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  637:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R14 = Object.freeze({
  638:{floor:'1F',glazing:'CLOSED',cutaway:false},
  639:{floor:'2F',glazing:'CLOSED',cutaway:false},
  640:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  641:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  642:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  643:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R15 = Object.freeze({
  644:{floor:'1F',glazing:'CLOSED',cutaway:false},
  645:{floor:'2F',glazing:'CLOSED',cutaway:false},
  646:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  647:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  648:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  649:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R16 = Object.freeze({
  650:{floor:'1F',glazing:'CLOSED',cutaway:false},
  651:{floor:'2F',glazing:'CLOSED',cutaway:false},
  652:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  653:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  654:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  655:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R17 = Object.freeze({
  656:{floor:'1F',glazing:'CLOSED',cutaway:false},
  657:{floor:'2F',glazing:'CLOSED',cutaway:false},
  658:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  659:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  660:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  661:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R18 = Object.freeze({
  662:{floor:'1F',glazing:'CLOSED',cutaway:false},
  663:{floor:'2F',glazing:'CLOSED',cutaway:false},
  664:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  665:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  666:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  667:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R19 = Object.freeze({
  668:{floor:'1F',glazing:'CLOSED',cutaway:false},
  669:{floor:'2F',glazing:'CLOSED',cutaway:false},
  670:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  671:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  672:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  673:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R20 = Object.freeze({
  674:{floor:'1F',glazing:'CLOSED',cutaway:false},
  675:{floor:'2F',glazing:'CLOSED',cutaway:false},
  676:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  677:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  678:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  679:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R21 = Object.freeze({
  680:{floor:'1F',glazing:'CLOSED',cutaway:false},
  681:{floor:'2F',glazing:'CLOSED',cutaway:false},
  682:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  683:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  684:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  685:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const V620R22 = Object.freeze({
  686:{floor:'1F',glazing:'CLOSED',cutaway:false},
  687:{floor:'2F',glazing:'CLOSED',cutaway:false},
  688:{floor:'BOTH',glazing:'CLOSED',cutaway:false},
  689:{floor:'BOTH',glazing:'ONE_OPEN',cutaway:false},
  690:{floor:'BOTH',glazing:'STACKED',cutaway:false},
  691:{floor:'BOTH',glazing:'CLOSED',cutaway:true},
});
const R31_SHA = C80_R31_9E0B_SOURCE.glbSha256;
const R31 = Object.freeze(Object.fromEntries(Object.values(C80_R31_9E0B_VIEWS).map(view =>
  [view.sceneIndex, {floor:view.floor,glazing:'CLOSED',cutaway:false}])));
// SHA-locked copy-on-write aliases: a COW node keeps the receipt identity of
// its original node only when its own JSON fingerprint matches exactly.
const COW_ALIASES = Object.freeze({
  [C80_608C_GLB_SHA256]: C80_608C_COW_ALIASES,
  [C80_614_GLB_SHA256]: C80_614_COW_ALIASES,
  [C80_620R10_GLB_SHA256]: C80_620R10_COW_ALIASES,
  [C80_620R11_GLB_SHA256]: C80_620R11_COW_ALIASES,
  [C80_620R12_GLB_SHA256]: C80_620R12_COW_ALIASES,
  [C80_620R13_GLB_SHA256]: C80_620R13_COW_ALIASES,
  [C80_620R14_GLB_SHA256]: C80_620R14_COW_ALIASES,
  [C80_620R15_GLB_SHA256]: C80_620R15_COW_ALIASES,
  [C80_620R16_GLB_SHA256]: C80_620R16_COW_ALIASES,
  [C80_620R17_GLB_SHA256]: C80_620R17_COW_ALIASES,
  [C80_620R18_GLB_SHA256]: C80_620R18_COW_ALIASES,
  [C80_620R19_GLB_SHA256]: C80_620R19_COW_ALIASES,
  [C80_620R20_GLB_SHA256]: C80_620R20_COW_ALIASES,
  [C80_620R21_GLB_SHA256]: C80_620R21_COW_ALIASES,
  [C80_620R22_GLB_SHA256]: C80_620R22_COW_ALIASES,
  [R31_SHA]: C80_620R22_COW_ALIASES,
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
  C80_614_GLB_SHA256, C80_620R10_GLB_SHA256, C80_620R11_GLB_SHA256,
  C80_620R12_GLB_SHA256, C80_620R13_GLB_SHA256, C80_620R14_GLB_SHA256,
  C80_620R15_GLB_SHA256, C80_620R16_GLB_SHA256, C80_620R17_GLB_SHA256,
  C80_620R18_GLB_SHA256, C80_620R19_GLB_SHA256,
  C80_620R20_GLB_SHA256, C80_620R21_GLB_SHA256, C80_620R22_GLB_SHA256,
  R31_SHA,
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
  if (sha===C80_620R10_GLB_SHA256) return V620R10[index];
  if (sha===C80_620R11_GLB_SHA256) return V620R11[index];
  if (sha===C80_620R12_GLB_SHA256) return V620R12[index];
  if (sha===C80_620R13_GLB_SHA256) return V620R13[index];
  if (sha===C80_620R14_GLB_SHA256) return V620R14[index];
  if (sha===C80_620R15_GLB_SHA256) return V620R15[index];
  if (sha===C80_620R16_GLB_SHA256) return V620R16[index];
  if (sha===C80_620R17_GLB_SHA256) return V620R17[index];
  if (sha===C80_620R18_GLB_SHA256) return V620R18[index];
  if (sha===C80_620R19_GLB_SHA256) return V620R19[index];
  if (sha===C80_620R20_GLB_SHA256) return V620R20[index];
  if (sha===C80_620R21_GLB_SHA256) return V620R21[index];
  if (sha===C80_620R22_GLB_SHA256) return V620R22[index];
  if (sha===R31_SHA) return R31[index];
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
  if (sha===C80_620R10_GLB_SHA256) return !!C80_620R10_SCENES[index] &&
    isC80620R10SourceScene(json,sha,index,C80_620R10_SCENES[index].floor);
  if (sha===C80_620R11_GLB_SHA256) return !!C80_620R11_SCENES[index] &&
    isC80620R11SourceScene(json,sha,index,C80_620R11_SCENES[index].floor);
  if (sha===C80_620R12_GLB_SHA256) return !!C80_620R12_SCENES[index] &&
    isC80620R12SourceScene(json,sha,index,C80_620R12_SCENES[index].floor);
  if (sha===C80_620R13_GLB_SHA256) return !!C80_620R13_SCENES[index] &&
    isC80620R13SourceScene(json,sha,index,C80_620R13_SCENES[index].floor);
  if (sha===C80_620R14_GLB_SHA256) return !!C80_620R14_SCENES[index] &&
    isC80620R14SourceScene(json,sha,index,C80_620R14_SCENES[index].floor);
  if (sha===C80_620R15_GLB_SHA256) return !!C80_620R15_SCENES[index] &&
    isC80620R15SourceScene(json,sha,index,C80_620R15_SCENES[index].floor);
  if (sha===C80_620R16_GLB_SHA256) return !!C80_620R16_SCENES[index] &&
    isC80620R16SourceScene(json,sha,index,C80_620R16_SCENES[index].floor);
  if (sha===C80_620R17_GLB_SHA256) return !!C80_620R17_SCENES[index] &&
    isC80620R17SourceScene(json,sha,index,C80_620R17_SCENES[index].floor);
  if (sha===C80_620R18_GLB_SHA256) return !!C80_620R18_SCENES[index] &&
    isC80620R18SourceScene(json,sha,index,C80_620R18_SCENES[index].floor);
  if (sha===C80_620R19_GLB_SHA256) return !!C80_620R19_SCENES[index] &&
    isC80620R19SourceScene(json,sha,index,C80_620R19_SCENES[index].floor);
  if (sha===C80_620R20_GLB_SHA256) return !!C80_620R20_SCENES[index] &&
    isC80620R20SourceScene(json,sha,index,C80_620R20_SCENES[index].floor);
  if (sha===C80_620R21_GLB_SHA256) return !!C80_620R21_SCENES[index] &&
    isC80620R21SourceScene(json,sha,index,C80_620R21_SCENES[index].floor);
  if (sha===C80_620R22_GLB_SHA256) return !!C80_620R22_SCENES[index] &&
    isC80620R22SourceScene(json,sha,index,C80_620R22_SCENES[index].floor);
  if (sha===R31_SHA) return !!r31ViewerLayerSceneReceipt(json,sha,index);
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
    const n=path[i],alias=aliasOf(sha,n),actual=json.nodes?.[n];
    const base=receipt.nodes[alias?.orig??n];
    // A geometry COW alias pins its own new mesh index (alias.mesh).
    const expected=base&&alias&&'mesh' in alias?{...base,mesh:alias.mesh}:base;
    if (!Number.isInteger(n)||!expected||!actual||
        // Receipt stores a group node's mesh as null; glTF omits the key.
        // A renamed COW root pins its own new name (alias.name) with its fingerprint.
        actual.name!==(alias?.name??expected.name) || (actual.mesh??null)!==(expected.mesh??null) ||
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
  // A building geometry COW (alias.building) is the same fixture with an
  // edited mesh: report the verified pinned name/mesh of the loaded node so
  // the per-mesh layer check compares against what is actually mounted.
  const alias=aliasOf(sha,node);
  const own=alias?.building===true ? {name:alias.name??receipt.nodes[src].name,mesh:alias.mesh??receipt.nodes[src].mesh} : {};
  return {...entry,...receipt.nodes[src],...own};
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
  // 620R12: the one store exhaust valve at the owner point joins the IV layer with its duct.
  { root:C80_620R12_K10_VALVE_ROOT, id:'technical-ventilation',storey:'1F',min:621 },
  {root:13176,id:'technical-electrical',storey:'2F',min:631,max:631},
]);
const modelNumber = sha => sha===C80_SUCC455_SAVO483_GLB_SHA256 ? 483
  : sha===C80_WW74_L150_GLB_SHA256 ? 488
  : sha===C80_495_GLB_SHA256 ? 495
  : sha===C80_500_GLB_SHA256 ? 500
  : sha===C80_524_RAIN_GLB_SHA256 ? 524
  : sha===C80_530_V27_GLB_SHA256 ? 530
  : sha===C80_602_GLB_SHA256 ? 602
  : sha===C80_608C_GLB_SHA256 ? 608
  : sha===C80_614_GLB_SHA256 ? 614
  : sha===C80_620R10_GLB_SHA256 || sha===C80_620R11_GLB_SHA256 ? 620
  : sha===C80_620R12_GLB_SHA256 ? 621
  : sha===C80_620R13_GLB_SHA256 ? 622
  : sha===C80_620R14_GLB_SHA256 ? 623
  : sha===C80_620R15_GLB_SHA256 ? 624
  : sha===C80_620R16_GLB_SHA256 ? 625
  : sha===C80_620R17_GLB_SHA256 ? 626
  : sha===C80_620R18_GLB_SHA256 ? 627
  : sha===C80_620R19_GLB_SHA256 ? 628
  : sha===C80_620R20_GLB_SHA256 ? 629
  : sha===C80_620R21_GLB_SHA256 ? 630
  : sha===C80_620R22_GLB_SHA256 || sha===R31_SHA ? 631 : -1;
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
