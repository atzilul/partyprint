import {hashKey,languageOfPath} from './core';
import type {Dictionary,GateEnvironment,Language,Nouns} from './core';

/**
 * Browser side of the gate: the dictionary was loaded by a script before the page took
 * over. It is keyed by a short hash of each Hebrew sentence, to keep the download small.
 */
type Loaded={__PP_I18N?:{language:string;dictionary:Dictionary;nouns?:Nouns};__PP_I18N_MISSING?:Record<string,string[]>;__PP_I18N_COLLECT?:number};
const loaded=()=>(window as unknown as Loaded);
const dictionary=(language:Language)=>loaded().__PP_I18N?.language===language?loaded().__PP_I18N:undefined;
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
