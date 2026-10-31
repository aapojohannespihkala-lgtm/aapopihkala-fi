// C80-050: reversible presentation of nonphysical measuring guides,
// scoped to the exact original 52scene WORK_TEST GLB. No source GLB edits.
export const C050_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const GUIDE_SCENES = [
  {scene: 50, firstNode: 5746, parent: 6459},
  {scene: 51, firstNode: 5767, parent: 6462},
];
function unavailable(reason) {
  return {available:false,reason,count:0,cleaned:false,setCleaned:()=>false,dispose:()=>{}};
}
export function createHi20C050GuidesPresentation(gltf, verifiedSha) {
  const parser = gltf?.parser, j = parser?.json;
  if (verifiedSha !== C050_SOURCE_SHA || gltf?.scenes?.length !== 52 ||
      j?.scenes?.length !== 52) return unavailable('sha-or-scene-count');
  const assoc = parser?.associations;
  if (!Array.isArray(j?.nodes) || typeof assoc?.get !== 'function') return unavailable('source-nodes');
  const hideTargets = [];
  const find = (sceneIndex, nodeId) => {
    const scene = gltf.scenes[sceneIndex];
    const found = [];
    scene?.traverse?.((obj) => {
      if (assoc.get(obj)?.nodes === nodeId) found.push(obj);
    });
    return found.length === 1 ? found[0] : null;
  };
  for (const {scene,firstNode,parent} of GUIDE_SCENES) {
    const parentData = j.nodes[parent];
    if (!parentData?.children?.includes(firstNode) ||
        !parentData?.children?.includes(firstNode + 7)) return unavailable('guide-parent');
    for (let i=0;i<8;i++) {
      const nodeId = firstNode+i;
      const source = j.nodes[nodeId];
      if (source?.mesh !== 860+i ||
          source?.extras?.sourceOnly !== true ||
          source?.extras?.presentationOnly !== true ||
          source?.extras?.contextOnly !== true ||
          !source?.name?.includes('KPH07_') ||
          !source?.name?.includes('MEASURE_GUIDE')) return unavailable('guide-source-identity');
      const object = find(scene,nodeId);
      if (!object?.isMesh || object.name !== source.name) return unavailable('guide-render-identity');
      hideTargets.push(object);
    }
  }
  // BOTH51 still uses the original nonphysical 955 mm door gauge.
  // 1F50 already uses a separate copy-on-write node without that gauge.
  const group = j.nodes[484], parent = j.nodes[485];
  if (group?.name !== 'D1F_NORTH_DOOR_AXISFIX_NONPHYSICAL_W955_GUIDE' ||
      group?.children?.length !== 3 ||
      ![481,482,483].every((id) => group.children.includes(id)) ||
      !parent?.children?.includes(484) ||
      group?.extras?.isPhysicalOpening !== false)
    return unavailable('w955-source-parent');
  const root = find(51,484);
  if (!root || root.name !== group.name || root.children?.length !== 3)
    return unavailable('w955-render-parent');
  for(const [nodeId,meshId] of [[481,504],[482,505],[483,506]]) {
    const n=j.nodes[nodeId], obj=find(51,nodeId);
    if (n?.mesh !== meshId ||
        !n?.name?.includes('NONPHYSICAL') ||
        !obj?.isMesh || obj.parent !== root || obj.name !== n.name)
      return unavailable('w955-render-mesh');
  }
  hideTargets.push(root);
  if (new Set(hideTargets).size !== 17) return unavailable('duplicate-target');
  const originals = hideTargets.map(obj=>obj.visible);
  let cleaned = false;
  const setCleaned = (next) => {
    cleaned = Boolean(next);
    hideTargets.forEach((obj,i) => {obj.visible = cleaned ? false : originals[i];});
    return true;
  };
  return {
    available:true,reason:null,count:19,
    get cleaned(){return cleaned;},
    setCleaned,
    dispose(){cleaned=false;hideTargets.forEach((obj,i)=>{obj.visible=originals[i];});},
  };
}
