/**
 * WORK_TEST selection lifecycle for two EXPLICITLY clicked source surfaces.
 * This module does not raycast, infer surfaces, render UI or claim a globally
 * shortest model distance. Pass closestVisibleSourceMeshClearance as calculate
 * after independently validating source, clipping and frontmost visibility.
 *
 * contextKey must change whenever the model SHA, active glTF scene, floor,
 * clipping or selectable-source policy changes. The viewer owns that key.
 * No selection persists across a changed context or a missing key.
 */
const keyOk = value => typeof value === 'string' && value.trim().length > 0;
const finitePoint = p => p && [p.x,p.y,p.z].every(Number.isFinite);
const MAX_PATCH_FACES = 64;

const sanitizePick = (pick, maxFaces) => {
  const {sourceId,mesh,frontmostHit,selectedFaceIndices} = pick || {};
  if (!keyOk(sourceId) || !mesh?.isMesh ||
      !frontmostHit || frontmostHit.object !== mesh ||
      !Number.isSafeInteger(frontmostHit.faceIndex) || frontmostHit.faceIndex < 0 ||
      !finitePoint(frontmostHit.point) ||
      !Array.isArray(selectedFaceIndices) ||
      !selectedFaceIndices.length || selectedFaceIndices.length > maxFaces ||
      selectedFaceIndices.some(i => !Number.isSafeInteger(i) || i < 0) ||
      new Set(selectedFaceIndices).size !== selectedFaceIndices.length ||
      !selectedFaceIndices.includes(frontmostHit.faceIndex)) return null;
  // Copy click evidence: a mutable raycaster result must not silently move
  // the selected anchor after the user has chosen a different surface.
  const p = frontmostHit.point;
  const point = typeof p.clone === 'function' ? p.clone() : {x:p.x,y:p.y,z:p.z};
  return Object.freeze({
    sourceId,mesh,
    frontmostHit:Object.freeze({object:mesh,faceIndex:frontmostHit.faceIndex,point}),
    selectedFaceIndices:Object.freeze([...selectedFaceIndices]),
  });
};

export const createSurfacePairSelection = ({calculate,maxFaces=MAX_PATCH_FACES}={}) => {
  if (typeof calculate !== 'function' ||
      !Number.isInteger(maxFaces) || maxFaces < 1 || maxFaces > MAX_PATCH_FACES) return null;
  let contextKey=null,first=null,second=null;
  const clearPair = () => {first=null;second=null;};
  const setContext = next => {
    if (!keyOk(next)) {contextKey=null;clearPair();return false;}
    if (contextKey!==next) {contextKey=next;clearPair();}
    return true;
  };
  const status = () => Object.freeze({
    contextKey,firstSourceId:first?.sourceId??null,
    secondSourceId:second?.sourceId??null,ready:!!(first&&second),
  });
  const selectHit = ({contextKey:key,...pick}={}) => {
    if (!keyOk(key) || key!==contextKey) return false;
    const selected=sanitizePick(pick,maxFaces);
    if (!selected) return false;
    if (!first) {first=selected;return true;}
    if (selected.mesh===first.mesh && selected.sourceId!==first.sourceId) return false;
    if (selected.sourceId===first.sourceId) {
      if (selected.mesh!==first.mesh) return false;
      first=selected;second=null;return true;
    }
    if (selected.mesh===first.mesh) return false;
    if (second && selected.sourceId===second.sourceId) {
      if (selected.mesh!==second.mesh) return false;
      second=selected;return true;
    }
    if (second) {first=selected;second=null;return true;}
    second=selected;
    return true;
  };
  const measure = ({contextKey:key,acceptsSourceMesh,acceptsClippedTriangle,
    isTriangleFrontmost}={}) => {
    if (!keyOk(key) || key!==contextKey || !first || !second ||
        first.sourceId===second.sourceId || first.mesh===second.mesh ||
        typeof acceptsSourceMesh!=='function' ||
        typeof acceptsClippedTriangle!=='function' ||
        typeof isTriangleFrontmost!=='function') return null;
    try {
      return calculate({sourceA:first,sourceB:second,acceptsSourceMesh,
        acceptsClippedTriangle,isTriangleFrontmost}) ?? null;
    } catch {return null;}
  };
  return Object.freeze({setContext,selectHit,measure,status,
    clear:()=>{clearPair();return status();}});
};
