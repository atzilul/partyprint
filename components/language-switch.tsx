'use client';
import {usePathname} from 'next/navigation';
import {LANGUAGE_NAMES,languageOptions} from '@/components/language-menu';

/**
 * Links to the other languages at the foot of every page: the same page where it is
 * translated, that language's home page where it is not. Each language is named in its own
 * script, so the names are not translated, and each link says which language it leads to.
 */
export default function LanguageSwitch(){
 const options=languageOptions(usePathname()||'/');
 return <nav className="language-switch" aria-label="Language" translate="no">{options.map(option=>option.current
  ?<b key={option.language} lang={option.language} translate="no" aria-current="true">{LANGUAGE_NAMES[option.language]}</b>
  :<a key={option.language} lang={option.language} hrefLang={option.language} translate="no" href={option.href}>{LANGUAGE_NAMES[option.language]}</a>)}</nav>;
}
