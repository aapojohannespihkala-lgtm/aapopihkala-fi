import { expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = '.github/scripts/private-model-d1f-odensvik-40-pointer-guard.py';
const candidate = 'd1f-odensvik-00193937-basin-correction-20261017';
const variants = ['WEST_ANCHOR_725_895_740','WEST_ANCHOR_740_895_725',
  'EAST_ANCHOR_725_895_740','EAST_ANCHOR_740_895_725'];
const surfaces = ['KPH_FLOOR','SAUNA_FLOOR','ORDINARY_FLOOR','KPH_CEILING','SAUNA_CEILING'];
const themos = ['THEMO_LOBBY','THEMO_BEDROOM','THEMO_BATHROOM'];
const flags = {WORK_TEST_ONLY:true,current:false,Canonical:false,asBuilt:false,
  publishToCURRENT:false,HUMAN_REVIEW:'NOT_RUN'};
const wcSha = '43d2a17e3f551afb552adbc87d05618e1d22aacd5cbbdd0ffa15625e588264ab';
type Fixture = {asset:any,scenes:any[],nodes:any[]};
function fixture():Fixture {
  const nodes:any[]=[{name:'HISTORICAL_PARENT'}];
  const scenes:any[]=Array.from({length:108},(_,i)=>({name:'PREVIOUS_'+i,nodes:[0]}));
  for(let i=0;i<4;i++){
    const variant=variants[i],rootIndex=nodes.length;
    const root:any={name:'D1F_WC_THEMO_ROOT_'+variant+'_ODENSVIK00193937_WORK_TEST',
      children:[],extras:{...flags}};
    nodes.push(root);
    function add(prefix:string){
      const index=nodes.length;
      nodes.push({name:prefix+variant+'_WORK_TEST'});root.children.push(index);
      return index;
    }
    root.extras.counterNode=add('D1F_COUNTER_60MM_');
    root.extras.cabinetNode=add('D1F_SINGLE_CABINET_');
    root.extras.surfaceNodes=Object.fromEntries(surfaces.map(k=>[k,add(k+'_')]));
    root.extras.themoNodes=Object.fromEntries(themos.map(k=>[k,add('P137E_'+k+'_')]));
    scenes.push({
      name:'D1F WC CLOSED LID450 '+variant+' WORK_TEST + IKEA ODENSVIK 00193937 BOWL/TOP PRODUCT CORRECTION WORK_TEST',
      nodes:[rootIndex],extras:{...flags,sourceScene:104+i,productNumber:'001.939.37',
        parentApprovedWCModelSha256:wcSha},
    });
  }
  return {asset:{version:'2.0'},scenes,nodes};
}
function toGlb(p:Fixture){
  const raw=Buffer.from(JSON.stringify(p),'utf8');
  const json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]);
  const bin=Buffer.alloc(4),head=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);
  head.write('glTF',0,'ascii');head.writeUInt32LE(2,4);
  head.writeUInt32LE(12+8+json.length+8+bin.length,8);
  jh.writeUInt32LE(json.length,0);jh.write('JSON',4,'ascii');
  bh.writeUInt32LE(bin.length,0);bh.write('BIN\0',4,'ascii');
  return Buffer.concat([head,jh,json,bh,bin]);
}
function run(mutator?:(p:Fixture)=>void) {
  const dir=mkdtempSync(join(tmpdir(),'d1f-odensvik-gate-'));
  try {
    const p=fixture();mutator?.(p);
    const file=join(dir,'candidate.glb');writeFileSync(file,toGlb(p));
    return spawnSync('python3',[script,file],{encoding:'utf8',timeout:10000});
  } finally {rmSync(dir,{recursive:true,force:true});}
}

test('ODENSVIK release gate runs only after authenticated raw download and before publish PUT',()=>{
  const w=readFileSync('.github/workflows/publish-work-test.yml','utf8');
  const gate="if: inputs.candidate == '"+candidate+"'";
  const invocation='python3 '+script+' "$RUNNER_TEMP/work-test-source.glb"';
  expect(w).toContain(gate);
  expect(w).toContain(invocation);
  expect(w.indexOf(invocation)).toBeGreaterThan(w.indexOf('Download and derive exact private Drive GLB identity'));
  expect(w.indexOf(invocation)).toBeLessThan(w.indexOf('Publish exact bytes through machine-only endpoint'));
  expect(w).toContain('[[ "$GITHUB_REF" == "refs/heads/main" ]]');
});
test('all 40 source scene pointers pass without claiming HUMAN_REVIEW or production render',()=>{
  const result=run();
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('PASS 4 scenes / 40 targets; WORK_TEST only');
});
test('existing but wrong-subtree cabinet, surface and Themo pointers fail closed',()=>{
  const staleCabinet=run(p=>{p.nodes[p.scenes[108].nodes[0]].extras.cabinetNode=0;});
  expect(staleCabinet.status).not.toBe(0);
  expect(staleCabinet.stderr).toContain('cabinetNode:outside-current-scene');
  const staleFloor=run(p=>{
    const from=p.nodes[p.scenes[108].nodes[0]].extras;
    const other=p.nodes[p.scenes[109].nodes[0]].extras;
    from.surfaceNodes.KPH_FLOOR=other.surfaceNodes.KPH_FLOOR;
  });
  expect(staleFloor.status).not.toBe(0);
  expect(staleFloor.stderr).toContain('KPH_FLOOR:outside-current-scene');
  const wrongThemo=run(p=>{
    const root=p.nodes[p.scenes[108].nodes[0]];
    root.extras.themoNodes.THEMO_LOBBY=root.extras.counterNode;
  });
  expect(wrongThemo.status).not.toBe(0);
  expect(wrongThemo.stderr).toContain('THEMO_LOBBY:wrong-source-node-name');
});
test('altered current state, wrong scene count and duplicate target all reject',()=>{
  const current=run(p=>{p.scenes[108].extras.current=true;});
  expect(current.status).not.toBe(0);
  expect(current.stderr).toContain('noncanonical-gate-failed');
  const shortScene=run(p=>{p.scenes.pop();});
  expect(shortScene.status).not.toBe(0);
  expect(shortScene.stderr).toContain('expected-112-source-scenes');
  const duplicate=run(p=>{
    const root=p.nodes[p.scenes[108].nodes[0]];
    root.extras.cabinetNode=root.extras.counterNode;
  });
  expect(duplicate.status).not.toBe(0);
});
