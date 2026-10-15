import {test} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm,symlink,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
// @ts-ignore: Node ESM helper has no generated declaration file.
import {parseArguments,inspectRawIdentity,SOURCES} from '../../src/scripts/privateModelM5AZ2R1125BridgeCli.mjs';

// This is a fail-closed CI contract. CI does not contain private raw Drive GLBs.
// A green CI run alone MUST NOT claim source or production verification.
const script=resolve('src/scripts/privateModelM5AZ2R1125BridgeCli.mjs');
const invoke=(...args:string[])=>spawnSync(process.execPath,[script,...args],{encoding:'utf8'});

test('source gate requires two explicit, distinct raw paths',()=>{
  assert.throws(()=>parseArguments([]),/both raw source paths required/);
  assert.throws(()=>parseArguments(['--z2-glb','a','--r1125-glb','a']),/distinct source paths/);
  assert.throws(()=>parseArguments(['--z2-glb','a','--r1125-glb','b','--report','a']),/report path must differ/);
});

test('source gate rejects overrides, duplicate inputs and malformed argument pairs',()=>{
  assert.throws(()=>parseArguments(['--z2-glb','a','--r1125-glb','b','--sha256','forged']),/unsupported argument/);
  assert.throws(()=>parseArguments(['--z2-glb','a','--z2-glb','b','--r1125-glb','c']),/duplicate argument/);
  assert.throws(()=>parseArguments(['--z2-glb','a','--r1125-glb']),/named path\/value pairs/);
  assert.equal(SOURCES.z2.bytes,2958672);
  assert.equal(SOURCES.r1125.bytes,3112432);
});

test('false source buffers cannot pass raw-size or SHA-256 checks',()=>{
  assert.throws(()=>inspectRawIdentity(Buffer.alloc(24),SOURCES.z2),/byte size mismatch/);
  assert.throws(()=>inspectRawIdentity(Buffer.alloc(SOURCES.z2.bytes),SOURCES.z2),/SHA-256 mismatch/);
  assert.throws(()=>inspectRawIdentity(Buffer.alloc(SOURCES.r1125.bytes),SOURCES.r1125),/SHA-256 mismatch/);
});

test('CLI help is harmless and never claims an authenticated source',()=>{
  const result=invoke('--help');
  assert.equal(result.status,0);
  assert.match(result.stdout,/authenticated-raw-Z2/);
  assert.doesNotMatch(result.stdout,/originalSourceBytesAuthenticated/);
});

test('synthetic GLBs fail without a success report even when byte lengths match',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'m5a-gate-'));
  try{
    const z=join(dir,'z.glb'),r=join(dir,'r.glb'),output=join(dir,'evidence.json');
    await Promise.all([writeFile(z,Buffer.alloc(SOURCES.z2.bytes)),writeFile(r,Buffer.alloc(SOURCES.r1125.bytes))]);
    const result=invoke('--z2-glb',z,'--r1125-glb',r,'--report',output);
    assert.equal(result.status,1);
    assert.equal(result.stdout,'');
    assert.match(result.stderr,/SHA-256 mismatch/);
    await assert.rejects(readFile(output),/ENOENT/);
  }finally{await rm(dir,{force:true,recursive:true});}
});

test('symlink sources are refused before checksum or geometry checks',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'m5a-gate-symlink-'));
  try{
    const z=join(dir,'z.glb'),alias=join(dir,'alias.glb'),r=join(dir,'r.glb');
    await Promise.all([writeFile(z,Buffer.alloc(SOURCES.z2.bytes)),writeFile(r,Buffer.alloc(SOURCES.r1125.bytes))]);
    await symlink(z,alias);
    const result=invoke('--z2-glb',alias,'--r1125-glb',r);
    assert.equal(result.status,1);
    assert.match(result.stderr,/regular non-symlink file/);
    assert.equal(result.stdout,'');
  }finally{await rm(dir,{force:true,recursive:true});}
});
