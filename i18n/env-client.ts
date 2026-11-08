import {hashKey,languageOfPath} from './core';
import type {Dictionary,GateEnvironment,Language,Nouns} from './core';

/**
 * Browser side of the gate: the dictionary was loaded by a script before the page took
 * over. It is keyed by a short hash of each Hebrew sentence, to keep the download small.
 */
type Loaded={__PP_I18N?:{language:string;dictionary:Dictionary;nouns?:Nouns};__PP_I18N_MISSING?:Record<string,string[]>;__PP_I18N_COLLECT?:number};
const loaded=()=>(window as unknown as Loaded);
const dictionary=(language:Language)=>loaded().__PP_I18N?.language===language?loaded().__PP_I18N:undefined;
/**
 * The dictionary loads without holding up the page (the server sent the page translated). The
 * browser takes the page over only once it has arrived, so that what it renders matches what
 * the server sent: every module built against the gate waits here. Hebrew pages do not wait.
 * If the dictionary never arrives, the page takes over after a few seconds anyway.
 */
if(typeof window!=='undefined'){
 const language=languageOfPath(window.location.pathname);
 if(language!=='he'&&!dictionary(language))await new Promise<void>(resolve=>{
  const done=()=>{window.removeEventListener('pp-i18n',done);clearTimeout(timer);resolve();};
  const timer=setTimeout(done,8000);
  window.addEventListener('pp-i18n',done);
 });
}
let waiting:ReturnType<typeof setTimeout>|null=null;
const unsent:Record<string,string[]>={};

export const clientEnvironment:GateEnvironment={
 language:()=>languageOfPath(window.location.pathname),
 lookup:(language,key)=>dictionary(language)?.dictionary[hashKey(key)],
 nouns:language=>dictionary(language)?.nouns,
 missing(language,key){
  const all=loaded().__PP_I18N_MISSING??={},keys=all[language]??=[];
  if(keys.includes(key))return;
  keys.push(key);
  if(!loaded().__PP_I18N_COLLECT)return;
  (unsent[language]??=[]).push(key);
  if(waiting)clearTimeout(waiting);
  waiting=setTimeout(()=>{
   for(const name of Object.keys(unsent)){
    const list=unsent[name].splice(0);
    if(list.length)void fetch('/api/i18n-missing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:name,keys:list}),keepalive:true}).catch(()=>{});
   }
  },400);
 },
 scripts:()=>[],
};

/**
 * A request the page sends to the site from a translated address says which language the
 * reader is using, so that an order remembers it. Hebrew addresses are not touched.
 */
type Marked={__PP_I18N_FETCH?:boolean};
if(typeof window!=='undefined'&&!(window as unknown as Marked).__PP_I18N_FETCH){
 (window as unknown as Marked).__PP_I18N_FETCH=true;
 const send=window.fetch.bind(window);
 window.fetch=(input,init)=>{
  const language=languageOfPath(window.location.pathname);
  if(language==='he')return send(input,init);
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(!(url.startsWith('/')&&!url.startsWith('//'))&&!url.startsWith(window.location.origin+'/'))return send(input,init);
  const headers=new Headers(init?.headers??(input instanceof Request?input.headers:undefined));
  headers.set('X-Partyprint-Language',language);
  return send(input,{...init,headers});
 };
}
