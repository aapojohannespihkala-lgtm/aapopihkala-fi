/**
 * Temporary screenshot input on the exact 115/100 WORK_TEST scene.
 * It authenticates no pixels. The browser owner must independently check bytes
 * and run the four-target pixel gate on real before/after PNG captures.
 */
import { D1F_COMBINED_WALL_ASSETS } from './privateModelD1FCombinedWallSceneContract.mjs';
import { D1F_FOUR_PIXEL_TARGETS, D1F_PIXEL_SUPPRESSION } from './privateModelD1FFourTargetPixelGate.mjs';

const SOURCE_SHA = D1F_COMBINED_WALL_ASSETS['d1f-combined-wall-115-100-20261013'].sha256;
const MEASURED_SHA = D1F_COMBINED_WALL_ASSETS['d1f-measured-wall-140-100-2350-b710-basin-20261014'].sha256;
const FINISHED_SHA = D1F_COMBINED_WALL_ASSETS['d1f-finished-face-2360-wall-basin-20261014'].sha256;
const CORRECTED_SHA = D1F_COMBINED_WALL_ASSETS['d1f-four-review-corrections-20261014'].sha256;
const CORRECTED_SOURCE = 'G2_D1F_FOUR_USER_REVIEW_CORRECTIONS_20261014_2330';
const FINISHED_SOURCE = 'G2_D1F_KPH_FINISHED_FACE_2360_FOUR_HYPOTHESES_20261014_1600';
const BASIN = 'BASIN';
const BASIN_SOURCE = 'G2_D1F_KPH_BASIN_SOURCE_FACE_X3P888_WORK_TEST_20261014';
const reject = () => { throw new Error('D1F_SOURCE_PIXEL_RUNTIME_REJECTED'); };

/** @param {any} options */
export function createD1FCombinedWallPixelRuntime({ THREE, selected, sourceSha, camera, controls, canvas, render }) {
  const corrections = sourceSha === CORRECTED_SHA;
  const finished = sourceSha === FINISHED_SHA || corrections;
  const measured = sourceSha === MEASURED_SHA || finished;
  const west = finished && selected?.variant?.startsWith('WEST_');
  if (finished && !/^(WEST|EAST)_ANCHOR_(725_895_740|740_895_725)$/.test(selected?.variant ?? '')) reject();
  const indexCount = (west ? 480 : measured ? 396 : 216) + (corrections ? 60 : 0);
  const vertexCount = (west ? 256 : measured ? 240 : 200) + (corrections ? 16 : 0);
  if ((!measured && sourceSha !== SOURCE_SHA) || !camera?.isPerspectiveCamera ||
      selected?.wall?.userData?.sourceNodeIndex !== 798 ||
      selected.corners?.length !== 3 || !selected.scene) reject();
  selected.scene.updateMatrixWorld(true);
  const matches = [];
  selected.wall.traverse(object => {
    if (!object.isMesh || !object.geometry?.index) return;
    const index = object.geometry.index.array;
    const offsets = [];
    for (let i = 0; i < index.length; i += 3) {
      const tri = [index[i], index[i + 1], index[i + 2]];
      if (tri.some(v => v >= 128 && v <= 135)) {
        if (!tri.every(v => v >= 128 && v <= 135)) reject();
        offsets.push(i);
      }
    }
    if (offsets.length) matches.push({ mesh: object, offsets });
  });
  if (matches.length !== 1 || matches[0].offsets.length !== 12 ||
      matches[0].mesh.geometry.index.count !== indexCount ||
      matches[0].mesh.geometry.attributes.position.count !== vertexCount) reject();
  const i03 = matches[0];
  const sourceGeometry = i03.mesh.geometry;
  const sourceIndex = sourceGeometry.index.array;
  const exactVertices = [...new Set(i03.offsets.flatMap(i =>
    [sourceIndex[i], sourceIndex[i + 1], sourceIndex[i + 2]]))];
  if (exactVertices.length !== 8 || exactVertices.some(v => v < 128 || v > 135)) reject();
  const corners = new Map(selected.corners.map(c => [c.name, c.object]));
  for (const id of D1F_FOUR_PIXEL_TARGETS.slice(1)) {
    const object = corners.get(id);
    if (!object?.isMesh || object.parent !== selected.wall ||
        object.userData?.independentlyAddressableCorner !== id ||
        object.visible !== true) reject();
  }
  const counter = measured ? selected.counter : null;
  if (measured) {
    if (!selected.workTestOnly || !counter?.isMesh ||
        counter.parent !== selected.scene.children[0] || !counter.geometry?.index ||
        counter.geometry.index.count !== 36 ||
        counter.geometry.attributes.position?.count !== 24 || counter.visible !== true ||
        counter.userData?.logicalFixtureId !== 'D1F_KPH_BASIN_TOP_WORK_PROXY_01' ||
        counter.userData?.sourceRecord !== (corrections ? CORRECTED_SOURCE : finished ? FINISHED_SOURCE : BASIN_SOURCE) ||
        counter.userData?.sourceHostFaceXM !== 3.888 ||
        counter.userData?.finishedFloorWorkZM !== 0.08 ||
        counter.userData?.absoluteFaceSurveyVerified !== false ||
        counter.userData?.WORK_TEST_ONLY !== true || counter.userData?.current !== false ||
        counter.userData?.Canonical !== false || counter.userData?.asBuilt !== false ||
        counter.userData?.HUMAN_REVIEW !== 'NOT_RUN') reject();
    if (finished && (counter.userData?.workingHostFaceXM !== (west ? 3.888 : 3.906) ||
        counter.userData?.physicalFinishedFaceVerified !== false ||
        Math.abs(counter.position.x - (west ? 0 : 0.018)) > 1e-8 ||
        counter.position.y !== 0 || counter.position.z !== 0)) reject();
    const bounds = new THREE.Box3().setFromBufferAttribute(counter.geometry.attributes.position);
    const observed = [...bounds.min.toArray(), ...bounds.max.toArray()];
    const expected = [3.888, 2.737, corrections ? 0.885 : 0.925, 4.383, 3.762, 0.945];
    if (observed.some((value, i) => !Number.isFinite(value) ||
        Math.abs(value - expected[i]) > 0.00001) ||
        [...counter.geometry.index.array].some(i => i < 0 || i >= 24)) reject();
  }
  const indexedTargets = new Map([['I03', { offsets: i03.offsets, vertices: exactVertices }]]);
  const near = (a,b) => Number.isFinite(a) && Math.abs(a-b) <= 0.00001;
  if (corrections) {
    const base = west ? 256 : 240;
    for (const [id, vertices, count, declared] of [
      ['LOBBY_DOOR_REVEALS', [4,5,6,7,12,13,14,15].map(i=>i+base), 8,
        selected.wall.userData?.userReviewCorrections?.lobbyDoor?.revealFocusIndexOffsets],
      ['B_WALL_CONTINUITY', [200,201,202,203,204,205,206,207], 12,
        selected.wall.userData?.userReviewCorrections?.wallContinuity?.focusIndexOffsets],
    ]) {
      const allowed = new Set(vertices), offsets = [];
      for (let i=0;i<sourceIndex.length;i+=3)
        if ([sourceIndex[i],sourceIndex[i+1],sourceIndex[i+2]].every(v=>allowed.has(v))) offsets.push(i);
      if (offsets.length !== count || JSON.stringify(offsets) !== JSON.stringify(declared)) reject();
      indexedTargets.set(id, {offsets, vertices});
    }
  }
  const inspectCorrections = () => {
    if (!corrections || i03.mesh.geometry !== sourceGeometry) reject();
    const p = sourceGeometry.attributes.position;
    const boundsOf = vertices => new THREE.Box3().setFromPoints(vertices.map(i=>new THREE.Vector3().fromBufferAttribute(p,i)));
    const hole = boundsOf(indexedTargets.get('LOBBY_DOOR_REVEALS').vertices);
    const step = boundsOf(indexedTargets.get('B_WALL_CONTINUITY').vertices);
    const adjacent = boundsOf([208,209,210,211,212,213,214,215]);
    const slab = new THREE.Box3().setFromBufferAttribute(counter.geometry.attributes.position);
    const dc = west ? 6.248 : 6.266;
    const reference = dc - 0.250;
    let footprints = 0;
    selected.scene.traverse(o => { if(o.userData?.representationKind === 'referenceFootprint') footprints++; });
    const slabSize = slab.getSize(new THREE.Vector3());
    if (!near(hole.max.x-hole.min.x,.710) || !near(hole.max.z-hole.min.z,1.935) ||
        !near(hole.min.z,.080) || !near(hole.max.z,2.015) ||
        !near(reference-(hole.max.x+.030),1.180) ||
        !near(step.max.z,2.430) || !near(adjacent.max.z,2.430) ||
        !near(slabSize.x,.495) || !near(slabSize.y,1.025) || !near(slabSize.z,.060) ||
        !near(slab.max.z-.080,.865) || !near(4.457-slab.max.y,.695) || footprints !== 0) reject();
    return {state:'GEOMETRY_VERIFIED',gate:'PASS_FOUR_REPORTED_CORRECTIONS_IN_LOADED_GEOMETRY',
      glbSha256:sourceSha,variant:selected.variant,clearDoorWidthMm:710,clearDoorHeightMm:1935,
      outerDoorReferenceWidthMm:770,nearOuterDoorReferenceOffsetMm:1180,
      bWallTopMm:2430,bWallJointStepMm:0,counterThicknessMm:60,counterTopAboveKphFloorMm:865,
      reachableRoomFootprintCount:footprints,pixelsVerifiedByThisRuntime:false,humanReview:'NOT_RUN'};
  };
  if (corrections) inspectCorrections();
  const targets = [...(measured ? [...D1F_FOUR_PIXEL_TARGETS, BASIN] : D1F_FOUR_PIXEL_TARGETS),
    ...(corrections ? ['LOBBY_DOOR_REVEALS','B_WALL_CONTINUITY'] : [])];
  const original = {
    position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone(),
    aspect: camera.aspect, fov: camera.fov, near: camera.near, far: camera.far,
    target: controls.target.clone(), enabled: controls.enabled, damping: controls.enableDamping,
    autoRotate: controls.autoRotate,
  };
  let prepared = null;
  let lockedPose = null;
  let hidden = null;
  let maskedGeometry = null;
  let disposed = false;
  const fingerprint = () => {
    camera.updateMatrixWorld(true);
    return JSON.stringify({ projection: camera.projectionMatrix.toArray(), pose: camera.matrixWorld.toArray() });
  };
  const pinFrame = () => {
    if (disposed || !lockedPose) return;
    camera.position.copy(lockedPose.position);
    camera.quaternion.copy(lockedPose.quaternion);
    camera.up.copy(lockedPose.up);
    camera.projectionMatrix.copy(lockedPose.projection);
    camera.projectionMatrixInverse.copy(lockedPose.projectionInverse);
    camera.aspect = lockedPose.aspect;
    camera.fov = lockedPose.fov;
    camera.updateMatrixWorld(true);
  };
  const restoreTarget = () => {
    if (indexedTargets.has(hidden)) {
      i03.mesh.geometry = sourceGeometry;
      maskedGeometry?.dispose();
      maskedGeometry = null;
    } else if (hidden === BASIN) {
      counter.visible = true;
    } else if (hidden) {
      corners.get(hidden).visible = true;
    }
    hidden = null;
    render();
    return i03.mesh.geometry === sourceGeometry &&
      [...corners.values()].every(o => o.visible === true) &&
      (!measured || counter.visible === true);
  };
  const exactPoints = id => {
    const object = indexedTargets.has(id) ? i03.mesh : id === BASIN ? counter : corners.get(id);
    if (!object?.visible || !object.geometry?.attributes.position) reject();
    object.updateWorldMatrix(true, false);
    const vertices = indexedTargets.has(id) ? indexedTargets.get(id).vertices
      : [...new Set(Array.from(object.geometry.index.array))];
    return vertices.map(i => new THREE.Vector3().fromBufferAttribute(
      object.geometry.attributes.position, i).applyMatrix4(object.matrixWorld));
  };
  const prepare = (targetId, viewIndex = 0) => {
    if (disposed || !targets.includes(targetId) ||
        !Number.isInteger(viewIndex) || viewIndex < 0 || viewIndex > 3) reject();
    if (!restoreTarget()) reject();
    const points = exactPoints(targetId);
    const bounds = new THREE.Box3().setFromPoints(points);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (![...size.toArray(), ...center.toArray()].every(Number.isFinite) ||
        (targetId === BASIN ? (size.y < 0.01 || size.y > (corrections ? 0.07 : 0.05)) :
          targetId === 'LOBBY_DOOR_REVEALS' ? !near(size.y,1.935) : size.y < 2)) reject();
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width), height = Math.round(rect.height);
    if (width < 320 || height < 320) reject();
    const dirs = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
    const [dx, dz] = dirs[viewIndex];
    // Source-locked interior I03 view for the finished-face WORK_TEST only.
    // The earlier exterior diagonal views can be occluded by the source wall
    // itself; the independent offline ray and VTK checks used the room side
    // at world +Z, 1.71 m from the exact indexed I03 bounds center.
    // Keep views 1..3 and all other targets on the existing camera path.
    const interiorI03 = finished && targetId === 'I03' && viewIndex === 0;
    camera.aspect = width / height;
    const interiorDoor = corrections && targetId === 'LOBBY_DOOR_REVEALS' && viewIndex === 0;
    const reportedStepView = corrections && targetId === 'B_WALL_CONTINUITY' && viewIndex === 0;
    camera.fov = interiorI03 || interiorDoor ? 80 : reportedStepView ? 38 : original.fov;
    // Use the FOV of this view, not the previous prepared view. Otherwise
    // switching from the 80-degree interior view to 38-degree exterior views
    // places the camera too close and clips the exact source-derived ROI.
    const distance = Math.max(size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.3,
      Math.max(size.x, size.z) * 2.8);
    if (interiorI03) {
      camera.position.copy(center).add(new THREE.Vector3(0, 0, 1.71));
    } else if (interiorDoor) {
      camera.position.set(center.x - 0.20, 1.30, -3.55);
    } else if (reportedStepView) {
      camera.position.set(1.73,7.70,-4.31);
    } else {
      camera.position.copy(center).add(new THREE.Vector3(dx, targetId === BASIN ? 1.5 : 0.22, dz).normalize().multiplyScalar(distance));
    }
    camera.up.set(0, 1, 0);
    controls.enableDamping = false; controls.autoRotate = false; controls.enabled = false;
    controls.target.copy(center);
    controls.update(); controls.update();
    camera.lookAt(center);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    const projected = points.map(p => p.clone().project(camera));
    if (projected.some(p => ![p.x, p.y, p.z].every(Number.isFinite) || p.z < -1 || p.z > 1)) reject();
    const xs = projected.map(p => (p.x + 1) * width / 2);
    const ys = projected.map(p => (1 - p.y) * height / 2);
    const x = Math.floor(Math.min(...xs)) - 3, y = Math.floor(Math.min(...ys)) - 3;
    const right = Math.ceil(Math.max(...xs)) + 3, bottom = Math.ceil(Math.max(...ys)) + 3;
    if (x < 0 || y < 0 || right > width || bottom > height || right - x < 8 || bottom - y < 8) reject();
    lockedPose = {
      position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone(),
      aspect: camera.aspect, fov: camera.fov, projection: camera.projectionMatrix.clone(),
      projectionInverse: camera.projectionMatrixInverse.clone(),
    };
    prepared = {
      targetId, viewIndex, width, height, roi: { x, y, width: right - x, height: bottom - y },
      cameraFingerprint: fingerprint(), glbSha256: sourceSha, variant: selected.variant,
      suppressionMethod: targetId === BASIN ? 'BASIN_NODE_VISIBILITY_ONLY' : D1F_PIXEL_SUPPRESSION[targetId],
      roiProvenance: 'PROJECTED_EXACT_TARGET_GEOMETRY', targetIdentityVerified: true,
      sourceI03Indices: { count: 36, sourceVertices: [128, 135], offsets: [...i03.offsets] },
      ...(indexedTargets.has(targetId) ? {sourceTargetIndices: {
        count: indexedTargets.get(targetId).offsets.length*3,
        sourceVertices:[...indexedTargets.get(targetId).vertices].sort((a,b)=>a-b),
        offsets:[...indexedTargets.get(targetId).offsets]}} : {}),
      pixelsVerifiedByThisRuntime: false, humanReview: 'NOT_RUN',
    };
    render();
    return { ...prepared, state: 'PREPARED' };
  };
  const suppress = targetId => {
    if (disposed || !prepared || prepared.targetId !== targetId || hidden ||
        fingerprint() !== prepared.cameraFingerprint) reject();
    if (indexedTargets.has(targetId)) {
      const target = indexedTargets.get(targetId);
      const removed = new Set(target.offsets);
      const keep = [];
      for (let i = 0; i < sourceIndex.length; i += 3)
        if (!removed.has(i)) keep.push(sourceIndex[i], sourceIndex[i + 1], sourceIndex[i + 2]);
      if (keep.length !== indexCount - target.offsets.length*3 || i03.mesh.visible !== true) reject();
      maskedGeometry = sourceGeometry.clone(); maskedGeometry.setIndex(keep);
      i03.mesh.geometry = maskedGeometry;
    } else if (targetId === BASIN) {
      counter.visible = false;
    } else {
      corners.get(targetId).visible = false;
    }
    hidden = targetId;
    render();
    return { ...prepared, state: 'SUPPRESSED' };
  };
  const restore = () => {
    if (disposed || !prepared) reject();
    const restored = restoreTarget();
    if (!restored || fingerprint() !== prepared.cameraFingerprint) reject();
    return { ...prepared, state: 'RESTORED', suppressionRestored: true };
  };
  const dispose = () => {
    if (disposed) return;
    lockedPose = null;
    restoreTarget();
    camera.position.copy(original.position); camera.quaternion.copy(original.quaternion); camera.up.copy(original.up);
    Object.assign(camera, { aspect: original.aspect, fov: original.fov, near: original.near, far: original.far });
    controls.target.copy(original.target); controls.enabled = original.enabled;
    controls.enableDamping = original.damping; controls.autoRotate = original.autoRotate;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    disposed = true; render();
  };
  return Object.freeze({ prepare, suppress, restore, dispose, pinFrame, inspectCorrections });
}
