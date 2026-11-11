import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {
 MJ79_SOURCE_SHA256,MJ79_PARENT_SHA256,MJ79_SOURCE_SCENE_COUNT,
 MJ79_SOURCE_NODE_COUNT,MJ79_SOURCE_MESH_COUNT,MJ79_BASE_FLOORS,
 MJ79_FLOORS,MJ79_SCENES,MJ79_SOCKETS,MJ79_SOURCES,
 mj79RootFnv32,isMJ79SourceScene,
} from '../../src/scripts/privateModelMJ79ExxactSourceProfile.mjs';
// Ordered root arrays derived from the byte-verified raw GLB, not a copied filename.
const ROOTS={372:'eNollMmR5DAMBB3Sg+CBw5aJ9d+Nrcr+ZLAlJnFR/Zf3rG+i3je719d10yijjRGeX7wwtnG+vff6KrX57X2/vK++PFV+BvqrmfGhoS39vpwH0iijjRFyfa/O+TJPGFsHKJrA6hj3mwltOalTbki7ykCQccchdbxSU/ZZ+5N6/SwN3rZfOAaJK2Ssp0hKWhk5krQylFarBqGV/gpjG8e4hpu10iiDfa41lmEjbISNsBE2QoFaray9aaXSenO9aq98VG+37RjXeIZKWg5U40AZZH7ghQ8m9OBUnGq9hnqSmoDgn+0YqRG2p5zjdNtJesD9yEAvRltmud7lKpcLjHEd5xfceXBW+aHaHcsd1VIPPaE5vlBH5QjX4KffThjH8IvxC5U4T+05qRIjPAOFSWpMakxqTGrMgr89YxbTLJIjG10niFu4hVu4hVu4jdu4jdu4jdu4jdu4jdu4gzu4gzu4gzu4gzu4gzt2cy0YkA6uAy98MGHBhriBG7iBG7iBG7iBG7iBG7gbd+Nu3I27cTfuxt24zCI37sHlEvgrNXG5h8k9TO6hviqIe3Av7sW9uBf34l7ci3txL+7FfbgP9+E+XP0r6GMq32f9juOuxdHt9bpgwzHdNTEgO92juO57+FOJeM5M9PPn/4jg3gTzDiYdzDWYUzCPYAbBDIIZBDMIZhBF3HLHxQ29s9xN/aH4hCL6uBfRnlP0Zu2+x/iWiBseeCGWb4lY0PUOEYdMZrPe7DmccNjzWD/2PN4+nlP1/PJp1v3+/QcPzDdk',373:'eNotlckV3TAMAxv6B1ELl1ry0n8bAca54MmWxqJIEf6T96zfRL3f7F6/rpuWsrRlJM8TLyzbcn577/Wr1OK39/3lffXLU+V3SP9qZvzR0JJ+v5yHpKUsbRlJrt+rc36ZJyxbH9BuEkbHcn8zoSUn9ZUbwq4ikIi44y31eYWm6LP2T+j1u7Qw257wHgSuLWM97aSgFZF3ElYWhdU6g6QV/grLthzLtThZKy1lYZ3PGstiIkyEiTARJkIbtVJZe5NKhfXmetQe+VO9nbZjuZZn0ZGWN6rxRhlEftCLPjRRF06H01mvRTlJVUDix/YeqRK2q5zjcNtBusD9iEAToyWzfN7lUy4fMMbnON/mjoNvlV8q3bGcUQ310hWa4wt1dBzJtfDo2QnLsXhiPKEjzlN6TuqIEa6BtknOmJwxOWNyxiz0WzPWoppFcESj64TCFmzBFmzBFmzDNmzDNmzDNmzDNmzDNuzADuzADuzADuzADuzAjtlcCw2UDK6DXvShiRbaKGzABmzABmzABmzABmzABuyG3bAbdsNu2A27YTcstcgNe2C5BO5SKyz3MLmHyT1UV6GwB/bCXtgLe2Ev7IW9sBf2wl7YB/tgH+yDlSuomcr3Wc9xnLU4ur0eF9roWJ01aaCsdI7iOu/hVol4jkzq988eEdyboN5BpYO6BnUK6hHUIKhBUIOgBuEa1JEHbdvPzrRXHWRbuCu2t6MZiVfrcsuWeNce6dHJ17VbfueR8iyx/aTXlW1Q7zQKO4U87toBbzGyOZc90z73dB8kbZGFtoNpB+M2S3dZ4jzHH3CS5YdaVxS+uNbljnV/jdtr3F3jJNUsW9ayZS0ey+L/gJJU4/siD3VV+9jh1H69dOskz8KB9Bjqj27t0jZ8Gc+zpKUsmJHddtlxHo3l38PRDvpHhEWjShuNraqUJsm1bLY3M1ynobxF47xHwz4a9v93adhHs3+/jM9+87uEXFdWJmsKyyrsqLCjwo6qvvfkDzsq7Kiwo8KOCjsq7Kiwo8KOCjsq7Kiwo5qvSrDYUdmOYs/XBJcrTysc9NIQl4bg4p+vjS4rLy1CK5xLM12+c2Ef7IN9sA/2wT7YB/tgH+yDpbF859VMh7azaQQWFFhQYBGBLQRWEMk352syWjydvfBP3RUsfhwLDXSjzPr+6t/t3cm//mbeq8lGs29vxuzYRNu0+9iopd94owe9KF+zUcdgOYPlDGYzmMEQ1WzWHL7gNgh+T4qE9eRwyN6QtyGGIVfDeSeZTWaT2WL2O1EzbsbD2EalljvoRb83idbffyg/+dQ='};
const rootList = id=>JSON.parse(inflateSync(Buffer.from(ROOTS[id],'base64')).toString('utf8'));
const links=Object.values(MJ79_SOURCES).map(url=>({url}));
function fixture() {
 const nodes=Array.from({length:MJ79_SOURCE_NODE_COUNT},()=>({}));
 nodes[12049]={name:'MJ79_D1F_PR03_PR05_SOURCE_EXACT_TWO_ANGLED_DOUBLE_PROXY_COW_ROOT_20261112',
   children:[11740,11741,11742,11743,11744,11747,12043,12048,11754,11757,11760,11763],
   extras:{sourceRoot:11739,sourceParentGLBSHA256:MJ79_PARENT_SHA256,
      visualDiffOnly:'PR03_PR05_TWO_ANGLED_DOUBLE_SOCKETS',notInstalledSKU:true,
      asBuilt:false,sourceLinks:links}};
 for (const s of MJ79_SOCKETS) {
   nodes[s.root]={name:'WORK_TEST_OUTLET',children:[...s.children],extras:{
     stableID:s.stableID,oldRootNode:s.oldRoot,ModelStage:'WORK_TEST',
     RepresentationKind:'PHOTO2025_ANGLED_VISUAL_PROXY',socketCount:2,
     installedSKU:'UNKNOWN',current:false,asBuilt:false,measured:false,
     physicalElectricalValidated:false,sourcePhotoDate:'2025-04-26',sourceLinks:links}};
   for(let i=0;i<4;i++)nodes[s.children[i]]={
     name:'MJ79_D1F_'+s.stableID.slice(3)+'_PHOTO12_EXXACT_ANGLED_TWO_OUTLETS_PART_VISUAL_WORK_TEST',
     mesh:4539+i,extras:{installedSKU:'UNKNOWN',current:false,asBuilt:false,sourceLinks:links}};
 }
 const scenes=Array.from({length:MJ79_SOURCE_SCENE_COUNT},()=>({name:'old-scene',nodes:[]}));
 for(const [index,p] of Object.entries(MJ79_SCENES)) {
   scenes[index]={name:p.name,nodes:rootList(index),extras:{
     parentGlbSHA256:MJ79_PARENT_SHA256,parentSceneIndex:p.parentScene,
     integrationTask:'MJ79_PHOTO12_D1F_PR03_PR05_VISUAL_ONLY',
     floor:p.floor,modelStage:'WORK_TEST',HOST_HOLD:true,current:false,asBuilt:false,
     photo2025:true,owner2026GeneralFamilyReference:true,actualInstalledSKU:'UNKNOWN',
     exactXYZMeasured:false,physicalElectricalVerified:false,nodeCOW:[11739,12049],
     replacedOldActiveOutletRoots:[11748,11751],newOutletRoots:[12043,12048],
     sourceLinks:links}};
 }
 return {scene:292,scenes,nodes,
  meshes:Array.from({length:MJ79_SOURCE_MESH_COUNT},()=>({})),
  asset:{extras:{ModelStage:'WORK_TEST',current:false,asBuilt:false,canonical:false,
    viewerFloorScenes:{...MJ79_BASE_FLOORS}}}};
}
test('MJ79 authentic root snapshots and floor-scene bindings',()=>{
 const j=fixture();
 for(const [floor,index] of Object.entries(MJ79_FLOORS)){
   assert.equal(mj79RootFnv32(j.scenes[index].nodes),MJ79_SCENES[index].rootFnv);
   assert.equal(isMJ79SourceScene(j,MJ79_SOURCE_SHA256,index,floor),true);
 }
 assert.equal(isMJ79SourceScene(j,MJ79_SOURCE_SHA256,292),false);
});
test('MJ79 refuses wrong loaded SHA, floor, stale ordered roots and provenance',()=>{
 const j=fixture(),sha=MJ79_SOURCE_SHA256;
 assert.equal(isMJ79SourceScene(j,'0'.repeat(64),372,'1F'),false);
 assert.equal(isMJ79SourceScene(j,sha,373,'1F'),false);
 const ordered=structuredClone(j);ordered.scenes[372].nodes.reverse();
 assert.equal(isMJ79SourceScene(ordered,sha,372),false);
 const parent=structuredClone(j);parent.scenes[373].extras.parentGlbSHA256='0'.repeat(64);
 assert.equal(isMJ79SourceScene(parent,sha,373),false);
 const photo=structuredClone(j);photo.scenes[372].extras.sourceLinks=[];
 assert.equal(isMJ79SourceScene(photo,sha,372),false);
 const old=structuredClone(j);old.scenes[373].nodes[0]=11739;
 assert.equal(isMJ79SourceScene(old,sha,373),false);
});
test('MJ79 refuses superseded outlets, duplicate new outlets or as-built upgrade',()=>{
 const sha=MJ79_SOURCE_SHA256;
 const old=fixture();old.nodes[12049].children.push(11748);
 assert.equal(isMJ79SourceScene(old,sha,372),false);
 const duplicate=fixture();duplicate.nodes[12049].children.push(12043);
 assert.equal(isMJ79SourceScene(duplicate,sha,373),false);
 const fake=fixture();fake.nodes[12039].mesh=4538;
 assert.equal(isMJ79SourceScene(fake,sha,372),false);
 const sku=fixture();sku.nodes[12043].extras.installedSKU='WDE002682';
 assert.equal(isMJ79SourceScene(sku,sha,372),false);
 const current=fixture();current.asset.extras.current=true;
 assert.equal(isMJ79SourceScene(current,sha,373),false);
 const amended=fixture();amended.scenes[373].extras.physicalElectricalVerified=true;
 assert.equal(isMJ79SourceScene(amended,sha,373),false);
});
