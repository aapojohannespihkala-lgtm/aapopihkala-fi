import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 C80_584_GLB_SHA256 as SHA,C80_584_GLB_BYTES as BYTES,
 C80_584_ZIP_SHA256 as ZIP,C80_584_ZIP_DRIVE_ID as DRIVE,
 C80_584_PARENT_GLB_SHA256 as PARENT,C80_584_DONOR_GLB_SHA256 as DONOR,
 C80_584_SCENES as SCENES,c80584RootHash as hash,
 isC80584K12Evidence as evidence,isC80584ExactSourceScene as valid,
 c80584SourceOnlyReceipt as receipt,
} from '../../src/scripts/privateModelC80584All5K12TileSourceProfile.mjs';

test('C80 584 original source identity and exactly six appended opt-in roles',()=>{
 for(const s of [SHA,ZIP,PARENT,DONOR])assert.match(s,/^[a-f0-9]{64}$/);
 assert.equal(DRIVE,'1hKwKUxNZu-Azdvc6TqbfU59mNx0RVlvG');
 assert.equal(BYTES,56608100);
 assert.deepEqual(Object.keys(SCENES),['578','579','580','581','582','583']);
 for(const s of Object.values(SCENES)){
  assert.equal(s.parent,s.scene-6);
  assert.equal(s.tiles,s.floor!=='2F');
 }
 assert.equal(valid({},SHA,580,'BOTH'),false);
 assert.equal(valid({},PARENT,580,'BOTH'),false);
 assert.equal(valid({},'0'.repeat(64),580,'BOTH'),false);
 assert.equal(valid({},SHA,574,'BOTH'),false);
 assert.equal(evidence({}),false);
 assert.deepEqual(receipt({},SHA,580,'BOTH'),{
  exactSource:false,stage:'WORK_TEST_HOST_HOLD',sourceOnly:true,
  sourceLinksBound:false,publishAllowed:false,current:false,asBuilt:false,
  physicalTileInstallationVerified:false,productionWebGLVerified:false,
  humanReview:'NOT_RUN'
 });
});

test('C80 584 root hash semantics reject altered/duplicate nodes',()=>{
 assert.equal(hash([11613,12315]),hash([11613,12315]));
 assert.notEqual(hash([11613,12315]),hash([12322,12315]));
 assert.equal(hash([-1]),null);
 assert.equal(hash([1,2.5]),null);
 assert.equal(hash('12322'),null);
});

const file=process.env.C80_584_ALL5_K12_GLB_PATH;
test('optional authentic 56.6 MB GLB: full six-scene source gates and negative source/status mutations',
 {skip:!file},()=>{
 const bin=readFileSync(file);
 assert.equal(bin.length,BYTES);
 assert.equal(bin.toString('ascii',0,4),'glTF');
 assert.equal(createHash('sha256').update(bin).digest('hex'),SHA);
 const length=bin.readUInt32LE(12);
 const json=JSON.parse(bin.subarray(20,20+length).toString('utf8'));
 assert.equal(evidence(json),true);
 for(let scene=578;scene<=583;scene++){
  const floor=SCENES[scene].floor;
  assert.equal(valid(json,SHA,scene,floor),true,'authentic scene '+scene);
  assert.equal(valid(json,SHA,scene,'WRONG'),false);
  assert.equal(valid(json,PARENT,scene,floor),false);
 }
 const modified=(mutate)=>{
  const v=structuredClone(json);mutate(v);
  return valid(v,SHA,580,'BOTH');
 };
 assert.equal(modified(j=>{j.scenes[580].nodes[j.scenes[580].nodes.indexOf(12322)]=11613;}),false);
 assert.equal(modified(j=>{j.scenes[580].extras.current=true;}),false);
 assert.equal(modified(j=>{j.scenes[580].extras.sourceLinksBound=true;}),false);
 assert.equal(modified(j=>{j.scenes[580].extras.K12KPHPhotoWorkAssumption=false;}),false);
 assert.equal(modified(j=>{j.nodes[12320].extras.physicalTileInstallationVerified=true;}),false);
 assert.equal(modified(j=>{j.nodes[12322].children.splice(0,1);}),false);
 assert.equal(modified(j=>{j.nodes[12321].extras.sourceTileEvidence='CURRENT';}),false);
 assert.equal(modified(j=>{j.meshes[4630].primitives[0].attributes.POSITION=1;}),false);
 assert.equal(modified(j=>{j.scenes[580].nodes.push(12322);}),false);
 assert.equal(modified(j=>{j.asset.extras.current=true;}),false);
 assert.equal(valid(json,SHA,579,'1F'),false);
 assert.equal(receipt(json,SHA,580,'BOTH').publishAllowed,false);
});
