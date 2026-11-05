import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import AnswerPage,{answerMetadata} from '@/components/answer-page';
import {BUNDLE_ANSWERS,getBundleAnswer} from '@/lib/bundle-answers';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';

/** Answer pages for large orders (lib/bundle-answers.ts), rendered by components/answer-page.tsx. */
export const dynamic='force-dynamic';
type PageProps={params:Promise<{slug:string}>};
async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}
function find(slug:string){try{return getBundleAnswer(decodeURIComponent(slug));}catch{return null;}}

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {slug}=await params,item=find(slug);
 return item?answerMetadata(item,await currentPricing()):{robots:{index:false,follow:false}};
}
export default async function BundleAnswerPage({params}:PageProps){
 const {slug}=await params,item=find(slug);
 if(!item)notFound();
 return <AnswerPage item={item} pricing={await currentPricing()} related={BUNDLE_ANSWERS.filter(other=>other.slug!==item.slug)} relatedTitle="עוד תשובות על הזמנות גדולות"/>;
}
