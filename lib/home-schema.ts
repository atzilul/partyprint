import type {HomeFaqItem} from './home-faq';
import type {Pricing} from './pricing';

const ORG_ID = 'https://partyprint.co.il/#organization';

export function homeStructuredData(faq: HomeFaqItem[], pricing: Pricing) {
  const prices = pricing.tiers.map(tier => tier.price).filter(price => Number.isFinite(price) && price > 0);
  const lowPrice = prices.length ? Math.min(...prices) : 90;
  const highPrice = prices.length ? Math.max(...prices) : 110;
  const oneShirtPrice = Number.isFinite(pricing.singleShirtPrice) ? pricing.singleShirtPrice! : 180;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage', '@id': 'https://partyprint.co.il/#faq',
        url: 'https://partyprint.co.il/', name: 'שאלות ותשובות על חולצות בעיצוב אישי', inLanguage: 'he-IL',
        mainEntity: faq.map(item => ({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}})),
      },
      {
        '@type': 'Product', '@id': 'https://partyprint.co.il/#single-shirt',
        name: 'חולצה אחת. מתנה אישית.', description: 'חולצה אחת בעיצוב אישי, כולל הדפסה ומשלוח עד הבית.',
        image: 'https://partyprint.co.il/shirts.webp', category: 'חולצה בעיצוב אישי',
        brand: {'@type':'Brand',name:'PARTYPRINT'}, manufacturer: {'@id':ORG_ID},
        offers: {
          '@type':'Offer', url:'https://partyprint.co.il/#packages', price:oneShirtPrice,
          priceCurrency:'ILS', availability:'https://schema.org/InStock', itemCondition:'https://schema.org/NewCondition',
          seller:{'@id':ORG_ID},
        },
      },
      {
        '@type':'Product', '@id':'https://partyprint.co.il/#group-shirts',
        name:'חבילות חולצות בעיצוב אישי', description:'מחיר לחולצה בהזמנה קבוצתית לפי מדרגת הכמות, כולל עיצוב, הדפסה ומשלוח.',
        image:'https://partyprint.co.il/family-shared-v2.webp', category:'חולצות בעיצוב אישי לקבוצה',
        brand:{'@type':'Brand',name:'PARTYPRINT'}, manufacturer:{'@id':ORG_ID},
        offers:{
          '@type':'AggregateOffer', url:'https://partyprint.co.il/#packages', lowPrice, highPrice,
          priceCurrency:'ILS', offerCount:Math.max(1,prices.length), availability:'https://schema.org/InStock', seller:{'@id':ORG_ID},
          description:'מחיר ליחידה; מדרגת הכמות בפועל מוצגת בטופס ההזמנה.',
        },
      },
    ],
  };
}
