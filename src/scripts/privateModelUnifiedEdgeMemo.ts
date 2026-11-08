/**
 * VIEWER-PERF: exact memo for the unified/visible edge overlay.
 *
 * The overlay built by index.astro `buildUnifiedEdgeGeometry` is a pure function
 * of the ordered candidate meshes (object identity, geometry, position/index
 * attribute identity + version + count, world matrix) and the C80-044 suppression
 * variant. Measured in production (8.11.2026, V82 d027eb46, D BOTH): one rebuild
 * takes ~4.5 s of main thread and ~0.5-1 GB of garbage, and a single floor switch
 * or Layers toggle triggers it several times for the same visible set. This memo
 * returns the previously computed segment positions for an identical input, so the
 * edge appearance, algorithm, thresholds and defaults stay exactly the same.
 */

type AttributeLike = {
  version?: number;
  count?: number;
  itemSize?: number;
  array?: unknown;
  data?: { version?: number; array?: unknown };
};

export type UnifiedEdgeMemoMesh = {
  matrixWorld: { elements: ArrayLike<number> };
  geometry?: {
    getAttribute?: (name: string) => AttributeLike | undefined;
    getIndex?: () => AttributeLike | null;
  } | null;
};

export type UnifiedEdgeMemoEntry = {
  positions: Float32Array;
  suppressedTJunctions: number;
};

export const createUnifiedEdgeMemo = (capacity = 6) => {
  const limit = Math.max(1, Math.min(32, Math.floor(capacity)));
  const ids = new WeakMap<object, number>();
  let nextId = 1;
  const idOf = (value: unknown) => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return 0;
    let id = ids.get(value as object);
    if (!id) {
      id = nextId++;
      ids.set(value as object, id);
    }
    return id;
  };
  const attributeParts = (attribute: AttributeLike | null | undefined) => [
    idOf(attribute),
    idOf(attribute?.array ?? attribute?.data?.array),
    attribute?.version ?? attribute?.data?.version ?? -1,
    attribute?.count ?? -1,
    attribute?.itemSize ?? -1,
  ];
  const entries: Array<UnifiedEdgeMemoEntry & { key: string }> = [];

  const keyOf = (meshes: readonly UnifiedEdgeMemoMesh[], variant: string) => {
    const parts: Array<string | number> = [variant, meshes.length];
    for (const mesh of meshes) {
      const geometry = mesh.geometry ?? null;
      parts.push(
        idOf(mesh),
        idOf(geometry),
        ...attributeParts(geometry?.getAttribute?.('position')),
        ...attributeParts(geometry?.getIndex?.() ?? null),
      );
      const elements = mesh.matrixWorld.elements;
      for (let i = 0; i < 16; i += 1) parts.push(elements[i]);
    }
    return parts.join('|');
  };

  const get = (key: string): UnifiedEdgeMemoEntry | null => {
    const index = entries.findIndex((entry) => entry.key === key);
    if (index < 0) return null;
    const [entry] = entries.splice(index, 1);
    entries.unshift(entry);
    return entry;
  };

  const set = (key: string, positions: ArrayLike<number>, suppressedTJunctions: number) => {
    const existing = entries.findIndex((entry) => entry.key === key);
    if (existing >= 0) entries.splice(existing, 1);
    // Own copy: the overlay geometry handed to the scene is disposed independently.
    entries.unshift({ key, positions: Float32Array.from(positions), suppressedTJunctions });
    entries.length = Math.min(entries.length, limit);
  };

  return {
    keyOf,
    get,
    set,
    clear: () => { entries.length = 0; },
    get size() { return entries.length; },
  };
};
