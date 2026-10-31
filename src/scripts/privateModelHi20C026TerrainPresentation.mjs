import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three';
/** C80-026: no new terrain design. Exact triangle soup copied from VERIFIED 56-scene
 * WORK_TEST donor Drive 1ClLOILNp78ij-Z3JwClmIbAhC0YpRPEg
 * model SHA256 5f293f76efce1cdf86d5d46b8123987d804391a82a0ee8443a9b0d5f3c602df7
 * scenes54/55, meshes1859/1860. Only original 52-scene HI20 source is editable.
 * Heights are source interpolations, NOT as-built or accepted geology.
 */
export const C026_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
export const C026_DONOR_SHA='5f293f76efce1cdf86d5d46b8123987d804391a82a0ee8443a9b0d5f3c602df7';
export const C026_PATCHES=[{"count":96,"sha":"01c65edb92ae5eab61a414113017e05a8334e638006fb67508b4682dc62a9df9","mesh":1859,"area":8.69105,"b64":"AACgvwAABb7sUTg9AACgvwAABb52cB4+MtuNvwAABb7sUTg9AACgvwAABb52cB4+AACgvwAABb6c9pQ+MtuNvwAABb7sUTg9MtuNvwAABb7sUTg9AACgvwAABb6c9pQ+AACAvwAABb7sUTg9AACgvwAABb6c9pQ+8aVJvwAABb7sUTg9AACAvwAABb7sUTg9AACgvwAABb6c9pQ+AACgvwAABb4ndR8/8aVJvwAABb7sUTg98aVJvwAABb7sUTg9AACgvwAABb4ndR8/iA0+vwAABb7sUTg9iA0+vwAABb7sUTg9AACgvwAABb4ndR8/yg8zvwAABb7sUTg9yg8zvwAABb7sUTg9AACgvwAABb4ndR8/gO4uvwAABb7sUTg9gO4uvwAABb7sUTg9AACgvwAABb4ndR8/tLH9vgAABb7sUTg9AACgvwAABb4ndR8/AACgv+V/ZL0iJ7A/tLH9vgAABb7sUTg9tLH9vgAABb7sUTg9AACgv+V/ZL0iJ7A/AAAAAAAABb7sUTg9AAAAAAAABb7sUTg9AACgv+V/ZL0iJ7A/AACgv0bUYb1OzrA/AAAAAAAABb7sUTg9AACgv0bUYb1OzrA/AACgv/TQYL24DbE/AAAAAAAABb7sUTg9AACgv/TQYL24DbE/AACgv3J7Xr3Vn7E/AAAAAAAABb7sUTg9AACgv3J7Xr3Vn7E/AACgv27ksbsQWPY/AAAAAAAABb7sUTg9AACgv27ksbsQWPY/AAAAAKfcCj3D9WhANaXSQMCvkD3D9VhAKVzXQMCvkD3NzIRAKVzXQMCvkD3D9VhAPQrHQAAA+LzD9WhAKVzXQMCvkD3NzIRANaXSQMCvkD3D9VhAAAAAAKfcCj3D9WhAKVzXQMCvkD3NzIRAPQrHQAAA+LzD9WhAAACgvwAA3D3NzIRAKVzXQMCvkD3NzIRAAAAAAKfcCj3D9WhAAACgv9PGrD2omHlAAACgvwAA3D3NzIRAAAAAAKfcCj3D9WhAAACgv7P/Vj2Sg2pAAACgv9PGrD2omHlAAAAAAKfcCj3D9WhAAACgv3qGJD3O92NAAACgv7P/Vj2Sg2pAAAAAAKfcCj3D9WhAAACgv/6kzrwA2jlAAACgv3qGJD3O92NAAAAAAKfcCj3D9WhAAACgv71esrw57C5AAACgv/6kzrwA2jlAAAAAAKfcCj3D9WhAAACgv3oRh7x6Lx5AAACgv71esrw57C5AAAAAAKfcCj3D9WhAAACgv5QSc7yA9BhAAACgv3oRh7x6Lx5AAAAAAKfcCj3D9WhAAACgv7V9IbxuMAlAAACgv5QSc7yA9BhAAAAAAKfcCj3D9WhAAACgv27ksbsQWPY/AACgv7V9IbxuMAlAAAAAAKfcCj3D9WhAPQrHQAAA+LzD9VhAPQrHQAAA+LzD9WhATDfJQAAA+LzD9VhATDfJQAAA+LzD9VhAPQrHQAAA+LzD9WhAQO7NQMCvkD3D9VhAQO7NQMCvkD3D9VhAPQrHQAAA+LzD9WhANaXSQMCvkD3D9VhA"},{"count":63,"sha":"610d4d0696b2bc0f19b73c5ba9116859f6f46e6b3996ab4c5990c6fad97cac13","mesh":1860,"area":21.502131,"b64":"AAAAAACAnj72KBDBaJEVQLBeuL32KBDBaJEVQLJeuL32KBDBGp2BQLy4+L32KBDBGp2BQLu4+L32KBDB52ijQKv/Gr72KBDBGp2BQLy4+L32KBDB52ijQKv/Gr72KBDB52ijQKv/Gr72KBDBQFilQNz/Gr72KBDBQFilQN3/Gr72KBDBbmXHQACGAb72KBDBQFilQNz/Gr72KBDBbmXHQACGAb72KBDBbmXHQACGAb72KBDB9ijMQJRC7DwAAAAAm7vZQDmtkD0AAAAA9ijMQDO/9b32KBDBm7vZQDmtkD0AAAAAddvbQIT1pz0AAAAA9ijMQDO/9b32KBDBddvbQIT1pz0AAAAArqDeQDtHxj0AAAAA9ijMQDO/9b32KBDBrqDeQDtHxj0AAAAAexQGQYmvDr72KBDB9ijMQDO/9b32KBDBrqDeQDtHxj0AAAAAnr/+QACiID4AAAAAexQGQYmvDr72KBDBnr/+QACiID4AAAAAexQGQd2LLj4AAAAAexQGQYmvDr72KBDBAAAAACeyEz8AACjBaJEVQHLoj7w6ISfBaJEVQE74CD0AACjBAAAAAIikBj/FnyTBaJEVQHLoj7w6ISfBAAAAACeyEz8AACjBAAAAAIikBj/FnyTBaJEVQCJTjr0UCCLBaJEVQHLoj7w6ISfBAAAAAHiM5z4tCSHBaJEVQCJTjr0UCCLBAAAAAIikBj/FnyTBAAAAAHiM5z4tCSHBaJEVQKteuL2g0R/BaJEVQCJTjr0UCCLBAAAAAACAnj5hdRjBaJEVQKteuL2g0R/BAAAAAHiM5z4tCSHBAAAAAACAnj5hdRjBaJEVQKteuL2w3RXBaJEVQKteuL2g0R/BAAAAAACAnj72KBDBaJEVQKteuL2w3RXBAAAAAACAnj5hdRjBAAAAAACAnj72KBDBaJEVQLBeuL32KBDBaJEVQKteuL2w3RXBAAAAAACAnj72KBDBAAAAAACAnj72KBDBaJEVQLBeuL32KBDB"}];
function unavailable(reason){return {available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}};}
function verts(base64,count){
  const raw=atob(base64);
  if(raw.length!==count*12)throw new Error('invalid-donor-buffer-length');
  const buf=new ArrayBuffer(raw.length),view=new DataView(buf);
  for(let i=0;i<raw.length;i++)view.setUint8(i,raw.charCodeAt(i));
  const out=new Float32Array(count*3);
  for(let i=0;i<out.length;i++)out[i]=view.getFloat32(i*4,true);
  if(!out.every(Number.isFinite))throw new Error('nonfinite-donor-vertex');
  return out;
}
function identity(m){const a=m?.elements;
  return a?.length===16 && a.every((v,i)=>Math.abs(v-(i%5===0?1:0))<1e-7);}
function reachable(json,sceneIndex,id){
  const stack=[...(json.scenes[sceneIndex]?.nodes||[])],seen=new Set();
  while(stack.length){const n=stack.pop();if(n===id)return true;
    if(seen.has(n))continue;seen.add(n);stack.push(...json.nodes[n]?.children||[]);}
  return false;
}
/** Reversible independent presentation, not a model or sourceLinks rewrite. */
export function createHi20C026TerrainPresentation(gltf,verifiedSha){
  const json=gltf?.parser?.json,scenes=gltf?.scenes,assoc=gltf?.parser?.associations;
  if(verifiedSha!==C026_SOURCE_SHA||json?.scenes?.length!==52||
     scenes?.length!==52||json?.nodes?.length!==6463||
     json?.meshes?.length!==1859||json?.scene!==0||
     typeof assoc?.get!=='function')return unavailable('source-identity');
  const names=['HI12_SITE_V7_SCALGO_TERRAIN_SCENE1_WORK_TEST',
               'HI12_SITE_V7_SCALGO_TERRAIN_SCENE0_WORK_TEST'];
  const ids=[5141,5100],sourceGroups=[];
  for(let i=0;i<2;i++){
    const sceneIndex=[50,51][i],scene=scenes[sceneIndex],id=ids[i];
    if(json.nodes[id]?.name!==names[i]||json.nodes[id]?.mesh!==1547||
       !reachable(json,sceneIndex,id)||!scene?.traverse||
       !scene?.add||!scene?.remove)return unavailable('source-terrain-node');
    scene.updateMatrixWorld(true);
    if(!identity(scene.matrixWorld))return unavailable('source-world-frame');
    const found=[];
    scene.traverse(o=>{if(assoc.get(o)?.nodes===id)found.push(o);});
    // GLTFLoader may attach source node association to the parent group for a
    // multi-primitive mesh, so inspect its descendants for material 212.
    if(found.length!==1)return unavailable('source-terrain-association');
    const mats=[];
    found[0].traverse(o=>{
      if(!o.isMesh)return;
      for(const m of (Array.isArray(o.material)?o.material:[o.material]))
        if(m?.name===json.materials?.[212]?.name)mats.push(m);
    });
    if(mats.length===0||json.materials?.[212]?.alphaMode!=='BLEND'||
      json.materials?.[212]?.pbrMetallicRoughness?.baseColorFactor?.[3]!==0.58)
      return unavailable('source-terrain-material');
    sourceGroups.push({scene,material:mats[0]});
  }
  // Refuse to draw a second copy if the patch is already in a future source.
  if(json.nodes.some(n=>n.name?.startsWith('C80-026_TERRACE_SOURCE_FRINGE_PATCH_SCENE52')))
    return unavailable('already-integrated');
  const mounted=[];
  try{
    for(let k=0;k<2;k++){
      for(const patch of C026_PATCHES){
        const geo=new BufferGeometry();
        geo.setAttribute('position',new Float32BufferAttribute(verts(patch.b64,patch.count),3));
        geo.computeVertexNormals();
        const mesh=new Mesh(geo,sourceGroups[k].material);
        mesh.name='HI20_C026_TERRAIN_WORK_TEST_'+[50,51][k]+'_DONOR'+patch.mesh;
        mesh.frustumCulled=true;
        mesh.visible=false;
        mesh.userData={c026SourceSha:C026_SOURCE_SHA,c026DonorSha:C026_DONOR_SHA,
          c026SourceMesh:patch.mesh,c026SourceScene:[54,55][k],
          c026AreaWorkM2:patch.area,physicalHost:'HOST_HOLD',asBuilt:false,
          current:false,sourceLinks:['G2b 56scene C80-026 donor','G1 SCALGO mesh1547']};
        sourceGroups[k].scene.add(mesh);
        mounted.push({scene:sourceGroups[k].scene,mesh});
      }
    }
  }catch{
    for(const {scene,mesh} of mounted){scene.remove(mesh);mesh.geometry.dispose();}
    return unavailable('mount-error');
  }
  let disposed=false,enabled=false;
  return {available:true,reason:null,count:mounted.length,
    get enabled(){return enabled;},
    setEnabled(value){if(disposed)return false;enabled=Boolean(value);
      for(const {mesh} of mounted)mesh.visible=enabled;return true;},
    dispose(){if(disposed)return;disposed=true;enabled=false;
      for(const {mesh,scene} of mounted){scene.remove(mesh);mesh.geometry.dispose();}}
  };
}
