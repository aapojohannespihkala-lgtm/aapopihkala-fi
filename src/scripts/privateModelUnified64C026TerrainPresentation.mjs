import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three';
import { C026_PATCHES, C026_DONOR_SHA } from './privateModelHi20C026TerrainPresentation.mjs';

// C80-026 is already built and source-proven in the 56scene G2b donor.
// Extend the existing, unmodified 64scene 1F/BOTH only: no new terrain design,
// no 64scene GLB edits and no physical or owner approval implied.
export const U64_C026_SHA='22ddaac08a290bcaa38d2b9985e9e851c25d92d3da111134062dae13a96685e8';
const SOURCE_MATERIAL='P143A_SCALGO_CURRENT_TERRAIN_WORKTEST_MATERIAL';
const TARGETS=[
  {scene:60,node:5141,parent:6454,name:'HI12_SITE_V7_SCALGO_TERRAIN_SCENE1_WORK_TEST'},
  {scene:63,node:5100,parent:6456,name:'HI12_SITE_V7_SCALGO_TERRAIN_SCENE0_WORK_TEST'},
];
const HASHES=['01c65edb92ae5eab61a414113017e05a8334e638006fb67508b4682dc62a9df9',
              '610d4d0696b2bc0f19b73c5ba9116859f6f46e6b3996ab4c5990c6fad97cac13'];
const denied=reason=>({available:false,reason,count:0,enabled:false,setEnabled:()=>false,dispose:()=>{}});
const worldIdentity=world=>world?.elements?.length===16&&world.elements.every(
  (v,i)=>Math.abs(v-(i%5===0?1:0))<1e-7);
const unpack=(data,count)=>{
  const raw=atob(data);
  if(raw.length!==count*12)throw Error('invalid C026 donor bytes');
  const dv=new DataView(new ArrayBuffer(raw.length));
  for(let i=0;i<raw.length;i++)dv.setUint8(i,raw.charCodeAt(i));
  const a=new Float32Array(count*3);
  for(let i=0;i<a.length;i++)a[i]=dv.getFloat32(i*4,true);
  if(!a.every(Number.isFinite))throw Error('invalid C026 donor coordinates');
  return a;
};
export function createUnified64C026TerrainPresentation(gltf,verifiedSha){
  const parser=gltf?.parser, json=parser?.json, associations=parser?.associations;
  if(verifiedSha!==U64_C026_SHA||json?.scene!==0||json?.asset?.version!=='2.0'||
     json?.asset?.extras?.current!==false||json?.asset?.extras?.asBuilt!==false||
     json?.scenes?.length!==64||gltf?.scenes?.length!==64||
     json?.nodes?.length!==6518||json?.meshes?.length!==1873||
     typeof associations?.get!=='function')
    return denied('source-sha-and-shape');
  const material=json.materials?.[212];
  if(material?.name!==SOURCE_MATERIAL||material.alphaMode!=='BLEND'||
     material.pbrMetallicRoughness?.baseColorFactor?.[3]!==.58 ||
     material.extras?.physicalGroundSurfaceClaim!==false)
    return denied('source-terrain-material');
  if(C026_PATCHES.length!==2||C026_PATCHES.some((p,i)=>
    p.mesh!==1859+i||p.sha!==HASHES[i]||
    p.count!==[96,63][i]||Math.abs(p.area-[8.69105,21.502131][i])>1e-6))
    return denied('donor-identity');
  if(json.nodes.some(n=>n.name?.startsWith('C80-026_TERRACE_SOURCE_FRINGE_PATCH_SCENE52')||
     n.name?.startsWith('C80-026_D_ADJACENT_TERRAIN_REMAINDER')))
    return denied('already-integrated');
  const destination=[];
  for(const t of TARGETS){
    const source=json.scenes[t.scene],parent=json.nodes[t.parent],node=json.nodes[t.node];
    const scene=gltf.scenes[t.scene];
    if(!source?.nodes?.includes(t.parent)||
       parent?.children?.filter(id=>id===t.node).length!==1||
       !parent?.name?.startsWith('C80R1_SCALGO_SITE_CONTEXT_')||
       node?.name!==t.name||node.mesh!==1547||
       node?.extras?.sourceOnly!==true||
       node?.extras?.physicalHost!=='HOST_HOLD'||
       node?.extras?.physicalStructureApproved!==false||
       json.meshes[1547]?.primitives?.length!==2||
       !json.meshes[1547].primitives.every(p=>p.material===212)||
       !scene?.traverse||!scene?.add||!scene?.remove)
      return denied('source-parent-geometry');
    scene.updateMatrixWorld(true);
    if(!worldIdentity(scene.matrixWorld))return denied('source-world-frame');
    const roots=[];
    scene.traverse(o=>{if(associations.get(o)?.nodes===t.node)roots.push(o);});
    if(roots.length!==1)return denied('source-association');
    const materials=[];
    roots[0].traverse(o=>{
      if(!o.isMesh)return;
      for(const m of (Array.isArray(o.material)?o.material:[o.material]))
        if(m?.name===SOURCE_MATERIAL)materials.push(m);
    });
    if(materials.length===0)return denied('rendered-terrain-material');
    destination.push({scene,material:materials[0],index:t.scene});
  }
  const mounted=[];
  try{
    for(const target of destination){
      for(const patch of C026_PATCHES){
        const geometry=new BufferGeometry();
        geometry.setAttribute('position',new Float32BufferAttribute(unpack(patch.b64,patch.count),3));
        geometry.computeVertexNormals();
        const mesh=new Mesh(geometry,target.material);
        mesh.name='U64_C026_VERIFIED_TERRAIN_SCENE'+target.index+'_DONOR'+patch.mesh;
        mesh.visible=false;
        mesh.userData={sourceSha:U64_C026_SHA,donorSha:C026_DONOR_SHA,
          sourceMesh:patch.mesh,workAreaM2:patch.area,
          sourceLinks:['G2b C026 56scene mesh'+patch.mesh,'G1 SCALGO terrain mesh1547'],
          physicalHost:'HOST_HOLD',current:false,asBuilt:false,humanReview:'NOT_RUN'};
        target.scene.add(mesh);
        mounted.push({scene:target.scene,mesh});
      }
    }
  }catch{
    for(const {scene,mesh} of mounted){scene.remove(mesh);mesh.geometry.dispose();}
    return denied('mount-error');
  }
  let enabled=false,disposed=false;
  return {available:true,reason:null,count:4,get enabled(){return enabled;},
    setEnabled(next){if(disposed)return false;enabled=Boolean(next);
      for(const {mesh} of mounted)mesh.visible=enabled;
      return true;},
    dispose(){if(disposed)return;disposed=true;enabled=false;
      for(const {scene,mesh} of mounted){scene.remove(mesh);mesh.geometry.dispose();}}
  };
}
