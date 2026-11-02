import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBuildingPartLayerBindings } from '../../src/scripts/privateModelBuildingPartLayerBindings.mjs';

const HASH = 'cff2dbead53b7836747e10ef359637114ff723690ec380e313cec817e4f71d31';
class Object3D {
  constructor(name = '', isMesh = false) {
    this.name = name;
    this.isMesh = isMesh;
    this.parent = null;
    this.children = [];
    this.visible = true;
    this.material = { name: name + '-source' };
    this.userData = {};
  }
  add(child) { this.children.push(child); child.parent = this; return this; }
  traverse(cb) { cb(this); for (const child of this.children) child.traverse(cb); }
}
const scope = (objectKey, apartmentScope, storeyScope, role = 'CONTENT') => ({
  objectKey, apartmentScope, storeyScope, role, phaseScope: 'ACTIVE_IN_SELECTED_WORKTEST',
});
function fixture() {
  const scene = new Object3D('scene');
  const group = new Object3D('GLTF_NODE_ROOT');
  scene.add(group);
  const entries = [
    ['wallD1', 'G2_WALL_EXT_A1', scope('wallD1','D','1F')],
    ['windowD2', 'G2_WINDOW_A2', scope('windowD2','D','2F')],
    ['wallA1', 'G2_WALL_INT_A3', scope('wallA1','A','1F')],
    ['helper', 'G2_WALL_INT_H', scope('helper','D','1F'), { presentationOnly: true }],
    ['floorD1', 'G2_FLOOR_A4', scope('floorD1','D','1F')],
    ['ceilingD2', 'G2_CEILING_A5', scope('ceilingD2','D','2F')],
    ['fixtureBoth', 'G2_FIXTURE_A6', scope('fixtureBoth','D','BOTH')],
    ['roofD2', 'G2_ROOF_A7', scope('roofD2','D','2F')],
    ['doorD1', 'G2_DOOR_EXT_A8', scope('doorD1','D','1F')],
    ['unknown', 'G2_WINDOW_A9', null],
    ['refFloor', 'G2_FLOOR_A10', scope('refFloor','D','1F'), { sourceRole:'REFERENCE_ONLY' }],
  ];
  const children = [];
  const objects = {};
  const nodes = [{children:[]}];
  const associations = new Map([[group, { nodes:0 }]]);
  entries.forEach(([name,g2,ylisViewScope,more],i)=>{
    const index=i+1, obj=new Object3D(name,true);
    group.add(obj); objects[name]=obj;children.push(index);
    nodes.push({extras: {G2Id:g2,...(ylisViewScope?{ylisViewScope}:{}),...(more??{})}});
    associations.set(obj,{ nodes:index, meshes:i });
  });
  nodes[0].children = children;
  const gltf = {scenes:[scene],parser:{json:{scenes:[{nodes:[0]}],nodes},associations}};
  const options={gltf,expectedSourceSha256:HASH,loadedSourceSha256:HASH,sceneIndex:0,activeSceneRoot:scene,area:'D',floor:'1F'};
  return {scene,group,gltf,objects,options};
}
const ids = result => result.bindings.map(x=>x.id).sort();

test('explicit 1F D bindings only, excludes A, 2F, roof and helpers',()=>{
  const {options,objects}=fixture();
  const before=objects.wallD1.material;
  const result=resolveBuildingPartLayerBindings(options);
  assert.equal(result.sourceVerified,true);
  assert.deepEqual(ids(result), ['architecture-doors','architecture-floors','architecture-walls-exterior']);
  assert.equal(result.frame.gates.get(objects.wallD1).floorAllowed,true);
  assert.equal(result.frame.availableNodeIds.length,3);
  assert.strictEqual(objects.wallD1.material,before);
  assert.equal(objects.wallA1.visible,true); // read-only resolver, no state mutation
});
test('2F D and BOTH D obey source storey boundaries',()=>{
  const f=fixture();
  let result=resolveBuildingPartLayerBindings({...f.options,floor:'2F'});
  assert.deepEqual(ids(result),['architecture-ceilings','architecture-windows']);
  result=resolveBuildingPartLayerBindings({...f.options,floor:'BOTH'});
  assert.deepEqual(ids(result),[
    'architecture-ceilings','architecture-doors','architecture-fixtures',
    'architecture-floors','architecture-walls-exterior','architecture-windows',
  ]);
});
test('WHOLE scope includes A but D scope never does',()=>{
  const f=fixture();
  const whole=resolveBuildingPartLayerBindings({...f.options,area:'WHOLE'});
  assert.deepEqual(ids(whole),[
    'architecture-doors','architecture-floors','architecture-walls-exterior','architecture-walls-interior',
  ]);
});
test('wrong SHA and stale active scene deny all',()=>{
  const f=fixture();
  const noHash=resolveBuildingPartLayerBindings({...f.options,loadedSourceSha256:'0'.repeat(64)});
  assert.equal(noHash.sourceVerified,false);
  assert.equal(noHash.bindings.length,0);
  const wrongScene=resolveBuildingPartLayerBindings({...f.options,activeSceneRoot:new Object3D('wrong')});
  assert.equal(wrongScene.sourceVerified,false);
  assert.equal(wrongScene.bindings.length,0);
});
test('hidden source parent or renderable never becomes a bridge binding',()=>{
  const f=fixture();
  f.group.visible=false;
  assert.equal(resolveBuildingPartLayerBindings(f.options).bindings.length,0);
  f.group.visible=true;
  f.objects.wallD1.visible=false;
  assert.ok(!resolveBuildingPartLayerBindings(f.options).bindings.some(x=>x.root===f.objects.wallD1));
});
test('source parser extras prevail over runtime userData and names',()=>{
  const f=fixture();
  f.objects.unknown.name='D_1F_PHYSICAL_WINDOW';
  f.objects.unknown.userData.ylisViewScope=scope('fabricated','D','1F');
  f.objects.unknown.userData.G2Id='G2_WINDOW_FAKE';
  assert.ok(!resolveBuildingPartLayerBindings(f.options).bindings.some(x=>x.root===f.objects.unknown));
});
test('node association must belong to exact source scene graph',()=>{
  const f=fixture();
  f.gltf.parser.associations.set(f.objects.wallD1,{nodes:12345});
  assert.ok(!resolveBuildingPartLayerBindings(f.options).bindings.some(x=>x.root===f.objects.wallD1));
});
test('duplicate glTF-parentage and cyclic source graph fail closed',()=>{
  const f=fixture();
  f.gltf.parser.json.nodes[0].children.push(1);
  assert.equal(resolveBuildingPartLayerBindings(f.options).sourceVerified,false);
  const cycle=fixture();
  cycle.gltf.parser.json.nodes[1].children=[0];
  assert.equal(resolveBuildingPartLayerBindings(cycle.options).sourceVerified,false);
});
test('legacy roof remains owned by existing roof controller',()=>{
  const f=fixture();
  const result=resolveBuildingPartLayerBindings({...f.options,floor:'BOTH'});
  assert.ok(!result.bindings.some(x=>x.root===f.objects.roofD2));
  assert.ok(result.excluded.some(x=>x.reason==='LEGACY_ROOF_CONTROLLER'));
});
test('shared C/D boundary admitted only in D BOTH, not single-floor',()=>{
  const f=fixture();
  const target=f.objects.fixtureBoth;
  const nodeIndex=f.gltf.parser.associations.get(target).nodes;
  f.gltf.parser.json.nodes[nodeIndex].extras.ylisViewScope=scope('shared','SHARED_CD','BOTH','SHARED_BOUNDARY');
  const both=resolveBuildingPartLayerBindings({...f.options,floor:'BOTH'});
  assert.ok(both.bindings.some(x=>x.root===target));
  const one=resolveBuildingPartLayerBindings({...f.options,floor:'1F'});
  assert.ok(!one.bindings.some(x=>x.root===target));
});

test('nested mesh descendants are not handed to non-overlapping bridge',()=>{
  const f=fixture();
  const inner=new Object3D('nested',true);
  f.objects.wallD1.add(inner);
  f.gltf.parser.associations.set(inner,{nodes:1});
  const result=resolveBuildingPartLayerBindings(f.options);
  assert.ok(!result.bindings.some(x=>x.root===f.objects.wallD1 || x.root===inner));
  assert.ok(result.excluded.some(x=>x.reason==='NESTED_MESH_HIERARCHY'));
});

test('identity and G2_FURN source extras use existing building families without runtime metadata',()=>{
  const f=fixture();
  const doorIndex=f.gltf.parser.associations.get(f.objects.doorD1).nodes;
  const fixtureIndex=f.gltf.parser.associations.get(f.objects.fixtureBoth).nodes;
  delete f.gltf.parser.json.nodes[doorIndex].extras.G2Id;
  f.gltf.parser.json.nodes[doorIndex].extras.identity='G2_DOOR_INT_D_1F_TEST';
  f.gltf.parser.json.nodes[fixtureIndex].extras.G2Id='G2_FURN_D_1F_TEST';
  const result=resolveBuildingPartLayerBindings({...f.options,floor:'BOTH'});
  assert.ok(result.bindings.some(b=>b.root===f.objects.doorD1 && b.id==='architecture-doors'));
  assert.ok(result.bindings.some(b=>b.root===f.objects.fixtureBoth && b.id==='architecture-fixtures'));
});

test('a repeated source node on distinct valid parent routes does not reject an unrelated scene',()=>{
  const f=fixture();
  const cloneParent=new Object3D('second-parent');
  const cloneWall=new Object3D('wallD1-copy',true);
  f.scene.add(cloneParent);cloneParent.add(cloneWall);
  const parentIndex=f.gltf.parser.json.nodes.length;
  f.gltf.parser.json.nodes.push({children:[1]});
  f.gltf.parser.json.scenes[0].nodes.push(parentIndex);
  f.gltf.parser.associations.set(cloneParent,{nodes:parentIndex});
  f.gltf.parser.associations.set(cloneWall,{nodes:1});
  const result=resolveBuildingPartLayerBindings(f.options);
  assert.equal(result.sourceVerified,true);
  assert.ok(result.bindings.some(b=>b.root===cloneWall));
  assert.ok(result.bindings.some(b=>b.root===f.objects.wallD1));
  assert.deepEqual(result.evidence.find(b=>b.sourceNodePath[0]===parentIndex)?.sourceNodePath,[parentIndex,1]);
});

function v26Fixture(sceneIndex=162) {
  const definitions={
    8199:{name:'C80R2_V20_D2F_PW26_PINK_WEST_WALL_CONTINUOUS_Y0P025_5P05',mesh:2589},
    8198:{name:'C80R2_V20_D2F_WHOLE_FLOOR_PALE_PLANK_CONTINUOUS_EXCEPT_WC_STAIR',mesh:2588},
    8003:{name:'C80R2_V16_D2F_INNER_CEILING_WHITE_VISIBLE_FROM_BELOW_ONLY',mesh:2450},
    6656:{name:'ARK3_1985_GABLE_ROOF_EXTENDED_TO_EAST_PLANE_WORK_TEST',mesh:1941},
    7723:{name:'source-roof-parent',children:[6656]},
  };
  const scene=new Object3D('V26');
  const associations=new Map(),objects={},nodes=[];
  const create=i=>{
    const def=definitions[i],object=new Object3D(def.name,def.mesh!==undefined);
    objects[i]=object;nodes[i]=structuredClone(def);associations.set(object,{nodes:i});
    for(const child of def.children??[])object.add(create(child));
    return object;
  };
  const roots=sceneIndex===175?[8199,8198,8003,7723]:[8199,8198,8003];
  for(const i of roots)scene.add(create(i));
  const scenes=new Array(176),sourceScenes=new Array(176);
  scenes[sceneIndex]=scene;
  sourceScenes[sceneIndex]={nodes:roots,name:sceneIndex===175
    ?'C80R2_V26_BOTH_STAIR_RAIL_LANDING_END_PLYWOOD_WORK_TEST_HOST_HOLD_20261102'
    :'C80R2_V20_D2F_FLOOR_PINK_POST_HOOD_ISLAND_KIV_WORK_TEST_HOST_HOLD_20261102'};
  const gltf={scenes,parser:{json:{nodes,scenes:sourceScenes},associations}};
  const options={gltf,expectedSourceSha256:HASH,loadedSourceSha256:HASH,sceneIndex,activeSceneRoot:scene,area:'D',floor:sceneIndex===175?'BOTH':'2F'};
  return {objects,scene,gltf,options};
}

test('V26 source profile admits actual current wall/floor/ceiling without pretending metadata was added',()=>{
  const f=v26Fixture();const before=JSON.stringify(f.gltf.parser.json);
  const result=resolveBuildingPartLayerBindings(f.options);
  assert.deepEqual(ids(result),['architecture-ceilings','architecture-floors','architecture-walls-interior']);
  assert.equal(result.evidence.find(e=>e.sourceNodeIndex===8199).sourceMeshIndex,2589);
  assert.equal(result.evidence.find(e=>e.sourceNodeIndex===8003).id,'architecture-ceilings');
  assert.ok(result.evidence.every(e=>e.bindingKind==='EXACT_V26_SOURCE_PROFILE'));
  assert.equal(JSON.stringify(f.gltf.parser.json),before);
  assert.deepEqual(f.objects[8199].userData,{});
});

test('V26 profile requires exact SHA, original scene, node mesh, name and source parent route',()=>{
  const other=v26Fixture();
  assert.equal(resolveBuildingPartLayerBindings({...other.options,loadedSourceSha256:'1'.repeat(64),expectedSourceSha256:'1'.repeat(64)}).bindings.length,0);
  const badMesh=v26Fixture();badMesh.gltf.parser.json.nodes[8199].mesh=1;
  assert.ok(!resolveBuildingPartLayerBindings(badMesh.options).bindings.some(b=>b.root===badMesh.objects[8199]));
  const badName=v26Fixture();badName.objects[8199].name='looks-like-a-wall';
  assert.ok(!resolveBuildingPartLayerBindings(badName.options).bindings.some(b=>b.root===badName.objects[8199]));
  const wrongFloor=v26Fixture();
  assert.equal(resolveBuildingPartLayerBindings({...wrongFloor.options,floor:'1F'}).bindings.length,0);
  const badPath=v26Fixture();const group=new Object3D('different-source-parent');
  badPath.scene.children=badPath.scene.children.filter(c=>c!==badPath.objects[8199]);
  group.add(badPath.objects[8199]);badPath.scene.add(group);
  badPath.gltf.parser.json.nodes[7]={children:[8199]};
  badPath.gltf.parser.json.scenes[162].nodes=badPath.gltf.parser.json.scenes[162].nodes.filter(i=>i!==8199).concat(7);
  badPath.gltf.parser.associations.set(group,{nodes:7});
  assert.ok(!resolveBuildingPartLayerBindings(badPath.options).bindings.some(b=>b.root===badPath.objects[8199]));
});

test('V26 roof takeover binds only its exact BOTH source route and remains separate from inner ceiling',()=>{
  const f=v26Fixture(175);const result=resolveBuildingPartLayerBindings(f.options);
  assert.ok(result.bindings.some(b=>b.id==='roof' && b.root===f.objects[6656]));
  assert.ok(result.bindings.some(b=>b.id==='architecture-ceilings' && b.root===f.objects[8003]));
  assert.deepEqual(result.evidence.find(e=>e.sourceNodeIndex===6656).sourceNodePath,[7723,6656]);
  f.gltf.parser.json.nodes[8199].extras={ylisViewScope:scope('wrong-area','A','2F')};
  assert.ok(!resolveBuildingPartLayerBindings(f.options).bindings.some(b=>b.root===f.objects[8199]));
});

test('multi-primitive source nodes bind only leaf meshes and retain nearest source node provenance',()=>{
  const f=v26Fixture();const floor=f.objects[8198];floor.isMesh=false;
  const leaves=Array.from({length:4},(_,primitive)=>{
    const mesh=new Object3D('floor-part-'+primitive,true);floor.add(mesh);
    f.gltf.parser.associations.set(mesh,{meshes:2588,primitives:primitive});return mesh;
  });
  const result=resolveBuildingPartLayerBindings(f.options);
  assert.equal(result.bindings.filter(b=>b.id==='architecture-floors').length,4);
  assert.ok(leaves.every(mesh=>result.bindings.some(b=>b.root===mesh)));
  assert.ok(result.evidence.filter(e=>e.id==='architecture-floors').every(e=>e.sourceNodeIndex===8198));
  f.gltf.parser.associations.set(leaves[0],{meshes:999,primitives:0});
  assert.ok(!resolveBuildingPartLayerBindings(f.options).bindings.some(b=>b.root===leaves[0]));
});
