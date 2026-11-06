import {languageOfPath} from './core';
import type {Dictionary,GateEnvironment,Language,Nouns} from './core';

/** Browser side of the gate: the dictionary was loaded by a script before the page took over. */
type Loaded={__PP_I18N?:{language:string;dictionary:Dictionary;nouns?:Nouns};__PP_I18N_MISSING?:Record<string,string[]>};
const loaded=()=>(window as unknown as Loaded);

export const clientEnvironment:GateEnvironment={
 language:()=>languageOfPath(window.location.pathname),
 dictionary:(language:Language)=>loaded().__PP_I18N?.language===language?loaded().__PP_I18N?.dictionary:undefined,
 nouns:(language:Language)=>loaded().__PP_I18N?.language===language?loaded().__PP_I18N?.nouns:undefined,
 missing(language,key){
  const all=loaded().__PP_I18N_MISSING??={},keys=all[language]??=[];
  if(!keys.includes(key))keys.push(key);
 },
 dictionaryScript:()=>null,
};
