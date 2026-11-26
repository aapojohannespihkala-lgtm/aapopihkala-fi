import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {SOURCE,VIEWS,wcHandleSeatReceipt} from '../../src/scripts/privateModelR34WcHandleSeatSourceReceipt.mjs';
const original=JSON.parse(readFileSync(new URL('../fixtures/private-model-r34-scene-roots.json',import.meta.url),'utf8'));
const viewNames=["Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene822","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene823","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__scene824","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__scene825","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene826","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene827","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene828","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__scene829","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene830","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene831","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene832","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene833","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene834","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_BOTH_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene835","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_NORMAL_PLEXI_ON_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene836","Ylisrinne_R34_FACADES_PARTYWALL_FRIEZE_2F_SERVICE_PLEXI_OFF_WORK_TEST_HOST_HOLD__WC_CLOSED_WORK_TEST_HOST_HOLD__ROSE_SEAT_WORK_TEST__scene837"];
function replace(roots,mapping){return roots.map(v=>mapping[v]??v);}
function fixture(original){
 const j={asset:{extras:{...original.asset,canonical:false,Canonical:false}},scene:292};
 for(const [k,n] of Object.entries(SOURCE.counts))j[k]=Array.from({length:n},()=>({}));
 for(let i=0;i<16;i++){
  let roots=[...original.scenes[822+i%4].nodes];
  if(i%8>=4)roots=replace(roots,{13843:13859,13844:13855,13845:13856});
  if(i>=8)roots=replace(roots,i<12?{13844:13860,13845:13861}:{13855:13862,13856:13863});
  j.scenes[822+i]={name:viewNames[i],nodes:roots,extras:{stage:"WORK_TEST",current:false,asBuilt:false,HUMAN_REVIEW:"NOT_RUN",...(i>=8?{handleSeatSourceScene:814+i,handleSeatSourceGLBSHA256:SOURCE.parentGlbSha256}:{})}};
 }
 for(const [root,mid,group,leaf] of [[13843,13842,13841,13840],[13859,13858,13857,13854]]){
  j.nodes[root]={children:[mid]};j.nodes[mid]={children:[group,10835,12641,10874,10891,12394]};j.nodes[group]={children:[12491,8030,leaf,12210,12211,12212,12213,12214,12215,12216,12217,12218]};j.nodes[leaf]={mesh:2463};
 }
 for(const [id,old,mesh] of [[13860,13844,3241],[13861,13845,3242],[13862,13855,3241],[13863,13856,3242]]){
  const m=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],copy=[...m];
  copy[id<13862?14:12]=(id===13860||id===13863?1:-1)*0.001500129699707;
  j.nodes[old]={mesh,matrix:m};j.nodes[id]={mesh,matrix:copy,extras:{handleSeatCowOf:old,handleSeatSourceGLBSHA256:SOURCE.parentGlbSha256,handleSeatPhysicalClaim:false,current:false,asBuilt:false}};
 }
 return j;
}
test('eight explicit WC preview views; all other source, floor, mode and state requests reject',()=>{const j=fixture(original);for(const v of VIEWS){const req={...v,explicitPreview:true};const r=wcHandleSeatReceipt(j,SOURCE.glbSha256,req);assert.equal(r?.doorState,v.doorState);assert.equal(r.publishAllowed,false);assert.equal(r.physicalHostVerified,false);for(const patch of [{explicitPreview:false},{floor:'1F'},{mode:'x'},{doorState:'x'},{sceneIndex:822}])assert.equal(wcHandleSeatReceipt(j,SOURCE.glbSha256,{...req,...patch}),null);assert.equal(wcHandleSeatReceipt(j,SOURCE.originalGlbSha256,req),null);}});
test('fail closed on changes to either scene, source identity, root path, mesh, stage or seat transform',()=>{const req={...VIEWS[0],explicitPreview:true};for(const mut of [x=>x.scenes[830].nodes.reverse(),x=>x.scenes[837].nodes.pop(),x=>x.nodes[13863].mesh=1,x=>x.nodes[13842].children[0]=13857,x=>x.nodes[13860].matrix[14]=0,x=>x.nodes[13860].extras.handleSeatPhysicalClaim=true,x=>x.asset.extras.current=true,x=>x.scene=830,x=>x.scenes[830].extras.handleSeatSourceScene=823]){const q=fixture(original);mut(q);assert.equal(wcHandleSeatReceipt(q,SOURCE.glbSha256,req),null);}});

test('source count expectations are immutable and altered counts remain rejected',()=>{
 const req={...VIEWS[0],explicitPreview:true};
 assert.equal(Object.isFrozen(SOURCE.counts),true);
 for(const [key,count] of Object.entries(SOURCE.counts)){
  const j=fixture(original);
  j[key].pop();
  assert.equal(wcHandleSeatReceipt(j,SOURCE.glbSha256,req),null,key);
  assert.equal(Reflect.set(SOURCE.counts,key,count-1),false,key);
  assert.equal(SOURCE.counts[key],count,key);
  assert.equal(wcHandleSeatReceipt(j,SOURCE.glbSha256,req),null,key);
 }
 assert.ok(wcHandleSeatReceipt(fixture(original),SOURCE.glbSha256,req));
});

test('reject malformed or ambiguous handle matrices even when the relative seat offset appears valid',()=>{
 const mutations=[
  j=>delete j.nodes[13860].matrix[14],
  j=>delete j.nodes[13844].matrix[3],
  j=>j.nodes[13860].translation=[1,0,0],
  j=>j.nodes[13844].rotation=[0,0,0,1],
  j=>j.nodes[13863].scale=[1,1,1],
  j=>{j.nodes[13860].matrix[3]=1;j.nodes[13844].matrix[3]=1;},
  j=>{j.nodes[13860].matrix[15]=0;j.nodes[13844].matrix[15]=0;},
  j=>{j.nodes[13860].matrix[0]=0;j.nodes[13844].matrix[0]=0;}
 ];
 for(const v of VIEWS){
  const req={...v,explicitPreview:true};
  assert.ok(wcHandleSeatReceipt(fixture(original),SOURCE.glbSha256,req));
  for(const mutate of mutations){const j=fixture(original);mutate(j);assert.equal(wcHandleSeatReceipt(j,SOURCE.glbSha256,req),null);}
 }
});


test('reject sparse source parent paths in every WC preview',()=>{
 const paths=[[13843,0],[13858,1],[13841,2]];
 for(const v of VIEWS){
  const req={...v,explicitPreview:true};
  assert.ok(wcHandleSeatReceipt(fixture(original),SOURCE.glbSha256,req));
  for(const [node,index] of paths){
   const j=fixture(original);
   delete j.nodes[node].children[index];
   assert.equal(wcHandleSeatReceipt(j,SOURCE.glbSha256,req),null,`missing parent path ${node}/${index}`);
  }
 }
});
