import ar from './ar.json';
import arNouns from './ar.nouns.json';
import {languageOfPath} from './core';
import type {Dictionary,GateEnvironment,Language,Nouns} from './core';

/** Server side of the gate: the language comes from the address of the request being rendered. */
const DICTIONARIES:Partial<Record<Language,Dictionary>>={ar:ar as Dictionary};
const NOUNS:Partial<Record<Language,Nouns>>={ar:arNouns as Nouns};
// The framework keeps the request being rendered here, for server and client components alike.
const NAVIGATION=Symbol.for('vinext.navigation.globalAccessors');
type Accessors={getServerContext?:()=>{pathname?:string}|null};
const MISSING=Symbol.for('partyprint.i18n.missing');
type Store={[MISSING]?:Map<string,Set<string>>};

export function missingSentences():Record<string,string[]>{
 const store=(globalThis as Store)[MISSING];
 return Object.fromEntries([...(store||new Map<string,Set<string>>())].map(([language,keys])=>[language,[...keys]]));
}
export function requestLanguage():Language{
 return languageOfPath(((globalThis as Record<symbol,unknown>)[NAVIGATION] as Accessors|undefined)?.getServerContext?.()?.pathname);
}
const version=(dictionary:Dictionary|undefined)=>{let sum=0;for(const key in dictionary)sum=(sum*31+key.length+dictionary[key].length)>>>0;return sum.toString(36);};

export const serverEnvironment:GateEnvironment={
 language:requestLanguage,
 dictionary:language=>DICTIONARIES[language],
 nouns:language=>NOUNS[language],
 missing(language,key){
  const store=globalThis as Store,all=store[MISSING]??=new Map<string,Set<string>>();
  let keys=all.get(language);if(!keys){keys=new Set();all.set(language,keys);}
  keys.add(key);
 },
 dictionaryScript:language=>DICTIONARIES[language]?'/i18n/'+language+'.js?v='+version(DICTIONARIES[language]):null,
};
