import {
  EdgesGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  NormalBlending,
  Points,
  type Material,
  type Object3D,
} from 'three';

/**
 * Presentation only. The caller supplies a single, already scope/scene-filtered
 * layer root. Never pass a whole unfiltered GLB scene to enable a technical layer.
 */
export type ViewerLayerPresentationMode = 'visible' | 'ghost' | 'hidden';

export type ViewerLayerGhostOptions = {
  /** A false scope/floor gate always wins over any requested layer state. */
  scopeAllowed?: boolean;
  /** Opacity for opaque faces. Transparent source faces use edges instead. */
  opacity?: number;
  /** Prefer edge-only presentation for coplanar or dense surfaces. */
  preferEdges?: boolean;
  /** Selected meshes, lines and points keep their source material and picking behaviour. */
  isSelected?: (object: Mesh | Line | Points) => boolean;
};

type MeshSnapshot = {
  material: Material | Material[];
  renderOrder: number;
  raycast: Mesh['raycast'];
  ownRaycast: boolean;
  temporaryMaterials: Material[];
  outline: LineSegments | null;
};

/** Source-backed routes can be lines or points, not just meshes. */
type LinePointSnapshot = {
  material: Material | Material[];
  raycast: Line['raycast'];
  ownRaycast: boolean;
  temporaryMaterials: Material[];
};

const validOpacity = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0.02, Math.min(0.35, value))
    : 0.18;

const materialsOf = (material: Material | Material[]): Material[] =>
  Array.isArray(material) ? material : [material];

/**
 * One adapter per non-overlapping layer root. This does not change the GLB,
 * its source metadata, other scene roots or original Material instances.
 */
export const createViewerLayerGhostPresentation = (root: Object3D) => {
  const originalRootVisible = root.visible;
  const changed = new Map<Mesh, MeshSnapshot>();
  const changedLinesAndPoints = new Map<Line | Points, LinePointSnapshot>();
  let disposed = false;
  let lastGhostSignature: string | null = null;

  // An unchanged Layers refresh must not rebuild hundreds of EdgesGeometry
  // objects and clone/dispose the same material set again. Reuse only when
  // the *actual* scene members, source AND temporary materials, selection,
  // clipping and geometry versions are still identical. In every ambiguous
  // case, fall back to the existing full restoration/rebuild path.
  const ghostSignature = (options: ViewerLayerGhostOptions, opacity: number) => {
    if (!root.visible) return null;
    const signature: unknown[] = [opacity, options.preferEdges === true];
    const materialState = (material: Material) => {
      const m = material as Material & {
        color?: { getHexString(): string };
        emissive?: { getHexString(): string };
        emissiveIntensity?: number;
        map?: { uuid: string; version: number };
        alphaMap?: { uuid: string; version: number };
        alphaTest?: number;
        metalness?: number;
        roughness?: number;
      };
      return [
        material.uuid, material.version, material.visible, material.opacity,
        material.transparent, material.blending, material.side,
        material.depthWrite, material.depthTest, material.colorWrite,
        material.clipIntersection, material.clippingPlanes?.map((plane) => [
          plane.normal.x, plane.normal.y, plane.normal.z, plane.constant,
        ]) ?? null, m.color?.getHexString?.() ?? null,
        m.map?.uuid ?? null, m.map?.version ?? null,
        // A direct source alphaMap swap does not increment Material.version,
        // but the existing ghost clone still holds the previous texture.
        m.alphaMap?.uuid ?? null, m.alphaMap?.version ?? null,
        m.alphaTest ?? null,
        m.metalness ?? null, m.roughness ?? null,
        // Emissive RGB/intensity can change without Material.version changing.
        // A cloned opaque ghost must then be rebuilt from the source material.
        m.emissive?.getHexString?.() ?? null, m.emissiveIntensity ?? null,
      ];
    };
    root.traverseVisible((object) => {
      // The ghost helper is derived; it never represents a source object.
      if (object.name === '__VIEWER_GHOST_EDGES_PRESENTATION_ONLY__') return;
      if (!(object instanceof Mesh || object instanceof Line || object instanceof Points)) return;
      const meshSaved = object instanceof Mesh ? changed.get(object) : undefined;
      const lineSaved = (object instanceof Line || object instanceof Points)
        ? changedLinesAndPoints.get(object) : undefined;
      const source = meshSaved?.material ?? lineSaved?.material ?? object.material;
      const geometry = (object as Mesh).geometry;
      const position = geometry?.getAttribute?.('position') as
        | { version?: number; data?: { version?: number } } | undefined;
      const selected = options.isSelected?.(object) === true;
      signature.push([
        object.uuid, object.visible, selected,
        geometry?.uuid ?? null, position?.version ?? position?.data?.version ?? null,
        geometry?.getIndex?.()?.version ?? null,
        materialsOf(source).map(materialState),
        materialsOf(object.material).map(materialState),
        meshSaved ? [object.renderOrder, meshSaved.renderOrder, meshSaved.outline?.uuid ?? null,
          meshSaved.outline?.parent === object] : null,
      ]);
    });
    return JSON.stringify(signature);
  };

  const restoreMaterials = () => {
    lastGhostSignature = null;
    for (const [mesh, saved] of changed) {
      mesh.material = saved.material;
      mesh.renderOrder = saved.renderOrder;
      if (saved.ownRaycast) {
        mesh.raycast = saved.raycast;
      } else {
        // Restore prototype raycast rather than installing an own-property hook.
        delete (mesh as unknown as { raycast?: Mesh['raycast'] }).raycast;
      }
      if (saved.outline) {
        mesh.remove(saved.outline);
        saved.outline.geometry.dispose();
        (saved.outline.material as Material).dispose();
      }
      saved.temporaryMaterials.forEach((material) => material.dispose());
    }
    changed.clear();
    for (const [object, saved] of changedLinesAndPoints) {
      object.material = saved.material;
      if (saved.ownRaycast) {
        object.raycast = saved.raycast;
      } else {
        delete (object as unknown as { raycast?: Line['raycast'] }).raycast;
      }
      saved.temporaryMaterials.forEach((material) => material.dispose());
    }
    changedLinesAndPoints.clear();
  };

  const apply = (
    mode: ViewerLayerPresentationMode,
    options: ViewerLayerGhostOptions = {},
  ): ViewerLayerPresentationMode => {
    if (disposed) throw new Error('Layer presentation adapter already disposed');
    try {
    if (mode !== 'visible' && mode !== 'ghost' && mode !== 'hidden') {
      throw new TypeError('Unknown layer presentation mode');
    }

    const effectiveMode = options.scopeAllowed === false ? 'hidden' : mode;
    const opacity = validOpacity(options.opacity);
    if (effectiveMode === 'ghost' && lastGhostSignature !== null &&
        lastGhostSignature === ghostSignature(options, opacity)) {
      return 'ghost';
    }

    restoreMaterials();
    root.visible = originalRootVisible && effectiveMode !== 'hidden';
    if (effectiveMode !== 'ghost' || !root.visible) return effectiveMode;

    // Snapshot before inserting helper edges so they cannot be traversed as data.
    const targets: Mesh[] = [];
    const lineAndPointTargets: Array<Line | Points> = [];
    // Only rendered descendants belong to this ghost pass. A hidden Group
    // can contain nominally visible meshes; traversing them may invoke a
    // broken clone/selection callback and hide the entire visible layer.
    root.traverseVisible((child) => {
      if (child instanceof Mesh && !options.isSelected?.(child)) {
        targets.push(child);
      } else if ((child instanceof Line || child instanceof Points) && !options.isSelected?.(child)) {
        lineAndPointTargets.push(child);
      }
    });

    for (const mesh of targets) {
      const original = mesh.material;
      const sourceMaterials = materialsOf(original);
      const useEdges =
        options.preferEdges === true ||
        sourceMaterials.some(
          (material) =>
            material.transparent ||
            material.opacity < 0.999 ||
            material.blending !== NormalBlending,
        );
      const temporaryMaterials: Material[] = [];
      try {
        for (const material of sourceMaterials) {
          const copy = material.clone();
          temporaryMaterials.push(copy);
          if (useEdges) {
            // Children (the outline) remain drawable when the mesh face is not.
            copy.visible = false;
          } else {
            copy.transparent = true;
            copy.opacity = Math.min(material.opacity, opacity);
            copy.depthWrite = false;
            copy.depthTest = true;
            copy.polygonOffset = true;
            copy.polygonOffsetFactor = -1;
            copy.polygonOffsetUnits = -1;
          }
          copy.needsUpdate = true;
        }
      } catch (error) {
        // Failed multi-material construction is not yet in 'changed'.
        temporaryMaterials.forEach((material) => material.dispose());
        throw error;
      }

      const snapshot: MeshSnapshot = {
        material: original,
        renderOrder: mesh.renderOrder,
        raycast: mesh.raycast,
        ownRaycast: Object.prototype.hasOwnProperty.call(mesh, 'raycast'),
        temporaryMaterials,
        outline: null,
      };
      changed.set(mesh, snapshot);
      mesh.material = Array.isArray(original)
        ? temporaryMaterials
        : temporaryMaterials[0];
      // Ghost geometry and its reference outline must not intercept source picks.
      mesh.raycast = () => {};
      mesh.renderOrder = snapshot.renderOrder + 1;

      // The helper line must never draw outside the source mesh's local clip.
      // A multi-material mesh with different clipping rules has no single
      // safe whole-mesh outline, so omit it instead of exposing hidden faces.
      const sourceClip = sourceMaterials[0].clippingPlanes;
      const sourceIntersection = sourceMaterials[0].clipIntersection;
      const sharedSourceClip = sourceMaterials.every((material) =>
        material.clipIntersection === sourceIntersection &&
        (material.clippingPlanes === sourceClip ||
          (!material.clippingPlanes?.length && !sourceClip?.length)),
      );
      if (useEdges && mesh.geometry && sharedSourceClip) {
        const outlineMaterial = new LineBasicMaterial({
          color: 0x8995a3,
          opacity: Math.min(0.48, opacity * 2),
          transparent: true,
          depthTest: true,
          depthWrite: false,
        });
        outlineMaterial.clippingPlanes = sourceClip;
        outlineMaterial.clipIntersection = sourceIntersection;
        const outline = new LineSegments(
          new EdgesGeometry(mesh.geometry, 30),
          outlineMaterial,
        );
        outline.name = '__VIEWER_GHOST_EDGES_PRESENTATION_ONLY__';
        outline.renderOrder = mesh.renderOrder + 1;
        outline.raycast = () => {};
        mesh.add(outline);
        snapshot.outline = outline;
      }
    }

    // Collection happens before transient mesh outline helpers are added.
    // Never modify original materials or change the source node hierarchy.
    for (const object of lineAndPointTargets) {
      const original = object.material;
      const copies: Material[] = [];
      try {
        for (const material of materialsOf(original)) {
          const copy = material.clone();
          copies.push(copy);
          copy.transparent = true;
          copy.opacity = Math.min(material.opacity, opacity);
          copy.depthWrite = false;
          copy.needsUpdate = true;
        }
      } catch (error) {
        copies.forEach((material) => material.dispose());
        throw error;
      }
      changedLinesAndPoints.set(object, {
        material: original,
        raycast: object.raycast,
        ownRaycast: Object.prototype.hasOwnProperty.call(object, 'raycast'),
        temporaryMaterials: copies,
      });
      object.material = Array.isArray(original) ? copies : copies[0];
      object.raycast = () => {};
    }
      lastGhostSignature = ghostSignature(options, opacity);
      return effectiveMode;
    } catch (error) {
      // A failed selection callback or clone must not expose a previously hidden
      // source root or leave earlier meshes in transient ghost materials.
      try { restoreMaterials(); } finally { root.visible = false; }
      throw error;
    }
  };

  const reset = () => {
    if (disposed) return;
    restoreMaterials();
    root.visible = originalRootVisible;
  };

  const dispose = () => {
    if (disposed) return;
    reset();
    disposed = true;
  };

  return { apply, reset, dispose };
};
