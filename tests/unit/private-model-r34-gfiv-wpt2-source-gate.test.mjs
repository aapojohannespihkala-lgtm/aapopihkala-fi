import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 R34_GFIV_WPT2_SOURCE as SOURCE,
 r34GfivWpt2SourceGate as gate,
 resolveR34GfivWpt2Scene as resolve,
} from '../../src/scripts/privateModelR34GfivWpt2SourceGate.mjs';

test('historic WPT2 source selection remains opt-in and fail-closed',()=>{
 const fake={scenes:[],nodes:[],meshes:[],scene:292};
 assert.equal(gate(fake,SOURCE.glbSha256),null);
 assert.equal(gate({},SOURCE.glbSha256),null);
 for(const floor of ['1F',null,'3F','BOTH_OTHER'])
  assert.equal(resolve(fake,SOURCE.glbSha256,floor),null);
 assert.equal(resolve(fake,SOURCE.glbSha256,'BOTH','true'),null);
 assert.equal(resolve(fake,'0'.repeat(64),'BOTH'),null);
 assert.equal(SOURCE.defaultScene,292);
});
const filepath=process.env.R34_GFIV_WPT2_GLB_PATH;
function load(){
 const buf=readFileSync(filepath);
 assert.equal(buf.length,SOURCE.glbBytes);
 assert.equal(createHash('sha256').update(buf).digest('hex'),SOURCE.glbSha256);
 assert.equal(buf.toString('ascii',0,4),'glTF');
 const jlen=buf.readUInt32LE(12);
 assert.equal(buf.toString('ascii',16,20),'JSON');
 return JSON.parse(buf.subarray(20,20+jlen).toString('utf8'));
}
test('authentic R34 GFIV WPT2 4-scene protected source receipt',
 {skip:!filepath},()=>{
 const json=load();
 assert.ok(gate(json,SOURCE.glbSha256));
 for(const [floor,clean,hist] of [['BOTH',862,863],['2F',864,865]]){
  assert.equal(resolve(json,SOURCE.glbSha256,floor)?.scene,clean);
  const selected=resolve(json,SOURCE.glbSha256,floor,true);
  assert.equal(selected?.scene,hist);
  assert.equal(selected.sourceLinksBound,false);
  assert.equal(selected.current,false);
 }
 function rejects(change,restore){
  change();try{assert.equal(gate(json,SOURCE.glbSha256),null);}finally{restore();}
  assert.ok(gate(json,SOURCE.glbSha256));
 }
 const s863=json.scenes[863],s862=json.scenes[862],s865=json.scenes[865];
 rejects(()=>{s863.extras['2015SchematicOptIn']=false;},
  ()=>{s863.extras['2015SchematicOptIn']=true;});
 rejects(()=>{s863.extras.current=true;},()=>{s863.extras.current=false;});
 rejects(()=>{s862.nodes.push(13980);},()=>{s862.nodes.pop();});
 rejects(()=>{s865.nodes.pop();},()=>{s865.nodes.push(13980);});
 const n=json.nodes[14059],original=n.extras.sourceLinksBound;
 rejects(()=>{n.extras.sourceLinksBound=true;},()=>{n.extras.sourceLinksBound=original;});
 const donor=s863.extras.historicalDonorGLBSHA256;
 rejects(()=>{s863.extras.historicalDonorGLBSHA256='0'.repeat(64);},
  ()=>{s863.extras.historicalDonorGLBSHA256=donor;});
 assert.equal(gate(json,'0'.repeat(64)),null);
});
