#!/usr/bin/env node
/**
 * Read-only identity gate for two historical drainage WORK_TEST GLBs.
 * This is not a physical pipe, route, elevation, production or review proof.
 * CI intentionally does not have the private Drive source bytes.
 */
import {createHash} from 'node:crypto';
import {lstat, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const SOURCES=Object.freeze({
  z2:Object.freeze({driveId:'1uG7z27QroMuttZmWDKNvCXAsypBBuQnq',bytes:2958672,sha256:'e15e265ee4267bb26214eaaab338b786388afb2d3a5b9dc37ecdb92e0815d4cb'}),
  r1125:Object.freeze({driveId:'13qxYc9PF7Z6eo_OXs1RrYCyo5CbTIAKs',bytes:3112432,sha256:'c465417fc101e7de495d0a04bb4feb2bee61b80cd5efccf876f6eb76326f9a48'}),
});
const KEYS=new Set(['--z2-glb','--r1125-glb','--report']);
const reject=(message)=>{throw new Error('M5A_EXACT_SOURCE: '+message);};

export function parseArguments(argv){
  if(argv.length===1&&argv[0]==='--help')return {help:true};
  if(argv.length%2!==0)reject('expected named path/value pairs');
  const result={};
  for(let i=0;i<argv.length;i+=2){
    const key=argv[i],value=argv[i+1];
    if(!KEYS.has(key))reject('unsupported argument');
    if(Object.hasOwn(result,key))reject('duplicate argument');
    if(!value||value.startsWith('--'))reject('missing path argument');
    result[key]=resolve(value);
  }
  const z2Path=result['--z2-glb'],r1125Path=result['--r1125-glb'],reportPath=result['--report'];
  if(!z2Path||!r1125Path)reject('both raw source paths required');
  if(z2Path===r1125Path)reject('distinct source paths required');
  if(reportPath&&(reportPath===z2Path||reportPath===r1125Path))reject('report path must differ');
  return {z2Path,r1125Path,reportPath};
}

export function inspectRawIdentity(raw,expected){
  if(!Buffer.isBuffer(raw)||raw.length!==expected.bytes)reject('raw source byte size mismatch');
  const sha256=createHash('sha256').update(raw).digest('hex');
  if(sha256!==expected.sha256)reject('raw source SHA-256 mismatch');
  if(raw.toString('ascii',0,4)!=='glTF'||raw.readUInt32LE(4)!==2||raw.readUInt32LE(8)!==raw.length)
    reject('GLB v2 header invalid');
  const jsonBytes=raw.readUInt32LE(12);
  if(jsonBytes<2||20+jsonBytes+8>raw.length||raw.toString('ascii',16,20)!=='JSON')
    reject('GLB JSON chunk invalid');
  const offset=20+jsonBytes;
  if(raw.toString('ascii',offset+4,offset+8)!=='BIN\0'||offset+8+raw.readUInt32LE(offset)!==raw.length)
    reject('GLB BIN chunk invalid');
  const json=JSON.parse(raw.toString('utf8',20,offset));
  if(!Array.isArray(json.scenes)||!Array.isArray(json.nodes))reject('GLB source structure invalid');
  return {driveId:expected.driveId,bytes:raw.length,sha256,sceneCount:json.scenes.length,nodeCount:json.nodes.length};
}

async function readRegular(path,expected){
  const stat=await lstat(path);
  if(!stat.isFile()||stat.isSymbolicLink())reject('raw source must be regular non-symlink file');
  if(stat.size!==expected.bytes)reject('raw source byte size mismatch');
  return readFile(path);
}

export async function runGate({z2Path,r1125Path,reportPath}){
  const [z2,r1125]=await Promise.all([
    readRegular(z2Path,SOURCES.z2),readRegular(r1125Path,SOURCES.r1125),
  ]);
  const result={
    result:'PASS',gate:'EXACT_TWO_RAW_GLB_IDENTITIES_ONLY',
    sourceZ2:inspectRawIdentity(z2,SOURCES.z2),
    sourceR1125:inspectRawIdentity(r1125,SOURCES.r1125),
    originalSourceBytesAuthenticated:true,
    semanticRouteChecksPerformed:false,
    physicalConnectionsVerified:false,physicalDiameterPerRouteVerified:false,
    elevationsMeasured:false,productionVerified:false,humanReviewNotAssessed:true,
    current:false,canonical:false,asBuilt:false,
  };
  if(reportPath)await writeFile(reportPath,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  return result;
}

export async function main(argv=process.argv.slice(2)){
  try{
    const args=parseArguments(argv);
    if(args.help){
      process.stdout.write('Usage: node privateModelM5AZ2R1125BridgeCli.mjs --z2-glb <authenticated-raw-Z2.glb> --r1125-glb <authenticated-raw-R1125.glb> [--report <new.json>]\n');
      return 0;
    }
    process.stdout.write(JSON.stringify(await runGate(args))+'\n');
    return 0;
  }catch(e){
    // Do not expose private machine paths, and never print PASS for failures.
    process.stderr.write('M5A_SOURCE_GATE_FAIL: '+String(e?.message??e).replace(/\/(?:[\w.-]+\/)*[\w.-]+/g,'<path>')+'\n');
    return 1;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  process.exitCode=await main();
}
