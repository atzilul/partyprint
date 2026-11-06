import type {Metadata} from 'next';
import {LANGUAGES,TRANSLATED_ROUTES,maskNumbers,translateDeep} from './core';
import type {Language} from './core';
import {missingSentences,reportMissing,serverEnvironment} from './env.server';
import {VARIANTS} from './variants';

const LOCALE:Record<Language,string>={he:'he_IL',ar:'ar_IL',en:'en_US',ru:'ru_RU',fr:'fr_FR'};

/** The same page in every language it exists in, for search engines. `path` has no language prefix. */
export function languageAlternates(path:string):Record<string,string>{
 const all:Record<string,string>={he:path,'x-default':path};
 for(const language of LANGUAGES)if(TRANSLATED_ROUTES[language]?.includes(path))all[language]='/'+language+path;
 return all;
}

/**
 * A page's metadata in another language. Titles, descriptions and social cards never become
 * elements, so they do not pass the gate by themselves. Keywords are replaced too, because
 * the site-wide Hebrew keywords would otherwise be inherited.
 */
export function translatedMetadata(hebrew:Metadata,language:Language,path:string):Metadata{
 const translated=translateDeep(hebrew,language,serverEnvironment);
 return {
  ...translated,
  keywords:Array.isArray(hebrew.keywords)?translateDeep(hebrew.keywords,language,serverEnvironment):[],
  alternates:{canonical:'/'+language+path,languages:languageAlternates(path)},
  openGraph:translated.openGraph?{...translated.openGraph,locale:LOCALE[language],url:'https://partyprint.co.il/'+language+path}:undefined,
 };
}

/** Everything the sync needs: what was met without a translation, and the moment-dependent sentences. */
export function sentencesToTranslate():Record<string,string[]>{
 for(const language of LANGUAGES)if(TRANSLATED_ROUTES[language])for(const variant of VARIANTS){
  const {key}=maskNumbers(variant().trim());
  if(serverEnvironment.lookup(language,key)===undefined)reportMissing(language,key);
 }
 return missingSentences();
}
export {reportMissing};
