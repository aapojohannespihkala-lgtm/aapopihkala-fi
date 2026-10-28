/**
 * C80 BOTH-only visual override for the original WORK_TEST source GLB.
 * Not an as-built claim. No geometry, material or scene router changes.
 * Integrate after createC70MainViewBridge.apply() has mounted the source scene.
 */
export const C80_SOURCE_SHA = 'c8230e1877a2fc2cd0c633c5247a92975b4669ae685f491fad9f45092fc11b8d';
export const C80_SCENE_BOTH = 'D_BOTH_C80_SOURCE_PRESENTATION_WORK_TEST_HOST_HOLD';
export const C80_ROOF_NAMES = Object.freeze([
  'C80_SOURCE_CONTEXT__ATTIC_K14_GABLE_CONTEXT',
  'C80_SOURCE_CONTEXT__ATTIC_SHARED_DC_CONTEXT',
  'C80_SOURCE_CONTEXT__ROOF_K14_EXISTING_SURFACES',
]);
const roofNames = new Set(C80_ROOF_NAMES);

function fail(detail) { throw new Error(`C80_ROOF_VISIBILITY_GUARD: ${detail}`); }

/**
 * @param {{gltf:any, sourceSha256:string}} input
 * @returns {{apply:(options:{selectedScene:any,sceneIndex:number,showRoofContext:boolean})=>{applied:boolean,changed:number,matched:number},restore:()=>number}}
 */
export function createC80RoofContextController({ gltf, sourceSha256 }) {
  if (sourceSha256 !== C80_SOURCE_SHA ||
      gltf?.scenes?.length !== 4 ||
      gltf?.scenes?.[0]?.name !== C80_SCENE_BOTH ||
      gltf?.parser?.json?.scene !== 0 ||
      gltf?.parser?.json?.scenes?.[0]?.name !== C80_SCENE_BOTH) {
    fail('source SHA or source scene differs');
  }
  const both = gltf.scenes[0];
  const objects = [];
  both.traverse((object) => {
    if (object?.isMesh && roofNames.has(object.name)) objects.push(object);
  });
  if (objects.length !== 3 || new Set(objects.map((o) => o.name)).size !== 3 ||
      objects.some((o) => typeof o.visible !== 'boolean')) {
    fail('exact original three roof meshes missing or duplicated');
  }
  const original = new Map(objects.map((o) => [o, o.visible]));
  return Object.freeze({
    apply({ selectedScene, sceneIndex, showRoofContext }) {
      if (![true, false].includes(showRoofContext)) fail('explicit roof visibility required');
      if (sceneIndex !== 0) return Object.freeze({ applied: false, changed: 0, matched: 3 });
      if (selectedScene !== both) fail('BOTH scene is not the mounted source scene');
      let changed = 0;
      for (const object of objects) {
        // Preserve original authored visible state on opt-in; never reveal a
        // hidden parent (the generic SOURCE_CONTEXT owner keeps that gate).
        const next = Boolean(showRoofContext && original.get(object));
        if (object.visible !== next) { object.visible = next; changed++; }
      }
      return Object.freeze({ applied: true, changed, matched: 3 });
    },
    restore() {
      let changed = 0;
      for (const object of objects) {
        const value = original.get(object);
        if (object.visible !== value) { object.visible = value; changed++; }
      }
      return changed;
    },
  });
}
