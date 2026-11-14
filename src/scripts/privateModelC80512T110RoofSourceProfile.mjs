// Source-only WORK_TEST_HOST_HOLD receiver. Never treat the roof hole or weatherproofing as verified.
export const C80_512_SHA256 = '0fb646042b135f59dfade6ab88f09e5fe12a57a1a3f6fb1927d7a51cbee0f461';
export const C80_512_GLB_BYTES = 55324372;
export const C80_512_PARENT_SHA256 = '78fbc1c65d3a879a3097d16cc9646c098499c839828563ea23afab0ecf5214ab';
export const C80_512_T110_MESH = 4611;
export const C80_512_T110_BOTH_NODE = 12239;
export const C80_512_T110_2F_ROOT = 12242;
export const C80_512_T110_SOURCE_NODE = 10145;
export const C80_512_ROOF_SOURCE_NODE = 6642;
export const C80_512_SCENES = Object.freeze({
  500: Object.freeze({ parent: 495, floor: '1F', glazing: 'CLOSED', cutaway: false, root: null }),
  505: Object.freeze({ parent: 488, floor: '2F', glazing: 'CLOSED', cutaway: false, root: 12242 }),
  506: Object.freeze({ parent: 490, floor: '2F', glazing: 'ONE_OPEN', cutaway: false, root: 12242 }),
  507: Object.freeze({ parent: 492, floor: '2F', glazing: 'STACKED', cutaway: false, root: 12242 }),
  508: Object.freeze({ parent: 501, floor: 'BOTH', glazing: 'CLOSED', cutaway: false, root: 12239 }),
  509: Object.freeze({ parent: 502, floor: 'BOTH', glazing: 'ONE_OPEN', cutaway: false, root: 12239 }),
  510: Object.freeze({ parent: 503, floor: 'BOTH', glazing: 'STACKED', cutaway: false, root: 12239 }),
  511: Object.freeze({ parent: 504, floor: 'BOTH', glazing: 'CLOSED', cutaway: true, root: 12239 }),
});
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const safe = x => x?.current === false && x?.asBuilt === false;
const isT110Tube = (node, name) => node?.name === name && node?.mesh === C80_512_T110_MESH &&
  node.extras?.m5System === 'VIEMARI' && node.extras?.workAssumption === true &&
  node.extras?.sourceGlbSHA256 === C80_512_PARENT_SHA256 &&
  node.extras?.existingT110Node === C80_512_T110_SOURCE_NODE &&
  node.extras?.sourceRoofNode === C80_512_ROOF_SOURCE_NODE &&
  node.extras?.roofOpeningCut === false && node.extras?.flashingModeled === false &&
  node.extras?.insulationModeled === false && node.extras?.capModeled === false &&
  node.extras?.physicalRoofPointVerified === false &&
  node.extras?.sourceLinksBoundForNewSHA === false && safe(node.extras);

export function isC80512T110SourceScene(json, sha, index) {
  if (sha !== C80_512_SHA256 || json?.scene !== 292 || json?.scenes?.length !== 512 ||
      json?.nodes?.length !== 12243 || json?.meshes?.length !== 4612 ||
      json?.materials?.length !== 740 || !Number.isInteger(index)) return false;
  const spec = C80_512_SCENES[index];
  if (!spec) return false;
  const both = json.nodes[C80_512_T110_BOTH_NODE],
    twoF = json.nodes[12240], clone = json.nodes[12241], root2f = json.nodes[12242],
    oldT110 = json.nodes[C80_512_T110_SOURCE_NODE];
  if (!isT110Tube(both, 'C80_512_T110_2015_ROOF_VENT_OPEN_END_2F_BOTH_WORK_TEST_HOST_HOLD') ||
      !isT110Tube(twoF, 'C80_512_T110_2015_ROOF_VENT_OPEN_END_2F_ONLY_WORK_TEST_HOST_HOLD') ||
      clone?.name !== 'C80_512_T110_SOURCE_10145_EXACT_DONOR_VISIBILITY_2F_WORK_TEST_HOST_HOLD' ||
      clone.mesh !== oldT110?.mesh || !equal(clone.matrix, oldT110?.matrix) ||
      clone.extras?.m5System !== 'VIEMARI' || !safe(clone.extras) ||
      root2f?.name !== 'C80_512_T110_2F_ONLY_ROOT_SOURCE_AND_ROOFTOP_EXTENSION' ||
      !equal(root2f.children, [12240,12241]) || root2f.extras?.m5System !== 'VIEMARI' ||
      !safe(root2f.extras) || root2f.extras?.sourceLinksBound !== false) return false;
  const scene = json.scenes[index], parent = json.scenes[spec.parent];
  if (!Array.isArray(scene?.nodes) || !Array.isArray(parent?.nodes)) return false;
  if (index === 500) return scene.name === 'C80_505_H24_FRAME_CLEARANCE_FROM_SCENE_495_WORK_TEST_HOST_HOLD' &&
      scene.nodes.includes(12238) && !scene.nodes.includes(12239) && !scene.nodes.includes(12242) &&
      scene.extras?.h24FrameCofit?.sourceScene === 495 &&
      scene.extras?.stage === 'WORK_TEST_HOST_HOLD' && scene.extras?.asBuilt === false;
  const x = scene.extras?.t110RoofVentCofit;
  if (scene.name !== 'C80_512_T110_ROOF_VENT_FROM_SCENE_' + spec.parent + '_WORK_TEST_HOST_HOLD' ||
      scene.extras?.stage !== 'WORK_TEST_HOST_HOLD' || scene.extras?.asBuilt !== false ||
      scene.extras?.sourceLinksBoundForNewSHA !== false ||
      x?.originalSceneIndex !== spec.parent || x?.appendedRoot !== spec.root ||
      x?.newTubeMesh !== C80_512_T110_MESH || x?.sourceExactGlbSha256 !== C80_512_PARENT_SHA256 ||
      x?.sourceT110Node !== C80_512_T110_SOURCE_NODE || x?.sourceRoofNode !== C80_512_ROOF_SOURCE_NODE ||
      x?.modelStage !== 'WORK_TEST_HOST_HOLD' || x?.sourceLinksBound !== false ||
      x?.CURRENT !== false || x?.asBuilt !== false || x?.physicalRoofOpeningVerified !== false ||
      !equal(scene.nodes, [...parent.nodes, spec.root])) return false;
  if (spec.floor === '2F') return parent.nodes.includes(12230) &&
      !parent.nodes.includes(12228) && !parent.nodes.includes(12237) &&
      !scene.nodes.includes(12239) && !scene.nodes.includes(12238);
  return parent.nodes.includes(12230) && parent.nodes.includes(12228) &&
      parent.nodes.includes(12237) && parent.nodes.includes(12238) &&
      !scene.nodes.includes(12242);
}

export function resolveC80512T110SceneIndex(floor, glazing = 'CLOSED', cutaway = false) {
  const found = Object.entries(C80_512_SCENES).filter(([,r]) =>
    r.floor === floor && r.glazing === glazing && r.cutaway === cutaway);
  return found.length === 1 ? Number(found[0][0]) : null;
}

/** Deliberately source-only. Caller verifies SHA from authentic bytes before accessing the scene. */
export function resolveC80512T110Scenes(gltf, sha) {
  const json = gltf?.parser?.json;
  if (sha !== C80_512_SHA256 || !json || gltf?.scenes?.length !== 512) return null;
  const scenes = {};
  for (const key of Object.keys(C80_512_SCENES)) {
    const index = Number(key), source = json.scenes[index], rendered = gltf.scenes[index];
    if (!isC80512T110SourceScene(json, sha, index) || !rendered ||
        rendered.name !== source.name || rendered.children?.length < source.nodes.length) return null;
    scenes[index] = rendered;
  }
  return scenes;
}

/** Technical overlay only; never a roof penetration/as-built certificate. */
export function c80512T110TechnicalReviewRoots(json, sha, index) {
  if (!isC80512T110SourceScene(json, sha, index)) return null;
  const direct = json.scenes[index].nodes;
  const wanted = [12228, 12230, 12237, 12238, 12239, 12242];
  return Object.freeze(wanted.filter(node => direct.includes(node)).map(node =>
    Object.freeze({node, name: json.nodes[node].name})));
}
