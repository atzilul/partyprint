'use client';
import {usePathname} from 'next/navigation';
import {LANGUAGES,TRANSLATED_ROUTES,languageOfPath} from '@/i18n/core';
import type {Language} from '@/i18n/core';

/**
 * Links to the same page in the other languages it exists in. Shown only on pages that
 * have a translation. Each language is named in its own script, so the names are not
 * translated.
 */
const NAMES:Record<Language,string>={he:'עברית',ar:'العربية',en:'English',ru:'Русский',fr:'Français'};
export default function LanguageSwitch(){
 const pathname=usePathname()||'/',current=languageOfPath(pathname);
 const path=current==='he'?pathname:pathname.slice(current.length+1)||'/';
 const others=LANGUAGES.filter(language=>TRANSLATED_ROUTES[language]?.includes(path));
 if(!others.length)return null;
 const all:Language[]=['he',...others];
 return <nav className="language-switch" aria-label="Language" translate="no">{all.map(language=>language===current
  ?<b key={language} lang={language} translate="no" aria-current="true">{NAMES[language]}</b>
  :<a key={language} lang={language} hrefLang={language} translate="no" href={language==='he'?path:'/'+language+path}>{NAMES[language]}</a>)}</nav>;
}
