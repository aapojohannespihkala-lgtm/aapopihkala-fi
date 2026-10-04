export type SelectionIdentityNode = {
  name?: unknown;
  type?: unknown;
  parent?: SelectionIdentityNode | null;
  isScene?: boolean;
  isMesh?: boolean;
  isLine?: boolean;
  isLineSegments?: boolean;
  isPoints?: boolean;
};

export type SceneNameLookup = {
  get(key: object): string | undefined;
};

export const nearestNamedAncestor = (
  object: SelectionIdentityNode,
  stopAt: SelectionIdentityNode,
) => {
  let current = object.parent;
  while (current && current !== stopAt) {
    if (current.name) return String(current.name);
    current = current.parent;
  }
  return '';
};

export const sceneNameForObject = (
  object: SelectionIdentityNode,
  stopAt: SelectionIdentityNode,
  sourceSceneNames: SceneNameLookup,
  fallback: SelectionIdentityNode | null | undefined,
) => {
  let current: SelectionIdentityNode | null | undefined = object;
  while (current && current !== stopAt) {
    if (current.isScene) {
      return sourceSceneNames.get(current as object) || (current.name ? String(current.name) : '');
    }
    current = current.parent;
  }

  if (!fallback) return '';
  return sourceSceneNames.get(fallback as object) || (fallback.name ? String(fallback.name) : '');
};

export const isObjectVisibilityRenderable = (object: SelectionIdentityNode | null | undefined) =>
  object?.isMesh === true ||
  object?.isLine === true ||
  object?.isLineSegments === true ||
  object?.isPoints === true;

export const selectionKindLabel = (object: SelectionIdentityNode | null | undefined) => {
  if (object?.isMesh === true) return 'Mesh';
  if (object?.isLineSegments === true) return 'LineSegments';
  if (object?.isLine === true) return 'Line';
  if (object?.isPoints === true) return 'Points';
  return object?.type ? String(object.type) : '-';
};
