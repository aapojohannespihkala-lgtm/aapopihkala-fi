import { rehydrateHI20SourceScenes } from './c80SourceProfiles.mjs';

// The HI20 52-scene WORK_TEST reuses 1 730 glTF nodes under several parents.
// GLTFLoader (three r185) caches one object per node and `add` moves it, so
// each shared child ends up only under the parent resolved last. Production
// 01.11.2026: 2F scene 48 rendered 230/530 source meshes (balcony glass and
// the 2F walls missing), 1F scene 50 was also short; BOTH 51 was complete.
// Which parent wins depends on load timing, so a fresh parse can differ.
//
// Rebuild exactly the three mounted floor scenes from the source JSON
// hierarchy with per-scene copies of the cached source objects (shared
// geometry/material, no new geometry, no GLB change). The other 49 scenes and
// the loader cache stay untouched. Exact SHA only; any mismatch fails closed
// before a single scene is changed.
export const HI20_UNIFIED52_SOURCE_SHA =
  '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
export const HI20_UNIFIED52_REHYDRATED_SCENES = Object.freeze([48, 50, 51]);

export async function rehydrateHi20Unified52SourceScenes(gltf, verifiedSha) {
  if (verifiedSha !== HI20_UNIFIED52_SOURCE_SHA) return null;
  const parser = gltf?.parser, json = parser?.json;
  if (typeof parser?.getDependency !== 'function' || json?.scenes?.length !== 52 ||
      gltf?.scenes?.length !== 52 || !Array.isArray(json.nodes))
    throw Error('HI20_UNIFIED52_REHYDRATE: source structure');
  const sourcePaths = new Map();
  const ids = new Set();
  for (const si of HI20_UNIFIED52_REHYDRATED_SCENES) {
    const paths = new Map();
    const visit = (id, path) => {
      if (!Number.isInteger(id) || !json.nodes[id] || paths.has(id) ||
          path.includes(id) || path.length > 128)
        throw Error('HI20_UNIFIED52_REHYDRATE: ambiguous path ' + si + ':' + id);
      const next = [...path, id];
      paths.set(id, next); ids.add(id);
      for (const child of json.nodes[id].children ?? []) visit(child, next);
    };
    for (const root of json.scenes[si]?.nodes ?? []) visit(root, []);
    if (!paths.size) throw Error('HI20_UNIFIED52_REHYDRATE: empty scene ' + si);
    sourcePaths.set(si, paths);
  }
  const cached = new Map(await Promise.all([...ids].map(async (id) =>
    [id, await parser.getDependency('node', id)])));
  return rehydrateHI20SourceScenes(gltf, json, sourcePaths, cached,
    [...HI20_UNIFIED52_REHYDRATED_SCENES]);
}
