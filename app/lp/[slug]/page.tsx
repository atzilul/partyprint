import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import LandingPage from '@/components/landing-page';
import {BUSINESS_DETAILS,PAYMENT_DISCLOSURE} from '@/lib/business-details';
import {LANDING_VARIANTS,LANDING_VARIANT_KEYS,isLandingVariant} from '@/lib/landing-variants';

/**
 * Paid landing pages: one purpose-built page per audience (components/landing-page.tsx,
 * copy in lib/landing-content.ts). Same request form and events as the home page.
 * Not indexed: campaigns link here, search visitors land on the home page.
 */
type PageProps={params:Promise<{slug:string}>};
export function generateStaticParams(){return LANDING_VARIANT_KEYS.map(slug=>({slug}));}
export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {slug}=await params;
 if(!isLandingVariant(slug))return {robots:{index:false,follow:false}};
 const content=LANDING_VARIANTS[slug],url='https://partyprint.co.il/lp/'+slug;
 return {
  title:content.title,
  description:content.description,
  robots:{index:false,follow:false},
  openGraph:{type:'website',locale:'he_IL',url,siteName:'PARTYPRINT',title:content.title,description:content.description,images:[{url:content.ogImage,width:1200,height:630,alt:content.ogAlt}]},
  twitter:{card:'summary_large_image',title:content.title,description:content.description,images:[{url:content.ogImage,alt:content.ogAlt}]},
 };
}
export default async function Landing({params}:PageProps){
 const {slug}=await params;
 if(!isLandingVariant(slug))notFound();
 return <LandingPage variant={slug} businessEmail={BUSINESS_DETAILS.email} paymentDisclosure={PAYMENT_DISCLOSURE}/>;
}
