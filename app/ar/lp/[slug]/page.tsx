import type {Metadata} from 'next';
import Landing,{generateMetadata as hebrewMetadata} from '@/app/lp/[slug]/page';
import {translateMetadata} from '@/i18n/server';

/**
 * Experiment: the audience page in Arabic. It is the Hebrew page itself; the translation
 * gate (i18n/gate.ts) swaps the text because the address starts with /ar. Not linked from
 * anywhere and not indexed.
 */
type PageProps={params:Promise<{slug:string}>};
export const dynamic='force-dynamic';
export async function generateMetadata(props:PageProps):Promise<Metadata>{
 const {slug}=await props.params;
 return {...translateMetadata(await hebrewMetadata(props),'ar'),alternates:{canonical:'/ar/lp/'+slug},robots:{index:false,follow:false}};
}
export default Landing;
