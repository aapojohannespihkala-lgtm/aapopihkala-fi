/** Release GPU resources owned by a parsed GLTF after it has been replaced.
 * Do not call for the mounted GLTF or for another scene of the same GLTF.
 * Multiple glTF scenes may share Object3Ds, geometry, materials and textures.
 */
export const releaseReplacedGltfGpuResources = (gltf, renderer) => {
  if (!gltf || typeof gltf !== 'object') return { objects: 0, geometries: 0, materials: 0, textures: 0 };
  const seenObjects = new Set();
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const stack = [...(Array.isArray(gltf.scenes) ? gltf.scenes : []), gltf.scene].filter(Boolean);
  while (stack.length) {
    const object = stack.pop();
    if (!object || seenObjects.has(object)) continue;
    seenObjects.add(object);
    for (const child of object.children ?? []) stack.push(child);
    if (object.geometry && typeof object.geometry.dispose === 'function') geometries.add(object.geometry);
    const refs = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of refs) {
      if (material && typeof material.dispose === 'function') materials.add(material);
    }
  }
  const addTexture = (value) => {
    if (value?.isTexture && typeof value.dispose === 'function') textures.add(value);
    if (Array.isArray(value)) for (const item of value) {
      if (item?.isTexture && typeof item.dispose === 'function') textures.add(item);
    }
  };
  for (const material of materials) {
    for (const value of Object.values(material)) addTexture(value);
    for (const uniform of Object.values(material.uniforms ?? {})) addTexture(uniform?.value);
  }
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
  renderer?.renderLists?.dispose?.();
  return { objects: seenObjects.size, geometries: geometries.size, materials: materials.size, textures: textures.size };
};
