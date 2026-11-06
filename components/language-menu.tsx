'use client';
import {useEffect,useRef,useState} from 'react';
import type {MouseEvent} from 'react';
import {usePathname} from 'next/navigation';
import {Check,Globe} from 'lucide-react';
import {TRANSLATED,languageOfPath} from '@/i18n/core';
import type {Language} from '@/i18n/core';
import {toHebrew,toLanguage} from '@/i18n/routes';

/**
 * Choosing a language. Three pieces share one list of options:
 *  - LanguageMenu: the button with a globe in the header (wide screens);
 *  - LanguageRow: the same choice as a row at the top of the opened menu (phones);
 *  - LanguageSuggestion: a slim bar for a reader whose browser asks for Arabic.
 * Each language is named in its own script and is never translated (translate="no"), and a
 * link says which language it leads to (hrefLang), so the translation gate leaves it alone.
 * Styles live at the end of app/globals.css.
 */
export const LANGUAGE_NAMES:Record<Language,string>={he:'עברית',ar:'العربية',en:'English',ru:'Русский',fr:'Français'};
const SHORT:Record<Language,string>={he:'עב',ar:'ع',en:'EN',ru:'RU',fr:'FR'};
const CHOICE='pp-language';

export type LanguageOption={language:Language;href:string;current:boolean;
 /** The link leads to this same page in the other language, not to that language's home page. */
 samePage:boolean};
/** What a reader can switch to from this address. A page with no translation offers the translated home page. */
export function languageOptions(pathname:string):LanguageOption[]{
 const current=languageOfPath(pathname);
 const hebrew=current==='he'?pathname:toHebrew(current,pathname.split('/').filter(Boolean).slice(1))?.path||'/';
 return [
  {language:'he',href:hebrew,current:current==='he',samePage:true},
  ...TRANSLATED.map(language=>{const same=toLanguage(language,hebrew);return {language,href:same||'/'+language,current:current===language,samePage:!!same};}),
 ];
}
const remember=(language:Language)=>{try{window.localStorage.setItem(CHOICE,language);}catch{/* private mode: the choice is simply not kept */}};
function follow(event:MouseEvent<HTMLAnchorElement>,option:LanguageOption){
 remember(option.language);
 // The same page in another language keeps what the address carried: the audience (?v=team), a coupon, a section.
 if(option.samePage){event.currentTarget.search=window.location.search;event.currentTarget.hash=window.location.hash;}
}

export default function LanguageMenu(){
 const pathname=usePathname()||'/',options=languageOptions(pathname),current=options.find(option=>option.current)?.language||'he';
 const root=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <div ref={root} className={'lang-menu'+(open?' is-open':'')} onBlur={event=>{if(!root.current?.contains(event.relatedTarget as Node|null))setOpen(false);}}>
  <button type="button" className="lang-menu-toggle" aria-label="בחירת שפה" aria-expanded={open} aria-controls="language-menu" onClick={()=>setOpen(value=>!value)}>
   <Globe size={17} aria-hidden="true"/><span className="lang-menu-code" lang={current} translate="no" aria-hidden="true">{SHORT[current]}</span>
  </button>
  <div id="language-menu" className="lang-menu-panel">{options.map(option=>option.current
   ?<span key={option.language} className="is-current" lang={option.language} translate="no" aria-current="true"><i aria-hidden="true" translate="no">{SHORT[option.language]}</i><b translate="no">{LANGUAGE_NAMES[option.language]}</b><Check size={17} aria-hidden="true"/></span>
   :<a key={option.language} lang={option.language} hrefLang={option.language} translate="no" href={option.href} onClick={event=>follow(event,option)}><i aria-hidden="true" translate="no">{SHORT[option.language]}</i><b translate="no">{LANGUAGE_NAMES[option.language]}</b></a>)}</div>
 </div>;
}

/** The same choice as a row, for the top of the opened navigation on a phone. */
export function LanguageRow(){
 const options=languageOptions(usePathname()||'/');
 return <div className="lang-row" role="group" aria-label="בחירת שפה"><Globe size={17} aria-hidden="true"/>{options.map(option=>option.current
  ?<b key={option.language} lang={option.language} translate="no" aria-current="true">{LANGUAGE_NAMES[option.language]}</b>
  :<a key={option.language} lang={option.language} hrefLang={option.language} translate="no" href={option.href} onClick={event=>follow(event,option)}>{LANGUAGE_NAMES[option.language]}</a>)}</div>;
}

/**
 * A reader whose browser prefers Arabic over Hebrew, on a Hebrew page that exists in Arabic,
 * is told so once. Nobody is redirected: the reader chooses, and the choice is remembered.
 */
export function LanguageSuggestion(){
 const pathname=usePathname()||'/',[show,setShow]=useState(false);
 const arabic=languageOfPath(pathname)==='he'?toLanguage('ar',pathname):null;
 useEffect(()=>{
  let wanted=false;
  try{
   const asked=(navigator.languages?.length?navigator.languages:[navigator.language]).map(value=>value.toLowerCase().split('-')[0]);
   const arabicAt=asked.indexOf('ar'),hebrewAt=asked.indexOf('he');
   wanted=!!arabic&&arabicAt>=0&&(hebrewAt<0||arabicAt<hebrewAt)&&!window.localStorage.getItem(CHOICE);
  }catch{/* no storage: no suggestion */}
  setShow(wanted);
 },[arabic]);
 if(!show||!arabic)return null;
 return <aside className="lang-suggest" lang="ar" dir="rtl" translate="no">
  <span translate="no">هذه الصفحة متوفرة باللغة العربية</span>
  <a href={arabic} lang="ar" hrefLang="ar" translate="no" onClick={event=>follow(event,{language:'ar',href:arabic,current:false,samePage:true})}>عرض بالعربية ←</a>
  <button type="button" translate="no" aria-label="إغلاق" onClick={()=>{remember('he');setShow(false);}}>×</button>
 </aside>;
}
