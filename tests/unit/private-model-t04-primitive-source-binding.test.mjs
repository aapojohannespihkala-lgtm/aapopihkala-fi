import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveT04PrimitiveSourceBinding } from '../../src/scripts/privateModelT04PrimitiveSourceBinding.mjs';

// R4E raw ZIP/GLB node1276/mesh859: one semantic SHARED_CD source object,
// two glTF primitives. Browser renderer/clipping and loaded byte proof are
// separate gates; these fixtures test only graph-to-source binding.
const SHA='e840c5fa14c0f919aa9617fdd9cd3ae144f511e5e0a023641e6599431b074807';
const KEY='node@9bd394795b6bee37de9aea6f6b128cf93e9489a34015852d2d59082a3529013e:n1276';
const scope = () => ({objectKey:KEY,sourceNodeIndex:1276,sourceMeshIndex:859,
  apartmentScope:'SHARED_CD',storeyScope:'BOTH',role:'SHARED_BOUNDARY',
  phaseScope:'ACTIVE_IN_SELECTED_WORKTEST'});
const fixture = () => {
  const root={isGroup:true,children:[],parent:null};
  const group={isGroup:true,children:[],userData:{ylisViewScope:scope()},parent:root};
  const a={isMesh:true,geometry:{},material:{},userData:{},children:[],parent:group};
  const b={isMesh:true,geometry:{},material:{},userData:{},children:[],parent:group};
  root.children=[group];group.children=[a,b];
  const args={root,sourceGroup:group,loadedZipSha256:SHA,expectedZipSha256:SHA,
    expectedObjectKey:KEY,expectedNodeIndex:1276,expectedMeshIndex:859};
  return {args,root,group,a,b};
};

test('real R4E node1276 maps two primitives to ONE source identity',()=>{
  const f=fixture();
  const oldScope=f.group.userData.ylisViewScope;
  const res=resolveT04PrimitiveSourceBinding(f.args);
  assert.equal(res.ok,true);assert.equal(res.reason,'T04_SOURCE_PRIMITIVES_IDENTIFIED_ONLY');
  assert.deepEqual(res.sharedMeshes,[f.a,f.b]);assert.equal(res.sourceObjectKey,KEY);
  assert.equal(res.source.zipSha256,SHA);assert.equal(res.primitiveCount,2);
  assert.equal(res.canApplyToViewer,false);assert.equal(res.canPublish,false);
  assert.equal(f.group.userData.ylisViewScope,oldScope);
  assert.equal(f.a.userData.ylisViewScope,undefined);
  assert.equal(f.b.userData.ylisViewScope,undefined);
  assert.ok(Object.isFrozen(res.sharedMeshes));
});

test('reject mismatched actual ZIP hash',()=>{
  const f=fixture(); assert.equal(resolveT04PrimitiveSourceBinding({...f.args,loadedZipSha256:'f'.repeat(64)}).reason,'SOURCE_BYTES_NOT_ATTESTED');
});
test('reject missing byte attestation',()=>{
  const f=fixture();delete f.args.loadedZipSha256;
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).ok,false);
});
test('reject incorrect objectKey',()=>{
  const f=fixture();f.args.expectedObjectKey='node:unrelated';
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'SOURCE_GROUP_SCOPE_NOT_VERIFIED');
});
test('reject changed glTF node/mesh identity',()=>{
  const f=fixture();f.group.userData.ylisViewScope.sourceMeshIndex=858;
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'SOURCE_GROUP_SCOPE_NOT_VERIFIED');
});
test('reject missing or wrong SHARED_CD/BOTH boundary scope',()=>{
  for (const [key,v] of [['apartmentScope','D'],['storeyScope','1F'],['role','CONTENT'],['phaseScope','UNKNOWN']]){
    const f=fixture();f.group.userData.ylisViewScope[key]=v;
    assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'SOURCE_GROUP_SCOPE_NOT_VERIFIED');
  }
});
test('reject source group outside loaded scene',()=>{
  const f=fixture();f.group.parent={};
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'SOURCE_GROUP_OUTSIDE_LOADED_ROOT');
});
test('reject a single-primitive mesh instead of source Group',()=>{
  const f=fixture();f.group.isMesh=true;
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'SOURCE_GROUP_NOT_VERIFIED');
});
test('reject incomplete or extra primitive children',()=>{
  const a=fixture();a.group.children=[a.a];
  assert.equal(resolveT04PrimitiveSourceBinding(a.args).reason,'PRIMITIVE_CHILDREN_NOT_VERIFIED');
  const b=fixture();b.group.children.push({...b.a,parent:b.group});
  assert.equal(resolveT04PrimitiveSourceBinding(b.args).reason,'PRIMITIVE_CHILDREN_NOT_VERIFIED');
});
test('reject duplicate primitive reference',()=>{
  const f=fixture();f.group.children=[f.a,f.a];
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'PRIMITIVE_CHILDREN_NOT_VERIFIED');
});
test('reject metadata wrongly copied to child to evade duplicate-key safeguards',()=>{
  const f=fixture();f.a.userData.ylisViewScope=scope();
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'PRIMITIVE_CHILDREN_NOT_VERIFIED');
});
test('reject a material-less or nested primitive',()=>{
  for(const fn of [f=>{f.a.material=null;},f=>{f.b.children=[{}];},f=>{f.a.parent=null;}]){
    const f=fixture();fn(f);
    assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'PRIMITIVE_CHILDREN_NOT_VERIFIED');
  }
});
test('reject attempts to skip source-verification metadata',()=>{
  const f=fixture();delete f.group.userData.ylisViewScope;
  assert.equal(resolveT04PrimitiveSourceBinding(f.args).reason,'SOURCE_GROUP_SCOPE_NOT_VERIFIED');
});
