import arSlugs from './ar.slugs.json';
import {LANGUAGES} from './core';
import type {Language} from './core';

/**
 * Which pages exist in which language, and under what address. A translated page lives
 * at /<language>/<path>; a page whose Hebrew address carries a Hebrew slug gets a slug in
 * its own language. Everything else on the site stays Hebrew only.
 */
const SLUGS:Partial<Record<Language,Record<string,string>>>={ar:arSlugs as Record<string,string>};
/** The purchase path. [slug] takes the slugs that have a translation; [id] takes any value. */
export const PATTERNS=['/','/lp/family','/lp/bride','/lp/groom','/lp/team','/lp/custom','/bundle-sale','/bundle-sale/[slug]','/prices/[slug]','/terms','/policies/shipping','/policies/returns','/privacy-policy','/thanks','/track/[id]','/design/[id]'] as const;
const PAGES:Partial<Record<Language,readonly string[]>>={ar:PATTERNS};
/** Pages whose Hebrew text is the binding one. */
export const LEGAL=['/terms','/policies/shipping','/policies/returns','/privacy-policy'];

const decode=(segment:string)=>{try{return decodeURIComponent(segment);}catch{return segment;}};
const split=(path:string)=>path.split('/').filter(Boolean).map(decode);
export type Match={pattern:string;path:string;params:Record<string,string>};

function match(language:Language,segments:string[],from:'hebrew'|'translated'):{match:Match;translated:string}|null{
 const slugs=SLUGS[language]||{};
 for(const pattern of PAGES[language]||[]){
  const parts=pattern.split('/').filter(Boolean);
  if(parts.length!==segments.length)continue;
  const hebrew:string[]=[],local:string[]=[],params:Record<string,string>={};
  let ok=true;
  for(let index=0;index<parts.length&&ok;index++){
   const part=parts[index],segment=segments[index];
   if(part==='[id]'){hebrew.push(segment);local.push(segment);params.id=segment;}
   else if(part==='[slug]'){
    const pair=from==='hebrew'?[segment,slugs[segment]]:[Object.keys(slugs).find(key=>slugs[key]===segment),segment];
    if(!pair[0]||!pair[1])ok=false;else{hebrew.push(pair[0]);local.push(pair[1]);params.slug=pair[0];}
   }else if(part!==segment)ok=false;
   else{hebrew.push(segment);local.push(segment);if(parts[index-1]==='lp')params.slug=segment;}
  }
  if(ok)return {match:{pattern,path:'/'+hebrew.join('/'),params},translated:'/'+[language,...local].join('/')};
 }
 return null;
}

/** The address of a Hebrew page in another language, or null when the page does not exist there. */
export function toLanguage(language:Language,hebrewPath:string):string|null{
 return language==='he'?hebrewPath:match(language,split(hebrewPath),'hebrew')?.translated??null;
}
/** The Hebrew page behind a translated address (the segments after the language), or null. */
export function toHebrew(language:Language,segments:string[]):Match|null{
 return match(language,segments.map(decode),'translated')?.match??null;
}
/** A link inside the site leads to the same page in the reader's language when that page exists. */
export function localizedHref(language:Language,href:string):string{
 if(language==='he'||!href.startsWith('/')||href.startsWith('//'))return href;
 const cut=href.search(/[?#]/),path=cut<0?href:href.slice(0,cut);
 const translated=toLanguage(language,path);
 return translated?translated+(cut<0?'':href.slice(cut)):href;
}
/** Every language a Hebrew page exists in, with its address there. */
export function translationsOf(hebrewPath:string):{language:Language;path:string}[]{
 return LANGUAGES.map(language=>({language:language as Language,path:toLanguage(language,hebrewPath)})).filter((entry):entry is {language:Language;path:string}=>!!entry.path);
}
/** A full address of this site (structured data, social cards) in the reader's language; other addresses are left alone. */
const SITE='https://partyprint.co.il';
export function localizedAddress(language:Language,address:string):string{
 if(address.startsWith('/'))return localizedHref(language,address);
 return address===SITE||address.startsWith(SITE+'/')||address.startsWith(SITE+'#')?SITE+localizedHref(language,address.slice(SITE.length)||'/'):address;
}
