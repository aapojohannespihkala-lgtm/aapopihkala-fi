import { expect, test } from '@playwright/test';
import { BoxGeometry, BufferGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, Plane, Points, PointsMaterial, Raycaster, Vector3 } from 'three';
import { createViewerLayerGhostPresentation } from '../../src/scripts/privateModelLayerGhostPresentation';

const makeMesh = (material = new MeshBasicMaterial()) =>
  new Mesh(new BoxGeometry(1, 1, 1), material);

test('opaque ghost is copy-on-write and restores exact source material, raycast and order', () => {
  const source = new MeshBasicMaterial({ color: 0x334455 });
  const mesh = makeMesh(source);
  const root = new Group();
  root.add(mesh);
  mesh.renderOrder = 7;
  const originalRaycast = mesh.raycast;
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('ghost', { opacity: 0.17 })).toBe('ghost');
  expect(mesh.material).not.toBe(source);
  const ghost = mesh.material as MeshBasicMaterial;
  expect(ghost.transparent).toBe(true);
  expect(ghost.opacity).toBeCloseTo(0.17);
  expect(ghost.depthWrite).toBe(false);
  expect(ghost.polygonOffset).toBe(true);
  expect(mesh.renderOrder).toBe(8);
  expect(source.transparent).toBe(false);
  expect(source.opacity).toBe(1);
  expect(mesh.raycast).not.toBe(originalRaycast);

  expect(adapter.apply('visible')).toBe('visible');
  expect(mesh.material).toBe(source);
  expect(mesh.renderOrder).toBe(7);
  expect(mesh.raycast).toBe(originalRaycast);
  expect(root.visible).toBe(true);
  adapter.dispose();
});

test('transparent source materials use non-pickable edges, not stacked alpha faces', () => {
  const original = new MeshBasicMaterial({ transparent: true, opacity: 0.3 });
  const mesh = makeMesh(original);
  const root = new Group();
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);
  adapter.apply('ghost');

  expect((mesh.material as MeshBasicMaterial).visible).toBe(false);
  expect(mesh.children).toHaveLength(1);
  expect(mesh.children[0].name).toBe('__VIEWER_GHOST_EDGES_PRESENTATION_ONLY__');
  expect(original.visible).toBe(true);

  const picks = [] as Array<{ distance: number }>;
  mesh.raycast(new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1)), picks as never);
  expect(picks).toHaveLength(0);
  adapter.apply('ghost');
  expect(mesh.children).toHaveLength(1);
  adapter.reset();
  expect(mesh.children).toHaveLength(0);
  expect(mesh.material).toBe(original);
  adapter.dispose();
});

test('ghost outline honors the transparent source clipping planes and clipIntersection', () => {
  const source = new MeshBasicMaterial({ transparent: true, opacity: 0.3 });
  const sourceClip = [new Plane(new Vector3(0, 1, 0), -0.4)];
  source.clippingPlanes = sourceClip;
  source.clipIntersection = true;
  const root = new Group();
  const mesh = makeMesh(source);
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('ghost')).toBe('ghost');
  expect(mesh.children).toHaveLength(1);
  const outline = mesh.children[0] as LineSegments;
  const outlineMaterial = outline.material as LineBasicMaterial;
  expect(outlineMaterial.clippingPlanes).toBe(sourceClip);
  expect(outlineMaterial.clipIntersection).toBe(true);
  expect(outlineMaterial).not.toBe(source);
  expect(source.clippingPlanes).toBe(sourceClip);
  expect(source.clipIntersection).toBe(true);
  expect(outline.raycast(new Raycaster(), [] as never)).toBeUndefined();

  adapter.apply('visible');
  expect(mesh.children).toHaveLength(0);
  expect(mesh.material).toBe(source);
  expect(source.clippingPlanes).toBe(sourceClip);
  adapter.dispose();
});

test('different source material clipping rules cannot create an exposing whole-mesh outline', () => {
  const first = new MeshBasicMaterial({ transparent: true, opacity: 0.3 });
  const second = new MeshBasicMaterial({ transparent: true, opacity: 0.3 });
  first.clippingPlanes = [new Plane(new Vector3(0, 1, 0), 0)];
  second.clippingPlanes = [new Plane(new Vector3(1, 0, 0), 0)];
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), [first, second]);
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('ghost')).toBe('ghost');
  expect(mesh.children).toHaveLength(0); // no unclipped helper can reveal masked faces
  expect(mesh.material).not.toBe([first, second]);
  expect((mesh.material as MeshBasicMaterial[]).every(m => !m.visible)).toBe(true);
  adapter.reset();
  expect(mesh.material).toEqual([first, second]);
  expect(mesh.children).toHaveLength(0);
  expect(first.clippingPlanes).toHaveLength(1);
  expect(second.clippingPlanes).toHaveLength(1);
  adapter.dispose();
});

test('scope and hidden take priority; original hidden descendants stay hidden', () => {
  const root = new Group();
  const shown = makeMesh();
  const previouslyHidden = makeMesh();
  previouslyHidden.visible = false;
  root.add(shown, previouslyHidden);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('visible', { scopeAllowed: false })).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(adapter.apply('ghost', { scopeAllowed: false })).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(adapter.apply('hidden')).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(adapter.apply('visible', { scopeAllowed: true })).toBe('visible');
  expect(root.visible).toBe(true);
  expect(previouslyHidden.visible).toBe(false);
  const hiddenMaterial = previouslyHidden.material;
  adapter.apply('ghost');
  expect(previouslyHidden.material).toBe(hiddenMaterial);
  adapter.dispose();
});

test('ghost ignores hidden Group descendants and preserves visible sibling', () => {
  const root = new Group();
  const visible = makeMesh();
  const visibleMaterial = visible.material;
  const visibleRaycast = visible.raycast;
  const hiddenGroup = new Group();
  hiddenGroup.visible = false;
  const hiddenMaterial = new MeshBasicMaterial();
  let hiddenClones = 0;
  hiddenMaterial.clone = () => {
    hiddenClones++;
    throw new Error('invisible material must not be cloned');
  };
  const hiddenMesh = makeMesh(hiddenMaterial);
  const hiddenRaycast = hiddenMesh.raycast;
  hiddenGroup.add(hiddenMesh);
  root.add(visible, hiddenGroup);
  const adapter = createViewerLayerGhostPresentation(root);

  // Neither the selection callback nor material cloning should see an object
  // under an invisible ancestor, even when the leaf's own visible flag is true.
  expect(adapter.apply('ghost', {
    isSelected: object => {
      if (object === hiddenMesh) throw new Error('invisible object selected');
      return false;
    },
  })).toBe('ghost');
  expect(root.visible).toBe(true);
  expect(visible.material).not.toBe(visibleMaterial);
  expect(visible.raycast).not.toBe(visibleRaycast);
  expect(hiddenGroup.visible).toBe(false);
  expect(hiddenMesh.material).toBe(hiddenMaterial);
  expect(hiddenMesh.raycast).toBe(hiddenRaycast);

  expect(adapter.apply('ghost')).toBe('ghost');
  expect(hiddenClones).toBe(0);
  expect(hiddenMesh.material).toBe(hiddenMaterial);
  adapter.apply('visible');
  expect(visible.material).toBe(visibleMaterial);
  expect(visible.raycast).toBe(visibleRaycast);
  expect(hiddenGroup.visible).toBe(false);
  adapter.dispose();
});

test('one scene root never mutates another scene even with shared source material', () => {
  const source = new MeshBasicMaterial({ color: 0x556677 });
  const scene1 = new Group();
  const scene2 = new Group();
  const first = makeMesh(source);
  const second = makeMesh(source);
  scene1.add(first);
  scene2.add(second);
  const adapter = createViewerLayerGhostPresentation(scene1);

  adapter.apply('ghost', { preferEdges: true });
  expect(first.material).not.toBe(source);
  expect(second.material).toBe(source);
  expect(second.visible).toBe(true);
  expect(second.children).toHaveLength(0);
  adapter.apply('hidden');
  expect(scene1.visible).toBe(false);
  expect(scene2.visible).toBe(true);
  adapter.dispose();
  expect(first.material).toBe(source);
});

test('selected material and picking are preserved, while other meshes ghost', () => {
  const root = new Group();
  const selected = makeMesh();
  const other = makeMesh();
  root.add(selected, other);
  const selectedRaycast = selected.raycast;
  const selectedMaterial = selected.material;
  const otherMaterial = other.material;
  const adapter = createViewerLayerGhostPresentation(root);

  adapter.apply('ghost', { isSelected: (mesh) => mesh === selected });
  expect(selected.material).toBe(selectedMaterial);
  expect(selected.raycast).toBe(selectedRaycast);
  expect(other.material).not.toBe(otherMaterial);
  adapter.dispose();
});

test('selected technical line and point retain source appearance and picking when peers ghost', () => {
  const positions = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0), new Vector3(1, 0, 0),
  ]);
  const selectedLineMaterial = new LineBasicMaterial({ color: 0x225577 });
  const selectedPointMaterial = new PointsMaterial({ color: 0x447799, size: 0.05 });
  const peerMaterial = new LineBasicMaterial({ color: 0x8899aa });
  const selectedLine = new LineSegments(positions, selectedLineMaterial);
  const selectedPoint = new Points(positions, selectedPointMaterial);
  const peer = new LineSegments(positions, peerMaterial);
  const lineRaycast = selectedLine.raycast;
  const pointRaycast = selectedPoint.raycast;
  const peerRaycast = peer.raycast;
  const root = new Group();
  root.add(selectedLine, selectedPoint, peer);
  const adapter = createViewerLayerGhostPresentation(root);

  adapter.apply('ghost', {
    opacity: 0.16,
    isSelected: object => object === selectedLine || object === selectedPoint,
  });
  expect(selectedLine.material).toBe(selectedLineMaterial);
  expect(selectedPoint.material).toBe(selectedPointMaterial);
  expect(selectedLine.raycast).toBe(lineRaycast);
  expect(selectedPoint.raycast).toBe(pointRaycast);
  expect(selectedLineMaterial.opacity).toBe(1);
  expect(selectedPointMaterial.opacity).toBe(1);
  expect(peer.material).not.toBe(peerMaterial);
  expect((peer.material as LineBasicMaterial).opacity).toBeCloseTo(0.16);
  expect(peer.raycast).not.toBe(peerRaycast);

  // Re-applying after a selection change must restore the previously ghosted
  // source without letting the old selection retain full strength.
  adapter.apply('ghost', {
    opacity: 0.16,
    isSelected: object => object === peer,
  });
  expect(peer.material).toBe(peerMaterial);
  expect(peer.raycast).toBe(peerRaycast);
  expect(selectedLine.material).not.toBe(selectedLineMaterial);
  expect(selectedPoint.material).not.toBe(selectedPointMaterial);

  adapter.apply('visible');
  expect(peer.material).toBe(peerMaterial);
  expect(peer.raycast).toBe(peerRaycast);
  expect(selectedLine.material).toBe(selectedLineMaterial);
  expect(selectedPoint.material).toBe(selectedPointMaterial);

  // Scope denial must override even a selected source object. Hidden routes
  // cannot remain ghosted or pickable through a stale selection.
  expect(adapter.apply('ghost', {
    scopeAllowed: false,
    isSelected: object => object === selectedLine || object === selectedPoint,
  })).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(selectedLine.material).toBe(selectedLineMaterial);
  expect(selectedPoint.material).toBe(selectedPointMaterial);
  expect(peer.material).toBe(peerMaterial);
  expect(adapter.apply('visible', { scopeAllowed: true })).toBe('visible');
  expect(root.visible).toBe(true);
  adapter.dispose();
});

test('multi-material mesh is restored exactly and repeat reset/dispose is harmless', () => {
  const originals = [new MeshBasicMaterial(), new MeshBasicMaterial()];
  const root = new Group();
  const mesh = new Mesh(new BoxGeometry(1, 1, 1), originals);
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);

  adapter.apply('ghost');
  const clones = mesh.material;
  expect(clones).toHaveLength(2);
  expect(clones[0]).not.toBe(originals[0]);
  expect(clones[1]).not.toBe(originals[1]);
  adapter.reset();
  expect(mesh.material).toBe(originals);
  adapter.dispose();
  adapter.dispose();
  expect(mesh.material).toBe(originals);
  expect(() => adapter.apply('visible')).toThrow(/disposed/);
});

test('originally hidden root is never shown by a preset', () => {
  const root = new Group();
  root.visible = false;
  root.add(makeMesh());
  const adapter = createViewerLayerGhostPresentation(root);
  expect(adapter.apply('visible')).toBe('visible');
  expect(root.visible).toBe(false);
  adapter.apply('ghost');
  expect(root.visible).toBe(false);
  adapter.reset();
  expect(root.visible).toBe(false);
});


test('ghost selection callback failure cannot reveal hidden scoped root', () => {
  const root = new Group();
  const source = new MeshBasicMaterial();
  const mesh = makeMesh(source);
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);
  adapter.apply('hidden');
  expect(root.visible).toBe(false);
  expect(() => adapter.apply('ghost', { isSelected: () => { throw new Error('selection unavailable'); } }))
    .toThrow('selection unavailable');
  expect(root.visible).toBe(false);
  expect(mesh.material).toBe(source);
  expect(mesh.children).toHaveLength(0);
  expect(adapter.apply('visible', { scopeAllowed: true })).toBe('visible');
  adapter.dispose();
});

test('late ghost material clone failure rolls back earlier meshes and hides root', () => {
  const firstSource = new MeshBasicMaterial({ color: 0x112233 });
  const badSource = new MeshBasicMaterial({ color: 0x445566 });
  badSource.clone = () => { throw new Error('material clone failed'); };
  const first = makeMesh(firstSource);
  const second = makeMesh(badSource);
  const firstRaycast = first.raycast;
  const root = new Group();
  root.add(first, second);
  const adapter = createViewerLayerGhostPresentation(root);
  expect(() => adapter.apply('ghost')).toThrow('material clone failed');
  expect(root.visible).toBe(false);
  expect(first.material).toBe(firstSource);
  expect(second.material).toBe(badSource);
  expect(first.raycast).toBe(firstRaycast);
  expect(first.children).toHaveLength(0);
  expect(adapter.apply('hidden')).toBe('hidden');
  adapter.dispose();
});

test('source LineSegments and Points are ghosted reversibly without changing sibling sources', () => {
  const lineMaterial = new LineBasicMaterial({ color: 0x224466 });
  const pointMaterial = new PointsMaterial({ color: 0x778899, size: 0.05 });
  const positions = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0), new Vector3(1, 0, 0),
  ]);
  const route = new LineSegments(positions, lineMaterial);
  const markers = new Points(positions, pointMaterial);
  const sibling = new LineSegments(positions, lineMaterial);
  const sourceRouteRaycast = route.raycast;
  const sourcePointRaycast = markers.raycast;
  const root = new Group();
  root.add(route, markers);
  const other = new Group();
  other.add(sibling);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(adapter.apply('ghost', { opacity: 0.16 })).toBe('ghost');
  expect(route.material).not.toBe(lineMaterial);
  expect(markers.material).not.toBe(pointMaterial);
  expect((route.material as LineBasicMaterial).opacity).toBeCloseTo(0.16);
  expect((markers.material as PointsMaterial).opacity).toBeCloseTo(0.16);
  expect((route.material as LineBasicMaterial).transparent).toBe(true);
  expect((markers.material as PointsMaterial).depthWrite).toBe(false);
  expect(route.raycast).not.toBe(sourceRouteRaycast);
  expect(markers.raycast).not.toBe(sourcePointRaycast);
  expect(sibling.material).toBe(lineMaterial);
  expect(lineMaterial.opacity).toBe(1);
  expect(pointMaterial.opacity).toBe(1);

  expect(adapter.apply('hidden')).toBe('hidden');
  expect(root.visible).toBe(false);
  expect(route.material).toBe(lineMaterial);
  expect(markers.material).toBe(pointMaterial);
  expect(route.raycast).toBe(sourceRouteRaycast);
  expect(markers.raycast).toBe(sourcePointRaycast);
  adapter.dispose();
  expect(root.visible).toBe(true);
});

test('selected technical line callback failure fails closed without mutating source material', () => {
  const positions = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0), new Vector3(1, 0, 0),
  ]);
  const source = new LineBasicMaterial({ color: 0x123456 });
  const route = new LineSegments(positions, source);
  const raycast = route.raycast;
  const root = new Group();
  root.add(route);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(() => adapter.apply('ghost', {
    isSelected: object => {
      if (object === route) throw new Error('technical selection failed');
      return false;
    },
  })).toThrow('technical selection failed');
  expect(root.visible).toBe(false);
  expect(route.material).toBe(source);
  expect(route.raycast).toBe(raycast);
  expect(adapter.apply('visible', { scopeAllowed: true })).toBe('visible');
  expect(root.visible).toBe(true);
  adapter.dispose();
});

test('point clone failure rolls back an earlier ghost line and hides the source root', () => {
  const positions = new BufferGeometry().setFromPoints([
    new Vector3(0, 0, 0), new Vector3(1, 0, 0),
  ]);
  const lineMaterial = new LineBasicMaterial();
  const badMaterial = new PointsMaterial();
  badMaterial.clone = () => { throw new Error('point clone failed'); };
  const route = new LineSegments(positions, lineMaterial);
  const markers = new Points(positions, badMaterial);
  const originalRaycast = route.raycast;
  const root = new Group();
  root.add(route, markers);
  const adapter = createViewerLayerGhostPresentation(root);

  expect(() => adapter.apply('ghost')).toThrow('point clone failed');
  expect(root.visible).toBe(false);
  expect(route.material).toBe(lineMaterial);
  expect(route.raycast).toBe(originalRaycast);
  expect(markers.material).toBe(badMaterial);
  adapter.dispose();
});


test('identical ghost refresh reuses derived material and edges without GPU disposal churn', () => {
  const source = new MeshBasicMaterial({ transparent: true, opacity: 0.35, color: 0x123456 });
  const mesh = makeMesh(source);
  const root = new Group();
  root.add(mesh);
  const adapter = createViewerLayerGhostPresentation(root);
  const options = { opacity: 0.17, isSelected: () => false };
  expect(adapter.apply('ghost', options)).toBe('ghost');
  const material = mesh.material as MeshBasicMaterial;
  const outline = mesh.children[0] as LineSegments;
  const geometry = outline.geometry;
  let materialDisposals = 0, edgeDisposals = 0;
  material.addEventListener('dispose', () => materialDisposals++);
  geometry.addEventListener('dispose', () => edgeDisposals++);

  for (let i = 0; i < 12; i++) {
    expect(adapter.apply('ghost', { opacity: 0.17, isSelected: () => false })).toBe('ghost');
    expect(mesh.material).toBe(material);
    expect(mesh.children[0]).toBe(outline);
  }
  expect(materialDisposals).toBe(0);
  expect(edgeDisposals).toBe(0);
  expect(mesh.material).not.toBe(source);
  expect(source.visible).toBe(true);

  // A real source color change must rebuild, not keep an outdated ghost.
  source.color.setHex(0xff0000);
  expect(adapter.apply('ghost', options)).toBe('ghost');
  expect(mesh.material).not.toBe(material);
  expect(mesh.children[0]).not.toBe(outline);
  expect(materialDisposals).toBe(1);
  expect(edgeDisposals).toBe(1);

  const changed = mesh.material as MeshBasicMaterial;
  const nextOutline = mesh.children[0];
  adapter.apply('ghost', { opacity: 0.25, isSelected: () => false });
  expect(mesh.material).not.toBe(changed);
  expect(mesh.children[0]).not.toBe(nextOutline);
  adapter.dispose();
  expect(mesh.material).toBe(source);
  expect(mesh.children).toHaveLength(0);
});

test('ghost cache invalidates for selection, geometry and hidden-descendant changes', () => {
  const root = new Group();
  const source = new MeshBasicMaterial({ transparent: true, opacity: 0.25 });
  const mesh = makeMesh(source);
  const group = new Group(), second = makeMesh(new MeshBasicMaterial());
  group.add(second);
  root.add(mesh, group);
  const adapter = createViewerLayerGhostPresentation(root);
  let selected = false;
  const options = { isSelected: (object: Mesh | LineSegments | Points) => selected && object === mesh };
  adapter.apply('ghost', options);
  const material0 = mesh.material;
  const outline0 = mesh.children[0];
  adapter.apply('ghost', options);
  expect(mesh.material).toBe(material0);
  expect(mesh.children[0]).toBe(outline0);

  selected = true;
  adapter.apply('ghost', options);
  expect(mesh.material).toBe(source);
  expect(mesh.children).toHaveLength(0);
  selected = false;
  adapter.apply('ghost', options);
  expect(mesh.material).not.toBe(source);
  const material1 = mesh.material;

  const replacementGeometry = new BoxGeometry(2, 2, 2);
  mesh.geometry = replacementGeometry;
  adapter.apply('ghost', options);
  expect(mesh.material).not.toBe(material1);
  expect(mesh.children).toHaveLength(1);

  const thirdMaterial = second.material;
  group.visible = false;
  adapter.apply('ghost', options);
  expect(second.material).toBe(thirdMaterial);
  group.visible = true;
  adapter.apply('ghost', options);
  expect(second.material).not.toBe(thirdMaterial);
  adapter.dispose();
  expect(mesh.material).toBe(source);
  expect(second.material).toBe(thirdMaterial);
});
