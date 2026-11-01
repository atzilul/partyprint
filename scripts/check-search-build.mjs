import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const server=spawn(process.execPath,['server.js'],{stdio:'inherit',env:{...process.env,HOST:'127.0.0.1',PORT:'3333'}});
let done=false;
server.on('exit',()=>{done=true;});
try{
 let ready=false;
 for(let i=0;i<60;i++){
  if(done)throw new Error('Production server exited before becoming ready.');
  try{const r=await fetch('http://127.0.0.1:3333/',{signal:AbortSignal.timeout(1500)});if(r.status===200){ready=true;break;}}catch{}
  await delay(500);
 }
 if(!ready)throw new Error('Production server did not become ready.');
 const audit=spawn(process.execPath,['scripts/audit-search.mjs'],{stdio:'inherit',env:{...process.env,PARTYPRINT_PUBLIC_URL:'http://127.0.0.1:3333',PARTYPRINT_AUDIT_LOCAL:'1'}});
 const code=await new Promise((resolve,reject)=>{audit.on('error',reject);audit.on('exit',resolve);});
 if(code!==0)throw new Error('Local search audit failed.');
}finally{server.kill('SIGTERM');}
