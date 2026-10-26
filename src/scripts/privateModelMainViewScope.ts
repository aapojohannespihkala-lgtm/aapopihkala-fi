import type { Object3D } from 'three';

export type MainViewFloor = 'BOTH' | '1F' | '2F';
export type T04Permit = {
  sourceObjectKey: string;
  meshes: Object3D[];
  clippedNow: () => boolean;
};
type Scope = {
  objectKey: string;
  apartmentScope: string;
  storeyScope: string;
  role: string;
  phaseScope: string;
};
const apartments = new Set(['D', 'A', 'B', 'C', 'SHARED_CD', 'SHARED_OTHER', 'SITE', 'UNKNOWN']);
const storeys = new Set(['1F', '2F', 'BOTH', 'OUTSIDE_1F', 'OUTSIDE_2F', 'ROOF', 'UNKNOWN']);
const roles = new Set(['CONTENT', 'SHARED_BOUNDARY', 'VERTICAL_CONNECTOR', 'OUTDOOR_D', 'UPPER_OCCLUDER', 'REFERENCE_ONLY', 'UNCLASSIFIED']);
const phases = new Set(['ACTIVE_IN_SELECTED_WORKTEST', 'HISTORICAL', 'SUPERSEDED', 'UNKNOWN']);

const readScope = (object: Object3D): Scope | null => {
  const s = object.userData.ylisViewScope;
  if (!s || typeof s.objectKey !== 'string' || !s.objectKey.trim() ||
      !apartments.has(s.apartmentScope) || !storeys.has(s.storeyScope) ||
      !roles.has(s.role) || !phases.has(s.phaseScope)) return null;
  return s;
};
const renderable = (object: Object3D) => {
  const candidate = object as Object3D & { isMesh?: boolean; isLine?: boolean; isPoints?: boolean };
  return candidate.isMesh || candidate.isLine || candidate.isPoints;
};

// Only the loaded scene's embedded, source-bound scope is consumed. Names,
// coordinates and unrelated scenes are never evidence of apartment ownership.
export const createMainViewScope = (root: Object3D) => {
  const objects: Object3D[] = [];
  root.traverse((object) => { if (renderable(object)) objects.push(object); });
  const scopes = new Map(objects.map((object) => [object, readScope(object)]));
  // A multi-primitive glTF node owns one scope on its Group. Do not copy it
  // onto children: that would invent two semantic identities for one source.
  const sharedGroups = new Map<Object3D, Scope>();
  root.traverse(object => {
    const s = readScope(object);
    if (!renderable(object) && s?.apartmentScope === 'SHARED_CD' &&
        s.storeyScope === 'BOTH' && s.role === 'SHARED_BOUNDARY' &&
        s.phaseScope === 'ACTIVE_IN_SELECTED_WORKTEST' && object.children.length === 2 &&
        object.children.every(child => renderable(child) && !scopes.get(child) &&
          !Object.hasOwn(child.userData, 'ylisViewScope') && !child.children.length)) sharedGroups.set(object, s);
  });
  const keyCounts = new Map<string, number>();
  for (const scope of scopes.values()) {
    if (scope) keyCounts.set(scope.objectKey, (keyCounts.get(scope.objectKey) ?? 0) + 1);
  }
  for (const scope of sharedGroups.values()) keyCounts.set(scope.objectKey, (keyCounts.get(scope.objectKey) ?? 0) + 1);
  const validScope = (object: Object3D) => {
    const scope = scopes.get(object) ?? (object.parent && sharedGroups.get(object.parent));
    return scope && keyCounts.get(scope.objectKey) === 1 ? scope : null;
  };
  const available = objects.some((object) => {
    const s = validScope(object);
    return s?.apartmentScope === 'D' && s.phaseScope === 'ACTIVE_IN_SELECTED_WORKTEST';
  });
  const baseline = new Map<Object3D, boolean>();
  let excluded = new Set<Object3D>();
  let floor: MainViewFloor = 'BOTH';
  let active = false;
  let t04Permit: T04Permit | null = null;
  let t04Meshes = new Set<Object3D>();
  const permitActive = () => {
    try { return !!t04Permit?.clippedNow(); } catch { return false; }
  };

  const restore = () => {
    for (const [object, visible] of baseline) object.visible = visible;
    baseline.clear();
    excluded.clear();
    active = false;
    floor = 'BOTH';
    t04Permit = null;
    t04Meshes.clear();
  };
  const enforce = () => {
    for (const object of excluded) object.visible = false;
    if (t04Permit && !permitActive()) {
      for (const object of t04Meshes) { object.visible = false; excluded.add(object); }
      t04Permit = null;
      t04Meshes.clear();
    }
  };
  const apply = (nextFloor: MainViewFloor, permit: T04Permit | null = null) => {
    restore();
    if (!available) return null;
    floor = nextFloor;
    active = true;
    const exceptions: Array<{ objectKey: string; reason: string }> = [];
    let included = 0;
    excluded = new Set();
    if (floor !== 'BOTH' && permit && Array.isArray(permit.meshes) && permit.meshes.length === 2 &&
        new Set(permit.meshes).size === 2 && typeof permit.clippedNow === 'function') {
      const group = permit.meshes[0]?.parent;
      const s = group && sharedGroups.get(group);
      if (group && s && keyCounts.get(s.objectKey) === 1 && s.objectKey === permit.sourceObjectKey &&
          group.children.every(child => permit.meshes.includes(child))) {
        t04Permit = permit;
        if (permitActive()) t04Meshes = new Set(permit.meshes);
        else t04Permit = null;
      }
    }
    for (const object of objects) {
      const s = validScope(object);
      let show = false;
      let reason = '';
      if (t04Meshes.has(object)) show = true;
      else if (!s) reason = 'MISSING_OR_DUPLICATE_SCOPE';
      else if (['A', 'B', 'C', 'SITE', 'SHARED_OTHER'].includes(s.apartmentScope)) { /* outside the D scope, not a missing D floor */ }
      else if (s.apartmentScope === 'UNKNOWN' || s.storeyScope === 'UNKNOWN' ||
               s.phaseScope === 'UNKNOWN' || s.role === 'UNCLASSIFIED') reason = 'UNRESOLVED_SCOPE';
      else if (s.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST') { /* history is opt-in */ }
      else if (s.apartmentScope === 'D' || s.apartmentScope === 'SHARED_CD') {
        if (s.role === 'REFERENCE_ONLY') reason = 'REFERENCE_PRESENTATION_PENDING';
        // T06: hide upper covers before testing unsplit BOTH geometry. A roof or
        // upper occluder needs no floor split when it is entirely omitted.
        // Shared boundaries and stair connectors still require T04/T05 clipping.
        else if (floor !== 'BOTH' && (s.role === 'UPPER_OCCLUDER' || s.storeyScope === 'ROOF')) { /* hide covers */ }
        else if (floor !== 'BOTH' && s.storeyScope === 'BOTH') reason = 'STOREY_CLIPPING_PENDING';
        else show = floor === 'BOTH' || s.storeyScope === floor || s.storeyScope === `OUTSIDE_${floor}`;
      }
      if (reason) exceptions.push({ objectKey: s?.objectKey ?? `scene-object:${object.uuid}`, reason });
      if (show) included += 1;
      // Also capture granted primitives so invalidation and WHOLE restore the
      // exact pre-filter visibility, including source-hidden primitives.
      if (t04Meshes.has(object)) baseline.set(object, object.visible);
      if (!show) {
        baseline.set(object, object.visible);
        excluded.add(object);
      }
    }
    enforce();
    return { included, exceptions };
  };
  const referenceCandidates = () => {
    if (!active || floor === 'BOTH') return [];
    const other = floor === '1F' ? '2F' : '1F';
    return objects.flatMap((object) => {
      const s = validScope(object);
      if (!s || !['D', 'SHARED_CD'].includes(s.apartmentScope) ||
          s.phaseScope !== 'ACTIVE_IN_SELECTED_WORKTEST' ||
          !['CONTENT', 'SHARED_BOUNDARY', 'OUTDOOR_D'].includes(s.role) ||
          ![other, `OUTSIDE_${other}`].includes(s.storeyScope)) return [];
      // Read the pre-filter visibility, including hidden source ancestors.
      // Do not reveal source objects just because their floor is referenced.
      let ancestor: Object3D | null = object;
      while (ancestor && ancestor !== root.parent) {
        if (!(baseline.get(ancestor) ?? ancestor.visible)) return [];
        ancestor = ancestor.parent;
      }
      return [{ object, objectKey: s.objectKey }];
    });
  };
  return { available, apply, restore, enforce, referenceCandidates,
    get t04Granted() { return t04Meshes.size === 2 && permitActive(); },
    get active() { return active; }, get floor() { return floor; } };
};
