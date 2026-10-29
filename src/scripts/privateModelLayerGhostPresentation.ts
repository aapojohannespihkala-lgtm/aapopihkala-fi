import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  NormalBlending,
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
  /** Selected meshes keep their source material and picking behaviour. */
  isSelected?: (mesh: Mesh) => boolean;
};

type MeshSnapshot = {
  material: Material | Material[];
  renderOrder: number;
  raycast: Mesh['raycast'];
  ownRaycast: boolean;
  temporaryMaterials: Material[];
  outline: LineSegments | null;
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
  let disposed = false;

  const restoreMaterials = () => {
    for (const [mesh, saved] of changed) {
      mesh.material = saved.material;
      mesh.renderOrder = saved.renderOrder;
      if (saved.ownRaycast) {
        mesh.raycast = saved.raycast;
      } else {
        // Restore prototype raycast rather than installing an own-property hook.
        delete (mesh as Mesh & { raycast?: Mesh['raycast'] }).raycast;
      }
      if (saved.outline) {
        mesh.remove(saved.outline);
        saved.outline.geometry.dispose();
        (saved.outline.material as Material).dispose();
      }
      saved.temporaryMaterials.forEach((material) => material.dispose());
    }
    changed.clear();
  };

  const apply = (
    mode: ViewerLayerPresentationMode,
    options: ViewerLayerGhostOptions = {},
  ): ViewerLayerPresentationMode => {
    if (disposed) throw new Error('Layer presentation adapter already disposed');
    if (mode !== 'visible' && mode !== 'ghost' && mode !== 'hidden') {
      throw new TypeError('Unknown layer presentation mode');
    }

    restoreMaterials();
    const effectiveMode = options.scopeAllowed === false ? 'hidden' : mode;
    root.visible = originalRootVisible && effectiveMode !== 'hidden';
    if (effectiveMode !== 'ghost' || !root.visible) return effectiveMode;

    const opacity = validOpacity(options.opacity);
    // Snapshot before inserting helper edges so they cannot be traversed as data.
    const targets: Mesh[] = [];
    root.traverse((child) => {
      if (child instanceof Mesh && child.visible && !options.isSelected?.(child)) {
        targets.push(child);
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
      const temporaryMaterials = sourceMaterials.map((material) => {
        const copy = material.clone();
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
        return copy;
      });

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

      if (useEdges && mesh.geometry) {
        const outline = new LineSegments(
          new EdgesGeometry(mesh.geometry, 30),
          new LineBasicMaterial({
            color: 0x8995a3,
            opacity: Math.min(0.48, opacity * 2),
            transparent: true,
            depthTest: true,
            depthWrite: false,
          }),
        );
        outline.name = '__VIEWER_GHOST_EDGES_PRESENTATION_ONLY__';
        outline.renderOrder = mesh.renderOrder + 1;
        outline.raycast = () => {};
        mesh.add(outline);
        snapshot.outline = outline;
      }
    }
    return effectiveMode;
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
