// C80-002: Reuse the 29.10.2026 scene3-only optical depth separation
// for four SOURCE_ONLY storage roofs. No physical height or GLB edit.
// Dynamic production WebGL flicker still requires review.
export const C002_SOURCE_SHA='15a13623be601b1cbc70aaced46e497146d50894da9a3a54b4c47b438b4acee9';
export const C002_VISUAL_OFFSET_M=0.005;
const TARGETS=[
 {id:3740,source:978,y:2.76,name:'K3_AC_STORAGE_P169A_C_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE'},
 {id:3744,source:983,y:1.76,name:'K3_AC_STORAGE_P169A_B_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE'},
 {id:3748,source:988,y:1.76,name:'K3_AC_STORAGE_P169A_A_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE'},
 {id:3756,source:978,y:2.76,name:'K3_D_STORAGE_FROM_C_P169A_C_STORAGE_ROOF_PRESENTATION_REFERENCE_NODE'},
];
const unavailable=reason=>({available:false,reason,count:0,enabled:false,
 setEnabled:()=>false,dispose:()=>{}});
export function createHi20C002StorageRoofPresentation(gltf,verifiedSha){
 const json=gltf?.parser?.json;
 if(verifiedSha!==C002_SOURCE_SHA || json?.asset?.version!=='2.0' ||
    json.asset?.extras?.current!==false || json.asset?.extras?.asBuilt!==false ||
    json.scene!==0 || json.scenes?.length!==52 || gltf?.scenes?.length!==52)
   return unavailable('source-sha-or-scene');
 const association=gltf.parser?.associations;
 if(typeof association?.get!=='function') return unavailable('node-associations');
 const scene3=gltf.scenes[3], roots=json.scenes[3]?.nodes, material=json.materials?.[85];
 if(!Array.isArray(roots) || json.meshes?.[514]?.primitives?.length!==1 ||
    json.meshes[514].primitives[0].material!==85 ||
    material?.alphaMode!=='BLEND' || material?.doubleSided!==true ||
    Math.abs((material?.pbrMetallicRoughness?.baseColorFactor?.[3]??0)-.58)>1e-6)
    return unavailable('roof-mesh-or-material');
 const matched=[];
 for(const target of TARGETS){
   const node=json.nodes?.[target.id];
   if(!roots.includes(target.id) || node?.mesh!==514 || node?.name!==target.name ||
      node.extras?.presentationOnly!==true ||
      node.extras?.sourceNodeIndex!==target.source ||
      typeof node.extras?.sourceDriveId!=='string' ||
      !Array.isArray(node.matrix) || node.matrix.length!==16 ||
      Math.abs(node.matrix[13]-target.y)>1e-4)
      return unavailable('source-roof-identity');
   const candidates=scene3?.children?.filter(obj=>obj?.isMesh===true &&
     association.get(obj)?.nodes===target.id && obj.name===target.name);
   if(candidates?.length!==1) return unavailable('loaded-roof-identity');
   const roof=candidates[0];
   if(!roof.position || !Number.isFinite(roof.position.y) ||
      Math.abs(roof.position.y-target.y)>1e-4 ||
      !roof.material || Array.isArray(roof.material) ||
      Math.abs(roof.material.opacity-.58)>.015)
      return unavailable('source-roof-transform');
   matched.push({roof,originalY:roof.position.y});
 }
 if(matched.length!==4 || new Set(matched.map(x=>x.roof)).size!==4)
   return unavailable('duplicate-roof-objects');
 let enabled=false;
 const apply=desired=>{
   const next=Boolean(desired);
   if(next===enabled) return true;
   for(const item of matched){
     item.roof.position.y=item.originalY+(next?C002_VISUAL_OFFSET_M:0);
     item.roof.updateMatrix?.();
     item.roof.updateMatrixWorld?.(true);
   }
   enabled=next;
   return true;
 };
 return {available:true,reason:null,count:4,get enabled(){return enabled;},
   setEnabled:apply,dispose:()=>{apply(false);}};
}
