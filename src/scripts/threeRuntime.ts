import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { installMiddleMouseLookAround } from './privateModelMiddleMouseLookAround';

type TrackedOrbitControls = ThreeOrbitControls & {
  object: THREE.Camera;
  domElement: HTMLElement;
};

const trackedOrbitControls = new WeakMap<HTMLElement, Set<TrackedOrbitControls>>();

class OrbitControls extends ThreeOrbitControls {
  private readonly trackedDomElement: HTMLElement;
  private readonly stopMiddleMouseLookAround: (() => void) | null;

  constructor(object: THREE.Camera, domElement: HTMLElement) {
    super(object, domElement);
    this.trackedDomElement = domElement;
    const controls = this as TrackedOrbitControls;
    let controlsForElement = trackedOrbitControls.get(domElement);
    if (!controlsForElement) {
      controlsForElement = new Set<TrackedOrbitControls>();
      trackedOrbitControls.set(domElement, controlsForElement);
    }
    controlsForElement.add(controls);
    // Only the private viewer's free-perspective camera gets this control.
    // Its plan and iso cameras share the canvas but retain their old behavior.
    this.stopMiddleMouseLookAround =
      domElement.id === 'private-model-canvas' &&
      object instanceof THREE.PerspectiveCamera &&
      domElement instanceof HTMLCanvasElement
        ? installMiddleMouseLookAround({ camera: object, controls: this, canvas: domElement })
        : null;
  }

  dispose() {
    this.stopMiddleMouseLookAround?.();
    trackedOrbitControls.get(this.trackedDomElement)?.delete(this as TrackedOrbitControls);
    super.dispose();
  }
}

export const getTrackedOrbitControls = (domElement: HTMLElement) =>
  [...(trackedOrbitControls.get(domElement) ?? [])];

export { THREE, OrbitControls, GLTFLoader, MeshSurfaceSampler };
