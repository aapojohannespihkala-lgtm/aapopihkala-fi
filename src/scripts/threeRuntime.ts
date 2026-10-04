import * as THREE from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

type TrackedOrbitControls = ThreeOrbitControls & {
  object: THREE.Camera;
  domElement: HTMLElement;
};

const trackedOrbitControls = new WeakMap<HTMLElement, Set<TrackedOrbitControls>>();

class OrbitControls extends ThreeOrbitControls {
  private readonly trackedDomElement: HTMLElement;

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
  }

  dispose() {
    trackedOrbitControls.get(this.trackedDomElement)?.delete(this as TrackedOrbitControls);
    super.dispose();
  }
}

export const getTrackedOrbitControls = (domElement: HTMLElement) =>
  [...(trackedOrbitControls.get(domElement) ?? [])];

export { THREE, OrbitControls, GLTFLoader, MeshSurfaceSampler };
