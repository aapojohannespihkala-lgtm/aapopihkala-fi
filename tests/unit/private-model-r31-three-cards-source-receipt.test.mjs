import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {
  R31_THREE_CARDS as S, r31ThreeCardsRootsFnv32 as fnv,
  isR31ThreeCardsSource as valid, r31ThreeCardsReceipt as receipt,
} from '../../src/scripts/privateModelR31ThreeCardsSourceReceipt.mjs';

// Tiny, compressed root-index arrays read from authenticated R31 original GLB.
// No geometry, material, photos, address or private model bytes in this test.
const roots = JSON.parse(inflateSync(Buffer.from('eNrtmEuKZTcQRPfS4ztQZurrrRivxHjvjjiqnhTlxjQGY3wnga6eQlL+Qsn7/dua59svv85e7YnsMZ6Tuz179anv0YeHm+HUcDSGy8NkqN+qTy2uEI7M/sw+lr93f9bUWsFm8/DmoUV7PPMMYBqWYRuOYLZnzgpDijzCwKgMXXuFLqYdk598R+2z58pHC32qPgU+Wtvqh9Jm2fQ5MbN0jLcUYxl09NZFBVtXbL5nS0MZusGOadOwDBiUCRbYwXutCS7wrtSB286rflhy9rPG6b45I2+62S5uIO6YrUPLGsfO8HczTYbIrm6Q/VNuFfhzszCfvR2xeZp3Zh9deu/BSY5X6uTTbGJrvrCC+Zw42NGOV2EAPpBno9l5GjJbN6JySCmYAmZDm5d2EHjykBa1npqyN9qYBXZwgBNc4F1zjKuBASYId8FdcBfcBXfBXXA33A13w91wN9wNd8PdcDfcDffAPXAP3AP3wD1wD9wD99p1zJ2tgQHisFZgBwc4wQVuEG7ADbgBN+AG3IAbcANuwA24CTfhJtyEm3ATbsJNuAk34RbcgltwC27BLbgFt+AW3ILb4Xa4HW6H2+F2uB1uh9vhdrgD7oA74A64ysGVuqayV99RSmSh/SUk5xoz9pfQ9TBsebgMIpvjEdYqIbWOnUF0g7gG8ai0VYGvMwJNsZczZeEq6UdaOmQRJWdTJXC6XKkGBdOwnqF9PNoe6ZPTtHB48jxKvGGwbkwvVFprS/+q1N4uPvkmDYysnbJDIFkcirRgGywfVsRdljjdY7p+5jm+kTew+yRkWreukhOu5TJ05RwXznHdHJfNOvKBYBj4XIZtOILCK+VfVFK7pRVIiSTAFH2Gcn5vxCysi2EJC7n/+BcppLXCYlPa7Bxr/5Gzz5L/NLc9KkM3pL3mTNJbYg/WoK4G9Taot0G9fcxTq5NandTqvDlEtrFyssZnKAfI6YWaLNRkrTvTwQFOELehJgs1WajJQk0WarJQk4WaLNRkoSYLDaRmkppJaiapmaRm9G51xp18Bl3DMhjsZLX9ICTPbxV0Vrqi7CCQiuD1dbkY7/iQ2w106jpYRnJ7ovNWW+EGfau02gp97vD9hVSHFSRQkKCegxque+dJbU7eg+DF79TXyosJ+v43JUfcW3FbfBL4Af9rxntudt5JhdoDwgLvDCtpTciQ2Bc591h/hXecYIHmxqIy912z0I0D0sfwiA8e8cEjPhINcYboTbTt5xBT1jcrVwbxbdbfbPfOvPHhbFGPMEHW+I0RHjSK9QdhYU231UJ8QqSCSAWRio9IEU1OxFeJZxKfCJknu65/kp6r0LRC5So468pD5/QrblR7L3qE4vl3DtQ9HU3X9rzv63qAmsJX5EbyuigZyQ32HHRpfd8+kI4H20fDz41fD1G4Gt7w+aCbZD3dQPIm1bVuHm7FKTmYH+SGa7x4I4SoB7Eo363q/oqquJNy6SR478yYfqgffvVbXsO5JExw/vZ8W6u9ffLbJ7998tsnv33y2ye/ffLbJ3/uk98O+e2Q/9cdcqhDft+Ef+1NaIeIkSnvm/Af/e9kffU+/ITSr+/a/IUe/6WC+pS/qZE/0MUPRfyxCqIlX6ldG5/1bM1PevZdw8YP1ShfNXrV6FWjn+xQXx36J3Tojz8BgMMuhA==', 'base64')).toString('utf8'));
function fixture(index) {
  const v=S.views[index];
  const scenes=Array.from({length:S.sceneCount},()=>({nodes:[]}));
  scenes[index]={name:v.name,nodes:[...roots[index]],extras:{stage:'WORK_TEST_HOST_HOLD',sourceLinksOutputSHA:'NOT_BOUND'}};
  const nodes=Array.from({length:S.nodeCount},()=>({}));
  const add=(key,num,extras,children)=>{
    nodes[key]={name:S.cards[num]?.name??'',extras,children};
  };
  add(13137,'TOSHIBA',{current:false,asBuilt:false,sourceLinksBound:false,
    skuConfidence:'PROBABLE_ONLY_RAS-25G2KVP-ND',HUMAN_REVIEW:'NOT_RUN'},Array.from({length:36},(_,i)=>5000+i));
  add(13247,'AEG',{current:false,asBuilt:false,sourceLinksBound:false,
    sourceRole:'PRODUCT_LOCAL_PRESENTATION',physicalHostVerified:false},Array.from({length:50},(_,i)=>5100+i));
  add(13466,'S1',{current:false,asBuilt:false,canPublish:false,
    owner4HandlesPhotoProxy:{ownerConfirmedCount:4,humanReview:'NOT_RUN'}},[12620,...Array.from({length:94},(_,i)=>5300+i)]);
  nodes[12620]={children:Array.from({length:44},(_,i)=>5500+i),extras:{physicalConnectionsVerified:0}};
  for(const start of [5000,5100,5300,5500]) {
    const length=start===5000?36:start===5100?50:start===5300?94:44;
    for(let k=0;k<length;k++) nodes[start+k]={mesh:0};
  }
  return {
    asset:{extras:{ModelStage:'WORK_TEST',Canonical:false,current:false,asBuilt:false,HUMAN_REVIEW:'NOT_RUN'}},
    scene:S.defaultScene, scenes,nodes,meshes:Array(S.meshCount),materials:Array(S.materialCount),
    accessors:Array(S.accessorCount),bufferViews:Array(S.bufferViewCount),
  };
}
function ok(json,i){let v=S.views[i];return valid(json,S.glbSha256,i,v.role,v.floor);}

test('original R31 root fingerprints and exact floor/role card selection',()=>{
  for(const [key,v] of Object.entries(S.views)) {
    const i=Number(key),j=fixture(i);
    assert.equal(roots[i].length,v.roots);
    assert.equal(fnv(roots[i]),v.rootsFNV);
    assert.equal(ok(j,i),true);
    for(const name of Object.keys(S.cards)) {
      const r=receipt(j,S.glbSha256,i,v.role,v.floor,name);
      assert.equal(r.exactSource,true);assert.equal(r.cardActive,v.cards.includes(name));
      assert.equal(r.rootNode,v.cards.includes(name)?S.cards[name].root:null);
      assert.equal(r.sourceLinksBound,false);assert.equal(r.publishAllowed,false);
      assert.equal(r.current,false);assert.equal(r.humanReview,'NOT_RUN');
    }
  }
});
test('fail closed for wrong SHA, role, floor, index, counts and rejected stage',()=>{
  const j=fixture(769);
  for(const value of [undefined,'0'.repeat(64),S.originalZipSha256])
    assert.equal(valid(j,value,769,'NORMAL','BOTH'),false);
  for(const [idx,role,floor] of [[769,'SERVICE','BOTH'],[769,'NORMAL','D2F'],[768,'NORMAL','BOTH'],[771,'NORMAL','BOTH']])
    assert.equal(valid(j,S.glbSha256,idx,role,floor),false);
  for(const mutate of [
    x=>x.scene=769, x=>x.asset.extras.current=true, x=>x.asset.extras.Canonical=true,
    x=>x.asset.extras.HUMAN_REVIEW='PASS', x=>x.scenes.length=772,
    x=>x.nodes.length=13506, x=>x.meshes.length=5168,
    x=>x.scenes[769].name='wrong', x=>x.scenes[769].extras.sourceLinksOutputSHA=S.glbSha256,
  ]) {const x=fixture(769); mutate(x);assert.equal(ok(x,769),false);}
});
test('fail closed for wrong S1 root, legacy root, node identity and unverified SKU/host',()=>{
  for(const mutate of [
    x=>{let v=x.scenes[769].nodes;v[v.indexOf(13466)]=13235;},
    x=>x.nodes[13466].name='old',
    x=>x.nodes[13466].extras.owner4HandlesPhotoProxy.ownerConfirmedCount=2,
    x=>x.nodes[12620].extras.physicalConnectionsVerified=1,
    x=>x.nodes[13137].extras.skuConfidence='CONFIRMED',
    x=>x.nodes[13137].extras.sourceLinksBound=true,
    x=>x.nodes[13247].extras.physicalHostVerified=true,
    x=>x.nodes[13247].children.pop(),
    x=>x.nodes[13466].children=x.nodes[13466].children.filter(n=>n!==12620),
  ]) {const x=fixture(769);mutate(x);assert.equal(ok(x,769),false);}
  const broken=fixture(769);
  assert.equal(receipt(broken,'bad',769,'NORMAL','BOTH','S1').cardActive,false);
  assert.equal(receipt(broken,S.glbSha256,769,'NORMAL','BOTH','UNLISTED').cardActive,false);
});
test('fail closed for accidental 1F cards visible in 2F, root order and invalid fingerprint input',()=>{
  const j=fixture(771);j.scenes[771].nodes[0]=13137;
  assert.equal(ok(j,771),false);
  for(const sample of [undefined,[-1,2],[1,1.5],[Number.MAX_SAFE_INTEGER+1]])
    assert.equal(fnv(sample),null);
  const k=fixture(770);k.scenes[770].nodes.reverse();assert.equal(ok(k,770),false);
});
const original=process.env.R31_THREE_CARDS_ORIGINAL_GLB;
test('optional authenticated original GLB replay', {skip:!original},()=>{
  const bytes=readFileSync(original);
  assert.equal(bytes.length,S.glbBytes);
  const digest=createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest,S.glbSha256);
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.toString('ascii',16,20),'JSON');
  const n=bytes.readUInt32LE(12);
  const json=JSON.parse(bytes.subarray(20,20+n).toString('utf8'));
  for(const [idx,v] of Object.entries(S.views))
    assert.equal(valid(json,digest,Number(idx),v.role,v.floor),true);
});
