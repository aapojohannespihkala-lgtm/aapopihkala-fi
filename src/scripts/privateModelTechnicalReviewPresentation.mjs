import { V71_SOURCE_SHA256, V71_SOURCE_SCENE_COUNT, V71_FLOORS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V71LayerSourceProfile.mjs';
import { V72_SOURCE_SHA256, V72_SOURCE_SCENE_COUNT, V72_FLOORS, V72_BUILDING_SCENES, V72_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V72LayerSourceProfile.mjs';
import { V73_SOURCE_SHA256, V73_SOURCE_SCENE_COUNT, V73_FLOORS, V73_BUILDING_SCENES, V73_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V73LayerSourceProfile.mjs';
import { V74_SOURCE_SHA256, V74_SOURCE_SCENE_COUNT, V74_FLOORS, V74_BUILDING_SCENES, V74_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V74LayerSourceProfile.mjs';
import { V75_SOURCE_SHA256, V75_SOURCE_SCENE_COUNT, V75_FLOORS, V75_BUILDING_SCENES, V75_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V75LayerSourceProfile.mjs';
import { V76_SOURCE_SHA256, V76_SOURCE_SCENE_COUNT, V76_FLOORS, V76_BUILDING_SCENES, V76_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V76LayerSourceProfile.mjs';
import { V77_SOURCE_SHA256, V77_SOURCE_SCENE_COUNT, V77_FLOORS, V77_BUILDING_SCENES, V77_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V77LayerSourceProfile.mjs';
import { V78_SOURCE_SHA256, V78_SOURCE_SCENE_COUNT, V78_FLOORS, V78_BUILDING_SCENES, V78_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V78LayerSourceProfile.mjs';
import { V79_SOURCE_SHA256, V79_SOURCE_SCENE_COUNT, V79_FLOORS, V79_BUILDING_SCENES, V79_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V79LayerSourceProfile.mjs';
import { V80_SOURCE_SHA256, V80_SOURCE_SCENE_COUNT, V80_FLOORS, V80_BUILDING_SCENES, V80_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V80LayerSourceProfile.mjs';
import { V81_SOURCE_SHA256, V81_SOURCE_SCENE_COUNT, V81_FLOORS, V81_BUILDING_SCENES, V81_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V81LayerSourceProfile.mjs';
import { V82_SOURCE_SHA256, V82_SOURCE_SCENE_COUNT, V82_FLOORS, V82_BUILDING_SCENES, V82_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V82LayerSourceProfile.mjs';
import { V83_SOURCE_SHA256, V83_SOURCE_SCENE_COUNT, V83_FLOORS, V83_BUILDING_SCENES, V83_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V83LayerSourceProfile.mjs';
import { V84_SOURCE_SHA256, V84_SOURCE_SCENE_COUNT, V84_FLOORS, V84_BUILDING_SCENES, V84_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V84LayerSourceProfile.mjs';
import { V85_SOURCE_SHA256, V85_SOURCE_SCENE_COUNT, V85_FLOORS, V85_BUILDING_SCENES, V85_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V85LayerSourceProfile.mjs';
import { V86_SOURCE_SHA256, V86_SOURCE_SCENE_COUNT, V86_FLOORS, V86_BUILDING_SCENES, V86_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V86LayerSourceProfile.mjs';
import { V87_SOURCE_SHA256, V87_SOURCE_SCENE_COUNT, V87_FLOORS, V87_BUILDING_SCENES, V87_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V87LayerSourceProfile.mjs';
import { V88_SOURCE_SHA256, V88_SOURCE_SCENE_COUNT, V88_FLOORS, V88_BUILDING_SCENES, V88_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V88LayerSourceProfile.mjs';
import { V89_SOURCE_SHA256, V89_SOURCE_SCENE_COUNT, V89_FLOORS, V89_BUILDING_SCENES, V89_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V89LayerSourceProfile.mjs';

/** Exact M5-integrated sources that carry technical review roots. */
const REVIEW_SOURCES = Object.freeze({
  [V71_SOURCE_SHA256]: { count: V71_SOURCE_SCENE_COUNT, floors: V71_FLOORS, scenes: V71_BUILDING_SCENES, roots: V71_TECHNICAL_REVIEW_ROOTS },
  [V72_SOURCE_SHA256]: { count: V72_SOURCE_SCENE_COUNT, floors: V72_FLOORS, scenes: V72_BUILDING_SCENES, roots: V72_TECHNICAL_REVIEW_ROOTS },
  [V73_SOURCE_SHA256]: { count: V73_SOURCE_SCENE_COUNT, floors: V73_FLOORS, scenes: V73_BUILDING_SCENES, roots: V73_TECHNICAL_REVIEW_ROOTS },
  [V74_SOURCE_SHA256]: { count: V74_SOURCE_SCENE_COUNT, floors: V74_FLOORS, scenes: V74_BUILDING_SCENES, roots: V74_TECHNICAL_REVIEW_ROOTS },
  [V75_SOURCE_SHA256]: { count: V75_SOURCE_SCENE_COUNT, floors: V75_FLOORS, scenes: V75_BUILDING_SCENES, roots: V75_TECHNICAL_REVIEW_ROOTS },
  [V76_SOURCE_SHA256]: { count: V76_SOURCE_SCENE_COUNT, floors: V76_FLOORS, scenes: V76_BUILDING_SCENES, roots: V76_TECHNICAL_REVIEW_ROOTS },
  [V77_SOURCE_SHA256]: { count: V77_SOURCE_SCENE_COUNT, floors: V77_FLOORS, scenes: V77_BUILDING_SCENES, roots: V77_TECHNICAL_REVIEW_ROOTS },
  [V78_SOURCE_SHA256]: { count: V78_SOURCE_SCENE_COUNT, floors: V78_FLOORS, scenes: V78_BUILDING_SCENES, roots: V78_TECHNICAL_REVIEW_ROOTS },
  [V79_SOURCE_SHA256]: { count: V79_SOURCE_SCENE_COUNT, floors: V79_FLOORS, scenes: V79_BUILDING_SCENES, roots: V79_TECHNICAL_REVIEW_ROOTS },
  [V80_SOURCE_SHA256]: { count: V80_SOURCE_SCENE_COUNT, floors: V80_FLOORS, scenes: V80_BUILDING_SCENES, roots: V80_TECHNICAL_REVIEW_ROOTS },
  [V81_SOURCE_SHA256]: { count: V81_SOURCE_SCENE_COUNT, floors: V81_FLOORS, scenes: V81_BUILDING_SCENES, roots: V81_TECHNICAL_REVIEW_ROOTS },
  [V85_SOURCE_SHA256]: { count: V85_SOURCE_SCENE_COUNT, floors: V85_FLOORS, scenes: V85_BUILDING_SCENES, roots: V85_TECHNICAL_REVIEW_ROOTS },
  [V86_SOURCE_SHA256]: { count: V86_SOURCE_SCENE_COUNT, floors: V86_FLOORS, scenes: V86_BUILDING_SCENES, roots: V86_TECHNICAL_REVIEW_ROOTS },
  [V87_SOURCE_SHA256]: { count: V87_SOURCE_SCENE_COUNT, floors: V87_FLOORS, scenes: V87_BUILDING_SCENES, roots: V87_TECHNICAL_REVIEW_ROOTS },
  [V88_SOURCE_SHA256]: { count: V88_SOURCE_SCENE_COUNT, floors: V88_FLOORS, scenes: V88_BUILDING_SCENES, roots: V88_TECHNICAL_REVIEW_ROOTS },
  [V89_SOURCE_SHA256]: { count: V89_SOURCE_SCENE_COUNT, floors: V89_FLOORS, scenes: V89_BUILDING_SCENES, roots: V89_TECHNICAL_REVIEW_ROOTS },
  [V84_SOURCE_SHA256]: { count: V84_SOURCE_SCENE_COUNT, floors: V84_FLOORS, scenes: V84_BUILDING_SCENES, roots: V84_TECHNICAL_REVIEW_ROOTS },
  [V83_SOURCE_SHA256]: { count: V83_SOURCE_SCENE_COUNT, floors: V83_FLOORS, scenes: V83_BUILDING_SCENES, roots: V83_TECHNICAL_REVIEW_ROOTS },
  [V82_SOURCE_SHA256]: { count: V82_SOURCE_SCENE_COUNT, floors: V82_FLOORS, scenes: V82_BUILDING_SCENES, roots: V82_TECHNICAL_REVIEW_ROOTS },
});
import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';

/**
 * Technical review presentation ("talotekniikka korostettuna, muut harmaana").
 * Presentation only: every renderable object of the active scene that is NOT
 * inside a source-verified technical root gets one shared neutral grey,
 * translucent material. Original material instances are kept and restored.
 * The GLB, source links, scene membership, visibility and camera are untouched.
 */

/** Resolve exact technical roots of the active V71-V89 scene. Fails closed (null). */
export function resolveTechnicalReviewRoots(gltf, scene, sceneIndex, loadedSha, expectedSha) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  const source = Object.hasOwn(REVIEW_SOURCES, loadedSha) ? REVIEW_SOURCES[loadedSha] : null;
  const profile = source?.roots[sceneIndex];
  const sceneProfile = source?.scenes[sceneIndex];
  const extras = json?.asset?.extras;
  if (!profile || !sceneProfile || expectedSha !== loadedSha ||
      json?.scenes?.length !== source.count || gltf?.scenes?.[sceneIndex] !== scene ||
      extras?.current !== false || extras?.asBuilt !== false ||
      !Object.entries(source.floors).every(([floor, index]) => extras?.viewerFloorScenes?.[floor] === index) ||
      json.scenes[sceneIndex]?.name !== sceneProfile.name ||
      typeof associations?.get !== 'function' || !Array.isArray(scene?.children)) return null;
  const sourceRoots = json.scenes[sceneIndex].nodes;
  const roots = [];
  for (const { node, name } of profile) {
    if (sourceRoots.filter(id => id === node).length !== 1 || json.nodes?.[node]?.name !== name) return null;
    const matches = scene.children.filter(object => associations.get(object)?.nodes === node);
    if (matches.length !== 1 || matches[0].parent !== scene || !sameSourceName(matches[0].name, name)) return null;
    roots.push(matches[0]);
  }
  return roots;
}

const isRenderable = object => object?.isMesh === true || object?.isLine === true ||
  object?.isLineSegments === true || object?.isPoints === true;

/**
 * @param root active glTF scene root
 * @param keepRoots objects whose whole subtree keeps its own materials
 * @param createMaterials () => ({ surface, line, systems? }) shared presentation materials;
 *   systems maps a technical system key to one shared highlight material
 * @param {(object: any) => (string | null)} [systemOf] system key for a kept renderable, or null to keep its own material
 */
export function createTechnicalReviewPresentation(root, keepRoots, createMaterials, systemOf = () => null) {
  const keep = new Set(keepRoots.filter(Boolean));
  const saved = new Map();
  let materials = null;
  let applied = false;
  let disposed = false;

  const kept = object => {
    for (let node = object; node && node !== root; node = node.parent) if (keep.has(node)) return true;
    return false;
  };

  const restore = () => {
    for (const [object, material] of saved) object.material = material;
    saved.clear();
    applied = false;
  };

  const releasePalette = () => {
    // Only these viewer-owned presentation materials may be disposed.
    // The original GLB materials remain owned by the source loader.
    const owned = materials;
    materials = null;
    owned?.surface?.dispose?.();
    owned?.line?.dispose?.();
    for (const material of Object.values(owned?.systems ?? {})) material?.dispose?.();
  };

  const apply = on => {
    if (disposed) return false;
    if (!on) { restore(); return false; }
    if (applied) return true;
    try {
      materials ??= createMaterials();
      root.traverse(object => {
        if (object === root || !isRenderable(object) || saved.has(object)) return;
        let shared;
        if (kept(object)) {
          // Technical geometry is drawn in a clear system color so that it stays
          // readable through the translucent grey building.
          const highlight = object.isMesh ? materials.systems?.[systemOf(object) ?? ''] : null;
          if (!highlight) return;
          shared = highlight;
        } else {
          shared = object.isMesh ? materials.surface : materials.line;
        }
        saved.set(object, object.material);
        object.material = Array.isArray(object.material) ? object.material.map(() => shared) : shared;
      });
      applied = true;
      return true;
    } catch (error) {
      // A late source classifier or material assignment can fail after earlier
      // objects have been recolored. Never leave a partially presented scene
      // or retain its temporary GPU palette after that failed attempt.
      try { restore(); } finally { releasePalette(); }
      throw error;
    }
  };

  const dispose = () => {
    if (disposed) return;
    restore();
    releasePalette();
    disposed = true;
  };

  return { apply, dispose, get applied() { return applied; }, get changedCount() { return saved.size; } };
}

/** System key of a kept technical object from its own or an ancestor's source extras. */
export function technicalReviewSystemOf(object, root) {
  for (let node = object; node && node !== root; node = node.parent) {
    const system = node.userData?.m5System;
    if (system === 'SAHKO' || system === 'VESI' || system === 'IV') return system;
    if (typeof node.name === 'string' && node.name.startsWith('KV17_P02_AXIS_ROOT')) return 'VESI';
  }
  return null;
}
