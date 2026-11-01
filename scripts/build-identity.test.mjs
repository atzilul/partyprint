import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createBuildIdentity} from './build-identity.mjs';

function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'partyprint-release-test-'));
 t.after(()=>rmSync(root,{recursive:true,force:true}));
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 git('init','-q');git('config','user.name','Release QA');git('config','user.email','release-qa@example.invalid');
 mkdirSync(join(root,'app'));writeFileSync(join(root,'app/page.tsx'),'public source');
 writeFileSync(join(root,'.gitignore'),'.env*\npartyprint-data/\n');
 git('add','.');git('commit','-qm','fixture');
 return {root,git};
}
test('clean revisions identify source using only the public allowlist',t=>{
 const {root,git}=fixture(t),r=createBuildIdentity({root,target:'cloudflare',builtAt:'2026-11-01T00:00:00.000Z'});
 assert.equal(r.sourceState,'clean');assert.equal(r.sourceCommit,git('rev-parse','HEAD'));
 assert.match(r.sourceFingerprint,/^[a-f0-9]{64}$/);
 assert.deepEqual(Object.keys(r).sort(),['builtAt','mode','schemaVersion','sourceCommit','sourceFingerprint','sourceState','target'].sort());
});
test('tracked edits and untracked application code cannot claim a commit',t=>{
 const {root}=fixture(t);
 writeFileSync(join(root,'app/page.tsx'),'edited source');
 let r=createBuildIdentity({root});assert.equal(r.sourceState,'modified');assert.equal(r.sourceCommit,null);assert.equal(r.sourceFingerprint,null);
 writeFileSync(join(root,'app/page.tsx'),'public source');writeFileSync(join(root,'app/new.ts'),'new code');
 r=createBuildIdentity({root});assert.equal(r.sourceState,'modified');assert.equal(r.sourceCommit,null);
});
test('committed docs change the revision without changing the source fingerprint',t=>{
 const {root,git}=fixture(t),before=createBuildIdentity({root});
 mkdirSync(join(root,'docs'));writeFileSync(join(root,'docs/progress.md'),'documentation only');git('add','docs');git('commit','-qm','docs');
 const after=createBuildIdentity({root});assert.notEqual(after.sourceCommit,before.sourceCommit);assert.equal(after.sourceFingerprint,before.sourceFingerprint);
 writeFileSync(join(root,'app/page.tsx'),'changed application');git('add','app');git('commit','-qm','app');
 assert.notEqual(createBuildIdentity({root}).sourceFingerprint,after.sourceFingerprint);
});
test('ignored runtime settings and customer storage do not enter the fingerprint',t=>{
 const {root}=fixture(t),before=createBuildIdentity({root});
 writeFileSync(join(root,'.env.local'),'PRIVATE_FIXTURE=not-a-real-secret');mkdirSync(join(root,'partyprint-data'));writeFileSync(join(root,'partyprint-data/order.json'),'private fixture');
 const after=createBuildIdentity({root});assert.equal(after.sourceState,'clean');assert.equal(after.sourceFingerprint,before.sourceFingerprint);
 assert.ok(!JSON.stringify(after).includes('PRIVATE_FIXTURE'));
});
test('missing Git and tracked source symlinks remain explicitly unavailable',t=>{
 const absent=mkdtempSync(join(tmpdir(),'partyprint-no-git-'));t.after(()=>rmSync(absent,{recursive:true,force:true}));
 assert.equal(createBuildIdentity({root:absent}).sourceState,'unavailable');
 const {root,git}=fixture(t);symlinkSync('../.git/config',join(root,'app/link'));git('add','app/link');git('commit','-qm','symlink');
 const r=createBuildIdentity({root});assert.equal(r.sourceState,'unavailable');assert.equal(r.sourceCommit,null);
});
