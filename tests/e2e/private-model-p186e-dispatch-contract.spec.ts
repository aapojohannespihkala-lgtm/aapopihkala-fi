import {test,expect} from '@playwright/test';
import {spawnSync,execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const validator=resolve('.github/scripts/private-model-review-dispatch.py');
const trusted='a'.repeat(40);
const request={probeMode:'p186e-labels-render',requestId:'p186e-20261016-test',expectedMainSha:trusted};
const evaluate=(payload:unknown)=>spawnSync('python3',['-c',
  'import json,runpy,sys; m=runpy.run_path(sys.argv[1]); print(json.dumps(m["validate_request"](json.loads(sys.stdin.read(), object_pairs_hook=m["unique_object"]),sys.argv[2])))',
  validator,trusted],{input:typeof payload==='string'?payload:JSON.stringify(payload),encoding:'utf8'});

test('validated requests can dispatch only the existing P186E mode on main',()=>{
  const result=evaluate(request);expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({ref:'main',inputs:{probe_mode:'p186e-labels-render'}});
});

test('invalid mode, extra target/ref, main drift and request injection fail closed',()=>{
  for(const payload of [
    {...request,probeMode:'full-render'}, {...request,probeMode:'g2-records-readback'},
    {...request,ref:'untrusted-branch'}, {...request,candidate:'arbitrary'},
    {...request,expectedMainSha:'b'.repeat(40)}, {...request,requestId:'ok\nref=other'},
    {...request,requestId:''}, {...request,requestId:true}, null,[],
    '{"probeMode":"full-render","probeMode":"p186e-labels-render","requestId":"abc","expectedMainSha":"'+trusted+'"}',
  ])expect(evaluate(payload).status).not.toBe(0);
});

function fixture(tamper=false){
  const dir=mkdtempSync(join(tmpdir(),'p186e-request-'));
  const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
  git('init','-b','main');git('config','user.email','fixture@example.invalid');
  git('config','user.name','Fixture');
  writeFileSync(join(dir,'trusted.txt'),'trusted main\n');git('add','.');git('commit','-qm','main');
  const before=git('rev-parse','HEAD');git('checkout','-qb','ops/private-model-review');
  mkdirSync(join(dir,'.github'));
  writeFileSync(join(dir,'.github/private-model-review-request.json'),JSON.stringify({...request,expectedMainSha:before}));
  if(tamper)writeFileSync(join(dir,'trusted.txt'),'untrusted executable change\n');
  git('add','.');git('commit','-qm','request');const after=git('rev-parse','HEAD');
  git('checkout','-q','main');
  const env={...process.env,EVENT_NAME:'push',REPOSITORY:'aapojohannespihkala-lgtm/aapopihkala-fi',
    REF_FULL:'refs/heads/ops/private-model-review',ACTOR:'aapojohannespihkala-lgtm',ACTOR_ID:'322566438',
    BEFORE_SHA:before,AFTER_SHA:after};
  return {dir,env,output:join(dir,'dispatch.json')};
}

test('actual CLI reads the inert request from its commit while executing trusted main',()=>{
  const f=fixture();try{
    const result=spawnSync('python3',[validator,f.output],{cwd:f.dir,env:f.env,encoding:'utf8'});
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(f.output,'utf8'))).toEqual({ref:'main',inputs:{probe_mode:'p186e-labels-render'}});
  }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('actual CLI rejects any executable tree delta even with an otherwise valid request',()=>{
  const f=fixture(true);try{
    const result=spawnSync('python3',[validator,f.output],{cwd:f.dir,env:f.env,encoding:'utf8'});
    expect(result.status).not.toBe(0);expect(existsSync(f.output)).toBe(false);
    expect(result.stderr.trim()).toBe('P186E_DISPATCH_REQUEST_REJECTED');
  }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('actual CLI rejects wrong actor, PR event, wrong branch and branch creation',()=>{
  const f=fixture();try{
    for(const change of [{ACTOR_ID:'1'},{ACTOR:'someone-else'},
      {EVENT_NAME:'pull_request'},{REF_FULL:'refs/heads/main'},
      {BEFORE_SHA:'0'.repeat(40)}]){
      const result=spawnSync('python3',[validator,f.output],{cwd:f.dir,env:{...f.env,...change},encoding:'utf8'});
      expect(result.status).not.toBe(0);expect(existsSync(f.output)).toBe(false);
      expect(result.stderr.trim()).toBe('P186E_DISPATCH_REQUEST_REJECTED');
    }
  }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('workflow executes main validator and never binds viewer credentials or PR secrets',()=>{
  const yaml=readFileSync('.github/workflows/trigger-p186e-production-review.yml','utf8');
  expect(yaml).toContain('ref: main');expect(yaml).toContain('fetch-depth: 0');
  expect(yaml).toContain('actions: write');expect(yaml).toContain('contents: read');
  expect(yaml).toContain('python3 .github/scripts/private-model-review-dispatch.py');
  expect(yaml).toContain('/actions/workflows/private-model-production-review-smoke.yml/dispatches');
  expect(yaml).not.toContain('secrets.');expect(yaml).not.toContain('CF_ACCESS');
  expect(yaml).not.toContain('pull_request:');
});

function refreshedMainFixture({tamper=false,omitOldParent=false}={}) {
  const dir=mkdtempSync(join(tmpdir(),'p186e-refresh-'));
  const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
  git('init','-b','main');git('config','user.email','fixture@example.invalid');
  git('config','user.name','Fixture');
  writeFileSync(join(dir,'trusted.txt'),'original trusted main\\n');
  git('add','.');git('commit','-qm','original main');
  const originalMain=git('rev-parse','HEAD');
  git('checkout','-qb','ops/private-model-review');
  mkdirSync(join(dir,'.github'));
  writeFileSync(join(dir,'.github/private-model-review-request.json'),
    JSON.stringify({...request,expectedMainSha:originalMain}));
  git('add','.');git('commit','-qm','original request');
  const before=git('rev-parse','HEAD');
  git('checkout','-q','main');
  writeFileSync(join(dir,'trusted.txt'),'new approved main source\\n');
  git('add','.');git('commit','-qm','approved main code advanced');
  const currentMain=git('rev-parse','HEAD');
  git('checkout','-qb','candidate-refreshed-request');
  mkdirSync(join(dir,'.github'));
  writeFileSync(join(dir,'.github/private-model-review-request.json'),
    JSON.stringify({...request,expectedMainSha:currentMain,requestId:'p186e-new-main-safe-refresh'}));
  if(tamper)writeFileSync(join(dir,'trusted.txt'),'untrusted executable drift\\n');
  git('add','.');git('commit','-qm','updated request tree');
  if(!omitOldParent)git('merge','--no-ff','-s','ours','-m','preserve old request ancestry',
    'ops/private-model-review');
  const after=git('rev-parse','HEAD');
  git('checkout','-q','main');
  const env={...process.env,EVENT_NAME:'push',
    REPOSITORY:'aapojohannespihkala-lgtm/aapopihkala-fi',
    REF_FULL:'refs/heads/ops/private-model-review',
    ACTOR:'aapojohannespihkala-lgtm',ACTOR_ID:'322566438',
    BEFORE_SHA:before,AFTER_SHA:after};
  return {dir,env,output:join(dir,'dispatch.json')};
}

test('source-preserving newer-main merge can safely trigger only the inert P186E request',()=>{
  const f=refreshedMainFixture();try{
    const result=spawnSync('python3',[validator,f.output],
      {cwd:f.dir,env:f.env,encoding:'utf8'});
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(f.output,'utf8')))
      .toEqual({ref:'main',inputs:{probe_mode:'p186e-labels-render'}});
  }finally{rmSync(f.dir,{recursive:true,force:true});}
});

test('new-main request refuses executable drift or a missing old-branch ancestry',()=>{
  for(const config of [{tamper:true},{omitOldParent:true}]){
    const f=refreshedMainFixture(config);try{
      const result=spawnSync('python3',[validator,f.output],
        {cwd:f.dir,env:f.env,encoding:'utf8'});
      expect(result.status).not.toBe(0);
      expect(existsSync(f.output)).toBe(false);
      expect(result.stderr.trim()).toBe('P186E_DISPATCH_REQUEST_REJECTED');
    }finally{rmSync(f.dir,{recursive:true,force:true});}
  }
});
