import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import {notFound} from 'next/navigation';
import {PAGE_MODULES} from '@/i18n/pages';
import {LEGAL,toHebrew} from '@/i18n/routes';
import {translatedMetadata} from '@/i18n/server';
import type {Language} from '@/i18n/core';

/**
 * The purchase path in another language. Every translated address renders the Hebrew page
 * behind it (i18n/pages.ts); the translation gate swaps the text because the address starts
 * with the language. A page is open to search engines exactly when its Hebrew page is.
 * app/<language>/[[...path]]/page.tsx calls this with its language. It lives in lib/ so that
 * its own Hebrew (the notice above a legal page) passes through the translation gate.
 */
type Search=Promise<Record<string,string|string[]|undefined>>;
export type TranslatedPageProps={params:Promise<{path?:string[]}>;searchParams:Search};

export function translatedPage(language:Language){
 async function resolve(props:TranslatedPageProps){
  const found=toHebrew(language,(await props.params).path||[]);
  if(!found)return null;
  return {found,module:await PAGE_MODULES[found.pattern](),props:{params:Promise.resolve(found.params),searchParams:props.searchParams}};
 }
 async function generateMetadata(props:TranslatedPageProps):Promise<Metadata>{
  const page=await resolve(props);
  if(!page)return {robots:{index:false,follow:false}};
  const hebrew=page.module.generateMetadata?await page.module.generateMetadata(page.props):page.module.metadata||{};
  return translatedMetadata(hebrew,language,page.found.path);
 }
 async function Page(props:TranslatedPageProps):Promise<ReactNode>{
  const page=await resolve(props);
  if(!page)notFound();
  const Hebrew=page.module.default;
  return <>
   {LEGAL.includes(page.found.path)&&<p className="translation-notice">זהו תרגום לנוחותכם. הנוסח המחייב הוא הנוסח בעברית. <a href={page.found.path} hrefLang="he">לנוסח בעברית</a></p>}
   <Hebrew {...page.props}/>
  </>;
 }
 return {generateMetadata,Page};
}
