import { TATE4_MJ6263_SOURCE_SHA256, m6263ReviewProfile } from './privateModelM6263ViewerReceipt.mjs';
import { TATE4_MJ6263_SCENES } from './privateModelTate4Mj62Mj63SourceProfile.mjs';
import { SUCCESSOR_R1_SHA256, SUCCESSOR_R1_SCENES,
  isM6263Mj72Kiv005Pk1SuccessorSourceScene } from './privateModelM6263Mj72Kiv005Pk1SuccessorSourceProfile.mjs';
import { TATE4_SOURCE_SHA256, TATE4_SOURCE_SCENE_COUNT, TATE4_FLOORS, TATE4_BUILDING_SCENES, TATE4_TECHNICAL_REVIEW_ROOTS } from './privateModelC80TateInteriorLayerSourceProfile.mjs';
import { TATE3_SOURCE_SHA256, TATE3_SOURCE_SCENE_COUNT, TATE3_FLOORS, TATE3_BUILDING_SCENES, TATE3_TECHNICAL_REVIEW_ROOTS } from './privateModelC80TateThreeDeltaLayerSourceProfile.mjs';
import { TATE_SOURCE_SHA256, TATE_SOURCE_SCENE_COUNT, TATE_FLOORS, TATE_BUILDING_SCENES, TATE_TECHNICAL_REVIEW_ROOTS } from './privateModelC80P02TateLayerSourceProfile.mjs';
import { P02_SOURCE_SHA256, P02_SOURCE_SCENE_COUNT, P02_FLOORS, P02_BUILDING_SCENES, P02_TECHNICAL_REVIEW_ROOTS } from './privateModelC80P02WaterLayerSourceProfile.mjs';
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
import { V90_SOURCE_SHA256, V90_SOURCE_SCENE_COUNT, V90_FLOORS, V90_BUILDING_SCENES, V90_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V90LayerSourceProfile.mjs';
import { V91_SOURCE_SHA256, V91_SOURCE_SCENE_COUNT, V91_FLOORS, V91_BUILDING_SCENES, V91_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V91LayerSourceProfile.mjs';
import { V92_SOURCE_SHA256, V92_SOURCE_SCENE_COUNT, V92_FLOORS, V92_BUILDING_SCENES, V92_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V92LayerSourceProfile.mjs';
import { V93_MJ49_SOURCE_SHA256, V93_MJ49_SCENE_COUNT, V93_MJ49_FLOORS, V93_MJ49_SCENES, V93_MJ49_REVIEW_ROOTS, isV93MJ49SavoNSScene } from './privateModelV93MJ49SavoNSKIV3SourceProfile.mjs';
import { V93_H35H38_SOURCE_SHA256, V93_H35H38_SOURCE_SCENE_COUNT, V93_H35H38_FLOORS, V93_H35H38_BUILDING_SCENES, V93_H35H38_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V93H35H38LayerSourceProfile.mjs';
import { IV125_LOWTRI_SOURCE_SHA256, IV125_LOWTRI_SOURCE_SCENE_COUNT, IV125_LOWTRI_FLOORS, IV125_LOWTRI_BUILDING_SCENES, IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V93IV125LowtriLayerSourceProfile.mjs';
import { V93_MJ40_SOURCE_SHA256, V93_MJ40_SCENE_COUNT, V93_MJ40_FLOORS, V93_MJ40_SCENES, V93_MJ40_REVIEW_ROOTS, isV93MJ40BoschOpen90Scene } from './privateModelV93MJ40BoschOpen90SourceProfile.mjs';
import { V90_H20_SOURCE_SHA256, V90_H20_SCENE_COUNT, V90_H20_FLOORS, V90_H20_BUILDING_SCENES, V90_H20_TECHNICAL_REVIEW_ROOTS } from './privateModelC80R2V90H20LayerSourceProfile.mjs';
import { V90_IV_P04_SOURCE_SHA256, V90_IV_P04_SCENE_COUNT, V90_IV_P04_FLOORS, V90_IV_P04_BUILDING_SCENES, V90_IV_P04_TECHNICAL_REVIEW_ROOTS, V90_IV_P04_OPTIN_SCENES } from './privateModelC80R2V90IVP04LayerSourceProfile.mjs';

/** Exact M5-integrated sources that carry technical review roots. */
const REVIEW_SOURCES = Object.freeze({
  [TATE4_SOURCE_SHA256]: { count:TATE4_SOURCE_SCENE_COUNT, floors:TATE4_FLOORS, scenes:TATE4_BUILDING_SCENES, roots:TATE4_TECHNICAL_REVIEW_ROOTS },
  [TATE3_SOURCE_SHA256]: { count:TATE3_SOURCE_SCENE_COUNT, floors:TATE3_FLOORS, scenes:TATE3_BUILDING_SCENES, roots:TATE3_TECHNICAL_REVIEW_ROOTS },
  [TATE_SOURCE_SHA256]: { count:TATE_SOURCE_SCENE_COUNT, floors:TATE_FLOORS, scenes:TATE_BUILDING_SCENES, roots:TATE_TECHNICAL_REVIEW_ROOTS },
  [P02_SOURCE_SHA256]: { count:P02_SOURCE_SCENE_COUNT, floors:P02_FLOORS, scenes:P02_BUILDING_SCENES, roots:P02_TECHNICAL_REVIEW_ROOTS },
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
  [V90_SOURCE_SHA256]: { count: V90_SOURCE_SCENE_COUNT, floors: V90_FLOORS, scenes: V90_BUILDING_SCENES, roots: V90_TECHNICAL_REVIEW_ROOTS },
  [V91_SOURCE_SHA256]: { count: V91_SOURCE_SCENE_COUNT, floors: V91_FLOORS, scenes: V91_BUILDING_SCENES, roots: V91_TECHNICAL_REVIEW_ROOTS },
  [V92_SOURCE_SHA256]: { count: V92_SOURCE_SCENE_COUNT, floors: V92_FLOORS, scenes: V92_BUILDING_SCENES, roots: V92_TECHNICAL_REVIEW_ROOTS },
  [V93_MJ49_SOURCE_SHA256]: { count: V93_MJ49_SCENE_COUNT, floors: V93_MJ49_FLOORS, scenes: V93_MJ49_SCENES, roots: V93_MJ49_REVIEW_ROOTS },
  [IV125_LOWTRI_SOURCE_SHA256]: { count: IV125_LOWTRI_SOURCE_SCENE_COUNT, floors: IV125_LOWTRI_FLOORS, scenes: IV125_LOWTRI_BUILDING_SCENES, roots: IV125_LOWTRI_TECHNICAL_REVIEW_ROOTS },
  [V93_H35H38_SOURCE_SHA256]: { count: V93_H35H38_SOURCE_SCENE_COUNT, floors: V93_H35H38_FLOORS, scenes: V93_H35H38_BUILDING_SCENES, roots: V93_H35H38_TECHNICAL_REVIEW_ROOTS },
  [V93_MJ40_SOURCE_SHA256]: { count: V93_MJ40_SCENE_COUNT, floors: V93_MJ40_FLOORS, scenes: V93_MJ40_SCENES, roots: V93_MJ40_REVIEW_ROOTS },
  [V90_H20_SOURCE_SHA256]: { count: V90_H20_SCENE_COUNT, floors: V90_H20_FLOORS, scenes: V90_H20_BUILDING_SCENES, roots: V90_H20_TECHNICAL_REVIEW_ROOTS },
  [V90_IV_P04_SOURCE_SHA256]: { count: V90_IV_P04_SCENE_COUNT, floors: V90_IV_P04_FLOORS, scenes: V90_IV_P04_BUILDING_SCENES, roots: V90_IV_P04_TECHNICAL_REVIEW_ROOTS },
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

// Exact-SHA opt-in technical review for the combined 369-scene successor.
// Preserve only established technical roots from the matching TATE4 floor,
// then add the physically distinct MJ63, MJ72 and KIV005 source components.
// The PK1 cutaway wrapper (12097) is ARCHITECTURE, never a technical root.
// The canonical source profile must PASS before trusting even the old root IDs.
/**
 * Three immutable source roots are visual wrappers, not technical systems.
 * 2220 C77 shower/glass/shelf, 11613 H24 WC + wall accessories,
 * 11945 MJ56 reference clearance guides. The source hash gates these exact
 * node IDs. Never apply this exclusion to other GLBs or their node indices.
 */
const COMPOSITE_PRESENTATION_ROOTS = new Set([2220,11613,11945]);
export function filterCompositePresentationRoots(entries,loadedSha) {
  if (!Array.isArray(entries)) return null;
  if (loadedSha !== TATE4_MJ6263_SOURCE_SHA256 &&
      loadedSha !== SUCCESSOR_R1_SHA256) return entries;
  return entries.filter(entry=>!COMPOSITE_PRESENTATION_ROOTS.has(entry.node));
}

export function successor369ReviewProfile(json, sha, sceneIndex) {
  const spec=SUCCESSOR_R1_SCENES[sceneIndex];
  if (!spec || !isM6263Mj72Kiv005Pk1SuccessorSourceScene(
    json,sha,sceneIndex,spec.floor,spec.glazing,spec.cutaway)) return null;
  const base=TATE4_MJ6263_SCENES[spec.parent];
  const inherited=TATE4_TECHNICAL_REVIEW_ROOTS[base?.parent];
  const active=json.scenes[sceneIndex].nodes;
  if (!Array.isArray(inherited) || !Array.isArray(active) ||
      active.includes(11542) || active.includes(8913) ||
      active.includes(12097)!==spec.cutaway) return null;
  const membership=new Set(active);
  // A source-locked technical root may nevertheless include NON-technical
  // presentation geometry. These original GLB roots are composite visual
  // wrappers, not technical systems:
  // 2220: C77 shower glass/basin/shelf (59 children)
  // 11613: H24 opened WC presentation (132 children, including toilet and
  //        wall accessories)
  // 11945: MJ56 sauna reference clearance guides (two guide meshes).
  // The cutaway replacement 12097 (PK1) is also never a technical root.
  // Keep the prior exact-source technical classifier unchanged for old SHAs.
  const kept=filterCompositePresentationRoots(inherited.filter(item=>
    membership.has(item.node)),sha);
  if (kept.some(item=>json.nodes[item.node]?.name!==item.name)) return null;
  // Source-exact IDs, not model-name guesses or whole-building visual roots.
  const addedIds=[12086,12087,12088,12089,12090,12091,12092,12096,12098,12106]
    .filter(id=>membership.has(id));
  if (addedIds.includes(12098)!==Boolean(spec.replacements.MJ72) ||
      addedIds.includes(12106)!==Boolean(spec.replacements.KIV005) ||
      (spec.floor==='2F' && addedIds.some(id=>id>=12086&&id<=12096)) ||
      (spec.floor!=='2F' && addedIds.filter(id=>id>=12086&&id<=12096).length!==8)) return null;
  const technical=[...kept,...addedIds.map(node=>({node,name:json.nodes[node].name}))];
  if (technical.length!==new Set(technical.map(x=>x.node)).size ||
      technical.some(x=>!x.name||x.node===12097||!membership.has(x.node)))return null;
  return {
    count:369, floors:{'1F':350,'2F':351,BOTH:352},
    scenes:{[sceneIndex]:{name:spec.name}},
    roots:{[sceneIndex]:technical}
  };
}

// SHA31dc and SHA8aa real GLB readback: 11613 is a 132-child VISUAL
// wrapper, but it contains these immutable 9 ventilation and 6 electrical
// fixture leaves. Preserve these devices without preserving the WC shell,
// basin, hatch, tile, sauna bench, shower glass or auxiliary guide material.
// These are WORK_TEST display classifications, never as-built evidence.
const H24_NESTED_TECHNICAL_LEAVES = Object.freeze([
  ...Array.from({length:6},(_,i)=>({node:1669+i,mesh:773+i,system:'SAHKO'})),
  ...Array.from({length:8},(_,i)=>({node:1704+i,mesh:808+i,system:'IV'})),
  {node:1730,mesh:4015,system:'IV'},
]);
const H24_SOURCE_NAME='V93_H24_WC_OPEN_HATCH_CLONE_OF_n8011_NO_n1729';
const h24NestedSystems=new WeakMap();

/** Only called after the whole-GLB SHA, source scene and top-level roots pass. */
export function appendSourceExactH24Children(json,scene,sceneIndex,loadedSha,associations,roots) {
  if (!Array.isArray(roots)) return null;
  if (loadedSha !== SUCCESSOR_R1_SHA256 &&
      loadedSha !== TATE4_MJ6263_SOURCE_SHA256) return roots;
  const active=json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(active) || !active.includes(11613)) return roots;
  const sourceParent=json.nodes?.[11613];
  if (sourceParent?.name!==H24_SOURCE_NAME ||
      !Array.isArray(sourceParent.children) ||
      !Array.isArray(scene?.children) ||
      typeof associations?.get!=='function') return null;
  const parents=scene.children.filter(o=>associations.get(o)?.nodes===11613);
  if (parents.length!==1 || parents[0].parent!==scene ||
      !sameSourceName(parents[0].name,H24_SOURCE_NAME)) return null;
  const parent=parents[0];
  const found=[];
  for (const spec of H24_NESTED_TECHNICAL_LEAVES) {
    const src=json.nodes?.[spec.node];
    if (!sourceParent.children.includes(spec.node) ||
        src?.mesh!==spec.mesh || !src?.name ||
        !Array.isArray(parent.children)) return null;
    const matches=parent.children.filter(o=>associations.get(o)?.nodes===spec.node);
    if (matches.length!==1 || matches[0].parent!==parent ||
        !sameSourceName(matches[0].name,src.name)) return null;
    found.push({object:matches[0],system:spec.system});
  }
  // Stage all checks before assigning any roles, preventing partial changes
  // if one expected exact source node is absent or belongs elsewhere.
  for (const item of found) h24NestedSystems.set(item.object,item.system);
  return roots.concat(found.map(item=>item.object));
}

/** Resolve exact technical roots of the active V71-V92 scene. Fails closed (null). */
export function resolveTechnicalReviewRoots(gltf, scene, sceneIndex, loadedSha, expectedSha) {
  const json = gltf?.parser?.json;
  const associations = gltf?.parser?.associations;
  const source = loadedSha === SUCCESSOR_R1_SHA256 ? successor369ReviewProfile(json,loadedSha,sceneIndex)
    : loadedSha === TATE4_MJ6263_SOURCE_SHA256 ? m6263ReviewProfile(json,loadedSha,sceneIndex)
    : Object.hasOwn(REVIEW_SOURCES, loadedSha) ? REVIEW_SOURCES[loadedSha] : null;
  // The source-locked legacy M6263 scenes must not re-highlight composite
  // shower/WC/guide wrappers that the newer successor already greys out.
  const profile = filterCompositePresentationRoots(source?.roots[sceneIndex],loadedSha);
  const sceneProfile = source?.scenes[sceneIndex];
  const extras = json?.asset?.extras;
  if (!profile || !sceneProfile || expectedSha !== loadedSha ||
      json?.scenes?.length !== source.count || gltf?.scenes?.[sceneIndex] !== scene ||
      extras?.current !== false || extras?.asBuilt !== false ||
      !Object.entries(source.floors).every(([floor, index]) => extras?.viewerFloorScenes?.[floor] === index) ||
      json.scenes[sceneIndex]?.name !== sceneProfile.name ||
      typeof associations?.get !== 'function' || !Array.isArray(scene?.children)) return null;
  if (loadedSha === V93_MJ40_SOURCE_SHA256 && !isV93MJ40BoschOpen90Scene(json, loadedSha, sceneIndex)) return null;
  if (loadedSha === V93_MJ49_SOURCE_SHA256 && !isV93MJ49SavoNSScene(json, loadedSha, sceneIndex)) return null;
  const sourceRoots = json.scenes[sceneIndex].nodes;
  const exactIvFocus = loadedSha === V90_IV_P04_SOURCE_SHA256 &&
    Object.values(V90_IV_P04_OPTIN_SCENES).includes(sceneIndex);
  // The three ventilation-only opt-ins have deliberately no building roots.
  // Require exact ordered source membership for the trusted SHA; a subset,
  // reorder or extra root is not an approved source review scene.
  if (exactIvFocus && (!Array.isArray(sourceRoots) ||
    sourceRoots.length !== profile.length ||
    !sourceRoots.every((node, index) => node === profile[index].node))) return null;
  const roots = [];
  for (const { node, name } of profile) {
    // A null name is valid only for the exact-SHA IV focus: the source hash
    // locks the immutable node JSON, while the ordered root list locks scope.
    const expectedName = exactIvFocus && name === null ? json.nodes?.[node]?.name : name;
    if (!expectedName || sourceRoots.filter(id => id === node).length !== 1 ||
      json.nodes?.[node]?.name !== expectedName) return null;
    const matches = scene.children.filter(object => associations.get(object)?.nodes === node);
    if (matches.length !== 1 || matches[0].parent !== scene || !sameSourceName(matches[0].name, expectedName)) return null;
    roots.push(matches[0]);
  }
  return appendSourceExactH24Children(json,scene,sceneIndex,loadedSha,associations,roots);
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
          // A trusted technical root can contain non-technical child meshes.
          // With a system palette, only explicitly classified meshes get a
          // technical color. Unknown children and visual guides must go grey.
          // A palette-free legacy review keeps its original source materials.
          if (!materials.systems) return;
          const system = object.isMesh ? systemOf(object) : null;
          shared = object.isMesh
            ? (materials.systems[system ?? ''] ?? materials.surface)
            : materials.line;
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
    const exactNested=h24NestedSystems.get(node);
    if (exactNested) return exactNested;
    const system = node.userData?.m5System;
    if (system === 'SAHKO' || system === 'VESI' || system === 'IV') return system;
    if (typeof node.name === 'string' && node.name.startsWith('KV17_P02_AXIS_ROOT')) return 'VESI';
  }
  return null;
}


