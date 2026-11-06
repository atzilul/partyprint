import ar from './ar.json';
import arNouns from './ar.nouns.json';
import en from './en.json';
import enNouns from './en.nouns.json';
import versions from './versions.json';
import {languageOfPath} from './core';
import type {Dictionary,GateEnvironment,Language,Nouns} from './core';

/** Server side of the gate: the language comes from the address of the request being rendered. */
const DICTIONARIES:Partial<Record<Language,Dictionary>>={ar:ar as Dictionary,en:en as Dictionary};
const NOUNS:Partial<Record<Language,Nouns>>={ar:arNouns as Nouns,en:enNouns as Nouns};
/**
 * The framework keeps the request being rendered here, for server and client components
 * alike. It is an internal of vinext, so it is read in this one place only. If a framework
 * update moves it, translated addresses render in Hebrew and scripts/i18n-check.mjs fails;
 * Hebrew addresses are not affected.
 */
const NAVIGATION=Symbol.for('vinext.navigation.globalAccessors');
type Accessors={getServerContext?:()=>{pathname?:string}|null};
const MISSING=Symbol.for('partyprint.i18n.missing');
type Store={[MISSING]?:Map<string,Set<string>>};
export const collecting=()=>process.env.PP_I18N_COLLECT==='1';

export function requestLanguage():Language{
 try{return languageOfPath(((globalThis as Record<symbol,unknown>)[NAVIGATION] as Accessors|undefined)?.getServerContext?.()?.pathname);}
 catch{return 'he';}
}
export function reportMissing(language:string,key:string){
 const store=globalThis as Store,all=store[MISSING]??=new Map<string,Set<string>>();
 let keys=all.get(language);if(!keys){keys=new Set();all.set(language,keys);}
 if(keys.size<20000)keys.add(key);
}
export function missingSentences():Record<string,string[]>{
 const store=(globalThis as Store)[MISSING];
 return Object.fromEntries([...(store||new Map<string,Set<string>>())].map(([language,keys])=>[language,[...keys]]));
}

export const serverEnvironment:GateEnvironment={
 language:requestLanguage,
 lookup:(language,key)=>DICTIONARIES[language]?.[key],
 nouns:language=>NOUNS[language],
 missing:reportMissing,
 scripts(language){
  if(!DICTIONARIES[language])return [];
  const dictionary={src:'/i18n/'+language+'.js?v='+((versions as Record<string,string>)[language]||'0')};
  // While sentences are being collected, the browser reports the ones it meets too.
  return collecting()?[{code:'window.__PP_I18N_COLLECT=1'},dictionary]:[dictionary];
 },
};
