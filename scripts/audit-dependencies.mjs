import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
async function scan(scope,flags){
 let raw;
 try{raw=execFileSync('npm',['audit','--json',...flags],{encoding:'utf8',maxBuffer:10*1024*1024,stdio:['ignore','pipe','pipe']});}
 catch(error){raw=error.stdout;if(!raw)throw Error('Dependency audit did not return JSON');}
 const report=JSON.parse(raw);
 await writeFile('artifacts/dependency-audit-'+scope+'.json',JSON.stringify(report,null,2));
 return {counts:report.metadata?.vulnerabilities,error:report.error,findings:Object.entries(report.vulnerabilities||{}).map(([name,item])=>({name,severity:item.severity,isDirect:item.isDirect,range:item.range,nodes:item.nodes,fixAvailable:item.fixAvailable,via:item.via.map(v=>typeof v==='string'?v:{name:v.name,title:v.title,url:v.url,range:v.range})}))};
}
await mkdir('artifacts',{recursive:true});
const all=await scan('all',[]),production=await scan('production',['--omit=dev']);
console.log(JSON.stringify({at:new Date().toISOString(),all,production},null,2));
if(all.error||production.error||all.findings.length||production.findings.length)process.exitCode=1;
