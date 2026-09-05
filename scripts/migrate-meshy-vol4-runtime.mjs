import { readFile, writeFile } from 'node:fs/promises';

const file = 'src/components/MeshyPixelatedPoiseVol4.astro';
let source = await readFile(file, 'utf8');

const bridge = `<script>
  type ThreeRuntimeModule = typeof import('../scripts/threeRuntime');

  const runtimeWindow = window as typeof window & {
    __loadMeshyVol4ThreeRuntime?: () => Promise<ThreeRuntimeModule>;
  };

  runtimeWindow.__loadMeshyVol4ThreeRuntime = () => import('../scripts/threeRuntime');
  window.dispatchEvent(new Event('meshy-vol4-three-runtime-loader-ready'));
</script>`;

const inlineStart = `<script is:inline>
  (() => {`;
const inlineWithLoader = `<script is:inline>
  (() => {
    const loadThreeRuntime = async () => {
      if (typeof window.__loadMeshyVol4ThreeRuntime !== 'function') {
        await new Promise((resolve) => {
          window.addEventListener(
            'meshy-vol4-three-runtime-loader-ready',
            resolve,
            { once: true }
          );
        });
      }

      const loader = window.__loadMeshyVol4ThreeRuntime;
      if (typeof loader !== 'function') {
        throw new Error('Shared Three.js runtime loader is unavailable');
      }

      return loader();
    };`;

if (!source.includes(bridge)) {
  if (!source.includes(inlineStart)) {
    throw new Error('Could not find Vol 4 inline script start');
  }
  source = source.replace(inlineStart, `${bridge}\n\n${inlineWithLoader}`);
}

const cdnImports = `          const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/+esm');
          const { OrbitControls } = await import(
            'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js/+esm'
          );
          const { GLTFLoader } = await import(
            'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js/+esm'
          );
          const { MeshSurfaceSampler } = await import(
            'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/math/MeshSurfaceSampler.js/+esm'
          );`;

const npmRuntime = `          const { THREE, OrbitControls, GLTFLoader, MeshSurfaceSampler } =
            await loadThreeRuntime();`;

if (source.includes(cdnImports)) {
  source = source.replace(cdnImports, npmRuntime);
} else if (!source.includes(npmRuntime)) {
  throw new Error('Could not find Vol 4 Three.js CDN import block');
}

await writeFile(file, source);
