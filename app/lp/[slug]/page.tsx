import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import LandingHome from '@/components/landing-home';
import {LANDING_HOME_CONTENT} from '@/lib/landing-home-content';
import {landingFaq} from '@/lib/home-faq';
import {BUSINESS_DETAILS,PAYMENT_DISCLOSURE} from '@/lib/business-details';
import {LANDING_VARIANTS,LANDING_VARIANT_KEYS,isLandingVariant} from '@/lib/landing-variants';
import {currentPricing} from '@/lib/current-pricing';
import {withFees} from '@/lib/fee-text';

/**
 * Paid landing pages: the home page's language for one audience (components/landing-home.tsx,
 * copy in lib/landing-home-content.ts). Same request form and events as the home page.
 * Indexed, each with its own canonical address, and listed in the sitemap; the home page
 * navigation links to all of them.
 */
type PageProps={params:Promise<{slug:string}>};
// Rendered per request: the prices in the HTML are the admin price list, not a build-time copy.
export const dynamic='force-dynamic';
export function generateStaticParams(){return LANDING_VARIANT_KEYS.map(slug=>({slug}));}
export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {slug}=await params;
 if(!isLandingVariant(slug))return {robots:{index:false,follow:false}};
 const content=LANDING_VARIANTS[slug],url='https://partyprint.co.il/lp/'+slug;
 return {
  title:content.title,
  description:content.description,
  alternates:{canonical:'/lp/'+slug},
  openGraph:{type:'website',locale:'he_IL',url,siteName:'PARTYPRINT',title:content.title,description:content.description,images:[{url:content.ogImage,width:1200,height:630,alt:content.ogAlt}]},
  twitter:{card:'summary_large_image',title:content.title,description:content.description,images:[{url:content.ogImage,alt:content.ogAlt}]},
 };
}
export default async function Landing({params}:PageProps){
 const {slug}=await params;
 if(!isLandingVariant(slug))notFound();
 const pricing=await currentPricing();
 const copy=LANDING_VARIANTS[slug],origin='https://partyprint.co.il',url=origin+'/lp/'+slug;
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:origin+'/'},{'@type':'ListItem',position:2,name:copy.title.split(' | ')[0],item:url}]},
  {'@type':'WebPage','@id':url+'#webpage',url,name:copy.title,description:copy.description,inLanguage:'he-IL',isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#service'},primaryImageOfPage:origin+copy.ogImage},
  {'@type':'FAQPage','@id':url+'#faq',inLanguage:'he-IL',mainEntity:landingFaq(PAYMENT_DISCLOSURE,withFees(LANDING_HOME_CONTENT[slug].faq,pricing),pricing).map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
 ]};
 return <><LandingHome variant={slug} initialPricing={pricing} businessEmail={BUSINESS_DETAILS.email} paymentDisclosure={PAYMENT_DISCLOSURE}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\u003c')}}/></>;
}
