import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {PAGE_MODULES} from '@/i18n/pages';
import {LEGAL,toHebrew} from '@/i18n/routes';
import {translatedMetadata} from '@/i18n/server';

/**
 * The purchase path in Arabic. Every address here renders the Hebrew page behind it
 * (i18n/pages.ts); the translation gate swaps the text because the address starts with /ar.
 * A page is open to search engines exactly when its Hebrew page is.
 */
const LANGUAGE='ar';
type Search=Promise<Record<string,string|string[]|undefined>>;
type PageProps={params:Promise<{path?:string[]}>;searchParams:Search};
export const dynamic='force-dynamic';

async function resolve(props:PageProps){
 const found=toHebrew(LANGUAGE,(await props.params).path||[]);
 if(!found)return null;
 return {found,module:await PAGE_MODULES[found.pattern](),props:{params:Promise.resolve(found.params),searchParams:props.searchParams}};
}
export async function generateMetadata(props:PageProps):Promise<Metadata>{
 const page=await resolve(props);
 if(!page)return {robots:{index:false,follow:false}};
 const hebrew=page.module.generateMetadata?await page.module.generateMetadata(page.props):page.module.metadata||{};
 return translatedMetadata(hebrew,LANGUAGE,page.found.path);
}
export default async function TranslatedPage(props:PageProps){
 const page=await resolve(props);
 if(!page)notFound();
 const Page=page.module.default;
 return <>
  {LEGAL.includes(page.found.path)&&<p className="translation-notice">זהו תרגום לנוחותכם. הנוסח המחייב הוא הנוסח בעברית. <a href={page.found.path} hrefLang="he">לנוסח בעברית</a></p>}
  <Page {...page.props}/>
 </>;
}
