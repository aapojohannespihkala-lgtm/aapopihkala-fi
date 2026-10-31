// C80-048: show only the four already existing V11 wall-head presentation
// objects in the same white as the exact source's 1F physical facade.
// Geometry, source GLB/materials, door openings and sourceLinks never change.
export const C048_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  {scene:50, whiteNode:6379, nodes:[{id:1486,mesh:425,material:65},
                                    {id:1487,mesh:426,material:66}]},
  {scene:51, whiteNode:6394, nodes:[{id:410,mesh:425,material:65},
                                    {id:411,mesh:426,material:66}]},
];
const unavailable = (reason) => ({
  available:false,reason,count:0,enabled:false,
  setEnabled:()=>false,dispose:()=>{},
});
function exactMesh(scene, nodeId, associations) {
  const matches = [];
  scene?.traverse?.((obj) => {
    if (!obj?.isMesh) return;
    let p = obj;
    while (p) {
      if (associations.get(p)?.nodes === nodeId) {
        matches.push(obj);
        break;
      }
      if (p === scene) break;
      p = p.parent;
    }
  });
  return matches.length === 1 ? matches[0] : null;
}
export function createHi20C048WallHeadsPresentation(gltf, verifiedSha) {
  const json = gltf?.parser?.json;
  if (verifiedSha !== C048_SOURCE_SHA || json?.asset?.version !== '2.0' ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false ||
      json?.scene !== 0 || json?.scenes?.length !== 52 ||
      gltf?.scenes?.length !== 52) return unavailable('source-sha-or-scene');
  const associations = gltf.parser?.associations;
  if (typeof associations?.get !== 'function') return unavailable('node-associations');

  const selections = [];
  for (const target of TARGETS) {
    const scene = gltf.scenes[target.scene];
    const refNode = json.nodes?.[target.whiteNode];
    if (!scene || refNode?.mesh !== 1835 ||
        json.meshes?.[1835]?.primitives?.length !== 1 ||
        json.meshes[1835].primitives[0].material !== 335)
      return unavailable('white-reference-identity');
    const reference = exactMesh(scene, target.whiteNode, associations);
    if (!reference || Array.isArray(reference.material) ||
        typeof reference.material?.clone !== 'function' ||
        !reference.material?.color ||
        reference.material.transparent === true)
      return unavailable('white-reference-not-loaded');

    for (const item of target.nodes) {
      const node = json.nodes?.[item.id];
      const prims = json.meshes?.[item.mesh]?.primitives;
      const materialData = json.materials?.[item.material];
      const rgba = materialData?.pbrMetallicRoughness?.baseColorFactor;
      if (node?.mesh !== item.mesh ||
          node?.name !== (item.material === 65
            ? 'D1F_V11_OPENING_HEAD_VH_WEST' : 'D1F_V11_OPENING_HEAD_VH_NORTH') ||
          node?.extras?.representationKind !== 'wallContinuationVisualProxy' ||
          prims?.length !== 1 || prims[0].material !== item.material ||
          materialData?.alphaMode !== 'BLEND' ||
          !Array.isArray(rgba) || Math.abs(rgba[3] - 0.83) > 1e-6)
        return unavailable('source-head-identity');
      const mesh = exactMesh(scene, item.id, associations);
      if (!mesh || Array.isArray(mesh.material) ||
          typeof mesh.material?.clone !== 'function' ||
          !mesh.material.transparent || Math.abs(mesh.material.opacity - 0.83) > 0.015)
        return unavailable('source-head-not-loaded');
      selections.push({mesh, original:mesh.material, reference:reference.material});
    }
  }
  if (selections.length !== 4 ||
      new Set(selections.map((row) => row.mesh)).size !== 4)
    return unavailable('shared-head-objects');

  let enabled = false;
  const restore = () => {
    if (!enabled) return;
    for (const row of selections) {
      const presentationMaterial = row.mesh.material;
      row.mesh.material = row.original;
      presentationMaterial.dispose?.();
    }
    enabled = false;
  };
  return {
    available:true,reason:null,count:selections.length,
    get enabled(){return enabled;},
    setEnabled(next){
      if (!next) {restore();return true;}
      if (enabled) return true;
      const replacements = [];
      try {
        for (const row of selections) {
          const white = row.reference.clone();
          white.transparent = false;
          white.opacity = 1;
          white.depthWrite = true;
          white.needsUpdate = true;
          replacements.push(white);
        }
      } catch {
        replacements.forEach((m) => m.dispose?.());
        return false;
      }
      selections.forEach((row, i) => {row.mesh.material = replacements[i];});
      enabled = true;
      return true;
    },
    dispose:restore,
  };
}
