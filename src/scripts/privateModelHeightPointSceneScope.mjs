/** A stored marker is renderable only in its recorded model scene/floor. */
export function heightPointSceneScope({ sceneName, floor } = {}) {
  if (typeof sceneName === 'string' && /^__scene[0-9]+$/.test(sceneName))
    return 'scene:' + sceneName;
  return 'floor:' + (['1F', '2F', 'BOTH'].includes(floor) ? floor : 'BOTH');
}

export function scopedHeightPointSurface(scope, sourceName) {
  if (typeof scope !== 'string' || !/^(?:scene:__scene[0-9]+|floor:(?:1F|2F|BOTH))$/.test(scope)) return null;
  const name = typeof sourceName === 'string'
    ? sourceName.replace(/[\u0000-\u001f]/g, ' ').slice(0, 115) : '';
  return ('@HP[' + scope + '] ' + name).slice(0, 160);
}

export function canRenderHeightPoint(point, scope, activeSeedIds = []) {
  if (!point || typeof point !== 'object' || typeof scope !== 'string') return false;
  if (typeof point.id === 'string' && point.id.startsWith('r34-'))
    return Array.isArray(activeSeedIds) && activeSeedIds.includes(point.id);
  return typeof point.surfaceObjectName === 'string'
    && point.surfaceObjectName.startsWith('@HP[' + scope + '] ');
}
