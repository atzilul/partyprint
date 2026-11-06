// Translation drift check: node scripts/check-translations.mjs   (after npm run build)
// Starts the built site in collect mode, reads every translated page the way a visitor's
// browser receives it, and fails when a Hebrew sentence on one of them has no translation.
// The Hebrew text in the code is the only source, so this is what notices that a Hebrew
// edit or a new section was released without its translations.
// It sees what the server renders. Text that appears only after a click is added to the
// candidates with `node scripts/i18n-sync.mjs scan <language> <file...>` (see AGENTS.md).
import {spawn,execFileSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const PORT=process.env.PARTYPRINT_I18N_CHECK_PORT||'3334',base='http://127.0.0.1:'+PORT;
// A language is one that has a dictionary: i18n/ar.json.
const languages=readdirSync(root+'i18n').map(name=>name.match(/^([a-z]{2})\.json$/)?.[1]).filter(Boolean);
const server=spawn(process.execPath,['server.js'],{cwd:root,stdio:'inherit',env:{...process.env,HOST:'127.0.0.1',PORT,PP_I18N_COLLECT:'1',PARTYPRINT_PUBLIC_URL:process.env.PARTYPRINT_PUBLIC_URL||'https://partyprint.co.il'}});
let exited=false;
server.on('exit',()=>{exited=true;});
let failed=false;
try{
 let ready=false;
 for(let attempt=0;attempt<60&&!ready;attempt++){
  if(exited)throw new Error('The built site exited before it was ready. Run npm run build first.');
  try{ready=(await fetch(base+'/',{signal:AbortSignal.timeout(1500)})).status===200;}catch{/* not up yet */}
  if(!ready)await delay(500);
 }
 if(!ready)throw new Error('The built site did not become ready.');
 for(const language of languages){
  const pages=execFileSync(process.execPath,[root+'scripts/i18n-pages.mjs',language],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
  const code=await new Promise((resolve,reject)=>{
   // The list of sentences without a translation is the point of this check, so it has to arrive.
   const child=spawn(process.execPath,[root+'scripts/i18n-check.mjs',base,language,...pages],{stdio:'inherit',env:{...process.env,PP_I18N_COLLECT:'1'}});
   child.on('error',reject);child.on('exit',resolve);
  });
  if(code!==0)failed=true;
 }
}finally{server.kill('SIGTERM');}
if(failed){
 console.error('Translations are behind the Hebrew source. Follow "Translations" in AGENTS.md: collect, translate, merge, publish.');
 process.exitCode=1;
}
