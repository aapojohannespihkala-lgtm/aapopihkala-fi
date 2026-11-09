// C80R2 main-model successor chain (64 -> 108+ scenes, 1.11.2026): every
// correction appends a new D1F/D2F/BOTH scene to the same immutable GLB, so a
// per-SHA viewer contract goes stale within hours. Resolve the three floor
// views from the GLB itself instead:
//   1. asset.extras.viewerFloorScenes = { "1F": n, "2F": n, "BOTH": n } wins;
//   2. otherwise the LAST scene whose name starts with C80R2_ and carries the
//      floor token (_BOTH_ before _D2F_/_2F_ before _D1F_/_1F_).
// Only a non-current, non-as-built WORK_TEST file qualifies. Anything
// ambiguous returns null and the viewer keeps its generic path.

const FLOORS = Object.freeze(['1F', '2F', 'BOTH']);
const hasToken = (name, token) => new RegExp('(^|_)' + token + '(_|$)').test(name);

export function floorOfC80R2SceneName(name) {
  const text = String(name ?? '');
  if (!text.startsWith('C80R2_')) return null;
  if (hasToken(text, 'BOTH')) return 'BOTH';
  if (hasToken(text, 'D2F') || hasToken(text, '2F')) return '2F';
  if (hasToken(text, 'D1F') || hasToken(text, '1F')) return '1F';
  return null;
}

export function resolveC80R2ChainFloorScenes(json) {
  const scenes = json?.scenes, extras = json?.asset?.extras;
  if (!Array.isArray(scenes) || scenes.length < 64 ||
      extras?.current !== false || extras?.asBuilt !== false) return null;
  const chain = scenes.filter((scene) => String(scene?.name ?? '').startsWith('C80R2_'));
  if (chain.length < 8) return null;
  const picked = {};
  let source;
  if (extras.viewerFloorScenes !== undefined) {
    const declared = extras.viewerFloorScenes;
    if (!declared || typeof declared !== 'object') return null;
    for (const floor of FLOORS) picked[floor] = declared[floor];
    source = 'asset.extras.viewerFloorScenes';
  } else {
    scenes.forEach((scene, index) => {
      const floor = floorOfC80R2SceneName(scene?.name);
      if (floor) picked[floor] = index;
    });
    source = 'latest-C80R2-scene-name';
  }
  for (const floor of FLOORS) {
    const index = picked[floor];
    const scene = Number.isInteger(index) && index >= 0 ? scenes[index] : undefined;
    const sceneExtras = scene?.extras ?? {};
    if (!scene || !Array.isArray(scene.nodes) || scene.nodes.length === 0 ||
        sceneExtras.current === true || sceneExtras.CURRENT === true ||
        sceneExtras.asBuilt === true) return null;
  }
  if (new Set(FLOORS.map((floor) => picked[floor])).size !== FLOORS.length) return null;
  return Object.freeze({
    '1F': picked['1F'], '2F': picked['2F'], BOTH: picked.BOTH, source,
    names: Object.freeze(Object.fromEntries(FLOORS.map((floor) => [floor, String(scenes[picked[floor]].name ?? '')]))),
  });
}
