/**
 * C80 BOTH G1-side scene-mount adapter for main a0aa685, WORK_TEST/SOURCE_ONLY.
 * Delegates the real c70_main_view_bridge selection; never reimplements routing.
 * Owns exactly two G1 source context mesh.visible flags, not the parent gate.
 */
import {createC80G1SideContextOverlay,C80_SOURCE_SHA256} from './c80_g1_side_context_overlay.mjs';
const reject=s=>{throw Error('C80_G1_MAIN_ADAPTER_FAIL_CLOSED: '+s)};

export function createC80G1MainViewAdapter({session,bridge,readMountedScene,uiHost,refreshEdges=()=>{}}={}){
  if(session?.contract?.model!=='D_C80'||session.verification?.glbSha256!==C80_SOURCE_SHA256||
     session.contract?.glbSha256!==C80_SOURCE_SHA256 || session.contract.canPublish!==false ||
     session.verification.safeForProduction!==false || session.verification.verified!==true ||
     session.gltf?.parser?.json?.scene!==0 || typeof readMountedScene!=='function' ||
     bridge?.sourceModel!=='D_C80'||bridge.sourceSha256!==C80_SOURCE_SHA256 ||
     !bridge.available || bridge.active || typeof bridge.apply!=='function'||
     typeof bridge.restore!=='function'||typeof bridge.dispose!=='function'||
     typeof bridge.enforce!=='function'||typeof refreshEdges!=='function'||
     !uiHost||typeof uiHost.appendChild!=='function'||typeof uiHost.ownerDocument?.createElement!=='function')
    reject('verified C80 session/bridge/host required');
  const policy=createC80G1SideContextOverlay({
    gltf:session.gltf,verifiedGlbSha256:C80_SOURCE_SHA256,sourceKind:'work-test',readMountedScene
  });
  const doc=uiHost.ownerDocument;
  const label=doc.createElement('label');
  const checkbox=doc.createElement('input');checkbox.type='checkbox'; checkbox.checked=false;
  checkbox.dataset.c80G1SideContext='opt-in';
  label.dataset.c80G1SideContext='control';
  label.title='Vain lähdekonteksti, ei vahvistettu rakennettu nykytila.';
  label.appendChild(checkbox);
  label.appendChild(doc.createTextNode(' Näytä G1-lähdekuoret (WORK_TEST / ei nykytila)'));
  label.hidden=true;checkbox.disabled=true;
  uiHost.appendChild(label);
  let disposed=false, show=false;
  const isBoth=()=>!disposed && bridge.active && bridge.available && bridge.sceneIndex===0 &&
    bridge.selectedScene===session.gltf.scenes[0] && readMountedScene()===session.gltf.scenes[0];
  const sync=()=>{
    const active=isBoth();
    label.hidden=!active;checkbox.disabled=!active || bridge.sourceContextVisible !== true;
    checkbox.checked=active && bridge.sourceContextVisible === true && show;
  };
  const restore=()=>{
    if(disposed)return;
    policy.onModelUnmount();show=false;
    try{bridge.restore()}finally{sync()}
  };
  const apply=floor=>{
    if(disposed)reject('disposed');
    // Existing bridge owns routing, camera and scene host; no second mount.
    const report=bridge.apply(floor);
    try {
      if(!report||!Number.isInteger(report.sceneIndex))reject('route report unavailable');
      policy.selectScene(report.sceneIndex,true);
      show=false;sync();
      return report;
    } catch(error) {
      show=false;policy.onModelUnmount();
      try{bridge.restore()}catch(_) {/* original host must fail closed */}
      sync();throw error;
    }
  };
  const setG1SideVisible=value=>{
    if(disposed||typeof value!=='boolean'||!isBoth())reject('BOTH scene0 active boolean required');
    if(value && bridge.sourceContextVisible !== true)reject('G1 opt-in requires SOURCE_CONTEXT ON');
    const previous=show;
    try {
      // false == focus (2 side source meshes hidden); true == explicit opt-in.
      policy.setInteriorMode(!value);
      show=value;sync();refreshEdges();
    } catch(error) {
      try{policy.setInteriorMode(!previous)}catch(_) {policy.onModelUnmount();}
      show=previous;sync();throw error;
    }
  };
  const setSourceContextVisible=value=>{
    if(disposed||typeof value!=='boolean'||typeof bridge.setSourceContextVisible!=='function')
      reject('source context control unavailable');
    // Restore G1's opt-in BEFORE the K17/roof/shell composer hides context.
    if(show && isBoth())setG1SideVisible(false);
    try{
      const result=bridge.setSourceContextVisible(value);
      // Reassert G1 focus AFTER K17/composer changes the shared mesh state.
      if(isBoth()){policy.selectScene(0,true);show=false;}
      return result;
    }finally{sync()}
  };
  const enforce=()=>{
    if(disposed)return;
    bridge.enforce();
    if(!bridge.active || !bridge.available){policy.onModelUnmount();show=false;}
    sync();
  };
  const dispose=()=>{
    if(disposed)return;
    policy.dispose();show=false;disposed=true;
    checkbox.removeEventListener('change',onChange);
    label.remove();
    bridge.dispose();
  };
  function onChange(){try{setG1SideVisible(Boolean(checkbox.checked));}catch(_){sync();}}
  checkbox.addEventListener('change',onChange);
  sync();
  // Proxy keeps the live getters of the original bridge. Spreading or copying
  // it would freeze selectedScene/active at the time of first model mount.
  return new Proxy(Object.create(null),{
    get(target,prop,receiver){
      if(prop==='apply')return apply;
      if(prop==='restore')return restore;
      if(prop==='dispose')return dispose;
      if(prop==='enforce')return enforce;
      if(prop==='setG1SideVisible')return setG1SideVisible;
      if(prop==='setSourceContextVisible')return setSourceContextVisible;
      if(prop==='g1SideVisible')return isBoth()&&show;
      if(prop==='g1SideSupported')return isBoth();
      return Reflect.get(bridge,prop,bridge);
    },
    has(_target,prop){return prop==='g1SideVisible'||prop==='g1SideSupported'||prop==='setG1SideVisible'||prop in bridge},
  });
}
