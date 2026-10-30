/** HI12 policy in the existing C70/C80 scene bridge. Reversible visible bits only. */
import { c80Hi12Source } from './c80SourceProfiles.mjs';
const fail = why => { throw Error('C80_HI12_VISIBILITY_FAIL_CLOSED: ' + why); };
export function createC80Hi12VisibilityAdapter({ bridge, session }) {
  const { profile, sourceObjects } = c80Hi12Source(session);
  if (bridge?.sourceModel !== 'D_C80' || bridge.sourceSha256 !== session.verification.glbSha256 || bridge.active || !bridge.available)
    fail('inactive verified source bridge required');
  let visible = true, roof = false, shell = 'FOCUS', disposed = false;
  const baseline = new Map();
  const restoreBits = () => { for (const [object, value] of baseline) object.visible = value; baseline.clear(); };
  const set = (object, value) => {
    if (!object || typeof object.visible !== 'boolean') fail('bound object absent');
    if (!baseline.has(object)) baseline.set(object, object.visible);
    object.visible = Boolean(baseline.get(object) && value);
  };
  const present = () => {
    restoreBits();
    if (!bridge.active) return;
    const si = bridge.sceneIndex, expected = profile.scenes[si], objects = sourceObjects[si];
    if (((session.contract.sourceSceneCount === 20 && [12, 17, 18].includes(si)) ||
         (session.contract.sourceSceneCount === 24 && [20, 21, 22].includes(si)) ||
         (session.contract.sourceSceneCount === 26 && [20, 24, 25].includes(si))) &&
        bridge.selectedScene === session.gltf.scenes[si]) return;
    if (![0, 1, 2].includes(si) || bridge.selectedScene !== session.gltf.scenes[si]) fail('wrong scene');
    // Only architectural context leaves are hidden. Independent K17 and SITE
    // roots, their geometry/materials, and all FULL_CONTEXT flags remain authored.
    for (const id of expected.contextNodeIds)
      set(objects.get(id), visible && (si === 0 ? roof || !profile.roofNodeIds.includes(id) : shell === 'SOURCE'));
  };
  const safely = action => {
    if (disposed) fail('disposed');
    try { return action(); } catch (error) { restoreBits(); try { bridge.restore(); } catch {} throw error; }
  };
  const facade = Object.create(bridge);
  Object.defineProperties(facade, {
    apply: { value: floor => safely(() => { restoreBits(); const result = bridge.apply(floor); present(); return result; }) },
    restore: { value: () => safely(() => { restoreBits(); return bridge.restore(); }) },
    enforce: { value: () => safely(() => { bridge.enforce(); if (!bridge.active) restoreBits(); }) },
    dispose: { value: () => { if (disposed) return; restoreBits(); disposed = true; bridge.dispose(); } },
    setSourceContextVisible: { value: value => safely(() => {
      if (typeof value !== 'boolean') fail('explicit context boolean required');
      visible = value; present(); return { applied: bridge.active, visible, keptIndependentK17: 14 };
    }) },
    setRoofContextVisible: { value: value => safely(() => {
      if (typeof value !== 'boolean') fail('explicit roof boolean required');
      roof = value; present(); return { applied: bridge.active && bridge.sceneIndex === 0 };
    }) },
    setFloorShellMode: { value: value => safely(() => {
      if (!['FOCUS', 'SOURCE'].includes(value)) fail('shell mode');
      shell = value; present(); return { applied: bridge.active && [1, 2].includes(bridge.sceneIndex) };
    }) },
    sourceContextVisible: { get: () => visible },
    roofContextVisible: { get: () => roof },
    floorShellMode: { get: () => shell },
  });
  return Object.freeze(facade);
}

