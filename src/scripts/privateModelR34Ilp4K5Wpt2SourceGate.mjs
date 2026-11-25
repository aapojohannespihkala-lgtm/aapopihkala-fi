import { createHash } from 'node:crypto';

// Offline, SHA-bound source receipt only. Never authorizes viewer registration or publication.
export const R34_ILP4_K5_WPT2_SOURCE = Object.freeze({
  receiverSha: '5b28b457ab0d1614e45a70b5f8dbdfb5123f8e7d8b0d1283c8cdf0bd1f839a98',
  receiverBytes: 67433780,
  glbSha: 'cdf95b7cf1c91948ec50d6b5d4a8487151f683a8daac3bb50b0bf4b6e1ce5c02',
  glbBytes: 67457312,
  donorSha: 'cfbd6874b229ec4dc976faceb672e3c16ae8e1d45e943eb58018c144e4c5fcc8',
  zipDriveId: '1ntMWzaS7GzglnwfW_t1wnK6NOSnRW7rx',
});
const C = R34_ILP4_K5_WPT2_SOURCE;
const swaps = new Map([[12468,14063],[12539,14064],[12554,14065]]);
const remap = n => swaps.get(n) ?? n;
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const sha = b => createHash('sha256').update(b).digest('hex');
function parse(bytes, length, hash) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== length || sha(bytes) !== hash) return null;
  if (bytes.readUInt32LE(0)!==0x46546c67 || bytes.readUInt32LE(4)!==2 || bytes.readUInt32LE(8)!==length) return null;
  const n=bytes.readUInt32LE(12), end=20+n;
  if (n%4 || end+8>length || bytes.readUInt32LE(16)!==0x4e4f534a || bytes.readUInt32LE(end+4)!==0x004e4942 || end+8+bytes.readUInt32LE(end)!==length) return null;
  return {json:JSON.parse(bytes.toString('utf8',20,end)),bin:bytes.subarray(end+8)};
}
function active(j, roots) {
  const seen=new Set(), pending=[...roots];
  while(pending.length) {
    const id=pending.pop();
    if(!Number.isInteger(id)||!j.nodes[id]) throw new Error('invalid node');
    if(seen.has(id)) continue;
    seen.add(id); pending.push(...(j.nodes[id].children??[]));
  }
  return [...seen].sort((a,b)=>a-b);
}
const safe = e => e?.geometryChanged===false && e.sourceLinksBound===false && e.physicalHostVerified===false && e.productionWebGLVerified===false && e.current===false && e.asBuilt===false && e.humanReview==='NOT_RUN';
const geometry = ({name,extras,children,...rest}) => rest;

// Both original byte streams are mandatory; no caller-supplied SHA or parsed-JSON shortcut.
export function receiveR34Ilp4K5Wpt2(receiverBytes, cofitBytes, floor, historical2015=false) {
  if(floor!=='BOTH'||typeof historical2015!=='boolean') return null;
  try {
    const a=parse(receiverBytes,C.receiverBytes,C.receiverSha), b=parse(cofitBytes,C.glbBytes,C.glbSha);
    if(!a||!b||!a.bin.equals(b.bin)) return null;
    const p=a.json,j=b.json;
    if(p.scene!==292||j.scene!==292||p.scenes.length!==868||j.scenes.length!==870||p.nodes.length!==14063||j.nodes.length!==14066) return null;
    if(!same(p.scenes,j.scenes.slice(0,868))||!same(p.nodes,j.nodes.slice(0,14063))) return null;
    const {scenes:ps,nodes:pn,...pr}=p, {scenes:js,nodes:jn,...jr}=j;
    if(!same(pr,jr)) return null;
    for(const [oldId,newId] of swaps) {
      const old=p.nodes[oldId], now=j.nodes[newId], e=now.extras.r34Ilp4K5Wpt2Cofit;
      if(!same(geometry(old),geometry(now))||!same((old.children??[]).map(remap),now.children??[])||!safe(e)||e.receiverNode!==oldId||e.receiverGlbSha256!==C.receiverSha||e.donorGlbSha256!==C.donorSha) return null;
    }
    if(!same(j.nodes[14063].extras.modelWorldBBoxM,{x:[5.425,6.225],y:[0.28,0.91],z:[-9.555,-9.255]})) return null;
    const sets=[];
    for(const [i,history] of [[868,false],[869,true]]) {
      const s=j.scenes[i], old=p.scenes[i-2], e=s.extras, m=e.r34Ilp4K5Wpt2Cofit;
      if(!s.name.endsWith('__scene'+i)||!same(old.nodes.map(remap),s.nodes)||!safe(m)||m.sourceScene!==i-2||m.receiverGlbSha256!==C.receiverSha||m.donorGlbSha256!==C.donorSha||m.oldRoot!==12554||m.newRoot!==14065||e.stage!=='WORK_TEST/HOST_HOLD'||e.optinHist2015!==history||e.optinP186PresentationOnly!==true||e.current!==false||e.asBuilt!==false||e.sourceLinksBound!==false) return null;
      const ids=active(j,s.nodes), expected=active(p,old.nodes).map(remap).sort((x,y)=>x-y);
      if(!same(ids,expected)||ids.length!==(history?2768:2672)||ids.filter(n=>n>=13979&&n<=14059).length!==(history?81:0)||![14060,14061,14062,14063,14064,14065].every(n=>ids.includes(n))) return null;
      sets.push(ids);
    }
    const clean=new Set(sets[0]);
    if(sets[1].filter(n=>!clean.has(n)).length!==96||sets[0].some(n=>!sets[1].includes(n))) return null;
    return Object.freeze({scene:historical2015?869:868,floor,historical2015,sourceSha256:C.glbSha,stage:'WORK_TEST/HOST_HOLD',geometryChanged:false,sourceLinksBound:false,productionWebGLVerified:false,physicalHostVerified:false,current:false,asBuilt:false,humanReview:'NOT_RUN'});
  } catch { return null; }
}
