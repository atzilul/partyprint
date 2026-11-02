import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const server=spawn(process.execPath,['server.js'],{stdio:'inherit',env:{...process.env,HOST:'127.0.0.1',PORT:'3333'}});
let ended=false;server.on('exit',()=>{ended=true});
try{
 let ready=false;
 for(let i=0;i<60;i++){if(ended)throw Error('Server stopped');try{const r=await fetch('http://127.0.0.1:3333/',{signal:AbortSignal.timeout(1500)});if(r.ok){ready=true;break}}catch{}await delay(500)}
 if(!ready)throw Error('Server not ready');
 const child=spawn(process.execPath,['scripts/check-landing-performance.mjs'],{stdio:'inherit',env:{...process.env,PERF_ORIGINS:'http://127.0.0.1:3333',PERF_EXPECT_OPTIMIZED:'1'}});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});
 if(code!==0)throw Error('Landing performance checks failed');
}finally{server.kill('SIGTERM')}
