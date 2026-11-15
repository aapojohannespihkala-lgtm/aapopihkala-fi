import {
  C80_530_V27_GLB_SHA256 as SOURCE_SHA,
  C80_530_V27_SCENES,
  isC80530V27SourceScene,
} from './privateModelC80530V27SourceProfile.mjs';

// These are glTF node indices in ONE immutable, authenticated 530-scene GLB.
// The names below distinguish the intended node from an unrelated same-index
// object in another model. Do not infer any present-day wiring from this map.
const HISTORICAL = Object.freeze({
  11560: ['D_1F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP', 'group2015', 'RK11.1 2015 PLAN_ONLY', 'RK11.1'],
  11574: ['D_2F_EXTERIOR_DOUBLE_OUTLET_COMMON_WEATHER_FLAP', 'group2015', 'RK11.2 2015 PLAN_ONLY', 'RK11.2'],
  11590: ['RK4_2_D1F_INNER_STORAGE_FROM_2015_HISTORIC_ENDPOINT', 'circuitId', 'RK4.2', 'RK4.2'],
});
const DEVICE_ROOTS = Object.freeze({
  11996: 'MJ54_BOSCH_WNG254ABSN',
  11311: 'V86_SAUNA_HARVIA_CILINDRO_PC90',
  9516: 'C80R2_V55_TOSHIBA_DAISEIKAI8',
  12098: 'MJ72_OWNER2026_STORAGE_SOCKET',
  12048: 'MJ16_SAVO_IH7603W',
  10975: 'C80R2_V69_P12_OPTIN__LOW3_BAY1',
  10853: 'R6_OVEN_TRANSFORMED',
  11642: 'NIBE_R200_OWNER_TRUE_LEFT_BACK_CORNER',
});
const CURRENT_UNKNOWN = ['Nykyinen sähkösyöttö', 'NOT_VERIFIED'];

/** The returned label is a 2015 plan link, never a CURRENT circuit claim.
 * Only call this after exact source SHA + scene + node association checks.
 */
export function c80530ElectricalGroupEvidenceForNode(json, nodeIndex) {
  if (!Number.isInteger(nodeIndex) || nodeIndex < 0) return null;
  const sourceNode = json?.nodes?.[nodeIndex];
  if (!sourceNode || typeof sourceNode.name !== 'string') return null;
  const historical = HISTORICAL[nodeIndex];
  if (historical) {
    const [namePrefix, key, sourceValue, group] = historical;
    const extras = sourceNode.extras;
    if (!sourceNode.name.startsWith(namePrefix) ||
        extras?.[key] !== sourceValue || extras.current !== false ||
        extras.asBuilt !== false ||
        (nodeIndex === 11590 && extras.noCurrentPhysicalCircuitClaim !== true))
      return null;
    return [
      ['Sähköryhmä (2015)', group + ' - historiallinen suunnitelma'],
      CURRENT_UNKNOWN,
    ];
  }
  const namePrefix = DEVICE_ROOTS[nodeIndex];
  return namePrefix && sourceNode.name.startsWith(namePrefix)
    ? [['Sähköryhmä', 'NOT_VERIFIED'], CURRENT_UNKNOWN] : null;
}

function reachableSourceNodes(json, sceneIndex) {
  const initial=json?.scenes?.[sceneIndex]?.nodes;
  if (!Array.isArray(initial) || !Array.isArray(json?.nodes)) return null;
  const seen=new Set(), pending=[...initial];
  while (pending.length) {
    const index=pending.pop();
    if (!Number.isInteger(index) || index < 0 || index >= json.nodes.length ||
        !json.nodes[index]) return null;
    if (seen.has(index)) continue;
    seen.add(index);
    if (seen.size > json.nodes.length) return null;
    const children=json.nodes[index].children;
    if (children !== undefined && !Array.isArray(children)) return null;
    if (children) pending.push(...children);
  }
  return seen;
}

/** Exact-SHA source-only selection metadata. No new sourceLinks or wiring.
 * The actual mounted glTF scene and GLTFLoader node associations are required;
 * name-only matches, a different SHA or a viewer helper cannot assert a group.
 */
export function createC80530ElectricalGroupEvidenceResolver(gltf, loadedSha) {
  const json=gltf?.parser?.json;
  const associations=gltf?.parser?.associations;
  if (loadedSha !== SOURCE_SHA || !Array.isArray(gltf?.scenes) ||
      json?.scenes?.length !== 530 || typeof associations?.get !== 'function') {
    return () => [];
  }
  return (selectedObject, mountedScene) => {
    const sceneIndex=gltf.scenes.indexOf(mountedScene);
    const spec=C80_530_V27_SCENES[sceneIndex];
    if (!spec || !isC80530V27SourceScene(json,loadedSha,sceneIndex,spec.floor))
      return [];
    const active=reachableSourceNodes(json,sceneIndex);
    if (!active) return [];
    let candidate=selectedObject;
    // Source IDs are parser associations, NOT userData/name patterns.
    for (let depth=0; candidate && candidate !== mountedScene && depth < 128;
         candidate=candidate.parent,depth++) {
      const index=associations.get(candidate)?.nodes;
      if (!Number.isInteger(index) || !active.has(index)) continue;
      const evidence=c80530ElectricalGroupEvidenceForNode(json,index);
      if (evidence) return evidence;
    }
    return [];
  };
}
