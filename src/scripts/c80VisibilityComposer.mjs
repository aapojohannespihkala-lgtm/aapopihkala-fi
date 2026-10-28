/**
 * C80-only composition layer for three independently released SOURCE_ONLY visibility
 * policies. Source C80 GLB SHA and 4-scene identity must already be authenticated.
 * No mesh, material, geometry or world transform is copied or changed here.
 *
 * Integration contract: pass the RELEASED K17 *adapter*, not raw C70/C80 bridge.
 * Call the returned facade in place of the K17 adapter for selection/restore,
 * and use its three setters for UI. Never independently call roof/shell helpers.
 */
import { createC80RoofContextController, C80_SOURCE_SHA } from './c80RoofVisibility.mjs';
import { createC80FloorShellFocus } from './c80FloorShellFocus.mjs';
const fail = message => { throw Error('C80_VISIBILITY_COMPOSER_FAIL_CLOSED: ' + message); };
const MAP = Object.freeze({BOTH:0,'1F':1,'2F':2});

export function createC80VisibilityComposer({ bridge, session }) {
  if (!bridge?.isSourceScene || bridge.sourceModel !== 'D_C80' ||
      typeof bridge.setSourceContextVisible !== 'function' ||
      bridge.active || !bridge.available ||
      session?.contract?.model !== 'D_C80' ||
      session?.contract?.glbSha256 !== C80_SOURCE_SHA ||
      session?.verification?.verified !== true ||
      session?.verification?.glbSha256 !== C80_SOURCE_SHA ||
      session?.verification?.safeForProduction !== false ||
      session?.contract?.canPublish !== false ||
      session?.contract?.canApplyToViewer !== false ||
      !Array.isArray(session?.gltf?.scenes) || session.gltf.scenes.length !== 4)
    fail('verified original C80 K17-adapter staging session required');
  const gltf = session.gltf;
  const shell = createC80FloorShellFocus({gltf, verifiedSourceSHA256:C80_SOURCE_SHA});
  if (!shell.ok) fail('floor-shell source guard: ' + shell.reason);
  const roof = createC80RoofContextController({gltf,sourceSha256:C80_SOURCE_SHA});
  let destroyed=false;
  let requestedRoof=false; // interior-facing BOTH default
  let requestedShell='FOCUS'; // interior-facing 1F/2F default
  let sourceContext=bridge.sourceContextVisible;
  if (sourceContext !== true) fail('K17 adapter must start with SOURCE_CONTEXT enabled');
  const ensure=()=>{if(destroyed) fail('disposed');};
  const clearPresentation = () => {
    // Reverse order of application: shell and roof are overlays on K17 state.
    shell.restore();
    roof.restore();
  };
  const reapplyPresentation = () => {
    if (!bridge.active) return;
    const index = bridge.sceneIndex;
    if (![0,1,2].includes(index) || bridge.selectedScene !== gltf.scenes[index])
      fail('wrong scene/mount; not applying presentation visibility');
    if (index === 0) {
      // CRITICAL: the roof opt-in must NOT bypass SOURCE_CONTEXT=OFF.
      // Roof belongs to the other (non-K17) C80 SOURCE_CONTEXT children.
      roof.apply({selectedScene:gltf.scenes[0],sceneIndex:0,
        showRoofContext:Boolean(sourceContext && requestedRoof)});
    } else if (!shell.apply(index,requestedShell)) {
      fail('floor-shell apply rejected');
    }
  };
  const safely = action => {
    ensure();
    try {return action();}
    catch (error) {
      try {clearPresentation();} catch {};
      try {bridge.restore();} catch {};
      throw error;
    }
  };
  const composed = Object.create(bridge);
  Object.defineProperties(composed, {
    apply: { enumerable:true, value: floor => safely(() => {
      if (!Object.hasOwn(MAP,floor)) fail('unsupported floor');
      clearPresentation();
      const result=bridge.apply(floor);
      if (bridge.sceneIndex!==MAP[floor]) fail('source scene routing mismatch');
      reapplyPresentation();
      return result;
    }) },
    restore: { enumerable:true, value:()=>safely(()=>{
      clearPresentation();
      return bridge.restore();
    }) },
    setSourceContextVisible: { enumerable:true, value:visible=>safely(()=>{
      if (typeof visible !== 'boolean') fail('source context requires boolean');
      clearPresentation();
      // This policy alone owns the parent/child K17 visibility baseline.
      const result=bridge.setSourceContextVisible(visible);
      sourceContext=visible;
      reapplyPresentation();
      return result;
    }) },
    setRoofContextVisible: { enumerable:true, value:visible=>safely(()=>{
      if (typeof visible !== 'boolean') fail('roof requires boolean');
      if (bridge.active && bridge.sceneIndex===0) roof.restore();
      requestedRoof=visible;
      reapplyPresentation();
      return Object.freeze({requested:visible,effective:sourceContext&&visible&&bridge.active&&bridge.sceneIndex===0});
    }) },
    setFloorShellMode: { enumerable:true, value:mode=>safely(()=>{
      if (mode!=='FOCUS' && mode!=='SOURCE') fail('shell mode must be FOCUS or SOURCE');
      if (bridge.active && (bridge.sceneIndex===1||bridge.sceneIndex===2)) shell.restore();
      requestedShell=mode;
      reapplyPresentation();
      return Object.freeze({requested:mode,applied:bridge.active&&(bridge.sceneIndex===1||bridge.sceneIndex===2)});
    }) },
    enforce: { enumerable:true, value:()=>safely(()=>{
      bridge.enforce();
      if (!bridge.active) clearPresentation();
    }) },
    dispose: { enumerable:true, value:()=>{
      if (destroyed) return;
      // Reverse overlay changes before underlying bridge frees original GLTF resources.
      clearPresentation();
      destroyed=true;
      return bridge.dispose();
    } },
    sourceContextVisible: { enumerable:true, get:()=>sourceContext },
    roofContextVisible: { enumerable:true, get:()=>requestedRoof },
    floorShellMode: { enumerable:true, get:()=>requestedShell },
  });
  return Object.freeze(composed);
}
