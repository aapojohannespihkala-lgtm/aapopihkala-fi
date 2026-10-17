import { test, expect } from '@playwright/test';
import { BoxGeometry, BufferGeometry, Group, LineBasicMaterial, LineSegments,
  Mesh, MeshBasicMaterial, Vector3 } from 'three';
// @ts-ignore - source-only ESM presentation helper
import { prepareM5AR1125Focus8020 as prepare } from '../../src/scripts/privateModelM5AR1125Focus8020.mjs';
// @ts-ignore - immutable source roster
import { m5aR1125SourcePixelKinds as kinds } from '../../src/scripts/privateModelM5AR1125SourceRoiPixelProof.mjs';

const keys = Object.keys(kinds);
const originalNodeIndices = [1104,1105,1106,1107,1118,1119,1120,1121,1122,1123,1124,1115,1116];
const originalMeshIndices = [555,556,557,558,559,560,561,562,563,564,565,534,534];
const provenance = {
  Canonical:false, presentationOnly:true, currentGeometryClaim:false,
  asBuiltClaim:false, publishToCURRENT:false,
};
function fixture() {
  const scene = new Group();
  scene.userData = { ...provenance };
  const root = new Group();
  scene.add(root);
  const targets:Record<string,Mesh|LineSegments>={};
  for(const key of keys){
    const boundary = key.startsWith('boundary:');
    const material = boundary ? new LineBasicMaterial({color:0xffdd33}) :
      new MeshBasicMaterial({color:0x22d3ee});
    const object = boundary
      ? new LineSegments(new BufferGeometry().setFromPoints([
          new Vector3(0,0,0),new Vector3(1,0,0)]),material)
      : new Mesh(new BoxGeometry(1,1,1),material);
    object.userData={
      ...provenance,
      ...(boundary?{representationKind:'unresolvedBoundaryMarker',
        boundaryRole:key.slice('boundary:'.length)}:
        {G2IdCandidate:key}),
    };
    root.add(object);
    targets[key]=object;
  }
  const context = new Mesh(new BoxGeometry(2,2,2),
    [new MeshBasicMaterial({color:0x993333}),new MeshBasicMaterial({color:0x339933})]);
  context.renderOrder=7;
  scene.add(context);
  const binding={
    sourceRoot:root,targets,sourceSceneIndex:63,sourceTargetCount:13,
    originalGlbDigestAuthenticated:true,
    originalSourceDigest:'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48',
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  };
  const associations=new Map<object,{nodes:number;meshes?:number;primitives?:number}>();
  associations.set(root,{nodes:1125});
  keys.forEach((key,i)=>associations.set(targets[key]!,{
    nodes:originalNodeIndices[i]!,meshes:originalMeshIndices[i]!,primitives:0,
  }));
  const gltf={scenes:Array.from({length:64},(_,i)=>i===63?scene:null),parser:{associations}};
  return {scene,root,targets,context,binding,gltf,associations};
}
test('80/20 focus changes presentation only and restores all original refs and order',()=>{
  const f=fixture();
  const items=[...Object.values(f.targets),f.context];
  const before=items.map(o=>({material:o.material,geometry:o.geometry,
    visible:o.visible,renderOrder:o.renderOrder}));
  const result=prepare({gltf:f.gltf,binding:f.binding});
  expect(result).toMatchObject({
    state:'WORK_TEST_PRESENTATION_ONLY', sourceTargetCount:13,
    presentedTargetCount:13,contextPrimitiveCount:1,targetOpacity:0.8,contextOpacity:0.2,
    webglPixelProof:false,originalGlbDigestVerifiedByThisHelper:false,
    authenticatedProductionProof:false,physicalPlacementVerified:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  });
  for(let i=0;i<items.length;i++){
    const item=items[i];
    expect(item.material).not.toBe(before[i].material);
    expect(item.geometry).toBe(before[i].geometry);
    expect(item.visible).toBe(before[i].visible);
    expect(item.renderOrder).toBe(i<13?1000:7);
    const mats=Array.isArray(item.material)?item.material:[item.material];
    for(const mat of mats){
      expect(mat.opacity).toBe(i<13?0.8:0.2);
      expect(mat.transparent).toBe(true);
      expect(mat.depthWrite).toBe(false);
      if(i<13) expect(mat.depthTest).toBe(false);
    }
  }
  expect(()=>prepare({gltf:f.gltf,binding:f.binding})).toThrow('R1125_FOCUS_8020_REJECTED');
  expect(result.restore()).toMatchObject({state:'RESTORED',exactMaterialRefsRestored:true});
  items.forEach((item,i)=>{
    expect(item.material).toBe(before[i].material);
    expect(item.geometry).toBe(before[i].geometry);
    expect(item.visible).toBe(before[i].visible);
    expect(item.renderOrder).toBe(before[i].renderOrder);
  });
  expect(result.restore().state).toBe('ALREADY_RESTORED');
  const again=prepare({gltf:f.gltf,binding:f.binding});
  expect(again.restore().state).toBe('RESTORED');
});

test('original glTF source associations reject renamed/synthetic replacements',()=>{
  const changes=[
    (f:ReturnType<typeof fixture>)=>f.associations.delete(f.root),
    (f:ReturnType<typeof fixture>)=>f.associations.set(f.root,{nodes:1124}),
    (f:ReturnType<typeof fixture>)=>f.associations.delete(f.targets[keys[0]]!),
    (f:ReturnType<typeof fixture>)=>f.associations.set(f.targets[keys[0]]!,{nodes:1105,meshes:555}),
    (f:ReturnType<typeof fixture>)=>f.associations.set(f.targets[keys[0]]!,{nodes:1104,meshes:556}),
    (f:ReturnType<typeof fixture>)=>f.associations.set(f.targets[keys[0]]!,{nodes:1104,meshes:555,primitives:1}),
    (f:ReturnType<typeof fixture>)=>f.associations.set(f.targets[keys[12]]!,{nodes:1115,meshes:534}),
  ];
  for(const mutate of changes){
    const f=fixture(), original=f.targets[keys[0]]!.material;
    mutate(f);
    expect(()=>prepare({gltf:f.gltf,binding:f.binding}))
      .toThrow('R1125_FOCUS_8020_REJECTED');
    expect(f.targets[keys[0]]!.material).toBe(original);
  }
  const f=fixture();
  // A forged userData label alone cannot replace the glTF node+mesh provenance.
  f.associations.set(f.targets[keys[0]]!,{nodes:1120,meshes:561});
  expect(f.targets[keys[0]]!.userData.G2IdCandidate).toBe(keys[0]);
  expect(()=>prepare({gltf:f.gltf,binding:f.binding}))
    .toThrow('original glTF node/mesh association mismatch');
});

test('source identity, detached root, promoted source and invisible render target fail closed',()=>{
  const changes=[
    (f:any)=>{f.binding.originalGlbDigestAuthenticated=false;},
    (f:any)=>{f.scene.userData.Canonical=true;},
    (f:any)=>{f.root.remove(f.targets[keys[0]]);},
    (f:any)=>{f.targets[keys[0]].visible=false;},
    (f:any)=>{f.targets[keys[0]].userData.currentGeometryClaim=true;},
    (f:any)=>{f.binding.targets[keys[1]]=f.targets[keys[0]];},
    (f:any)=>{f.scene.remove(f.root);},
    (f:any)=>{(f.context.material as any[])[0].visible=false;},
    (f:any)=>{f.context.material=null;},
  ];
  for(const mutate of changes) {
    const f=fixture();mutate(f);
    const initial=Object.values(f.targets).map((v:any)=>v.material);
    expect(()=>prepare({gltf:f.gltf,binding:f.binding})).toThrow('R1125_FOCUS_8020_REJECTED');
    Object.values(f.targets).forEach((v:any,i)=>expect(v.material).toBe(initial[i]));
  }
});

test('80/20 preflight rejects invisible alpha and color-write source materials before swapping',()=>{
  const changes=[
    (f:ReturnType<typeof fixture>)=>{(f.targets[keys[0]]!.material as any).colorWrite=false;},
    (f:ReturnType<typeof fixture>)=>{(f.targets[keys[1]]!.material as any).alphaTest=0.8;},
    (f:ReturnType<typeof fixture>)=>{(f.targets[keys[2]]!.material as any).alphaTest=Infinity;},
    (f:ReturnType<typeof fixture>)=>{(f.context.material as any[])[0].colorWrite=false;},
    (f:ReturnType<typeof fixture>)=>{(f.context.material as any[])[1].alphaTest=0.2;},
    (f:ReturnType<typeof fixture>)=>{(f.context.material as any[])[1].alphaTest=-0.01;},
  ];
  for(const change of changes){
    const f=fixture(), objects=[...Object.values(f.targets),f.context];
    change(f);
    const materialRefs=objects.map(o=>o.material);
    expect(()=>prepare({gltf:f.gltf,binding:f.binding}))
      .toThrow('source render material unavailable');
    objects.forEach((o,i)=>expect(o.material).toBe(materialRefs[i]));
  }
});

test('legitimately drawable alpha thresholds remain reversible WORK_TEST previews',()=>{
  const f=fixture();
  (f.targets[keys[0]]!.material as any).alphaTest=0.1;
  (f.context.material as any[])[0].alphaTest=0.1;
  const original=[f.targets[keys[0]]!.material,f.context.material];
  const prepared=prepare({gltf:f.gltf,binding:f.binding});
  expect(prepared.presentedTargetCount).toBe(13);
  expect(prepared.contextPrimitiveCount).toBe(1);
  expect(prepared.webglPixelProof).toBe(false);
  expect(prepared.restore().state).toBe('RESTORED');
  expect(f.targets[keys[0]]!.material).toBe(original[0]);
  expect(f.context.material).toBe(original[1]);
});
