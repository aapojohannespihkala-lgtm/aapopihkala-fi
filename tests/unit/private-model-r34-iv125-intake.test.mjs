import assert from 'node:assert/strict';
import test from 'node:test';
import {
  R34_IV125_INTAKE as S, r34Iv125ExactSource,
  r34Iv125SelectScene, r34Iv125BoundSourceLinks,
} from '../../src/scripts/privateModelR34Iv125Intake.mjs';

// Synthetic source-graph guards only. Not a production or original-GLB WebGL test.
function fixture() {
  const nodes = Array.from({length:S.nodeCount}, () => ({}));
  const scenes = Array.from({length:S.sceneCount}, (_,i) => ({name: 'unused__scene'+i,nodes:[2]}));
  const rendered = Array.from({length:S.sceneCount}, (_,i) => ({name:scenes[i].name}));
  scenes[894] = {name:'R34_IV125_BOTH_NORMAL_WORK_TEST_HOST_HOLD__scene894',nodes:[2]};
  scenes[895] = {name:'R34_IV125_BOTH_SERVICE_WORK_TEST_HOST_HOLD__scene895',nodes:[3]};
  rendered[894].name = scenes[894].name;
  rendered[895].name = scenes[895].name;
  const links=[{title:'Original drawing',url:'https://example.com/source'}];
  nodes[1]={name:'host',extras:{sourceLinks:links}};
  nodes[2]={children:[1]};
  nodes[3]={children:[1]};
  const candidate={id:S.candidateId,path:S.path};
  const gltf={scenes:rendered,parser:{json:{scene:292,scenes,nodes,meshes:Array.from({length:S.meshCount},()=>({}))},associations:new Map()}};
  const selected={name:'host',userData:{sourceLinks:links},parent:rendered[894]};
  gltf.parser.associations.set(selected,{nodes:1});
  return {candidate,gltf,selected,links};
}

test('exact protected candidate uses the same 69,980,160 source bytes as the Worker receipt',()=>{
  const x=fixture();
  assert.deepEqual(r34Iv125ExactSource(x.candidate),{glbBytes:S.glbBytes,glbSha256:S.glbSha256});
  assert.equal(r34Iv125ExactSource({id:'other',path:x.candidate.path}),undefined);
  assert.throws(()=>r34Iv125ExactSource({...x.candidate,path:'/private-model/work-test/wrong.glb'}),/PATH_MISMATCH/);
});

test('output SHA selects BOTH 894/895, never default292',()=>{
  const {gltf}=fixture();
  assert.equal(r34Iv125SelectScene(gltf,S.glbSha256),gltf.scenes[894]);
  assert.equal(r34Iv125SelectScene(gltf,S.glbSha256,'service'),gltf.scenes[895]);
  assert.notEqual(r34Iv125SelectScene(gltf,S.glbSha256),gltf.scenes[292]);
  assert.throws(()=>r34Iv125SelectScene(gltf,'0'.repeat(64)),/OUTPUT_SHA/);
  assert.throws(()=>r34Iv125SelectScene(gltf,S.glbSha256,'default'),/UNKNOWN_VIEW/);
});

test('scene integrity rejects default292 substitution, missing BOTH, altered node counts',()=>{
  for(const mutate of [
    g=>{g.parser.json.scene=894;},
    g=>{g.parser.json.scenes[894].name='R34__scene292';},
    g=>{g.parser.json.scenes[895].nodes=[];},
    g=>{g.parser.json.nodes.pop();},
  ]) {
    const {gltf}=fixture(); mutate(gltf);
    assert.throws(()=>r34Iv125SelectScene(gltf,S.glbSha256));
  }
});

test('sourceLinks require output SHA + mounted scene + exact source parent',()=>{
  const {gltf,selected,links}=fixture();
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[894],object:selected,links}),links);
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:'0'.repeat(64),mountedScene:gltf.scenes[894],object:selected,links}),[]);
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[292],object:selected,links}),[]);
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[894],object:selected,links:[{title:'wrong'}]}),[]);
  gltf.parser.json.scenes[894].nodes=[9];
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[894],object:selected,links}),[]);
});

test('parent association changes or mutated sourceLinks fail closed',()=>{
  const {gltf,selected,links}=fixture();
  const parent={parent:gltf.scenes[894],userData:{},name:'parent'};
  selected.parent=parent;
  gltf.parser.associations.set(parent,{nodes:2});
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[894],object:selected,links}),links);
  gltf.parser.json.nodes[2].children=[77];
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[894],object:selected,links}),[]);
  gltf.parser.json.nodes[2].children=[1];
  selected.userData.sourceLinks=[{title:'forged'}];
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[894],object:selected,links}),[]);
});

test('scene894-to-895 identity is separately enforced and cannot reuse stale 894 object',()=>{
  const {gltf,selected,links}=fixture();
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[895],object:selected,links}),[]);
  selected.parent=gltf.scenes[895];
  gltf.parser.json.scenes[895].nodes=[1];
  assert.deepEqual(r34Iv125BoundSourceLinks({gltf,digest:S.glbSha256,mountedScene:gltf.scenes[895],object:selected,links}),links);
});
