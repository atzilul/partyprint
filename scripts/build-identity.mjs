import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// A public diagnostic allowlist, never a dump of the host's environment.
const SOURCE_PATHS=['app','components','lib','runtime','build','scripts','public',
 'package.json','package-lock.json','pnpm-lock.yaml','yarn.lock','vite.config.ts',
 'next.config.ts','middleware.ts','server.js','tsconfig.json'];
const SHA=/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export function createBuildIdentity({root=process.cwd(),target='node',mode='production',builtAt=new Date().toISOString()}={}){
 if(!['node','cloudflare'].includes(target)||!['production','development'].includes(mode))throw Error('Unknown build target or mode');
 const base={schemaVersion:1,target,mode,builtAt,sourceState:'unavailable',sourceCommit:null,sourceFingerprint:null};
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:10000,maxBuffer:8*1024*1024});
 try{
  const sha=git(['rev-parse','--verify','HEAD']).trim();
  if(!SHA.test(sha))return base;
  // An uncommitted build must never claim to be an exact Git revision.
  if(git(['status','--porcelain','--untracked-files=normal']).trim())return {...base,sourceState:'modified'};
  const files=git(['ls-files','-z','--',...SOURCE_PATHS]).split('\0').filter(Boolean).sort();
  if(!files.length)return base;
  const hash=createHash('sha256');
  for(const name of files){
   const path=resolve(root,name);
   if(!lstatSync(path).isFile())return base;
   hash.update(name+'\0').update(readFileSync(path)).update('\0');
  }
  return {...base,sourceState:'clean',sourceCommit:sha,sourceFingerprint:hash.digest('hex')};
 }catch{return base;}
}
