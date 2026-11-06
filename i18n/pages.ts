import type {Metadata} from 'next';
import type {ReactNode} from 'react';

/**
 * The Hebrew pages behind the translated addresses (i18n/routes.ts). A translated address
 * renders the Hebrew page itself; the gate swaps the text. Server only.
 */
type PageModule={
 default:(props:{params:Promise<Record<string,string>>;searchParams:Promise<Record<string,string|string[]|undefined>>})=>ReactNode|Promise<ReactNode>;
 metadata?:Metadata;
 generateMetadata?:(props:{params:Promise<Record<string,string>>;searchParams:Promise<Record<string,string|string[]|undefined>>})=>Metadata|Promise<Metadata>;
};
const load=(module:Promise<unknown>)=>module as Promise<PageModule>;
export const PAGE_MODULES:Record<string,()=>Promise<PageModule>>={
 '/':()=>load(import('@/app/page')),
 '/lp/family':()=>load(import('@/app/lp/[slug]/page')),
 '/lp/bride':()=>load(import('@/app/lp/[slug]/page')),
 '/lp/groom':()=>load(import('@/app/lp/[slug]/page')),
 '/lp/team':()=>load(import('@/app/lp/[slug]/page')),
 '/lp/custom':()=>load(import('@/app/lp/[slug]/page')),
 '/bundle-sale':()=>load(import('@/app/bundle-sale/page')),
 '/bundle-sale/[slug]':()=>load(import('@/app/bundle-sale/[slug]/page')),
 '/prices/[slug]':()=>load(import('@/app/prices/[slug]/page')),
 '/terms':()=>load(import('@/app/terms/page')),
 '/policies/shipping':()=>load(import('@/app/policies/shipping/page')),
 '/policies/returns':()=>load(import('@/app/policies/returns/page')),
 '/privacy-policy':()=>load(import('@/app/privacy-policy/page')),
 '/thanks':()=>load(import('@/app/thanks/page')),
 '/track/[id]':()=>load(import('@/app/track/[id]/page')),
 '/design/[id]':()=>load(import('@/app/design/[id]/page')),
 '/contact':()=>load(import('@/app/contact/page')),
};
