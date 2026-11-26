/**
 * Source-only intake for the existing RELEASED R34 IV125 glTF successor.
 * Does NOT authorize Worker catalog visibility, R2 upload or CURRENT status.
 * Only actual same-origin GLB bytes hashed by loadModelWithSourceCards can
 * provide the digest passed into these scene and link gates.
 */
export const R34_IV125_INTAKE = Object.freeze({
  candidateId: 'c80-r34-iv125-cdb38108-both-sc894-sc895-work-test',
  path: '/private-model/work-test/c80-r34-iv125-cdb38108-both-sc894-sc895-work-test.glb',
  glbSha256: 'cdb3810894993a89243f12367cfc58623aca6a9a1c58f8dae2639f2b16ed5e69',
  glbBytes: 69980160,
  sceneCount: 896,
  nodeCount: 14114,
  meshCount: 5337,
  defaultScene: 292,
  normalScene: 894,
  serviceScene: 895,
});

export function r34Iv125ExactSource(candidate) {
  if (candidate?.id !== R34_IV125_INTAKE.candidateId) return undefined;
  if (candidate.path !== R34_IV125_INTAKE.path)
    throw new Error('R34_IV125_CANDIDATE_PATH_MISMATCH');
  return { glbBytes: R34_IV125_INTAKE.glbBytes, glbSha256: R34_IV125_INTAKE.glbSha256 };
}

function verifiedScenes(gltf, digest) {
  const s = R34_IV125_INTAKE;
  const json = gltf?.parser?.json;
  if (digest !== s.glbSha256 || !json || !Array.isArray(gltf?.scenes) ||
      json.scene !== s.defaultScene ||
      json.scenes?.length !== s.sceneCount || gltf.scenes.length !== s.sceneCount ||
      json.nodes?.length !== s.nodeCount || json.meshes?.length !== s.meshCount)
    throw new Error('R34_IV125_OUTPUT_SHA_OR_GLTF_MISMATCH');
  for (const index of [s.normalScene, s.serviceScene]) {
    const description = json.scenes[index];
    const runtime = gltf.scenes[index];
    const name = String(description?.name || '');
    if (!name.endsWith('__scene' + index) || !name.includes('BOTH') ||
        !runtime || !Array.isArray(description?.nodes) || !description.nodes.length ||
        description.nodes.some(node => !Number.isInteger(node) || node < 0 || node >= s.nodeCount))
      throw new Error('R34_IV125_BOTH_SCENE_MISMATCH');
  }
  return json;
}

/** Throws instead of silently displaying the glTF default scene292. */
export function r34Iv125SelectScene(gltf, digest, mode = 'normal') {
  verifiedScenes(gltf, digest);
  if (mode !== 'normal' && mode !== 'service')
    throw new Error('R34_IV125_UNKNOWN_VIEW');
  return gltf.scenes[mode === 'service' ? R34_IV125_INTAKE.serviceScene : R34_IV125_INTAKE.normalScene];
}

/**
 * No source links from another GLB or stale scene. Verify original parser
 * node associations, each parent edge, glTF scene root and source extras
 * against the exact output-SHA's parsed graph, not display names alone.
 * A missing / ambiguous association yields NO links, never guessed links.
 */
export function r34Iv125BoundSourceLinks({ gltf, digest, mountedScene, object, links }) {
  try {
    const json = verifiedScenes(gltf, digest);
    const sceneIndex = gltf.scenes.indexOf(mountedScene);
    if (![R34_IV125_INTAKE.normalScene, R34_IV125_INTAKE.serviceScene].includes(sceneIndex) ||
        !object || !Array.isArray(links)) return [];
    const associations = gltf?.parser?.associations;
    if (!associations?.get) return [];
    const seen = new Set();
    const nodePath = [];
    let verifiedLinks = null;
    let cursor = object;
    while (cursor && cursor !== mountedScene && !seen.has(cursor) && seen.size < 128) {
      seen.add(cursor);
      const i = associations.get(cursor)?.nodes;
      if (Number.isInteger(i)) {
        if (i < 0 || i >= json.nodes.length ||
            (nodePath.length && !json.nodes[i]?.children?.includes(nodePath[nodePath.length - 1])))
          return [];
        nodePath.push(i);
        const runtimeLinks = cursor.userData?.sourceLinks;
        if (runtimeLinks !== undefined && runtimeLinks !== null) {
          if (!Array.isArray(runtimeLinks) ||
              JSON.stringify(runtimeLinks) !== JSON.stringify(json.nodes[i]?.extras?.sourceLinks)) return [];
          if (verifiedLinks === null && runtimeLinks.length) verifiedLinks = runtimeLinks;
        }
      }
      cursor = cursor.parent;
    }
    if (cursor !== mountedScene || !nodePath.length ||
        !json.scenes[sceneIndex].nodes.includes(nodePath[nodePath.length - 1]))
      return [];
    if (links.length && (verifiedLinks === null ||
        JSON.stringify(links) !== JSON.stringify(verifiedLinks))) return [];
    return verifiedLinks && links.length ? links : [];
  } catch {
    return [];
  }
}
