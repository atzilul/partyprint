import type {Metadata} from 'next';
import Landing,{generateMetadata as hebrewMetadata} from '@/app/lp/[slug]/page';
import {translatedMetadata} from '@/i18n/server';

/**
 * Experiment: the audience page in Arabic. It is the Hebrew page itself; the translation
 * gate (i18n/gate.ts) swaps the text because the address starts with /ar. Not indexed.
 */
type PageProps={params:Promise<{slug:string}>};
export const dynamic='force-dynamic';
export async function generateMetadata(props:PageProps):Promise<Metadata>{
 const {slug}=await props.params;
 return {...translatedMetadata(await hebrewMetadata(props),'ar','/lp/'+slug),robots:{index:false,follow:false}};
}
export default Landing;
