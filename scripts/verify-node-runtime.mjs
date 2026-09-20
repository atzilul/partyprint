// Run after a portable `npm run build`. Uses disposable data and sends no email.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,scryptSync} from 'node:crypto';
const data=await mkdtemp(join(tmpdir(),'partyprint-node-'));
const base='http://127.0.0.1:3000',origin='https://partyprint-runtime.example',password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex');
const credentials=JSON.stringify({'atzilul@gmail.com':`scrypt$${salt}$${scryptSync(password,salt,64).toString('hex')}`});
let server,logs='',cookie='';
const request=(path,options={})=>fetch(base+path,{redirect:'manual',...options,headers:{Origin:origin,'X-Forwarded-Proto':'https','X-Forwarded-Host':'partyprint-runtime.example',...(cookie?{Cookie:cookie}:{}),...options.headers}});
async function start(){server=spawn('npm',['start'],{detached:true,env:{...process.env,PORT:'3000',HOST:'127.0.0.1',PARTYPRINT_PUBLIC_URL:origin,VINEXT_TRUSTED_HOSTS:'partyprint-runtime.example',PARTYPRINT_DATA_DIR:data,PARTYPRINT_SESSION_SECRET:randomBytes(32).toString('hex'),PARTYPRINT_STAFF_PASSWORD_HASHES:credentials,RESEND_API_KEY:'',MAIL_FROM:''},stdio:['ignore','pipe','pipe']});server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error(logs);try{if((await request('/api/pricing')).status===200)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Startup timeout: '+logs)}
async function stop(){if(!server)return;const exited=new Promise(r=>server.once('exit',r));process.kill(-server.pid,'SIGTERM');await exited;server=undefined}
async function login(){const r=await request('/api/staff-login',{method:'POST',body:new URLSearchParams({email:'atzilul@gmail.com',password})});assert.equal(r.status,303,await r.text());cookie=r.headers.get('set-cookie').split(';')[0];assert(r.headers.get('set-cookie').includes('HttpOnly'));assert(r.headers.get('set-cookie').includes('Secure'))}
try{
 await start();assert.equal((await request('/')).status,200);
 assert.equal((await request('/signin-with-chatgpt')).status,200);
 assert.equal((await request('/api/admin/orders',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'atzilul@gmail.com'}})).status,403);
 assert.equal((await request('/api/staff-login',{method:'POST',body:new URLSearchParams({email:'atzilul@gmail.com',password:'wrong'})})).status,401);
 await login();assert.equal((await request('/admin')).status,200);
 const settings=await (await request('/api/admin/settings')).json();
 const pricing=await request('/api/admin/settings',{method:'POST',body:JSON.stringify({action:'pricing',pricing:{...settings.pricing,tiers:[{quantity:4,price:99}]}})});assert.equal(pricing.status,200,await pricing.text());
 assert.equal((await request('/api/admin/settings',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'})).status,403);
 const form=new FormData();for(const [k,v] of Object.entries({name:'Node test',phone:'0501234567',email:'test@example.com',brief:'Runtime verification',package:0,quantity:4,expectedPrice:396,mode:'order',shirts:JSON.stringify(Array.from({length:4},()=>({size:'M',color:'black'})))}))form.set(k,String(v));
 const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=','base64');
 for(let i=0;i<10;i++)form.append('images',new Blob([image],{type:'image/png'}),`reference-${i}.png`);
 const created=await request('/api/orders',{method:'POST',body:form});assert.equal(created.status,201,await created.clone().text());const result=await created.json();assert.equal(result.emailSent,false);assert(result.trackingUrl.startsWith(origin+'/track/'));
 const path='/api/admin/orders/'+result.id;let order=await (await request(path)).json();assert.equal(order.price,396);assert.equal(order.images.length,10);
 const imagePath=path+'/image?key='+encodeURIComponent(order.images[0].key);assert.deepEqual(Buffer.from(await (await request(imagePath)).arrayBuffer()),image);
 const bundle=await request(path+'/bundle');assert.equal(bundle.status,200);assert.equal(Buffer.from(await bundle.arrayBuffer()).subarray(0,2).toString(),'PK');
 const edit=new FormData();edit.set('order',JSON.stringify({...order,notes:'',address:'',dueDate:'',tracking:'',priceNote:'',revisions:0,status:'designing',keep:order.images.map(i=>i.key)}));const saved=await request(path,{method:'POST',body:edit});assert.equal(saved.status,200,await saved.clone().text());assert.equal((await saved.json()).status,'designing');
 assert.equal((await request('/api/admin/orders',{method:'POST'})).status,200);
 const coupon={code:'NODELAST',title:'Runtime last use',kind:'percent',value:10,minQuantity:4,minSubtotal:0,maxUses:1,starts:'',ends:'',enabled:true,package:0,used:0,version:0};
 assert.equal((await request('/api/admin/settings',{method:'POST',body:JSON.stringify({action:'coupon',coupon})})).status,200);
 form.set('coupon','NODELAST');form.set('expectedPrice','356.4');
 const concurrent=await Promise.all([request('/api/orders',{method:'POST',body:form}),request('/api/orders',{method:'POST',body:form})]);
 assert.equal(concurrent.filter(r=>r.status===201).length,1);assert(concurrent.some(r=>[400,409].includes(r.status)));
 await stop();cookie='';await start();assert.equal((await request(path)).status,403);await login();order=await (await request(path)).json();assert.equal(order.status,'designing');assert.equal((await (await request('/api/pricing')).json()).shirtPrice,99);assert.deepEqual(Buffer.from(await (await request(imagePath)).arrayBuffer()),image);
 const logout=await request('/signout-with-chatgpt');assert.equal(logout.status,303);assert(logout.headers.get('set-cookie').includes('Max-Age=0'));
 assert(!/ERR_UNSUPPORTED_ESM_URL_SCHEME|ReferenceError|TypeError/.test(logs),logs);
 console.log('PASS: Node production boot on PORT=3000 behind a trusted HTTPS proxy; home/pricing; password login; forged identity and CSRF rejected; 10 image order at configured price; private image/ZIP; edit; atomic last coupon use; object listing; database, price and image persistence after restart. No email sent.');
}finally{await stop();await rm(data,{recursive:true,force:true})}
