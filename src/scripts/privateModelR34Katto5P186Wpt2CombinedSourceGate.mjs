/**
 * Source-only receipt for R34 GFIV + KATTO5 P186 A-C presentation apertures
 * + opt-in historical 2015 WPT2 schematic. This is NOT a viewer registration,
 * binding of source links, structural model acceptance, or an as-built claim.
 * Caller MUST hash the entire original, unmodified GLB before invoking.
 */
export const R34_KATTO5_P186_WPT2_SOURCE = Object.freeze({
 glbSha256:'5b28b457ab0d1614e45a70b5f8dbdfb5123f8e7d8b0d1283c8cdf0bd1f839a98',
 glbBytes:67433780,
 zipSha256:'8a91d7b26c07447dd499b714a5336351d127ff67006b6979663c103284031b1a',
 zipDriveId:'1Dm-_lRzHK_ntTIckzksBP3Pl1se7k0ie',
 receiverSha256:'cede7d94aae77d1869c3a1393b7e1fcd9d534baf77731f1d9de8a19bbde7de4b',
 massDonorSha256:'215574ecfda078f4b9b828c0f3204c282bcb0e3e492d18967c9724b894d49d3d',
 commonBaseSha256:'2fe923d7c1cb84bec69622b96d1b42db5741a5220f19f2810accc88cbdb88e54',
 historicalDonorSha256:'0378ac71ae327e2462ae4803c95878030d8b5860342071cd948388057a0ca435',
 sceneCount:868,nodeCount:14063,meshCount:5313,accessorCount:11622,
 bufferViewCount:11629,materialCount:837,defaultScene:292,
});
const SPECS=Object.freeze({
 862:Object.freeze({roots:505,hash:'f230bf47',active:2672,history:false}),
 863:Object.freeze({roots:510,hash:'9a622164',active:2768,history:true}),
 864:Object.freeze({roots:207,hash:'9e41085c',active:1039,history:false}),
 865:Object.freeze({roots:208,hash:'7c411407',active:1040,history:true}),
 866:Object.freeze({roots:505,hash:'e5966852',active:2672,history:false}),
 867:Object.freeze({roots:510,hash:'0570f401',active:2768,history:true}),
});
const NEW_MASS_ROOT=14062,OLD_MASS_ROOT=13369;
const HISTORY_START=13979,HISTORY_END=14059;
function rootHash(ids){
 let h=2166136261;
 for(const c of ids.join(','))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
 return h.toString(16).padStart(8,'0');
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
function rootSwapExact(oldRoots,newRoots){
 return oldRoots.length===newRoots.length&&
  oldRoots.filter(n=>n===OLD_MASS_ROOT).length===1&&
  oldRoots.every((n,i)=>newRoots[i]===(n===OLD_MASS_ROOT?NEW_MASS_ROOT:n));
}
function activeSwapExact(oldNodes,newNodes){
 const removed=[OLD_MASS_ROOT,13365,13367],added=[NEW_MASS_ROOT,14060,14061];
 return oldNodes.size===newNodes.size&&
  removed.every(n=>oldNodes.has(n)&&!newNodes.has(n))&&
  added.every(n=>!oldNodes.has(n)&&newNodes.has(n))&&
  [...oldNodes].every(n=>removed.includes(n)||newNodes.has(n))&&
  [...newNodes].every(n=>added.includes(n)||oldNodes.has(n));
}
function safeHistoricalNode(n){
 const e=n?.extras;
 if(!e||e.current!==false||e.asBuilt!==false)return false;
 for(const k of ['sourceLinksBound','sourceLinksBoundNewSHA','physicalCable',
   'physicalRouteVerified','physicalCableRouteVerified','electricalCircuitVerified',
   'physicalHostVerified','productionWebGLVerified','humanReviewVerified']){
  if(e[k]===true)return false;
 }
 if(typeof e.physicalConnectionsVerified==='number'&&e.physicalConnectionsVerified!==0)return false;
 return e.r34HistoricalImport?.historicalPlanYear===2015&&
  e.r34HistoricalImport?.['2026InstalledPhysicalCableRouteVerified']===false&&
  e.r34HistoricalImport?.sourceLinksBoundForOutputSHA===false;
}
/** Strict source receipt, not an authorization to render in production. */
export function r34Katto5P186Wpt2CombinedGate(json,sha){
 const c=R34_KATTO5_P186_WPT2_SOURCE;
 if(sha!==c.glbSha256||!json||json.scene!==c.defaultScene||
    json.scenes?.length!==c.sceneCount||json.nodes?.length!==c.nodeCount||
    json.meshes?.length!==c.meshCount||json.accessors?.length!==c.accessorCount||
    json.bufferViews?.length!==c.bufferViewCount||json.materials?.length!==c.materialCount)return null;
 const seen={};
 for(const [key,rule] of Object.entries(SPECS)){
  const i=Number(key),s=json.scenes[i],r=s?.nodes,e=s?.extras;
  if(!Array.isArray(r)||r.length!==rule.roots||rootHash(r)!==rule.hash||
    !s.name?.endsWith('__scene'+i)||
    e?.['2015SchematicOptIn']!==rule.history||
    e?.historicalSchematicNotPhysicalCable!==true||
    e?.historicalDonorGLBSHA256!==c.historicalDonorSha256||
    e?.hostHold!==true||e?.sourceLinksBound!==false||
    e?.current!==false||e?.asBuilt!==false)return null;
  if(i>=866){
   if(e?.stage!=='WORK_TEST/HOST_HOLD'||
      e?.optinP186PresentationOnly!==true||
      e?.optinHist2015!==rule.history||e?.noFirestopProof!==true)return null;
  }else if(e?.stage!=='WORK_TEST_HOST_HOLD')return null;
  const active=reachable(json,r);
  if(!active||active.size!==rule.active)return null;
  const hist=[...active].filter(n=>n>=HISTORY_START&&n<=HISTORY_END);
  if(hist.length!==(rule.history?(i===865?1:81):0))return null;
  seen[i]=active;
 }
 if(!rootSwapExact(json.scenes[862].nodes,json.scenes[866].nodes)||
    !rootSwapExact(json.scenes[863].nodes,json.scenes[867].nodes)||
    !activeSwapExact(seen[862],seen[866])||!activeSwapExact(seen[863],seen[867]))return null;
 // Historical objects are not permitted in the new CLEAN scene.
 const history=[...seen[867]].filter(n=>!seen[866].has(n)).sort((a,b)=>a-b);
 const originalHistory=[...seen[863]].filter(n=>!seen[862].has(n)).sort((a,b)=>a-b);
 if(history.length!==96||history.some((n,i)=>n!==originalHistory[i]))return null;
 for(let n=HISTORY_START;n<=HISTORY_END;n++){
  if(!safeHistoricalNode(json.nodes[n])||seen[866].has(n)||
     !seen[867].has(n)||!seen[863].has(n))return null;
 }
 const root=json.nodes[NEW_MASS_ROOT],re=root?.extras;
 if(!root||JSON.stringify(root.children)!=='[13364,14060,13366,14061,13368]'||
   re?.presentationOnly!==true||re?.physicalVerified!==false||
   re?.structuralCutVerified!==false||re?.current!==false||re?.asBuilt!==false||
   re?.stage!=='WORK_TEST/HOST_HOLD')return null;
 for(const [id,mesh] of [[14060,5311],[14061,5312]]){
  const n=json.nodes[id],e=n?.extras;
  if(n?.mesh!==mesh||e?.presentationOnly!==true||
     e?.physicalVerified!==false||e?.structuralCutVerified!==false||
     e?.current!==false||e?.asBuilt!==false||
     e?.stage!=='WORK_TEST/HOST_HOLD')return null;
 }
 return Object.freeze({
  sha256:sha,stage:'WORK_TEST/HOST_HOLD',current:false,asBuilt:false,
  sourceLinksBound:false,productionWebGLVerified:false,humanReview:'NOT_RUN',
  presentationAperturesOnly:true,structuralOpeningsVerified:false,
  clean:Object.freeze({BOTH:866}),historical2015:Object.freeze({BOTH:867}),
 });
}
/** Only exact opt-in BOTH is allowed; never silently map a 2F or 1F request. */
export function resolveR34Katto5P186Wpt2CombinedScene(json,sha,floor,historical2015=false){
 if(floor!=='BOTH'||typeof historical2015!=='boolean')return null;
 const receipt=r34Katto5P186Wpt2CombinedGate(json,sha);
 if(!receipt)return null;
 return Object.freeze({scene:historical2015?867:866,floor:'BOTH',historical2015,
  sourceSha256:sha,stage:'WORK_TEST/HOST_HOLD',current:false,asBuilt:false,
  sourceLinksBound:false});
}
