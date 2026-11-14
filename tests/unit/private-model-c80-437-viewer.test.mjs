import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {C80_437_GLB_SHA256 as SHA,C80_437_SCENES,isC80437SourceScene,resolveC80437BuildingNode,resolveC80437TechnicalNode,resolveC80437CardNode,c80437ReviewProfile} from '../../src/scripts/privateModelC80437SourceProfile.mjs';
import {createC80437FloorRuntime,resolveC80437SceneIndex} from '../../src/scripts/privateModelC80437FloorRuntime.mjs';
const raw=JSON.parse(readFileSync(new URL('../fixtures/c80437-viewer-source.json',import.meta.url)));
const fixture=()=>{const f=structuredClone(raw),j={asset:f.asset,scene:292,scenes:Array.from({length:437},()=>({nodes:[]})),nodes:Array.from({length:12164},()=>({})),meshes:Array.from({length:4576},()=>({}))};for(const [i,s] of Object.entries(f.scenes))j.scenes[i]=s;for(const [i,n] of Object.entries(f.nodes))j.nodes[i]=n;return j;};
test('437 publication registry names the original ZIP and exact worker identity',()=>{
 const registry=JSON.parse(readFileSync(new URL('../../.github/work-test-candidates.json',import.meta.url)));
 assert.deepEqual(registry.candidates['c80-succ437-cofit-20261114'],{driveFileId:'12i53BpDbWLmv48bmWycCdCAeynUtB1Df'});
 const worker=readFileSync(new URL('../../worker/privateWorkTest.ts',import.meta.url),'utf8');
 const block=worker.match(/const C80_SUCC437_WORK_TEST_CANDIDATE = \{([\s\S]*?)\n\} as const satisfies PrivateWorkTestCandidate;/)?.[1];
 assert.ok(block?.includes(`expectedSha256: '${SHA}'`));assert.ok(block.includes('expectedSize: 54585652'));
 const j=fixture();for(const n of ['__proto__',-1,undefined])assert.equal(resolveC80437CardNode(j,SHA,430,n),null);
});
test('437 authenticates all nine authored opt-ins, rejects stale parents and option aliases',()=>{
 const j=fixture();for(const [i,s] of Object.entries(C80_437_SCENES)){assert.ok(isC80437SourceScene(j,SHA,Number(i),s.floor,s.glazing,s.cutaway));assert.equal(resolveC80437SceneIndex(SHA,s.floor,s.glazing,s.cutaway),Number(i));}
 for(const i of [292,362,410,419,427])assert.equal(isC80437SourceScene(j,SHA,i),false);
 assert.equal(isC80437SourceScene(j,'b55c10cf1a5a557c6ace8932254ae7c614abb65e515998bd2c2d41f3037240de',430),false);
 assert.equal(resolveC80437SceneIndex(SHA,'2F','CLOSED',true),null);
 assert.equal(resolveC80437SceneIndex(SHA,'1F','STACKED'),null);
});
test('437 rejects altered roots, source limits and CURRENT promotion',()=>{
 for(const mutate of [j=>j.scenes[430].nodes.reverse(),j=>j.scenes[430].extras.sourceLinksBindingVerified=true,j=>j.asset.extras.current=true,j=>j.scene=430,j=>j.scenes.pop()]){const j=fixture();mutate(j);assert.equal(isC80437SourceScene(j,SHA,430),false);}
});
test('437 corrected PA2 hot/cold, concealed VP1 and red hose retain exact source roles',()=>{
 const j=fixture();for(const [i,hot,cold,vp1] of [[428,12158,12146,12138],[430,12161,12148,12139]]){
  for(const n of [hot,cold,vp1])assert.equal(resolveC80437TechnicalNode(j,SHA,i,n)?.id,'technical-water');
  const card=resolveC80437CardNode(j,SHA,i,hot);assert.ok(card?.links.length);assert.equal(card.path.at(-1),hot);
 }
 assert.equal(resolveC80437TechnicalNode(j,SHA,429,12158),null);
 assert.equal(resolveC80437TechnicalNode(j,SHA,430,12156)?.id,'technical-water');
 assert.equal(resolveC80437TechnicalNode(j,SHA,430,12108)?.id,'technical-electrical');
 j.nodes[12161].mesh=4573;assert.equal(resolveC80437TechnicalNode(j,SHA,430,12161),null);
});
test('437 new wall/floor IDs are architecture, never a door or inherited donor identity',()=>{
 const j=fixture();for(const n of [12144,12145]){assert.equal(resolveC80437BuildingNode(j,SHA,430,n,[n])?.id,'architecture-walls');assert.equal(resolveC80437TechnicalNode(j,SHA,430,n),null);}
 assert.equal(resolveC80437BuildingNode(j,SHA,428,12144,[12144]),null);
 assert.equal(resolveC80437BuildingNode(j,SHA,430,12144,[12145,12144]),null);
 j.nodes[12144].translation=[1,2,3];assert.equal(resolveC80437BuildingNode(j,SHA,430,12144,[12144]),null);
});
test('437 review excludes composite furniture, WC and PK1 cutaway wrappers',()=>{
 const j=fixture();for(const i of [428,429,430,435,436]){const p=c80437ReviewProfile(j,SHA,i);assert.ok(p);for(const n of [2220,11613,11945,12097,12144,12145])assert.equal(p.roots[i].some(x=>x.node===n),false);}
 const card=resolveC80437CardNode(j,SHA,428,12096);assert.ok(card.links.some(x=>x.link?.includes('1v8tyPG99W-jglBnHO7VHnxEUj7Sz8S2i')));
 j.nodes[12096].extras.sourceLinks[0].link='https://example.invalid';assert.equal(resolveC80437CardNode(j,SHA,428,12096),null);
});
test('437 floor, glazing, cutaway, restore and dispose mount only authored scenes',()=>{
 const j=fixture(),scenes=j.scenes.map(s=>({name:s.name,children:s.nodes.map(n=>({name:j.nodes[n].name})),traverse(fn){this.children.forEach(fn);}}));
 let mounted=scenes[430];const rt=createC80437FloorRuntime({gltf:{parser:{json:j},scenes},sha:SHA,mount:s=>{mounted=s;},mounted:()=>mounted});
 for(const [i,s] of Object.entries(C80_437_SCENES)){rt.restore();assert.ok(rt.apply(s.floor,s.glazing));if(s.cutaway)assert.ok(rt.setCutaway(true));assert.equal(rt.sceneIndex,Number(i));assert.equal(mounted,scenes[i]);}
 rt.restore();assert.equal(mounted,scenes[430]);rt.dispose();assert.equal(rt.apply('1F'),null);
});
test('437 original complete GLB agrees with all new-SHA receipts',{skip:!process.env.YLIS_C80437_GLB},()=>{
 const b=readFileSync(process.env.YLIS_C80437_GLB);assert.equal(b.length,54585652);assert.equal(createHash('sha256').update(b).digest('hex'),SHA);const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
 for(const [index,s] of Object.entries(C80_437_SCENES)){const i=Number(index);assert.ok(isC80437SourceScene(j,SHA,i));assert.ok(c80437ReviewProfile(j,SHA,i));for(const [n,e] of Object.entries(s.building))for(const p of e.paths)assert.ok(resolveC80437BuildingNode(j,SHA,i,Number(n),p));for(const n of Object.keys(s.technical))assert.ok(resolveC80437TechnicalNode(j,SHA,i,Number(n)));for(const n of Object.keys(s.cards))assert.ok(resolveC80437CardNode(j,SHA,i,Number(n)));}
});
