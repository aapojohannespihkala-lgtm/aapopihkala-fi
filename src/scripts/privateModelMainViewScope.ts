import type { Object3D } from 'three';

export type MainViewFloor = 'BOTH' | '1F' | '2F';
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
  const keyCounts = new Map<string, number>();
  for (const scope of scopes.values()) {
    if (scope) keyCounts.set(scope.objectKey, (keyCounts.get(scope.objectKey) ?? 0) + 1);
  }
  const validScope = (object: Object3D) => {
    const scope = scopes.get(object);
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

  const restore = () => {
    for (const [object, visible] of baseline) object.visible = visible;
    baseline.clear();
    excluded.clear();
    active = false;
    floor = 'BOTH';
  };
  const enforce = () => { for (const object of excluded) object.visible = false; };
  const apply = (nextFloor: MainViewFloor) => {
    restore();
    if (!available) return null;
    floor = nextFloor;
    active = true;
    const exceptions: Array<{ objectKey: string; reason: string }> = [];
    let included = 0;
    excluded = new Set();
    for (const object of objects) {
      const s = validScope(object);
      let show = false;
      let reason = '';
      if (!s) reason = 'MISSING_OR_DUPLICATE_SCOPE';
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
      else {
        baseline.set(object, object.visible);
        excluded.add(object);
      }
    }
    enforce();
    return { included, exceptions };
  };
  return { available, apply, restore, enforce, get active() { return active; }, get floor() { return floor; } };
};
