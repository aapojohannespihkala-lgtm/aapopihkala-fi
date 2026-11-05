import { Matrix4, Mesh, Raycaster, Vector2, Vector3, type Camera, type Material, type Object3D } from 'three';
import { collectViewerLayerSourceNodes } from './privateModelLayersRuntime';
import { resolveV69P12R1SourceContext } from './privateModelC80R2V69P12R1LayerSourceProfile.mjs';

const SHA = 'd39102890470f59d7c2a2e033851a6f3d1481a83fb6180b549acd4cbf22182b3';
const TARGETS = [{ node: 8028, mesh: 2461 }, { node: 8030, mesh: 2462 }];

const materials = (mesh: Mesh) => Array.isArray(mesh.material) ? mesh.material : [mesh.material];
const state = (material: Material) => ({ opacity: material.opacity, transparent: material.transparent,
  depthTest: material.depthTest, depthWrite: material.depthWrite, colorWrite: material.colorWrite,
  visible: material.visible });

/** Read-only observation of the live source, camera and ray intersections.
 * It never changes visibility/materials or claims that a ray hit proves pixels.
 * The protected browser test independently compares actual screenshots.
 */
export function observeC008Depth(args: {
  source: any; root: Object3D; sceneIndex: number; loadedSha: string | null;
  expectedSha: string | null; camera: Camera; width: number; height: number;
}) {
  const { source, root, sceneIndex, camera, width, height } = args;
  const json = source?.parser?.json;
  if (args.loadedSha !== SHA || args.expectedSha !== SHA || json?.scenes?.length !== 295 ||
      ![293, 294].includes(sceneIndex) || source?.scenes?.[sceneIndex] !== root ||
      width <= 0 || height <= 0) return null;
  const nodes = collectViewerLayerSourceNodes(source, root, sceneIndex, SHA);
  const targets = TARGETS.map(target => {
    const matches = nodes.filter(node => node.nodeIndex === target.node && node.meshIndex === target.mesh &&
      (node.object as Mesh).isMesh && json.nodes[target.node]?.mesh === target.mesh);
    const primitives = json.meshes?.[target.mesh]?.primitives;
    if (matches.length !== 1 || primitives?.length !== 1 || primitives[0].material !== 453 ||
        (json.materials?.[453]?.alphaMode ?? 'OPAQUE') !== 'OPAQUE') return null;
    return { ...target, record: matches[0], object: matches[0].object as Mesh };
  });
  if (targets.some(target => !target)) return null;
  root.updateWorldMatrix(true, true);
  camera.updateWorldMatrix(true, false);
  const sourceIds = new Map(nodes.map(node => [node.object, node.nodeIndex]));
  const nodeId = (object: Object3D): number | null => {
    for (let current: Object3D | null = object; current && current !== root; current = current.parent)
      if (sourceIds.has(current)) return sourceIds.get(current)!;
    return null;
  };
  const visibleMeshes: Mesh[] = [];
  root.traverseVisible(object => { if ((object as Mesh).isMesh) visibleMeshes.push(object as Mesh); });
  const raycaster = new Raycaster();
  const viewProjection = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  const doors = targets.map(target => {
    const { object, record } = target!;
    const position = object.geometry.getAttribute('position');
    const index = object.geometry.getIndex();
    const count = index?.count ?? position.count;
    const samples = [];
    const pixels = new Set<string>();
    for (let start = 0; start < count; start += 3) {
      const point = new Vector3();
      for (let offset = 0; offset < 3; offset++) point.add(new Vector3().fromBufferAttribute(
        position, index ? index.getX(start + offset) : start + offset));
      point.multiplyScalar(1 / 3).applyMatrix4(object.matrixWorld);
      const ndc = point.clone().applyMatrix4(viewProjection);
      if (Math.abs(ndc.x) > .98 || Math.abs(ndc.y) > .95 || Math.abs(ndc.z) > 1) continue;
      const pixel = { x: (ndc.x + 1) * width / 2, y: (1 - ndc.y) * height / 2 };
      const key = `${Math.round(pixel.x)},${Math.round(pixel.y)}`;
      if (pixels.has(key)) continue;
      pixels.add(key);
      raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera);
      const hits = raycaster.intersectObjects(visibleMeshes, false).filter(hit => {
        const mesh = hit.object as Mesh;
        const material = materials(mesh)[hit.face?.materialIndex ?? 0];
        if (!material?.visible || !material.colorWrite || material.opacity <= 0) return false;
        const planes = material.clippingPlanes;
        return !planes?.length || !(material.clipIntersection
          ? planes.every(plane => plane.distanceToPoint(hit.point) > 0)
          : planes.some(plane => plane.distanceToPoint(hit.point) > 0));
      });
      // Transparent faces can tint the door, but do not define opaque depth.
      const opaque = hits.find(hit => {
        const material = materials(hit.object as Mesh)[hit.face?.materialIndex ?? 0];
        return !material.transparent && material.opacity >= .999 && material.depthTest && material.depthWrite;
      });
      samples.push({ ...pixel, point: point.toArray(), targetDistance: raycaster.ray.origin.distanceTo(point),
        frontDistance: opaque?.distance ?? null, frontNode: opaque ? nodeId(opaque.object) : null,
        hits: hits.slice(0, 4).map(hit => ({ node: nodeId(hit.object), distance: hit.distance,
          material: state(materials(hit.object as Mesh)[hit.face?.materialIndex ?? 0]) })) });
    }
    const ancestorOrders = [];
    let visible = true;
    for (let current: Object3D | null = object; current; current = current.parent) {
      visible = visible && current.visible;
      ancestorOrders.push(current.renderOrder);
      if (current === root) break;
    }
    return { node: target!.node, mesh: target!.mesh, parent: record.parentNodeIndex,
      sourceLinks: json.nodes[target!.node].extras?.sourceLinks ?? [],
      name: record.nodeName, visible, material: materials(object).map(state),
      renderOrder: object.renderOrder, ancestorOrders, samples };
  });
  const context = resolveV69P12R1SourceContext(source, root, sceneIndex, args.loadedSha, args.expectedSha);
  const sourceContext = context ? { rootNode: context.node, enabled: context.root.visible,
    nodes: context.parts.map(({ node }) => node),
    mountedNodes: context.parts.filter(({ object }) => object !== null).map(({ node }) => node),
    visibleNodes: context.parts.filter(({ object }) => root.visible && context.root.visible && object?.visible)
      .map(({ node }) => node),
  } : null;
  return { sourceSha256: SHA, sceneIndex, width, height, doors, sourceContext,
    camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(),
      projection: camera.projectionMatrix.toArray() }, humanReview: 'NOT_RUN' };
}
