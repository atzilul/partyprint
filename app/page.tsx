import type {Metadata} from 'next';
import {cookies} from 'next/headers';
import HomeClient from './home-client';
import {BUSINESS_DETAILS,PAYMENT_DISCLOSURE} from '@/lib/business-details';
import {LANDING_VARIANTS,LANDING_VARIANT_COOKIE,resolveLandingVariant,type LandingVariantKey} from '@/lib/landing-variants';
import {homeFaq} from '@/lib/home-faq';
import {homeStructuredData} from '@/lib/home-schema';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING} from '@/lib/pricing';

type PageProps={searchParams:Promise<{v?:string|string[]}>};
async function selectedVariant(searchParams:PageProps['searchParams']):Promise<LandingVariantKey|null>{
 const params=await searchParams;
 const jar=await cookies();
 return resolveLandingVariant(params.v,jar.get(LANDING_VARIANT_COOKIE)?.value);
}
export async function generateMetadata({searchParams}:PageProps):Promise<Metadata>{
 const params=await searchParams;
 const jar=await cookies();
 const queryVariant=resolveLandingVariant(params.v);
 const variant=resolveLandingVariant(params.v,jar.get(LANDING_VARIANT_COOKIE)?.value)||'family';
 const socialUrl=queryVariant?'https://partyprint.co.il/?v='+queryVariant:'https://partyprint.co.il/';
 const content=LANDING_VARIANTS[variant];
 return {
  title:content.title,
  description:content.description,
  alternates:{canonical:'/'},
  openGraph:{type:'website',locale:'he_IL',url:socialUrl,siteName:'PARTYPRINT',title:content.title,description:content.description,images:[{url:content.ogImage,width:1200,height:630,alt:content.ogAlt}]},
  twitter:{card:'summary_large_image',title:content.title,description:content.description,images:[{url:content.ogImage,alt:content.ogAlt}]}
 };
}
export default async function HomePage({searchParams}:PageProps){
 const variant=await selectedVariant(searchParams);
 let pricing=DEFAULT_PRICING;try{pricing=await getPricing();}catch{/* structured data falls back to the advertised defaults */}
 const schema=homeStructuredData(homeFaq(PAYMENT_DISCLOSURE),pricing);
 return <><HomeClient initialVariant={variant||undefined} businessEmail={BUSINESS_DETAILS.email} paymentDisclosure={PAYMENT_DISCLOSURE}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></>;
}
