import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {resolveC80R2ChainFloorScenes} from '../src/scripts/privateModelC80R2ChainScenes.mjs';
import {resolveBuildingPartLayerBindings} from '../src/scripts/privateModelBuildingPartLayerBindings.mjs';
import {K17_RAIL900_SOURCE_SHA256 as SHA,K17_RAIL900_BUILDING_PARTS as PARTS,K17_RAIL900_BUILDING_SCENES as SCENES} from '../src/scripts/privateModelK17Rail900LayerSourceProfile.mjs';
const data=fs.readFileSync(process.argv[2]);
assert.equal(data.length,31760668);
assert.equal(crypto.createHash('sha256').update(data).digest('hex'),SHA);
assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);
assert.equal(data.readUInt32LE(8),data.length);assert.equal(data.readUInt32LE(16),0x4e4f534a);
const j=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
assert.equal(j.scenes.length,308);assert.equal(j.scene,307);
const floors=resolveC80R2ChainFloorScenes(j);
assert.deepEqual([floors['1F'],floors['2F'],floors.BOTH],[305,306,307]);
assert.equal(j.asset.extras.current,false);assert.equal(j.asset.extras.asBuilt,false);
class SourceObject {
  constructor(name,isMesh=false){this.name=name;this.isMesh=isMesh;this.visible=true;this.children=[];this.parent=null;this.userData={};}
  add(child){this.children.push(child);child.parent=this;}
  traverse(cb){cb(this);for(const c of this.children)c.traverse(cb);}
}
const results=[];
for(const [key,s] of Object.entries(SCENES)) {
  const si=Number(key), source=j.scenes[si], scene=new SourceObject(source.name), associations=new Map();
  assert.equal(source.name,s.name);assert.deepEqual(source.nodes,s.rootNodes);
  const counts={};
  const add=(ni,parent,path)=>{
    assert.ok(!path.includes(ni));path=path.concat(ni);
    const d=j.nodes[ni],primitives=d.mesh===undefined?[]:j.meshes[d.mesh].primitives;
    const node=new SourceObject(d.name,primitives.length===1);node.userData=d.extras??{};
    parent.add(node);associations.set(node,{nodes:ni,...(node.isMesh?{meshes:d.mesh,primitives:0}:{})});
    if(primitives.length>1)primitives.forEach((p,pi)=>{const leaf=new SourceObject('primitive-'+pi,true);node.add(leaf);associations.set(leaf,{meshes:d.mesh,primitives:pi});});
    if(s.paths[ni]) {
      const p=PARTS[ni];assert.equal(d.name,p.name);assert.equal(d.mesh,p.mesh);
      assert.ok(s.paths[ni].some(p=>JSON.stringify(p)===JSON.stringify(path)));
      counts[ni]=primitives.length;
    }
    for(const c of d.children??[])add(c,node,path);
  };
  for(const root of source.nodes)add(root,scene,[]);
  const scenes=[];scenes[si]=scene;
  const r=resolveBuildingPartLayerBindings({gltf:{parser:{json:j,associations},scenes},activeSceneRoot:scene,sceneIndex:si,floor:s.floor,area:'D',expectedSourceSha256:SHA,loadedSourceSha256:SHA});
  assert.equal(r.sourceVerified,true);
  for(const [ni,count] of Object.entries(counts)) assert.equal(r.evidence.filter(e=>e.sourceNodeIndex===Number(ni)).length,count,'node '+ni+' scene '+si);
  assert.ok(!r.evidence.some(e=>e.sourceNodeIndex===9915 || e.sourceNodeIndex===9844));
  assert.ok(r.evidence.some(e=>e.sourceNodeIndex===9942));
  results.push({scene:si,floor:s.floor,sourceNodes:Object.keys(counts).length,primitiveBindings:r.bindings.length});
}
console.log(JSON.stringify({stage:'WORK_TEST/HOST_HOLD',sourceSHA256:SHA,sourceSize:data.length,floors,results,sourceContract:'PASS',browserWebGL:'NOT_RUN',productionWebGL:'NOT_RUN',sourceCards:'NOT_REBOUND'},null,2));
