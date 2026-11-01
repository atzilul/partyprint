import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const base=(process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il').replace(/\/$/,'');
if(!['https://partyprint.co.il','http://127.0.0.1:3333'].includes(base))throw Error('Unexpected release audit origin');
const local=base.includes('127.0.0.1'),required=local||process.env.PARTYPRINT_REQUIRE_RELEASE==='1';
let expectedCommit=process.env.PARTYPRINT_EXPECT_RELEASE_COMMIT||null;
if(local&&!expectedCommit)expectedCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
if(expectedCommit&&!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(expectedCommit))throw Error('Expected a full commit hash');
const report={at:new Date().toISOString(),base,expectedCommit,available:false,release:null,checks:[],errors:[],note:'Build-source diagnostic only; not a Hostinger deployment receipt or indexing proof.'};
const check=(label,value)=>{assert.ok(value,label);report.checks.push(label);};
try{
 const response=await fetch(base+'/api/release',{headers:{'cache-control':'no-cache'},redirect:'error',signal:AbortSignal.timeout(15000)});
 report.status=response.status;
 if(response.status===404&&!required)report.note+=' The older public version has no release endpoint.';
 else{
  check('release endpoint returns 200',response.status===200);
  check('release response is JSON',(response.headers.get('content-type')||'').includes('application/json'));
  check('release response prevents caching',/\bno-store\b/i.test(response.headers.get('cache-control')||''));
  check('release diagnostic remains noindex',/\bnoindex\b/i.test(response.headers.get('x-robots-tag')||''));
  const body=await response.json();
  const keys=['app','schemaVersion','target','mode','builtAt','sourceState','sourceCommit','sourceFingerprint'];
  check('release body has only documented public fields',body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).length===keys.length&&Object.keys(body).every(k=>keys.includes(k)));
  check('release schema identifies PARTYPRINT',body.app==='PARTYPRINT'&&body.schemaVersion===1);
  check('release target and mode are recognized',['node','cloudflare','unknown'].includes(body.target)&&['production','development','unknown'].includes(body.mode));
  check('release source state is recognized',['clean','modified','unavailable'].includes(body.sourceState));
  check('release time is explicit',body.builtAt===null||typeof body.builtAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(body.builtAt)&&Number.isFinite(Date.parse(body.builtAt)));
  const clean=body.sourceState==='clean';
  check('source evidence cannot label uncommitted content',clean?/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(body.sourceCommit)&&/^[a-f0-9]{64}$/.test(body.sourceFingerprint):body.sourceCommit===null&&body.sourceFingerprint===null);
  // Retain only values that passed the complete public schema check.
  report.release=Object.fromEntries(keys.map(k=>[k,body[k]]));report.available=true;
  if(required)check('production artifact has clean source evidence',clean&&body.mode==='production'&&body.builtAt!==null&&body.target!=='unknown');
  if(expectedCommit)check('served artifact matches the expected Git revision',body.sourceCommit===expectedCommit);
 }
}catch(error){report.errors.push(error.message);}
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/release-identity.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
