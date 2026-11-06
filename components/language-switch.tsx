'use client';
import {usePathname} from 'next/navigation';
import {languageOfPath} from '@/i18n/core';
import type {Language} from '@/i18n/core';
import {toHebrew,translationsOf} from '@/i18n/routes';

/**
 * Links to the same page in the other languages it exists in. Shown only on pages that
 * have a translation. Each language is named in its own script, so the names are not
 * translated, and each link says which language it leads to, so it is left where it points.
 */
const NAMES:Record<Language,string>={he:'עברית',ar:'العربية',en:'English',ru:'Русский',fr:'Français'};
export default function LanguageSwitch(){
 const pathname=usePathname()||'/',current=languageOfPath(pathname);
 const hebrew=current==='he'?pathname:toHebrew(current,pathname.split('/').filter(Boolean).slice(1))?.path;
 if(!hebrew)return null;
 const others=translationsOf(hebrew);
 if(!others.length)return null;
 const all:{language:Language;path:string}[]=[{language:'he',path:hebrew},...others];
 return <nav className="language-switch" aria-label="Language" translate="no">{all.map(({language,path})=>language===current
  ?<b key={language} lang={language} translate="no" aria-current="true">{NAMES[language]}</b>
  :<a key={language} lang={language} hrefLang={language} translate="no" href={path}>{NAMES[language]}</a>)}</nav>;
}
