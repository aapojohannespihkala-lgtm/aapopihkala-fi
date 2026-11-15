import receipt from './privateModelC80437Receipt.json' with {type:'json'};
import { c80437Fingerprint } from './privateModelC80437SourceProfile.mjs';
import {
  C80_SUCC455_SAVO483_GLB_SHA256, C80_SUCC455_SAVO483_SCENES,
  isC80Succ455Savo483SourceScene,
} from './privateModelC80Succ455Room3Mj83SourceProfile.mjs';
import {
  C80_WW74_L150_GLB_SHA256, C80_WW74_L150_VIEWER_ROLES,
  isC80Ww74L150SourceScene,
} from './privateModelC80Ww74L150FloorRuntime.mjs';
import {
  C80_495_GLB_SHA256, C80_495_VIEWER_ROLES,
  isC80495SavoSewerSourceScene,
} from './privateModelC80495SavoSewerFloorRuntime.mjs';
import {
  C80_500_GLB_SHA256, C80_500_VIEWER_ROLES,
  isC80500ABCSourceScene,
} from './privateModelC80500WW1974ABCSourceProfile.mjs';

// These are authenticated, opt-in WORK_TEST SHA identities only, not a
// generic parent-source inheritance rule. Node IDs alone are insufficient.
const sources = new Map([
  [C80_SUCC455_SAVO483_GLB_SHA256, {
    roles: C80_SUCC455_SAVO483_SCENES,
    guard: (json, sha, index, floor) => isC80Succ455Savo483SourceScene(json, sha, index, floor),
  }],
  [C80_WW74_L150_GLB_SHA256, {
    roles: C80_WW74_L150_VIEWER_ROLES,
    guard: (json, sha, index) => isC80Ww74L150SourceScene(json, sha, index),
  }],
  [C80_495_GLB_SHA256, {
    roles: C80_495_VIEWER_ROLES,
    guard: (json, sha, index) => isC80495SavoSewerSourceScene(json, sha, index),
  }],
  [C80_500_GLB_SHA256, {
    roles: C80_500_VIEWER_ROLES,
    guard: (json, sha, index) => isC80500ABCSourceScene(json, sha, index),
  }],
]);
export const isC80Inherited437Sha = sha => sources.has(String(sha ?? '').toLowerCase());
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function verifiedRole(json, sha, index, floor) {
  const source = sources.get(String(sha ?? '').toLowerCase());
  const role = source?.roles?.[index];
  const extras = json?.asset?.extras;
  if (!source || !role || (floor !== undefined && role.floor !== floor) ||
      extras?.ModelStage !== 'WORK_TEST' ||
      extras.current !== false || extras.asBuilt !== false ||
      extras.HUMAN_REVIEW !== 'NOT_RUN' ||
      !source.guard(json, sha, index, role.floor)) return null;
  return role;
}
export function isC80Inherited437Scene(json, sha, index, floor) {
  return verifiedRole(json, sha, index, floor) !== null;
}

// This helper verifies the entire path and its immutable original definitions;
// it confers no source identity by itself. The public resolver also requires
// SHA, scene, floor and the version-specific source profile before calling it.
export function verifyInherited437Path(json, index, node, path, entry, signatures) {
  if (!Number.isInteger(index) || !Number.isInteger(node) ||
      !Array.isArray(path) || !path.length || path.at(-1) !== node ||
      !Array.isArray(entry?.paths) || !entry.paths.some(p => equal(p, path))) return false;
  for (let i = 0; i < path.length; i++) {
    const id = path[i], def = json?.nodes?.[id], original = signatures?.[id];
    const siblings = i === 0 ? json?.scenes?.[index]?.nodes : json?.nodes?.[path[i - 1]]?.children;
    if (!Number.isInteger(id) || !def || !original ||
        !Array.isArray(siblings) || siblings.filter(n => n === id).length !== 1 ||
        def.name !== original.name || def.mesh !== original.mesh ||
        c80437Fingerprint(def) !== original.fnv) return false;
  }
  return true;
}
function inherited437Scene(role) {
  const found = Object.entries(receipt.scenes).filter(([, s]) =>
    s.floor === role.floor && s.glazing === role.glazing && s.cutaway === role.cutaway);
  return found.length === 1 ? found[0][1] : null;
}
function newTechnicalPart(json, sha, index, node, path) {
  const sceneRoots = json?.scenes?.[index]?.nodes;
  const def = json?.nodes?.[node];
  if (!Array.isArray(sceneRoots) || !def || !Number.isInteger(def.mesh)) return null;
  const sewerAllowed = sha === C80_WW74_L150_GLB_SHA256 ||
    sha === C80_495_GLB_SHA256 || sha === C80_500_GLB_SHA256;
  if (sewerAllowed && node >= 12225 && node <= 12227 &&
      equal(path, [12228, node]) && sceneRoots.filter(n => n === 12228).length === 1 &&
      equal(json.nodes[12228]?.children, [12225, 12226, 12227]) &&
      /DRAIN/.test(def.name ?? ''))
    return { id: 'technical-drainage', name: def.name, mesh: def.mesh };
  if ((sha === C80_495_GLB_SHA256 || sha === C80_500_GLB_SHA256) &&
      node === 12229 && equal(path, [12230, 12229]) &&
      sceneRoots.filter(n => n === 12230).length === 1 &&
      equal(json.nodes[12230]?.children, [12229]) &&
      def.mesh === 4604 && /SAVO/.test(def.name ?? ''))
    return { id: 'technical-electrical', name: def.name, mesh: def.mesh };
  if (sha === C80_500_GLB_SHA256 && node >= 12231 && node <= 12236 &&
      equal(path, [12237, node]) &&
      sceneRoots.filter(n => n === 12237).length === 1 &&
      equal(json.nodes[12237]?.children, [12231, 12232, 12233, 12234, 12235, 12236]) &&
      def.mesh === 4605 + node - 12231 &&
      /^WW1974_[ABC]_L100_DRAIN_/.test(def.name ?? ''))
    return { id: 'technical-drainage', name: def.name, mesh: def.mesh };
  return null;
}
// Reject modified, moved, duplicate or superseded nodes instead of transferring
// a 437 receipt based only on an appealing GLTFLoader name.
export function resolveC80Inherited437LayerNode(json, sha, index, floor, node, path) {
  const role = verifiedRole(json, sha, index, floor);
  if (!role || !Number.isInteger(node) || !Array.isArray(path)) return null;
  const oldScene = inherited437Scene(role);
  const record = oldScene?.building?.[node] ?? oldScene?.technical?.[node];
  if (record && verifyInherited437Path(json, index, node, path, record, receipt.nodes))
    return { ...record, ...receipt.nodes[node] };
  // New source-specific geometry can never inherit a 437 identity.
  return newTechnicalPart(json, String(sha).toLowerCase(), index, node, path);
}
