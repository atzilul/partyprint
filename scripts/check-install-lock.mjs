import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const root=process.cwd(),scratch=mkdtempSync(join(tmpdir(),'partyprint-install-lock-'));
const original=readFileSync(join(root,'package-lock.json'),'utf8');
const manifest=readFileSync(join(root,'package.json'),'utf8');
const npm=args=>execFileSync('npm',args,{cwd:scratch,stdio:'inherit',timeout:240000});
try{
 writeFileSync(join(scratch,'package.json'),manifest);
 writeFileSync(join(scratch,'package-lock.json'),original);
 const npmVersion=execFileSync('npm',['--version'],{encoding:'utf8'}).trim();
 console.log('[partyprint] install verification Node '+process.version+', npm '+npmVersion);
 const manifests=[];
 npm(['install','--no-audit','--no-fund']);
 const first=readFileSync(join(scratch,'package-lock.json'),'utf8');
 manifests.push(readFileSync(join(scratch,'package.json'),'utf8')===manifest);
 npm(['install','--no-audit','--no-fund']);
 const second=readFileSync(join(scratch,'package-lock.json'),'utf8');
 manifests.push(readFileSync(join(scratch,'package.json'),'utf8')===manifest);
 rmSync(join(scratch,'node_modules'),{recursive:true,force:true});
 npm(['install','--no-audit','--no-fund']);
 const fresh=readFileSync(join(scratch,'package-lock.json'),'utf8');
 manifests.push(readFileSync(join(scratch,'package.json'),'utf8')===manifest);
 const before=JSON.parse(original),after=JSON.parse(first);
 const beforeTop={...before},afterTop={...after};delete beforeTop.packages;delete afterTop.packages;
 const names=[...new Set([...Object.keys(before.packages),...Object.keys(after.packages)])].sort();
 const changes=names.filter(name=>JSON.stringify(before.packages[name])!==JSON.stringify(after.packages[name])).map(path=>({path,before:before.packages[path]??null,after:after.packages[path]??null}));
 const reconstructed=JSON.parse(original);
 for(const {path,after:entry} of changes){if(entry===null)delete reconstructed.packages[path];else reconstructed.packages[path]=entry;}
 const report={
  at:new Date().toISOString(),node:process.version,npm:npmVersion,
  originalBytes:Buffer.byteLength(original),normalizedBytes:Buffer.byteLength(first),
  originalPackages:Object.keys(before.packages).length,normalizedPackages:Object.keys(after.packages).length,
  manifestUnchanged:manifests.every(Boolean),topLevelUnchanged:JSON.stringify(beforeTop)===JSON.stringify(afterTop),
  firstInstallUnchanged:first===original,secondInstallUnchanged:second===first,freshInstallUnchanged:fresh===first,
  reconstructionExact:JSON.stringify(reconstructed,null,2)+'\n'===first,
  normalizedSha256:createHash('sha256').update(first).digest('hex'),
  normalizedGitBlob:createHash('sha1').update('blob '+Buffer.byteLength(first)+'\0').update(first).digest('hex'),
  changes
 };
 mkdirSync(resolve(root,'artifacts'),{recursive:true});
 writeFileSync(resolve(root,'artifacts/install-lock-report.json'),JSON.stringify(report,null,2)+'\n');
 writeFileSync(resolve(root,'artifacts/package-lock.node24.json'),first);
 console.log('PARTYPRINT_INSTALL_REPORT_BEGIN');
 console.log(JSON.stringify(report));
 console.log('PARTYPRINT_INSTALL_REPORT_END');
 if(!report.manifestUnchanged||!report.topLevelUnchanged||!report.reconstructionExact||!report.firstInstallUnchanged||!report.secondInstallUnchanged||!report.freshInstallUnchanged)process.exitCode=1;
}finally{
 rmSync(scratch,{recursive:true,force:true});
}
