// Local-only proxy models Hostinger's existing text compression for laboratory QA.
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:http';
import {brotliCompressSync,constants} from 'node:zlib';
const server=spawn(process.execPath,['server.js'],{stdio:'inherit',env:{...process.env,HOST:'127.0.0.1',PORT:'3334'}});
let ended=false;server.on('exit',()=>{ended=true});
const proxy=createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'){res.writeHead(405).end();return}
  const response=await fetch('http://127.0.0.1:3334'+req.url,{headers:{'accept':req.headers.accept||'*/*','accept-encoding':'identity'},redirect:'manual',signal:AbortSignal.timeout(30000)});
  let data=Buffer.from(await response.arrayBuffer());
  const headers=Object.fromEntries(response.headers);
  delete headers['content-length'];delete headers['content-encoding'];delete headers['transfer-encoding'];
  if(/\btext\/|javascript|json|svg|font-ttf|font\/ttf/.test(headers['content-type']||'')){
   data=brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:4}});
   headers['content-encoding']='br';headers.vary='Accept-Encoding';
  }
  res.writeHead(response.status,headers).end(data);
 }catch{res.writeHead(502).end('Laboratory upstream unavailable')}
});
try{
 let ready=false;
 for(let i=0;i<60;i++){if(ended)throw Error('Server stopped');try{const r=await fetch('http://127.0.0.1:3334/',{signal:AbortSignal.timeout(1500)});if(r.ok){ready=true;break}}catch{}await delay(500)}
 if(!ready)throw Error('Server not ready');
 await new Promise(resolve=>proxy.listen(3333,'127.0.0.1',resolve));
 const child=spawn(process.execPath,['scripts/check-landing-performance.mjs'],{stdio:'inherit',env:{...process.env,PERF_ORIGINS:'http://127.0.0.1:3333',PERF_EXPECT_OPTIMIZED:'1',PERF_SERVER_PROFILE:'local production build; read-only proxy with Brotli text compression, quality 4'}});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});
 if(code!==0)throw Error('Landing performance checks failed');
}finally{proxy.closeAllConnections();proxy.close();server.kill('SIGTERM')}
