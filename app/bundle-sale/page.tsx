import type {Metadata} from 'next';
import BundleSale from '@/components/bundle-sale';
import {BUSINESS_DETAILS,PAYMENT_DISCLOSURE} from '@/lib/business-details';
import {landingFaq} from '@/lib/home-faq';
import {BUNDLE_KEYWORDS,bundleFaq,bundleOffers,shekels} from '@/lib/bundles';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';

/**
 * BUNDLE SALE: bundles of 25, 50 and 100 shirts for large groups, at the quantity prices
 * that are in force (components/bundle-sale.tsx, lib/bundles.ts). Same request form and
 * events as the home page.
 */
export const dynamic='force-dynamic';
const origin='https://partyprint.co.il',url=origin+'/bundle-sale',ogImage='/og-team.jpg';
const title='חולצות מודפסות בכמויות: BUNDLE SALE מ־25 חולצות | PARTYPRINT';
async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}
function describe(pricing:Pricing){
 const [small,medium,large]=bundleOffers(pricing).bundles;
 return 'חולצות מודפסות בעיצוב אישי בכמות גדולה, לגנים, בתי ספר, חברות, חיילים ותנועות נוער: '+small.size+' חולצות ב־'+shekels(small.unit)+' ₪ לחולצה, '+medium.size+' ב־'+shekels(medium.unit)+' ₪ ו־'+large.size+' ב־'+shekels(large.unit)+' ₪. כולל עיצוב, הדפסה ומשלוח.';
}
export async function generateMetadata():Promise<Metadata>{
 const description=describe(await currentPricing()),alt='קבוצה גדולה בחולצות תואמות בעיצוב אישי של PARTYPRINT';
 return {
  title,
  description,
  keywords:BUNDLE_KEYWORDS,
  alternates:{canonical:'/bundle-sale'},
  openGraph:{type:'website',locale:'he_IL',url,siteName:'PARTYPRINT',title,description,images:[{url:ogImage,width:1200,height:630,alt}]},
  twitter:{card:'summary_large_image',title,description,images:[{url:ogImage,alt}]},
 };
}
export default async function BundleSalePage(){
 const pricing=await currentPricing(),offers=bundleOffers(pricing),prices=offers.bundles.map(item=>item.unit);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:origin+'/'},{'@type':'ListItem',position:2,name:'BUNDLE SALE',item:url}]},
  {'@type':'WebPage','@id':url+'#webpage',url,name:title,description:describe(pricing),inLanguage:'he-IL',isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#service'},primaryImageOfPage:origin+ogImage},
  {'@type':'Product','@id':url+'#bundles',name:'באנדל חולצות בעיצוב אישי להזמנות גדולות',description:'באנדלים של '+offers.bundles.map(item=>item.size).join(', ')+' חולצות עם עיצוב אישי אחד לכל הקבוצה, הדפסה ומשלוח. המחיר לחולצה יורד ככל שהכמות עולה.',image:origin+ogImage,brand:{'@type':'Brand',name:'PARTYPRINT'},
   offers:{'@type':'AggregateOffer',lowPrice:String(Math.min(...prices)),highPrice:String(Math.max(...prices)),priceCurrency:'ILS',offerCount:offers.bundles.length,availability:'https://schema.org/InStock',url:url+'#order',seller:{'@id':origin+'/#organization'}}},
  {'@type':'FAQPage','@id':url+'#faq',inLanguage:'he-IL',mainEntity:landingFaq(PAYMENT_DISCLOSURE,bundleFaq(pricing)).map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
 ]};
 return <><BundleSale initialPricing={pricing} businessEmail={BUSINESS_DETAILS.email} paymentDisclosure={PAYMENT_DISCLOSURE}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></>;
}
