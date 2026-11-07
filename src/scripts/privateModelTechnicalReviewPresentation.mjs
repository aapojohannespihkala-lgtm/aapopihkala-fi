import { V71_SOURCE_SHA256, V71_SOURCE_SCENE_COUNT, V71_FLOORS, V71_BUILDING_SCENES, V71_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V71LayerSourceProfile.mjs';
import { sameSourceName } from './privateModelSourceNodeAssociations.mjs';

/**
 * Technical review presentation ("talotekniikka korostettuna, muut harmaana").
 * Presentation only: every renderable object of the active scene that is NOT
 * inside a source-verified technical root gets one shared neutral grey,
 * translucent material. Original material instances are kept and restored.
 * The GLB, source links, scene membership, visibility and camera are untouched.
 */

/** Resolve exact technical roots of the active V71 scene. Fails closed (null). */
export function resolveTechnicalReviewRoots(gltf, scene, sceneIndex, loadedSha, expectedSha) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  const profile = V71_TECHNICAL_REVIEW_ROOTS[sceneIndex];
  const sceneProfile = V71_BUILDING_SCENES[sceneIndex];
  const extras = json?.asset?.extras;
  if (!profile || !sceneProfile || loadedSha !== V71_SOURCE_SHA256 || expectedSha !== loadedSha ||
      json?.scenes?.length !== V71_SOURCE_SCENE_COUNT || gltf?.scenes?.[sceneIndex] !== scene ||
      extras?.current !== false || extras?.asBuilt !== false ||
      !Object.entries(V71_FLOORS).every(([floor, index]) => extras?.viewerFloorScenes?.[floor] === index) ||
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
 * @param createMaterials () => ({ surface, line }) shared presentation materials
 */
export function createTechnicalReviewPresentation(root, keepRoots, createMaterials) {
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

  const apply = on => {
    if (disposed) return false;
    if (!on) { restore(); return false; }
    if (applied) return true;
    materials ??= createMaterials();
    root.traverse(object => {
      if (object === root || !isRenderable(object) || kept(object) || saved.has(object)) return;
      saved.set(object, object.material);
      const shared = object.isMesh ? materials.surface : materials.line;
      object.material = Array.isArray(object.material) ? object.material.map(() => shared) : shared;
    });
    applied = true;
    return true;
  };

  const dispose = () => {
    if (disposed) return;
    restore();
    materials?.surface?.dispose?.();
    materials?.line?.dispose?.();
    materials = null;
    disposed = true;
  };

  return { apply, dispose, get applied() { return applied; }, get changedCount() { return saved.size; } };
}
