import {SINGLE_SHIRT_PRICE} from './catalog';
import type {Pricing} from './pricing';
import type {HomeFaqItem} from './home-faq';

const ORIGIN='https://partyprint.co.il';

/**
 * Shipping and return facts shared by every Offer, as Google's merchant listing
 * rich result expects them. They mirror /policies/shipping and /policies/returns:
 * delivery is included in the package price and goes to the customer's door in
 * Israel, within 5 business days after design approval, order approval and
 * payment (up to 7 in remote areas); shirts are made to order, so a standard
 * return window does not apply, while defects are handled through the studio.
 */
export function offerPolicies(){
 return {
  shippingDetails:{
   '@type':'OfferShippingDetails',
   shippingRate:{'@type':'MonetaryAmount',value:'0',currency:'ILS'},
   shippingDestination:{'@type':'DefinedRegion',addressCountry:'IL'},
   deliveryTime:{
    '@type':'ShippingDeliveryTime',
    handlingTime:{'@type':'QuantitativeValue',minValue:1,maxValue:3,unitCode:'DAY'},
    transitTime:{'@type':'QuantitativeValue',minValue:1,maxValue:7,unitCode:'DAY'},
   },
  },
  hasMerchantReturnPolicy:{
   '@type':'MerchantReturnPolicy',
   applicableCountry:'IL',
   returnPolicyCategory:'https://schema.org/MerchantReturnNotPermitted',
   merchantReturnLink:ORIGIN+'/policies/returns',
  },
 };
}

/** Facts every Product carries, from the owner's questionnaire (Nov 2026). */
export function productFacts(){
 return {
  material:'100% כותנה',
  color:['לבן','שחור','אפור'],
  size:['S','M','L','XL','ילדים לפי גיל 2 עד 18'],
  audience:{'@type':'PeopleAudience',suggestedMinAge:2},
  additionalProperty:[
   {'@type':'PropertyValue',name:'שיטת הדפסה',value:'DTF'},
   {'@type':'PropertyValue',name:'אזור הדפסה',value:'מלפנים בלבד, עד A3 למבוגרים ובדרך כלל A4 לילדים'},
   {'@type':'PropertyValue',name:'הוראות כביסה',value:'כביסה עד 40 מעלות, בלי מייבש'},
  ],
 };
}

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
   {'@type':'Product','@id':ORIGIN+'/#single-shirt',name:'חולצה אחת בעיצוב אישי',description:'חולצה אחת עם עיצוב אישי שנוצר מהתמונות והרעיון שלכם. הדפסת DTF מלפנים, עד A3. עיצוב לאישור לפני ההדפסה, משלוח עד הבית.',image:ORIGIN+'/og-default.jpg',brand,...productFacts(),
    offers:{'@type':'Offer',price:String(pricing.singleShirtPrice??SINGLE_SHIRT_PRICE),priceCurrency:'ILS',availability:'https://schema.org/InStock',itemCondition:'https://schema.org/NewCondition',url:ORIGIN+'/#order',seller,...offerPolicies()}},
   {'@type':'Product','@id':ORIGIN+'/#group-shirts',name:'חולצות בעיצוב אישי לקבוצה',description:'חבילות של 4 עד 100 חולצות עם עיצוב אישי אחד לקבוצה. הדפסת DTF מלפנים, עד A3. עיצוב לאישור לפני ההדפסה, משלוח עד הבית. המחיר לחולצה יורד ככל שהכמות עולה.',image:ORIGIN+'/og-default.jpg',brand,...productFacts(),
    offers:{'@type':'AggregateOffer',lowPrice:String(low),highPrice:String(high),priceCurrency:'ILS',offerCount:Math.max(1,tierPrices.length),availability:'https://schema.org/InStock',url:ORIGIN+'/#order',seller,...offerPolicies()}},
  ],
 };
}
