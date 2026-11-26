/**
 * Source-exact, fail-closed R34 technical-network presence contract.
 * A GLB proves which source meshes are mounted, NOT a water-tight fitting,
 * service access, electrical safety or an as-built physical route.
 * This is WORK_TEST source QA, never CURRENT approval.
 */
export const R34_MEP_SOURCE = Object.freeze({
  sha256: '99210ea517c18cf24fa5f9702abe12ed2a8058a0c606d38b863e19802a270725',
  scenes: Object.freeze({ 822:'BOTH', 823:'BOTH', 824:'2F', 825:'2F' }),
});

const chain = (id, system, views, nodes, evidence, notes) => Object.freeze({
  id, system, views: Object.freeze(views),
  nodes: Object.freeze(nodes.map(([id, role])=>Object.freeze({id,role}))),
  evidence, notes,
});

/** Only verified original GLB node IDs. Different systems never share inferred ports. */
export const R34_MEP_CHAINS = Object.freeze([
  chain('D_IV_1F_TO_2F', 'IV', ['BOTH'], [
    [13543,'IV'], [13544,'IV'], [13545,'IV'], [13546,'IV'],
    [13232,'IV'], [13233,'IV'], [13341,'IV'],
  ], '2015_PLAN_3D_WORK_TEST', '1F collector/AV1 -> 2F riser, physical host sleeve and acoustic/fire seal unverified'),
  chain('D_IV_2F_ONLY', 'IV', ['2F'], [
    [13232,'IV'], [13233,'IV'], [10070,'IV'],
  ], '2015_PLAN_3D_WORK_TEST', '2F fan variant is not the BOTH fan; do not superimpose'),
  chain('D_WASTE_AND_T110', 'VIEMARI', ['BOTH'], [
    [13628,'VIEMARI'], [13629,'VIEMARI'], [13630,'VIEMARI'],
    [13635,'VIEMARI'], [13636,'VIEMARI'], [12239,'VIEMARI'],
  ], '2015_PLAN_WORK_ASSUMPTION', 'fixture drains and T110 wastewater vent are not room ventilation'),
  chain('D_WASTE_T110_2F', 'VIEMARI', ['2F'], [[12240,'VIEMARI']],
    '2015_PLAN_WORK_TEST', '2F-only T110 scene alternative, physical discharge not proven'),
  chain('D_NIBE_KV_LV', 'VESI', ['BOTH','2F'], [
    [11681,'VESI'], [11682,'VESI'], [13492,'VISUAL_ONLY'], [13493,'VISUAL_ONLY'],
    [13415,'DEVICE'],
  ], 'MANUFACTURER_PORT_ROLES_NOT_INSTALLED_MAPPING', 'NIBE XL3/XL4 and safety drain XL48 not connected by verified port/host evidence'),
  chain('D_PA2_UNDERFLOOR', 'VESI', ['BOTH'], [
    [12148,'PARENT_VESI'], [12512,'PARENT_VESI'], [5224,'WORK_SHELL'],
  ], 'WORK_SHELL_NOT_SLAB', '200 mm work shell is not a surveyed structural sleeve or pipe embedment'),
  chain('D_ELECTRICAL_BOARD', 'SAHKO', ['BOTH'], [
    [13560,'SAHKO'], [13581,'SAHKO'], [13618,'SAHKO'],
  ], 'ELECTRICAL_SCHEMATIC_AND_VISUAL_WORK_TEST', 'open circuits and switchboard visual are not verified cable continuities'),
  chain('ROOF_GUTTER_FIVE_OUTLETS', 'SADEVESI', ['BOTH'], [
    [13794,'ROOFWATER'], [13795,'ROOFWATER'], [13796,'ROOFWATER'], [13797,'ROOFWATER'],
    [13798,'ROOFWATER'], [13800,'ROOFWATER'], [13802,'ROOFWATER'],
    [13804,'ROOFWATER'], [13806,'ROOFWATER'],
  ], 'GUTTER_TO_COLLAR_HOST_GAP', 'original R34 five gutter joins unverified; four fixed in separate opt-in donor'),
]);

function mountedNodes(json, sceneIndex) {
  const scene = json?.scenes?.[sceneIndex];
  if (!scene || !Array.isArray(scene.nodes) || !Array.isArray(json.nodes)) return null;
  const active = new Set(), visiting = new Set();
  const walk=(idx)=>{
    if (!Number.isInteger(idx)||idx<0||idx>=json.nodes.length) throw Error('bad-node-index');
    if (visiting.has(idx)) throw Error('cycle-in-scene');
    if (active.has(idx)) return;
    visiting.add(idx);
    const children=json.nodes[idx]?.children ?? [];
    if (!Array.isArray(children)) throw Error('bad-child-list');
    children.forEach(walk);
    visiting.delete(idx);
    active.add(idx);
  };
  try { scene.nodes.forEach(walk); } catch { return null; }
  return active;
}

function systemOf(json, active, nodeId, role) {
  const n=json.nodes[nodeId];
  if (typeof n?.mesh !== 'number') return false;
  if (role==='WORK_SHELL') return n.name?.includes('WORK_SHELL')===true;
  if (role==='DEVICE') return n.name?.includes('R300')===true;
  if (role==='VISUAL_ONLY') return n.extras?.visualOnly===true || n.name?.includes('VISIBLE_ONLY')===true;
  if (role==='ROOFWATER') return n.name?.startsWith('T12_')===true;
  if (n.extras?.m5System===role) return true;
  if (role!=='PARENT_VESI' || !n.name?.startsWith('PA2_BOTH_')) return false;
  // An unmounted old wrapper cannot confer a technical role in this scene.
  return json.nodes.some((p,i)=>active.has(i)&&p.extras?.m5System==='VESI'&&
    Array.isArray(p.children)&&p.children.includes(nodeId));
}

/** ok means required SOURCE MODEL pieces present, never a physical connection. */
export function inspectR34MepNetwork(json, loadedSha, sceneIndex) {
  const sceneRole=R34_MEP_SOURCE.scenes[sceneIndex]??null;
  if (!sceneRole || loadedSha!==R34_MEP_SOURCE.sha256 ||
      !Array.isArray(json?.scenes) || json.scenes.length<=825 ||
      !Array.isArray(json?.nodes) || json.nodes.length<=13806)
    return {sourceValid:false,sceneRole,chains:[],ok:false,physicalVerified:false};
  const active=mountedNodes(json,sceneIndex);
  if (!active) return {sourceValid:false,sceneRole,chains:[],ok:false,physicalVerified:false};
  const chains=R34_MEP_CHAINS.filter(c=>c.views.includes(sceneRole)).map(c=>{
    const missing=[],badType=[];
    for (const n of c.nodes) {
      if (!active.has(n.id)) missing.push(n.id);
      else if (!systemOf(json,active,n.id,n.role)) badType.push(n.id);
    }
    return Object.freeze({id:c.id,system:c.system,modelPresent:!missing.length&&!badType.length,
      missing,badType,evidence:c.evidence,physicalVerified:false,
      status:missing.length||badType.length?'SOURCE_MODEL_INCOMPLETE':'MODEL_PRESENT_PHYSICAL_HOLD'});
  });
  return {sourceValid:true,sceneRole,chains,
    ok:chains.every(c=>c.modelPresent),physicalVerified:false};
}
