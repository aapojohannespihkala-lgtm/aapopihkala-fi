// C80-037, exact-source HI20 WORK_TEST viewer correction.
// Hide only the two cabinet top triangles that are exactly covered by TOP_COVER.
// No source GLB, other parts, placement, node ID, or provenance is changed.
const SOURCE_SHA = '15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
const TARGETS = [
  { scene: 50, parent: 5733, cabinet: 5683, cover: 5684, suffix: '1' },
  { scene: 51, parent: 5682, cabinet: 5632, cover: 5633, suffix: '0' },
];
const fail = (reason) => ({ available: false, reason, count: 0,
  get enabled() { return false; }, setEnabled: () => false, dispose: () => {} });

export function createHi20C037WasherTopPresentation(gltf, verifiedSha) {
  const json = gltf?.parser?.json;
  if (verifiedSha !== SOURCE_SHA || gltf?.scenes?.length !== 52 ||
      json?.scenes?.length !== 52 || json?.asset?.version !== '2.0' ||
      json?.asset?.extras?.current !== false || json?.asset?.extras?.asBuilt !== false)
    return fail('source-sha-or-scene-identity');
  const associations = gltf.parser?.associations;
  if (typeof associations?.get !== 'function') return fail('missing-node-associations');
  if (json.nodes?.[5683]?.mesh !== 1665 || json.nodes?.[5632]?.mesh !== 1665 ||
      json.nodes?.[5684]?.mesh !== 1666 || json.nodes?.[5633]?.mesh !== 1666 ||
      json.meshes?.[1665]?.primitives?.[0]?.material !== 228 ||
      json.meshes?.[1666]?.primitives?.[0]?.material !== 229)
    return fail('original-cabinet-cover-mesh-material-mismatch');
  const planned = [];
  for (const target of TARGETS) {
    const scene = gltf.scenes[target.scene];
    if (!scene || typeof scene.traverse !== 'function') return fail('source-scene-unavailable');
    const matches = new Map();
    scene.traverse((obj) => {
      const id = associations.get(obj)?.nodes;
      if ([target.cabinet, target.cover].includes(id)) {
        if (matches.has(id)) matches.set(id, null);
        else matches.set(id, obj);
      }
    });
    const cabinet = matches.get(target.cabinet), cover = matches.get(target.cover);
    const stem = `C80-037_BOSCH_${target.suffix}_`;
    if (!cabinet?.isMesh || !cover?.isMesh ||
        cabinet.name !== stem + 'BOSCH_WNG254ABSN_MAIN_CABINET' ||
        cover.name !== stem + 'TOP_COVER' || !cabinet.parent ||
        cabinet.parent !== cover.parent ||
        associations.get(cabinet.parent)?.nodes !== target.parent ||
        json.nodes[target.parent]?.children?.includes(target.cabinet) !== true ||
        json.nodes[target.parent]?.children?.includes(target.cover) !== true ||
        cabinet.userData?.asBuilt !== false || cover.userData?.asBuilt !== false ||
        cabinet.userData?.current !== false || cover.userData?.current !== false ||
        JSON.stringify(cabinet.userData?.sourceLinks) !== JSON.stringify(cover.userData?.sourceLinks))
      return fail('source-node-parent-or-provenance-mismatch');
    const geo = cabinet.geometry, lid = cover.geometry;
    const pos = geo?.getAttribute?.('position'), idx = geo?.index;
    const lidPos = lid?.getAttribute?.('position'), lidIdx = lid?.index;
    if (!pos || !idx || pos.count !== 8 || idx.count !== 36 ||
        !lidPos || !lidIdx || lidPos.count !== 8 || lidIdx.count !== 36 ||
        typeof geo.clone !== 'function') return fail('source-geometry-topology-mismatch');
    const yMax = Math.max(...Array.from({ length: pos.count }, (_, i) => pos.getY(i)));
    const coverYMax = Math.max(...Array.from({ length: lidPos.count }, (_, i) => lidPos.getY(i)));
    if (Math.abs(yMax - 0.848) > 0.0001 || Math.abs(yMax - coverYMax) > 0.000001 ||
        cabinet.position.distanceTo(cover.position) > 1e-8 ||
        cabinet.quaternion.angleTo(cover.quaternion) > 1e-8 ||
        cabinet.scale.distanceTo(cover.scale) > 1e-8)
      return fail('cabinet-cover-local-registration-mismatch');
    const retained = [], upper = [], upperCover = [];
    const sourceTri = (index, position, offset) => Array.from({ length: 3 }, (_, k) => {
      const vertex = index.getX(offset + k);
      return [position.getX(vertex), position.getY(vertex), position.getZ(vertex)];
    });
    const isTop = (tri) => tri.every((v) => Math.abs(v[1] - yMax) < 0.000001);
    for (let n = 0; n < idx.count; n += 3) {
      const tri = sourceTri(idx, pos, n);
      if (isTop(tri)) upper.push(tri);
      else for (let k = 0; k < 3; k++) retained.push(idx.getX(n + k));
    }
    for (let n = 0; n < lidIdx.count; n += 3) {
      const tri = sourceTri(lidIdx, lidPos, n);
      if (isTop(tri)) upperCover.push(tri);
    }
    const canon = (tri) => tri.map(v => v.map(x => x.toFixed(6)).join(','))
      .sort().join('|');
    if (upper.length !== 2 || upperCover.length !== 2 || retained.length !== 30 ||
        upper.map(canon).sort().join(';') !== upperCover.map(canon).sort().join(';'))
      return fail('two-exact-coplanar-top-faces-not-found');
    planned.push({ cabinet, original: geo, retained });
  }
  if (planned[0].cabinet === planned[1].cabinet)
    return fail('cross-scene-cabinet-alias');
  let enabled = false;
  const restore = () => {
    if (!enabled) return;
    for (const item of planned) {
      const clone = item.cabinet.geometry;
      item.cabinet.geometry = item.original;
      clone.dispose?.();
    }
    enabled = false;
  };
  return {
    available: true, reason: null, count: planned.length * 2,
    get enabled() { return enabled; },
    setEnabled(next) {
      if (!next) { restore(); return true; }
      if (enabled) return true;
      const clones = [];
      try {
        for (const item of planned) {
          const clone = item.original.clone();
          clone.setIndex(item.retained);
          clones.push(clone);
        }
        for (let i = 0; i < planned.length; i++) planned[i].cabinet.geometry = clones[i];
        enabled = true;
        return true;
      } catch (_) {
        for (let i = 0; i < planned.length; i++) planned[i].cabinet.geometry = planned[i].original;
        clones.forEach((g) => g.dispose?.());
        return false;
      }
    },
    dispose: restore,
  };
}
