import test from 'node:test';
import assert from 'node:assert/strict';
import { U64_KIV003_SHA, createUnified64Kiv003Presentation }
  from '../../src/scripts/privateModelUnified64Kiv003Presentation.mjs';
const NAME='K10_R3_WORLD10_SC19_K10_R3_D1F_KIV100_ANCHOR_003_WORK_TEST_SLEEVE_COVER_ORIENT';
function fixture(){
 const assoc=new Map(),scenes=Array.from({length:64},()=>({children:[]}));
 const nodes=Array.from({length:6058},()=>({}));
 const json={asset:{version:'2.0',extras:{current:false,asBuilt:false}},
    scene:0,scenes:Array.from({length:64},()=>({nodes:[]})),nodes};
 for(const spec of [{scene:60,parent:1663,node:1622,count:5,children:1603},
                    {scene:63,parent:6057,node:616,count:10,children:597}]){
   const children=Array.from({length:19},(_,i)=>spec.children+i);
   nodes[spec.parent]={name:'K10_SC25_KIV100x10_WORLD_YUP_AXIS_REPLACEMENT_TEST',
     children:[spec.node,...Array.from({length:spec.count-1},(_,i)=>300+i)],
     extras:{modelStage:'WORK_TEST',physicalWallCuts:'NOT_VERIFIED'}};
   nodes[spec.node]={name:NAME,children,extras:{
     realWallHostVerified:false,sourceAnchorCoverNode:1151,
     sourceAnchorSleeveNode:1150,C78SourceNode:{sourceScene:77,sourceNode:20509}
   }};
   const childObjects=children.map((id,i)=>{
      nodes[id]={mesh:755-i,name:NAME+'__'+i};
      const o={name:nodes[id].name,isMesh:true,visible:true};
      assoc.set(o,{nodes:id});return o;
   });
   const target={name:NAME,visible:true,children:childObjects,
     userData:{realWallHostVerified:false}};
   const parent={name:nodes[spec.parent].name,visible:true,children:[target]};
   assoc.set(parent,{nodes:spec.parent});assoc.set(target,{nodes:spec.node});
   scenes[spec.scene].children.push(parent);
   json.scenes[spec.scene].nodes=[spec.parent];
 }
 return {scenes,parser:{json,associations:assoc}};
}
test('exact 64scene C042 hides only two 19-part reference groups and restores',()=>{
 const g=fixture();
 const before=JSON.stringify(g.parser.json);
 const p=createUnified64Kiv003Presentation(g,U64_KIV003_SHA);
 assert.equal(p.available,true,p.reason);assert.equal(p.count,2);
 assert.equal(p.setCorrected(true),true);
 assert.equal(p.corrected,true);
 assert.equal(g.scenes[60].children[0].children[0].visible,false);
 assert.equal(g.scenes[63].children[0].children[0].visible,false);
 assert.equal(g.scenes[62].children.length,0);
 assert.equal(g.scenes[60].children[0].children.length,1);
 assert.equal(g.scenes[63].children[0].children[0].children.length,19);
 p.dispose();
 assert.equal(g.scenes[60].children[0].children[0].visible,true);
 assert.equal(g.scenes[63].children[0].children[0].visible,true);
 assert.equal(p.setCorrected(true),false);
 assert.equal(JSON.stringify(g.parser.json),before);
});
test('wrong SHA, host and parent roster never hide source',()=>{
 let g=fixture();
 assert.equal(createUnified64Kiv003Presentation(g,'not-source').available,false);
 g=fixture();g.parser.json.nodes[616].extras.realWallHostVerified=true;
 assert.equal(createUnified64Kiv003Presentation(g,U64_KIV003_SHA).available,false);
 g=fixture();g.parser.json.nodes[6057].children.splice(0,1);
 assert.equal(createUnified64Kiv003Presentation(g,U64_KIV003_SHA).available,false);
 g=fixture();g.parser.json.scenes[60].nodes=[];
 assert.equal(createUnified64Kiv003Presentation(g,U64_KIV003_SHA).available,false);
});
test('runtime association identity fail closed instead of hiding other vents',()=>{
 const g=fixture();g.parser.associations.delete(g.scenes[63].children[0].children[0]);
 const p=createUnified64Kiv003Presentation(g,U64_KIV003_SHA);
 assert.equal(p.available,false);
 assert.equal(g.scenes[60].children[0].children[0].visible,true);
 assert.equal(g.scenes[63].children[0].children[0].visible,true);
});
