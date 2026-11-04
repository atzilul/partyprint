import {SINGLE_SHIRT_PRICE} from './catalog';
import type {Pricing} from './pricing';
import type {HomeFaqItem} from './home-faq';

const ORIGIN='https://partyprint.co.il';
/** FAQPage plus two Product entries (one shirt, group packages) for the home page. */
export function homeStructuredData(faq:HomeFaqItem[],pricing:Pricing){
 const tierPrices=pricing.tiers.map(t=>t.price).filter(p=>Number.isFinite(p)&&p>0);
 const low=tierPrices.length?Math.min(...tierPrices):pricing.shirtPrice,high=tierPrices.length?Math.max(...tierPrices):pricing.shirtPrice;
 const brand={'@type':'Brand',name:'PARTYPRINT'};
 const seller={'@id':ORIGIN+'/#organization'};
 return {
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'FAQPage','@id':ORIGIN+'/#faq',inLanguage:'he-IL',mainEntity:faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
   {'@type':'Product','@id':ORIGIN+'/#single-shirt',name:'חולצה אחת בעיצוב אישי',description:'חולצה אחת עם עיצוב אישי שנוצר מהתמונות והרעיון שלכם, כולל הדפסה ומשלוח עד הבית.',image:ORIGIN+'/og-default.jpg',brand,
    offers:{'@type':'Offer',price:String(pricing.singleShirtPrice??SINGLE_SHIRT_PRICE),priceCurrency:'ILS',availability:'https://schema.org/InStock',itemCondition:'https://schema.org/NewCondition',url:ORIGIN+'/#order',seller}},
   {'@type':'Product','@id':ORIGIN+'/#group-shirts',name:'חולצות בעיצוב אישי לקבוצה',description:'חבילות של 4 עד 100 חולצות עם עיצוב אישי אחד לקבוצה, הדפסה ומשלוח. המחיר לחולצה יורד ככל שהכמות עולה.',image:ORIGIN+'/og-default.jpg',brand,
    offers:{'@type':'AggregateOffer',lowPrice:String(low),highPrice:String(high),priceCurrency:'ILS',offerCount:Math.max(1,tierPrices.length),availability:'https://schema.org/InStock',url:ORIGIN+'/#order',seller}},
  ],
 };
}
