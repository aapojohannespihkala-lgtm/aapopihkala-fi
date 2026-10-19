import {expect, test} from '@playwright/test';
import {
  SOURCE156_WALL_CUTAWAY as S,
  Source156CutawayError,
  createSource156WallCutaway,
} from '../../src/scripts/privateModelD1FSource156WallCutaway.mjs';

const originalTargetSourceNodes=[2251,2583,2580,2499,2733,2773,2654];

function fixture() {
  const roots=[2855,2615,2640,2653,2707,2771,2772];
  const wall={
    name:S.wallName,visible:true,
    children:[],
    geometry:{id:'original-source-mesh773-four-primitives'},
  };
  const targets=originalTargetSourceNodes.map((nodeId)=>({
    nodeId,name:'ORIGINAL_SOURCE_'+nodeId,visible:true,
    geometry:{id:'unchanged-original-target-'+nodeId},
  }));
  const objects=[wall,...targets];
  const associations=new Map(objects.map((o,i)=>[
    o,{nodes:i===0?S.wallNodeId:originalTargetSourceNodes[i-1]},
  ]));
  const scene={traverse(cb){for(const object of objects)cb(object);}};
  const scenes=Array.from({length:158},()=>({nodes:[]}));
  scenes[156]={nodes:roots};
  const nodes=Array.from({length:2857},()=>({}));
  nodes[S.wallNodeId]={
    name:S.wallName,mesh:S.wallMeshId,
    extras:{WORK_TEST_ONLY:true,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'},
  };
  const meshes=Array.from({length:1064},()=>({primitives:[]}));
  meshes[S.wallMeshId]={
    primitives:[106,128,129,130].map(material=>({material})),
  };
  const gltf={scene,scenes:Array.from({length:158},(_,i)=>
    i===156?scene:{}),parser:{
    json:{scene:156,scenes,nodes,meshes},
    associations,
  }};
  return {gltf,wall,targets,objects,associations,scene};
}
const instantiate=f=>createSource156WallCutaway({
  gltf:f.gltf,authenticatedSourceSha256:S.sourceSha256,
  candidateId:S.candidateId,
});

test('original SOURCE156 wall2448 is exactly four immutable primitives, not an inferred new wall',()=>{
  expect(S).toMatchObject({
    sceneIndex:156,sceneCount:158,wallNodeId:2448,wallMeshId:773,
    sourceSha256:'14eed1eff91785682ac7d5c7cd0e9dec6b2ba053f41f539242e2ab120a29af51',
    originalPrimitiveMaterialIds:[106,128,129,130],
    presentationOnly:true,physicalAbsoluteXYZVerified:false,
    current:false,canonical:false,asBuilt:false,humanReview:'NOT_RUN',
  });
  expect(S.wallName).toContain('D1F_WC_CONTINUOUS_WALL_');
});

test('one reversible presentation cutaway hides only original wall mesh, never seven target nodes',()=>{
  const f=fixture();
  const priorGeometries=f.objects.map(x=>x.geometry);
  const state=instantiate(f);
  expect(state.state()).toMatchObject({
    originalWallNodeId:2448,originalPrimitiveCount:4,
    presentationCutawayActive:false,productionPixelsVerified:false,
    humanReview:'NOT_RUN',
  });
  const hidden=state.setPresentation('HIDE_FOR_PRESENTATION');
  expect(hidden).toMatchObject({
    presentationCutawayActive:true,persistentModelChanged:false,
    originalGeometryChanged:false,current:false,canonical:false,asBuilt:false,
  });
  expect(f.wall.visible).toBe(false);
  expect(f.targets.every(x=>x.visible===true)).toBe(true);
  expect(f.objects.map(x=>x.geometry)).toEqual(priorGeometries);
  const restored=state.setPresentation('RESTORE_ORIGINAL');
  expect(restored.presentationCutawayActive).toBe(false);
  expect(f.objects.every(x=>x.visible===true)).toBe(true);
  expect(state.restore().presentationCutawayActive).toBe(false);
  expect(f.objects.map(x=>x.geometry)).toEqual(priorGeometries);
});

test('cutaway is strict fail-closed for duplicate HIDE, stale RESTORE and unknown action',()=>{
  const f=fixture(),s=instantiate(f);
  expect(()=>s.setPresentation('RESTORE_ORIGINAL')).toThrow(/INVALID_RESTORE/);
  expect(()=>s.setPresentation('MAKE_CURRENT')).toThrow(/UNKNOWN_ACTION/);
  s.setPresentation('HIDE_FOR_PRESENTATION');
  expect(()=>s.setPresentation('HIDE_FOR_PRESENTATION')).toThrow(/NOT_PRISTINE/);
  expect(s.restore().presentationCutawayActive).toBe(false);
  expect(f.wall.visible).toBe(true);
  expect(s.restore().productionPixelsVerified).toBe(false);
  f.wall.visible=false;
  expect(()=>s.setPresentation('HIDE_FOR_PRESENTATION')).toThrow(/NOT_PRISTINE/);
  expect(s.restore().presentationCutawayActive).toBe(false);
  expect(f.wall.visible).toBe(false); // never overwrite an external owner
});

test('wrong candidate, wrong full-GLB SHA or wrong scene cannot enable source cutaway',()=>{
  const f=fixture();
  expect(()=>createSource156WallCutaway({
    gltf:f.gltf,authenticatedSourceSha256:'wrong',candidateId:S.candidateId,
  })).toThrow(/SOURCE_IDENTITY/);
  expect(()=>createSource156WallCutaway({
    gltf:f.gltf,authenticatedSourceSha256:S.sourceSha256,candidateId:'wrong',
  })).toThrow(/SOURCE_IDENTITY/);
  f.gltf.parser.json.scene=155;
  expect(()=>instantiate(f)).toThrow(/ORIGINAL_SCENE/);
  f.gltf.parser.json.scene=156;
  f.gltf.parser.json.scenes[156].nodes.pop();
  expect(()=>instantiate(f)).toThrow(/ORIGINAL_SCENE/);
});

test('wrong wall name, material, metadata, missing association or duplicated association rejects',()=>{
  const f=fixture(),wall=f.gltf.parser.json.nodes[2448];
  wall.name='OTHER_WALL';
  expect(()=>instantiate(f)).toThrow(/EXACT_ORIGINAL_WALL_4_PRIMITIVES/);
  wall.name=S.wallName;
  const primitive=f.gltf.parser.json.meshes[773].primitives[2];
  primitive.material=999;
  expect(()=>instantiate(f)).toThrow(/EXACT_ORIGINAL_WALL_4_PRIMITIVES/);
  primitive.material=129;
  wall.extras.asBuilt=true;
  expect(()=>instantiate(f)).toThrow(/EXACT_ORIGINAL_WALL_4_PRIMITIVES/);
  wall.extras.asBuilt=false;
  f.associations.delete(f.wall);
  expect(()=>instantiate(f)).toThrow(/WALL_SOURCE_NODE_NOT_PRISTINE/);
  f.associations.set(f.wall,{nodes:2448});
  f.associations.set(f.targets[0],{nodes:2448});
  expect(()=>instantiate(f)).toThrow(/WALL_SOURCE_NODE_NOT_PRISTINE/);
  expect(f.wall.visible).toBe(true);
});

test('a missing trusted GLTFLoader association or previously hidden wall never passes',()=>{
  const f=fixture();
  f.gltf.parser.associations=null;
  expect(()=>instantiate(f)).toThrow(Source156CutawayError);
  f.gltf.parser.associations=f.associations;
  f.wall.visible=false;
  expect(()=>instantiate(f)).toThrow(/WALL_SOURCE_NODE_NOT_PRISTINE/);
});
