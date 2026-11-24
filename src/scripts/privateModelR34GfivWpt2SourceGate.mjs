/**
 * Original R34 + GF/IV/K10/WC1/1F2F + 2015 WPT2 schematic cofit.
 * Source-only receipt. It MUST NOT register a viewer scene or bind source links.
 * The caller computes SHA256 over the entire unmodified original GLB.
 * Nothing here authorizes CURRENT, as-built, electrical safety or WebGL release.
 */
export const R34_GFIV_WPT2_SOURCE=Object.freeze({
 glbSha256:'cede7d94aae77d1869c3a1393b7e1fcd9d534baf77731f1d9de8a19bbde7de4b',
 glbBytes:67412900,
 zipSha256:'3da16ebb8e8621be7730376cdc5f7bb56c9e45433d016f7bd4eeb39681db18ec',
 zipDriveId:'18JXOIrbj-_pJtFn03HSnXbvV8Mise9wC',
 historicalDonorSha256:'0378ac71ae327e2462ae4803c95878030d8b5860342071cd948388057a0ca435',
 sceneCount:866,nodeCount:14060,meshCount:5311,defaultScene:292,
});
const SPEC=Object.freeze({
 862:Object.freeze({floor:'BOTH',history:false,roots:505,hash:'f230bf47',active:2672}),
 863:Object.freeze({floor:'BOTH',history:true,roots:510,hash:'9a622164',active:2768}),
 864:Object.freeze({floor:'2F',history:false,roots:207,hash:'9e41085c',active:1039}),
 865:Object.freeze({floor:'2F',history:true,roots:208,hash:'7c411407',active:1040}),
});
const HISTORY_START=13979,HISTORY_END=14059;
function fnvRoots(ids){
 let h=2166136261;
 for(const ch of ids.join(','))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
 return h.toString(16).padStart(8,'0');
}
function sameMembers(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
function addedExact(a,b,add){
 const left=new Set(a),right=new Set(b);
 return left.size===a.length&&right.size===b.length&&
  [...left].every(n=>right.has(n))&&
  sameMembers([...right].filter(n=>!left.has(n)).sort((x,y)=>x-y),add);
}
function reachable(json,roots){
 const seen=new Set(),stack=[...roots];
 while(stack.length){
  const n=stack.pop();
  if(!Number.isInteger(n)||n<0||n>=json.nodes.length)return null;
  if(seen.has(n))continue;
  seen.add(n);
  const children=json.nodes[n]?.children??[];
  if(!Array.isArray(children)||children.length>json.nodes.length)return null;
  stack.push(...children);
 }
 return seen;
}
function historicalNodeSafe(n){
 const e=n?.extras;
 if(!e||e.current!==false||e.asBuilt!==false)return false;
 for(const key of ['sourceLinksBound','sourceLinksBoundNewSHA',
  'sourceLinksBoundToNewSHA','physicalCable','physicalRouteVerified',
  'physicalCableRouteVerified','electricalCircuitVerified',
  'physicalHostVerified','productionWebGLVerified','humanReviewVerified']){
  if(e[key]===true)return false;
 }
 if(typeof e.physicalConnectionsVerified==='number'&&e.physicalConnectionsVerified!==0)return false;
 return e.r34HistoricalImport?.historicalPlanYear===2015&&
  e.r34HistoricalImport?.['2026InstalledPhysicalCableRouteVerified']===false&&
  e.r34HistoricalImport?.sourceLinksBoundForOutputSHA===false;
}
/** Fail closed if the original full-GLB SHA or any scene/source policy differs. */
export function r34GfivWpt2SourceGate(json,sha){
 if(sha!==R34_GFIV_WPT2_SOURCE.glbSha256||!json||
    json.scenes?.length!==R34_GFIV_WPT2_SOURCE.sceneCount||
    json.nodes?.length!==R34_GFIV_WPT2_SOURCE.nodeCount||
    json.meshes?.length!==R34_GFIV_WPT2_SOURCE.meshCount||
    json.scene!==R34_GFIV_WPT2_SOURCE.defaultScene)return null;
 const seen=Object.create(null);
 for(const [i,rule] of Object.entries(SPEC)){
  const scene=json.scenes[i],ex=scene?.extras,roots=scene?.nodes;
  if(!scene||!Array.isArray(roots)||roots.length!==rule.roots||
     fnvRoots(roots)!==rule.hash||
     !scene.name?.endsWith('__scene'+i)||
     !scene.name.includes(rule.history?'HIST2015':'CLEAN')||
     ex?.['2015SchematicOptIn']!==rule.history||
     ex?.historicalSchematicNotPhysicalCable!==true||
     ex?.historicalDonorGLBSHA256!==R34_GFIV_WPT2_SOURCE.historicalDonorSha256||
     ex?.stage!=='WORK_TEST_HOST_HOLD'||ex?.hostHold!==true||
     ex?.current!==false||ex?.asBuilt!==false||ex?.sourceLinksBound!==false)return null;
  const nodes=reachable(json,roots);
  if(!nodes||nodes.size!==rule.active)return null;
  const newNodes=[...nodes].filter(n=>n>=HISTORY_START&&n<=HISTORY_END);
  if(newNodes.length!==(rule.history?(rule.floor==='2F'?1:81):0))return null;
  if(rule.history&&rule.floor==='2F'&&newNodes[0]!==13980)return null;
  seen[i]=nodes;
 }
 if(!Array.isArray(json.scenes[858]?.nodes)||!Array.isArray(json.scenes[860]?.nodes))return null;
 const roots=i=>json.scenes[i].nodes;
 if(!addedExact(roots(862),roots(863),[13307,13979,13980,13981,14059])||
    !sameMembers(roots(860),roots(864))||
    !addedExact(roots(864),roots(865),[13980])||
    !addedExact(roots(862),roots(858),[13307]))return null;
 for(let id=HISTORY_START;id<=HISTORY_END;id++){
  if(!historicalNodeSafe(json.nodes[id])||
    seen[862].has(id)||seen[864].has(id)||!seen[863].has(id))return null;
 }
 return Object.freeze({
  sha256:sha,stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false,
  sourceLinksBound:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
  clean:Object.freeze({BOTH:862,'2F':864}),
  historical2015:Object.freeze({BOTH:863,'2F':865}),
 });
}
/** This selector does not mount or publish scenes. Historical mode is opt-in. */
export function resolveR34GfivWpt2Scene(json,sha,floor,historical2015=false){
 if(!['BOTH','2F'].includes(floor)||typeof historical2015!=='boolean')return null;
 const receipt=r34GfivWpt2SourceGate(json,sha);
 if(!receipt)return null;
 return Object.freeze({scene:historical2015?receipt.historical2015[floor]:receipt.clean[floor],
  floor,historical2015,sourceSha256:sha,sourceLinksBound:false,
  stage:'WORK_TEST_HOST_HOLD',current:false,asBuilt:false});
}
