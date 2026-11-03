// Serve a production build through the same Brotli text-compression profile
// as the existing Hostinger performance laboratory.
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:http';
import {brotliCompressSync,constants} from 'node:zlib';

const upstreamPort=3334;
const proxyPort=3333;
const upstream=`http://127.0.0.1:${upstreamPort}`;
const app=spawn(process.execPath,['server.js'],{stdio:'inherit',env:{...process.env,HOST:'127.0.0.1',PORT:String(upstreamPort)}});
let appExited=false;
app.on('exit',()=>{appExited=true});

const proxy=createServer(async(req,res)=>{
  try{
    if(req.method!=='GET'){
      res.writeHead(405).end();
      return;
    }
    const response=await fetch(upstream+(req.url||'/'),{
      headers:{accept:req.headers.accept||'*/*','accept-encoding':'identity'},
      redirect:'manual',
      signal:AbortSignal.timeout(30000),
    });
    let data=Buffer.from(await response.arrayBuffer());
    const headers=Object.fromEntries(response.headers);
    delete headers['content-length'];
    delete headers['content-encoding'];
    delete headers['transfer-encoding'];
    if(/\btext\/|javascript|json|svg|font-ttf|font\/ttf/.test(headers['content-type']||'')){
      data=brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:4}});
      headers['content-encoding']='br';
      headers.vary='Accept-Encoding';
    }
    res.writeHead(response.status,headers).end(data);
  }catch{
    if(!res.headersSent)res.writeHead(502);
    res.end('Lighthouse upstream unavailable');
  }
});

function stop(){
  proxy.closeAllConnections();
  proxy.close();
  if(!appExited)app.kill('SIGTERM');
}
process.on('SIGINT',stop);
process.on('SIGTERM',stop);

try{
  let ready=false;
  for(let attempt=0;attempt<120;attempt++){
    if(appExited)throw new Error('Production server stopped before becoming ready');
    try{
      const response=await fetch(upstream+'/',{signal:AbortSignal.timeout(1500)});
      if(response.ok){ready=true;break;}
    }catch{}
    await delay(500);
  }
  if(!ready)throw new Error('Production server did not become ready');
  await new Promise((resolve,reject)=>{
    proxy.once('error',reject);
    proxy.listen(proxyPort,'127.0.0.1',resolve);
  });
  console.log(`PARTYPRINT Lighthouse proxy ready at http://127.0.0.1:${proxyPort}`);
  await new Promise(resolve=>app.once('exit',resolve));
  if(!appExited)throw new Error('Production server exited unexpectedly');
}catch(error){
  stop();
  console.error('[partyprint] Lighthouse proxy failed:',error.message);
  process.exitCode=1;
}
