import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// A public diagnostic allowlist, never a dump of the host's environment.
const SOURCE_PATHS=['app','components','lib','runtime','build','scripts','public',
 'package.json','package-lock.json','pnpm-lock.yaml','yarn.lock','vite.config.ts',
 'next.config.ts','middleware.ts','server.js','tsconfig.json','.openai/hosting.json','.gitignore'];
const SHA=/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export function createBuildIdentity({root=process.cwd(),target='node',mode='production',builtAt=new Date().toISOString()}={}){
 if(!['node','cloudflare'].includes(target)||!['production','development'].includes(mode))throw Error('Unknown build target or mode');
 const base={schemaVersion:1,target,mode,builtAt,sourceState:'unavailable',sourceCommit:null,sourceFingerprint:null};
 const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:10000,maxBuffer:8*1024*1024});
 try{
  const sha=git(['rev-parse','--verify','HEAD']).trim();
  if(!SHA.test(sha))return base;
  // Compare content with HEAD: executable bits changed by hosting must not
  // be mistaken for changed application bytes. Extra source still fails closed.
  if(git(['ls-files','--others','--exclude-standard','-z','--',...SOURCE_PATHS]))return {...base,sourceState:'modified'};
  const entries=git(['ls-tree','-r','-z','--full-tree',sha,'--',...SOURCE_PATHS]).split('\0').filter(Boolean).map(line=>{
   const at=line.indexOf('\t'),[mode,type,blob]=line.slice(0,at).split(' ');
   return {name:line.slice(at+1),mode,type,blob};
  }).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  const tracked=git(['ls-files','-z','--',...SOURCE_PATHS]).split('\0').filter(Boolean).sort();
  if(!entries.length)return base;
  if(JSON.stringify(entries.map(e=>e.name))!==JSON.stringify(tracked))return {...base,sourceState:'modified'};
  const hash=createHash('sha256');
  for(const {name,mode,type,blob} of entries){
   if(type!=='blob'||!['100644','100755'].includes(mode))return base;
   const path=resolve(root,name);
   if(!lstatSync(path).isFile())return base;
   const bytes=readFileSync(path);
   const object=createHash(blob.length===64?'sha256':'sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
   if(object!==blob)return {...base,sourceState:'modified'};
   hash.update(name+'\0').update(bytes).update('\0');
  }
  return {...base,sourceState:'clean',sourceCommit:sha,sourceFingerprint:hash.digest('hex')};
 }catch{return base;}
}
