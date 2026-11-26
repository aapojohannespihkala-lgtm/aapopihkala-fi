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
  const selectHit = (input={}) => {
    // Empty/invalidated raycaster events and disposed scene evidence are not clicks.
    if (!input || typeof input!=='object') return false;
    let key,pick,selected;
    try {
      ({contextKey:key,...pick}=input);
      if (!keyOk(key) || key!==contextKey) return false;
      selected=sanitizePick(pick,maxFaces);
    } catch {return false;}
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
      // A view/clip/selection event may invalidate the pair while a caller
      // evaluates the selected source surfaces. Never return that stale result.
      const firstAtStart=first,secondAtStart=second,contextAtStart=contextKey;
      const result=calculate({sourceA:firstAtStart,sourceB:secondAtStart,
        acceptsSourceMesh,acceptsClippedTriangle,isTriangleFrontmost});
      if(contextKey!==contextAtStart || first!==firstAtStart ||
         second!==secondAtStart) return null;
      // A stale or malformed calculator must never turn into a measured
      // clearance between the two surfaces currently selected by the user.
      // The source-mesh adapter is synchronous; do not leak async/thenable
      // results whose context can change after this validation.
      if (!result || typeof result!=='object' ||
          typeof result.then==='function' ||
          result.sourceAId!==firstAtStart.sourceId ||
          result.sourceBId!==secondAtStart.sourceId ||
          !Number.isFinite(result.distanceM) || result.distanceM<0) return null;
      return result;
    } catch {return null;}
  };
  return Object.freeze({setContext,selectHit,measure,status,
    clear:()=>{clearPair();return status();}});
};
