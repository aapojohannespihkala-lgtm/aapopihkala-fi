/**
 * C80-only addon for the main a0aa685 existing C70/C80 source-scene bridge.
 * No model mutation except reversible Object3D.visible on C80 context children.
 * NEVER changes C70, CURRENT or gltf.scenes[3] (FULL_CONTEXT).
 */
import { createC80K17VisibilityPolicy } from './c80_k17_visibility_policy.mjs';
const SHA = 'c8230e1877a2fc2cd0c633c5247a92975b4669ae685f491fad9f45092fc11b8d';
const NAME = 'C80_SOURCE_CONTEXT_SEPARATE_FROM_FLOOR_CONTENT';
const fail = reason => { throw new Error('C80_K17_VIEWER_ADAPTER_FAIL_CLOSED: ' + reason); };

export function createC80K17ViewerBridgeAdapter(bridge, session) {
  if (!bridge?.isSourceScene || bridge?.sourceModel !== 'D_C80' ||
      session?.contract?.model !== 'D_C80' ||
      session.contract.glbSha256 !== SHA || session.verification?.glbSha256 !== SHA ||
      session.verification?.verified !== true ||
      session.contract?.canApplyToViewer !== false || session.contract?.canPublish !== false ||
      !Array.isArray(session.gltf?.scenes) || session.gltf.scenes.length !== 4)
    fail('Exact original C80 verified WORK_TEST source bridge required');
  let requestedVisible = true;
  let policy = null;
  let destroyed = false;
  const restorePolicy = () => {
    if (policy) { policy.restore(); policy = null; }
  };
  const setVisible = visible => {
    if (typeof visible !== 'boolean') fail('Explicit boolean required');
    if (destroyed) fail('Disposed');
    requestedVisible = visible;
    if (!bridge.active) return Object.freeze({ applied: false, visible });
    if (!policy) fail('Active C80 floor is missing verified K17 policy');
    const state = policy.apply(visible);
    return Object.freeze({ applied: true, ...state });
  };
  // Create an addon rather than modifying the frozen C70 source bridge.
  // Its existing getters/methods stay inherited and retain their closures.
  const addon = Object.create(bridge);
  Object.defineProperties(addon, {
    apply: {value: floor => {
      if (destroyed) fail('Disposed');
      restorePolicy();
      const report = bridge.apply(floor);
      if (!report) return report;
      try {
        const index = bridge.sceneIndex;
        if (index !== (floor === 'BOTH' ? 0 : floor === '1F' ? 1 : 2) ||
            bridge.selectedScene !== session.gltf.scenes[index])
          fail('Unexpected C80 floor scene');
        const scene = bridge.selectedScene;
        const groups = [];
        scene.traverse(object => {
          const sourceName = object.userData?.name;
          const expectedRuntimeName = NAME + (index === 0 ? '' : '_' + index);
          if (sourceName === NAME && object.name === expectedRuntimeName) groups.push(object);
        });
        if (groups.length !== 1) fail('Ambiguous/missing source-context group');
        policy = createC80K17VisibilityPolicy(groups[0], index);
        policy.apply(requestedVisible);
        return report;
      } catch (error) {
        restorePolicy();
        try { bridge.restore(); } catch { /* Fail closed even if host restore fails. */ }
        throw error;
      }
    }, enumerable: true},
    restore: {value: () => { restorePolicy(); return bridge.restore(); }, enumerable: true},
    enforce: {value: () => {
      bridge.enforce();
      if (!bridge.active) restorePolicy();
    }, enumerable: true},
    dispose: {value: () => {
      if (destroyed) return;
      restorePolicy(); destroyed = true; bridge.dispose();
    }, enumerable: true},
    setSourceContextVisible: {value:setVisible, enumerable:true},
    sourceContextVisible: {get:() => requestedVisible, enumerable:true},
  });
  return Object.freeze(addon);
}
