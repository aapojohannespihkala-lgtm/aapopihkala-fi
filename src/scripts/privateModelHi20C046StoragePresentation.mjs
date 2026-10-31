// C80-046: show only the already corrected C047 storage door wall,
// not its older K7D head infill and zero-thickness C80_029 preview.
// This never changes the exact source GLB or a physical roof/door.
export const C046_SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  {scene:50, infill:1488, parent:5354, preview:5756, repaired:6345},
  {scene:51, infill:412, parent:5338, preview:5777, repaired:6396},
];
const unavailable = (reason) => ({
  available:false, reason, count:0, cleaned:false,
  setCleaned:()=>false, dispose:()=>{},
});
function sourceObject(scene, nodeId, associations) {
  const found=[];
  scene?.traverse?.((obj) => {
    if (associations.get(obj)?.nodes === nodeId) found.push(obj);
  });
  return found.length === 1 ? found[0] : null;
}
export function createHi20C046StoragePresentation(gltf, verifiedSha) {
  const json=gltf?.parser?.json;
  if (verifiedSha !== C046_SOURCE_SHA ||
      json?.asset?.version !== '2.0' || json?.scene !== 0 ||
      json?.scenes?.length !== 52 || gltf?.scenes?.length !== 52 ||
      json?.asset?.extras?.current !== false ||
      json?.asset?.extras?.asBuilt !== false)
    return unavailable('sha-or-scene');
  const associations=gltf?.parser?.associations;
  if (typeof associations?.get !== 'function') return unavailable('associations');
  const toHide=[];
  for (const t of TARGETS) {
    const scene=gltf.scenes[t.scene];
    const infill=json.nodes?.[t.infill];
    const preview=json.nodes?.[t.preview];
    const repaired=json.nodes?.[t.repaired];
    // The expected replacement must already exist. Do not create a wall.
    if (!infill || infill.mesh !== 633 ||
        !/K7D.*VARASTO.*INFILL/i.test(infill.name || '') ||
        infill.extras?.representationKind !== 'wallContinuationVisualProxy' ||
        !json.nodes?.[t.parent]?.children?.includes(t.infill) ||
        json.meshes?.[633]?.primitives?.[0]?.material !== 72 ||
        !preview || preview.mesh !== 1727 ||
        !/C80[_-]029/i.test(preview.name || '') ||
        preview.extras?.representationKind !== 'SOURCE_CONTEXT' ||
        json.meshes?.[1727]?.primitives?.[0]?.material !== 281 ||
        !repaired || repaired.mesh !== 1820 ||
        !/C80[_-]047/i.test(repaired.name || '') ||
        repaired.extras?.representationKind !== 'DISPLAY_VOLUME_NOT_PHYSICAL_STRUCTURE' ||
        !Array.isArray(repaired.extras?.sourceLinks) ||
        json.meshes?.[1820]?.primitives?.[0]?.material !== 333)
      return unavailable('source-identity');
    const objects=[t.infill,t.preview,t.repaired].map(id=>
      sourceObject(scene,id,associations));
    if (objects.some(o=>!o || o.visible !== true))
      return unavailable('source-objects');
    if (new Set(objects).size !== 3)
      return unavailable('shared-target');
    toHide.push(objects[0],objects[1]);
  }
  if (toHide.length !== 4 || new Set(toHide).size !== 4)
    return unavailable('incomplete-roster');
  const originals=toHide.map(obj=>obj.visible);
  let cleaned=false;
  return {
    available:true, reason:null, count:toHide.length,
    get cleaned(){return cleaned;},
    setCleaned(next){
      cleaned=Boolean(next);
      toHide.forEach((obj,i)=>{obj.visible=cleaned?false:originals[i];});
      return true;
    },
    dispose(){
      toHide.forEach((obj,i)=>{obj.visible=originals[i];});
      cleaned=false;
    },
  };
}
