/**
 * Temporary screenshot input for exact old 115/100 or measured 140/100 with basin WORK_TEST scene.
 * It authenticates no pixels. The browser owner must independently check bytes
 * and run independent source-target pixel gates on real before/after PNG captures.
 */
import { D1F_COMBINED_WALL_ASSETS } from './privateModelD1FCombinedWallSceneContract.mjs';
import { D1F_FOUR_PIXEL_TARGETS, D1F_PIXEL_SUPPRESSION } from './privateModelD1FFourTargetPixelGate.mjs';

const OLD_SOURCE_SHA = D1F_COMBINED_WALL_ASSETS['d1f-combined-wall-115-100-20261013'].sha256;
const MEASURED_SOURCE_SHA = D1F_COMBINED_WALL_ASSETS['d1f-measured-wall-140-100-2350-b710-basin-20261014'].sha256;
const BASIN_TARGET = 'BASIN';
const BASIN_RECORD = 'G2_D1F_KPH_BASIN_SOURCE_FACE_X3P888_WORK_TEST_20261014';
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= 0.00002;
const reject = () => { throw new Error('D1F_SOURCE_PIXEL_RUNTIME_REJECTED'); };

/** @param {any} options */
export function createD1FCombinedWallPixelRuntime({ THREE, selected, sourceSha, camera, controls, canvas, render }) {
  const measured = sourceSha === MEASURED_SOURCE_SHA;
  if ((!measured && sourceSha !== OLD_SOURCE_SHA) || !camera?.isPerspectiveCamera ||
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
      matches[0].mesh.geometry.index.count !== (measured ? 396 : 216) ||
      matches[0].mesh.geometry.attributes.position.count !== (measured ? 240 : 200)) reject();
  const i03 = matches[0];
  const sourceGeometry = i03.mesh.geometry;
  const sourceIndex = sourceGeometry.index.array;
  const exactVertices = [...new Set(i03.offsets.flatMap(i =>
    [sourceIndex[i], sourceIndex[i + 1], sourceIndex[i + 2]]))];
  if (exactVertices.length !== 8 || exactVertices.some(v => v < 128 || v > 135)) reject();
  const corners = new Map(selected.corners.map(c => [c.name, c.object]));
  const basin = measured ? selected.counter : null;
  if (measured) {
    if (!basin?.isMesh || basin.parent !== selected.scene.children[0] || basin.visible !== true ||
        basin.userData?.logicalFixtureId !== 'D1F_KPH_BASIN_TOP_WORK_PROXY_01' ||
        basin.userData?.sourceRecord !== BASIN_RECORD ||
        basin.userData?.WORK_TEST_ONLY !== true ||
        basin.userData?.current !== false || basin.userData?.Canonical !== false ||
        basin.userData?.asBuilt !== false || basin.userData?.HUMAN_REVIEW !== 'NOT_RUN' ||
        basin.userData?.absoluteFaceSurveyVerified !== false ||
        basin.userData?.physicalAbsoluteXYZVerified !== false ||
        basin.geometry.index?.count !== 36 ||
        basin.geometry.attributes.position?.count !== 24) reject();
    basin.geometry.computeBoundingBox();
    const bound = basin.geometry.boundingBox;
    if (!bound || ![3.888, 2.737, 0.925].every((n, i) => close(bound.min.getComponent(i), n)) ||
        ![4.383, 3.762, 0.945].every((n, i) => close(bound.max.getComponent(i), n))) reject();
  } else if (selected.counter) reject();
  const pixelTargets = measured ? [...D1F_FOUR_PIXEL_TARGETS, BASIN_TARGET] : D1F_FOUR_PIXEL_TARGETS;
  for (const id of D1F_FOUR_PIXEL_TARGETS.slice(1)) {
    const object = corners.get(id);
    if (!object?.isMesh || object.parent !== selected.wall ||
        object.userData?.independentlyAddressableCorner !== id ||
        object.visible !== true) reject();
  }
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
    camera.updateMatrixWorld(true);
  };
  const restoreTarget = () => {
    if (hidden === 'I03') {
      i03.mesh.geometry = sourceGeometry;
      maskedGeometry?.dispose();
      maskedGeometry = null;
    } else if (hidden === BASIN_TARGET) {
      basin.visible = true;
    } else if (hidden) {
      corners.get(hidden).visible = true;
    }
    hidden = null;
    render();
    return i03.mesh.geometry === sourceGeometry &&
      [...corners.values()].every(o => o.visible === true) &&
      (!measured || basin.visible === true);
  };
  const exactPoints = id => {
    const object = id === 'I03' ? i03.mesh : id === BASIN_TARGET ? basin : corners.get(id);
    if (!object?.visible || !object.geometry?.attributes.position) reject();
    object.updateWorldMatrix(true, false);
    const vertices = id === 'I03' ? exactVertices
      : [...new Set(Array.from(object.geometry.index.array))];
    return vertices.map(i => new THREE.Vector3().fromBufferAttribute(
      object.geometry.attributes.position, i).applyMatrix4(object.matrixWorld));
  };
  const prepare = (targetId, viewIndex = 0) => {
    if (disposed || !pixelTargets.includes(targetId) ||
        !Number.isInteger(viewIndex) || viewIndex < 0 || viewIndex > 3) reject();
    if (!restoreTarget()) reject();
    const points = exactPoints(targetId);
    const bounds = new THREE.Box3().setFromPoints(points);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (![...size.toArray(), ...center.toArray()].every(Number.isFinite) ||
        (targetId === BASIN_TARGET
          ? !(size.x > 0.49 && size.y > 0.015 && size.z > 0.49)
          : size.y < 2)) reject();
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width), height = Math.round(rect.height);
    if (width < 320 || height < 320) reject();
    const dirs = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
    const distance = Math.max(size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.3,
      Math.max(size.x, size.z) * 2.8);
    const [dx, dz] = dirs[viewIndex];
    camera.aspect = width / height;
    camera.position.copy(center).add(new THREE.Vector3(dx, 0.22, dz).normalize().multiplyScalar(distance));
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
      aspect: camera.aspect, projection: camera.projectionMatrix.clone(),
      projectionInverse: camera.projectionMatrixInverse.clone(),
    };
    prepared = {
      targetId, viewIndex, width, height, roi: { x, y, width: right - x, height: bottom - y },
      cameraFingerprint: fingerprint(), glbSha256: sourceSha, variant: selected.variant,
      suppressionMethod: targetId === BASIN_TARGET ? 'SOURCE_COUNTER_NODE_VISIBILITY_ONLY' : D1F_PIXEL_SUPPRESSION[targetId],
      roiProvenance: 'PROJECTED_EXACT_TARGET_GEOMETRY', targetIdentityVerified: true,
      sourceI03Indices: { count: 36, sourceVertices: [128, 135], offsets: [...i03.offsets] },
      pixelsVerifiedByThisRuntime: false, humanReview: 'NOT_RUN',
    };
    render();
    return { ...prepared, state: 'PREPARED' };
  };
  const suppress = targetId => {
    if (disposed || !prepared || prepared.targetId !== targetId || hidden ||
        fingerprint() !== prepared.cameraFingerprint) reject();
    if (targetId === 'I03') {
      const removed = new Set(i03.offsets);
      const keep = [];
      for (let i = 0; i < sourceIndex.length; i += 3)
        if (!removed.has(i)) keep.push(sourceIndex[i], sourceIndex[i + 1], sourceIndex[i + 2]);
      if (keep.length !== (measured ? 360 : 180) || i03.mesh.visible !== true) reject();
      maskedGeometry = sourceGeometry.clone(); maskedGeometry.setIndex(keep);
      i03.mesh.geometry = maskedGeometry;
    } else if (targetId === BASIN_TARGET) {
      basin.visible = false;
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
  return Object.freeze({ prepare, suppress, restore, dispose, pinFrame });
}
