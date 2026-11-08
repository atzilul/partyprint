import type {Metadata} from 'next';
import {LANGUAGES,maskNumbers,translateDeep} from './core';
import {localizedHref,toLanguage,translationsOf} from './routes';
import type {Language} from './core';
import {missingSentences,reportMissing,serverEnvironment} from './env-server';
import {SITE_METADATA} from '@/lib/site-metadata';
import {VARIANTS} from './variants';
import {customerConfirmation} from '@/lib/order-mail';
import {reviewRequestMail} from '@/lib/review-request';
import type {Order} from '@/lib/orders';

const LOCALE:Record<Language,string>={he:'he_IL',ar:'ar_IL',en:'en_IL',ru:'ru_RU',fr:'fr_FR'};

/** The same page in every language it exists in, for search engines. `path` has no language prefix. */
export function languageAlternates(path:string):Record<string,string>{
 return {he:path,'x-default':path,...Object.fromEntries(translationsOf(path).map(entry=>[entry.language,entry.path]))};
}

/**
 * A page's metadata in another language. Titles, descriptions and social cards never become
 * elements, so they do not pass the gate by themselves. Keywords are replaced too, because
 * the site-wide Hebrew keywords would otherwise be inherited.
 */
export function translatedMetadata(page:Metadata,language:Language,path:string):Metadata{
 // What the page does not set it inherits from the site, and that has to be translated as well.
 const hebrew:Metadata={...page,title:page.title??SITE_METADATA.title,description:page.description??SITE_METADATA.description,openGraph:page.openGraph??SITE_METADATA.openGraph,twitter:page.twitter??SITE_METADATA.twitter};
 const translated=translateDeep(hebrew,language,serverEnvironment);
 return {
  ...translated,
  keywords:Array.isArray(page.keywords)?translateDeep(page.keywords,language,serverEnvironment):[],
  alternates:{canonical:toLanguage(language,path)||path,languages:languageAlternates(path)},
  openGraph:translated.openGraph?{...translated.openGraph,locale:LOCALE[language],url:'https://partyprint.co.il'+(toLanguage(language,path)||path)}:undefined,
 };
}

/**
 * The language of the reader who sent a request: the page says so in a header (i18n/env-client.ts);
 * the address the request came from is the fallback. Hebrew unless a translated page sent it.
 */
export function languageOfRequest(request:Request):Language{
 const named=request.headers.get('x-partyprint-language')||'';
 const candidates=[named,(()=>{try{return new URL(request.headers.get('referer')||'').pathname.split('/')[1]||'';}catch{return '';}})()];
 for(const candidate of candidates)if((LANGUAGES as readonly string[]).includes(candidate)&&toLanguage(candidate as Language,'/'))return candidate as Language;
 return 'he';
}
/** A full address on this site, in the reader's language when the page exists there. */
export function localizedUrl(language:string|undefined,url:string):string{
 if(!language||language==='he'||!(LANGUAGES as readonly string[]).includes(language))return url;
 try{const parsed=new URL(url);return parsed.origin+localizedHref(language as Language,parsed.pathname+parsed.search+parsed.hash);}
 catch{return localizedHref(language as Language,url);}
}

/** Everything the sync needs: what was met without a translation, and the moment-dependent sentences. */
export function sentencesToTranslate():Record<string,string[]>{
 for(const language of LANGUAGES)if(toLanguage(language,'/'))for(const variant of VARIANTS){
  const {key}=maskNumbers(variant().trim());
  if(serverEnvironment.lookup(language,key)===undefined)reportMissing(language,key);
 }
 // The confirmation email, in both forms of the design choice. Rendering it reports what it lacks.
 for(const language of LANGUAGES)if(toLanguage(language,'/'))for(const designMode of [undefined,'individual']){
  const sample={id:'00000000-0000-4000-8000-000000000000',name:'Sample',email:'sample@example.com',quantity:12,price:1140,images:[{},{}],designMode,revisionPrice:100,language} as unknown as Order;
  customerConfirmation(sample,'https://partyprint.co.il/track/sample#token');
 }
 // The review request sent when an order ships.
 for(const language of LANGUAGES)if(toLanguage(language,'/'))reviewRequestMail({id:'00000000-0000-4000-8000-000000000000',name:'Sample',email:'sample@example.com',language} as unknown as Order,'https://g.page/r/sample/review');
 return missingSentences();
}
export {reportMissing};
