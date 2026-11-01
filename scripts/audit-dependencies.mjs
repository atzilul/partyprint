import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
let raw;
try{raw=execFileSync('npm',['audit','--json'],{encoding:'utf8',maxBuffer:10*1024*1024,stdio:['ignore','pipe','pipe']});}
catch(error){raw=error.stdout;if(!raw)throw Error('Dependency audit did not return JSON');}
const report=JSON.parse(raw);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/dependency-audit.json',JSON.stringify(report,null,2));
const findings=Object.entries(report.vulnerabilities||{}).map(([name,item])=>({name,severity:item.severity,isDirect:item.isDirect,range:item.range,nodes:item.nodes,fixAvailable:item.fixAvailable,via:item.via.map(v=>typeof v==='string'?v:{name:v.name,title:v.title,url:v.url,range:v.range})}));
console.log(JSON.stringify({at:new Date().toISOString(),counts:report.metadata?.vulnerabilities,error:report.error,findings},null,2));
if(report.error||findings.length)process.exitCode=1;
