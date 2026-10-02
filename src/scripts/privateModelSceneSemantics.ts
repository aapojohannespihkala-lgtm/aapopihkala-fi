export type PrivateModelFloor = '1F' | '2F';

export const semanticName = (object: any) => {
  const names: string[] = [];
  let current = object;
  let depth = 0;

  while (current && depth < 12) {
    if (current.name) names.push(String(current.name));
    current = current.parent;
    depth += 1;
  }

  return names.join(' | ').toUpperCase();
};

export const normalizeSceneName = (name: unknown) =>
  String(name ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

export const findSourceNamedScene = (gltf: any, sourceName: string) => {
  const sourceScenes = gltf?.parser?.json?.scenes;
  if (Array.isArray(sourceScenes)) {
    const sourceIndex = sourceScenes.findIndex((candidate: any) => candidate?.name === sourceName);
    if (sourceIndex >= 0 && gltf.scenes?.[sourceIndex]) {
      return gltf.scenes[sourceIndex];
    }
  }

  const target = normalizeSceneName(sourceName);
  return (
    gltf.scenes?.find((candidate: any) => normalizeSceneName(candidate?.name) === target) ?? null
  );
};

export const hasFloorToken = (object: any, floor: PrivateModelFloor) => {
  const explicitStorey = String(object?.userData?.storey ?? '').toUpperCase();
  if (explicitStorey === floor) return true;

  const name = semanticName(object);
  return new RegExp('(^|[_\\s-])(?:D[_\\s-]?)?' + floor + '([_\\s-]|$)').test(name);
};

export const explicitFloorToken = (object: any) => {
  const has1F = hasFloorToken(object, '1F');
  const has2F = hasFloorToken(object, '2F');
  if (has1F && has2F) return '1F / 2F';
  if (has1F) return '1F';
  if (has2F) return '2F';
  return '-';
};
