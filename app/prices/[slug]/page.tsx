import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import AnswerPage,{answerMetadata} from '@/components/answer-page';
import {PRICE_ANSWERS,getPriceAnswer} from '@/lib/price-answers';
import {BUNDLE_ANSWERS} from '@/lib/bundle-answers';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';

/** Price answers for the audience pages (lib/price-answers.ts), rendered by components/answer-page.tsx. */
export const dynamic='force-dynamic';
type PageProps={params:Promise<{slug:string}>};
async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}
function find(slug:string){try{return getPriceAnswer(decodeURIComponent(slug));}catch{return null;}}

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {slug}=await params,item=find(slug);
 return item?answerMetadata(item,await currentPricing()):{robots:{index:false,follow:false}};
}
export default async function PriceAnswerPage({params}:PageProps){
 const {slug}=await params,item=find(slug);
 if(!item)notFound();
 // The other audiences, then the price answer for teams, which lives with the bundles.
 const related=[...PRICE_ANSWERS.filter(other=>other.slug!==item.slug),...BUNDLE_ANSWERS.filter(other=>other.slug==='חולצות-לעובדים-מחיר')];
 return <AnswerPage item={item} pricing={await currentPricing()} related={related} relatedTitle="עוד תשובות על מחירים"/>;
}
