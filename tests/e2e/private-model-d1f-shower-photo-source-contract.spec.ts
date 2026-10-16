import { test, expect } from '@playwright/test';
// @ts-ignore - focused raw GLB ES module is validated by the fixture tests below.
import { selectD1FShowerPhotoScene, verifyD1FShowerPhotoRawGlb, D1F_SHOWER_PHOTO_VARIANTS } from '../../src/scripts/privateModelD1FShowerPhotoSourceContract.mjs';

function sourceFixture() {
  const scenes: any[] = Array.from({length:124},()=>({nodes:[]}));
  const nodes: any[] = Array.from({length:2464},()=>({}));
  const meshes: any[] = Array.from({length:778},()=>({}));
  const materials: any[] = Array.from({length:133},()=>({}));
  meshes[777] = {
    name: 'D1F_ALAJARVI_CURVED_DOUBLE_SHOWER_DOOR_900x900_WORK_TEST',
    primitives: [{mode:4,indices:1161,material:131,attributes:{POSITION:1160}},
      {mode:4,indices:1163,material:131,attributes:{POSITION:1162}},
      {mode:4,indices:1165,material:132,attributes:{POSITION:1164}}],
    extras: {physicalInstallPositionExact:false,actualHeightMeasured:false,glassHeightMmWorkAssumption:1900}
  };
  materials[131]={alphaMode:'BLEND',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[0.83,0.95,0.95,0.27]}};
  materials[132]={extras:{status:'WORK_TEST_APPROX_NOT_MEASURED'}};
  for (const v of D1F_SHOWER_PHOTO_VARIANTS) {
    scenes[v.sceneIndex]={nodes:[v.rootNode],name:v.name+' + ALAJARVI 900x900 DOUBLE GLASS WORK_TEST'};
    scenes[v.parentSceneIndex]={nodes:[v.parentRootNode],name:v.name+' PARENT PHOTO WORK_TEST'};
    const stem='D1F_ROOT_'+v.name+'_PREVIOUS_WORK_TEST';
    const prev=Array.from({length:43},(_,i)=>i);
    nodes[v.parentRootNode]={name:stem,children:prev};
    nodes[v.rootNode]={name:stem+'_SHOWER_GLASS_900_WORK_TEST',children:[...prev,v.glassNode]};
    nodes[v.glassNode]={
      name:'D1F_ALAJARVI_DOUBLE_CURVED_GLASS_900_WORK_TEST_'+(v.sceneIndex-120),
      mesh:777,extras:{glassDimensionsMmNominal:[900,900],status:'WORK_TEST',noCurrentPromotion:true,
      wallAnchorVariant:v.name.startsWith('WEST')?'WEST':'EAST'}
    };
  }
  return {scenes,nodes,meshes,materials,scene:120,asset:{extras:{bathroomShowerGlassSuccessor20261016:{
    newScenes:[120,121,122,123],parentSha256:'d6b69d575193124ee2ca3955e08d68ee7813d60bcf8e5c22fb584cd7499321f7',
    glassHeightWorkAssumptionMm:1900,current:false,canonical:false,asBuilt:false,publishToCURRENT:false,
    humanReview:'NOT_RUN',stickers:'EXCLUDED'}}}};
}
test('accepts all four uniquely anchored scene variants as WORK_TEST only',()=>{
  const f=sourceFixture();
  for(const v of D1F_SHOWER_PHOTO_VARIANTS){
    const s=selectD1FShowerPhotoScene(f,v.name);
    expect(s.sceneIndex).toBe(v.sceneIndex);
    expect(s.glassNode).toBe(v.glassNode);
    expect(s.humanReview).toBe('NOT_RUN');
    expect(s.authenticatedProductionPixelsVerified).toBe(false);
    expect(s.current).toBe(false);
  }
});
test('rejects legacy or extra scene counts',()=>{
  const f=sourceFixture();f.scenes.pop();
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
});
test('rejects historical scene root substituted for new source scene',()=>{
  const f=sourceFixture();f.scenes[120].nodes=[2449];
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
});
test('rejects missing new glass child',()=>{
  const f=sourceFixture();f.nodes[2457].children.pop();
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
});
test('rejects substitution of a second variant into an expected scene',()=>{
  const f=sourceFixture();f.scenes[121].nodes=[2461];
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
});
test('rejects source parent substitution or claimed as-built status',()=>{
  const f=sourceFixture();f.asset.extras.bathroomShowerGlassSuccessor20261016.parentSha256='other';
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow();
  const g=sourceFixture();g.asset.extras.bathroomShowerGlassSuccessor20261016.asBuilt=true;
  expect(()=>selectD1FShowerPhotoScene(g)).toThrow();
});
test('rejects glass pane accidentally rendered opaque',()=>{
  const f=sourceFixture();f.materials[131].alphaMode='OPAQUE';
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow();
});
test('rejects wrong mesh, material, and glass nominal dimensions',()=>{
  for(const change of [
    (f:any)=>f.nodes[2456].mesh=5,
    (f:any)=>f.meshes[777].primitives[1].material=132,
    (f:any)=>f.nodes[2456].extras.glassDimensionsMmNominal=[800,900],
  ]){
    const f=sourceFixture();change(f);
    expect(()=>selectD1FShowerPhotoScene(f)).toThrow();
  }
});
test('rejects invented exact height and a false human acceptance',()=>{
  const f=sourceFixture();f.meshes[777].extras.actualHeightMeasured=true;
  expect(()=>selectD1FShowerPhotoScene(f)).toThrow();
  const g=sourceFixture();g.asset.extras.bathroomShowerGlassSuccessor20261016.humanReview='PASS';
  expect(()=>selectD1FShowerPhotoScene(g)).toThrow();
});
test('rejects unsupported variant and invalid raw bytes before any review selection',async()=>{
  expect(()=>selectD1FShowerPhotoScene(sourceFixture(),'UNKNOWN_VARIANT')).toThrow();
  await expect(verifyD1FShowerPhotoRawGlb(new Uint8Array(12))).rejects.toThrow('D1F_SHOWER_PHOTO_SOURCE_OR_VARIANT_INVALID');
});
