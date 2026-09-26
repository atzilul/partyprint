/* eslint-disable @next/next/no-img-element -- curated local editorial images. */
import Link from '@/components/safe-link';
import type {Metadata} from 'next';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import '../seo/seo.css';

export const metadata: Metadata = {
  title: 'הדפסה על חולצות, מתנות וחולצות לאירועים | PARTYPRINT',
  description: 'מדריכים מעשיים על הדפסה על חולצות, הדפסה בעיצוב אישי, חולצות לימי הולדת, מסיבות, צוותים, עסקים ואירועים.',
  keywords: ['הדפסה על חולצה', 'הדפסה על חולצות', 'הדפסה בעיצוב אישי', 'חולצה לימי הולדת', 'חולצה למסיבת רווקים', 'חולצה למסיבת רווקות', 'חולצה לצוות', 'חולצה ממותגת', 'חולצות לאירועים'],
  alternates: {canonical: '/guides'},
  openGraph: {title: 'הדפסה על חולצות, מתנות וחולצות לאירועים | PARTYPRINT', description: 'מדריכים מעשיים על הדפסה על חולצות, הדפסה בעיצוב אישי, חולצות לימי הולדת, מסיבות, צוותים, עסקים ואירועים.', url: 'https://partyprint.co.il/guides', type: 'website', images: [{url: '/party-crew.webp', alt: 'חבורה בחולצות בעיצוב אישי של PARTYPRINT'}]},
};

export default function GuidesPage() {
  const canonical='https://partyprint.co.il/guides';
  const schema={'@context':'https://schema.org','@graph':[{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:'https://partyprint.co.il/'},{'@type':'ListItem',position:2,name:'מדריכי רעיונות',item:canonical}]},{'@type':'CollectionPage','@id':canonical+'#collection',url:canonical,name:'הדפסה על חולצות, מתנות וחולצות לאירועים | PARTYPRINT',description:'מדריכים מעשיים על הדפסה על חולצות, הדפסה בעיצוב אישי, חולצות לימי הולדת, מסיבות, צוותים, עסקים ואירועים.',inLanguage:'he-IL',isPartOf:{'@id':'https://partyprint.co.il/#website'},mainEntity:{'@type':'ItemList',numberOfItems:SEO_PAGES.length,itemListElement:SEO_PAGES.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.title,url:'https://partyprint.co.il'+SEO_PAGE_URL(item.slug)}))}}]};
  return <main className="seo-page" dir="rtl"><SeoNav/><section className="seo-hub-hero"><div><span className="seo-kicker">PARTYPRINT / IDEA GUIDE</span><h1>המתנה הנכונה<br/><span>מתחילה ברעיון.</span></h1><p>מדריכים קצרים על הדפסה על חולצות, הדפסה בעיצוב אישי, חולצות לימי הולדת, מסיבות, צוותים ואירועים.</p><Link className="seo-primary-cta" href="/#order">יש לי רעיון · מתחילים בלי חיוב <span aria-hidden="true">←</span></Link></div><div className="seo-hub-stamp" aria-hidden="true"><strong>{SEO_PAGES.length}</strong><span>עמודי השראה</span></div></section><section className="seo-hub-content"><div className="seo-section-heading"><div><span className="seo-kicker">CHOOSE YOUR MOMENT</span><h2>לאיזה אירוע אתם מתכוננים?</h2></div><p>כל עמוד מתמקד בכוונת חיפוש אחרת, עם טיפים פרקטיים וקישור ישיר לעיצוב שלכם.</p></div><div className="seo-card-grid">{SEO_PAGES.map(item => <Link className="seo-card" href={SEO_PAGE_URL(item.slug)} key={item.slug}><div className="seo-card-image"><img src={item.heroImage} alt={item.heroAlt} loading="lazy"/></div><div className="seo-card-body"><span>{item.kicker.split('·')[0].trim()}</span><h2>{item.title}</h2><p>{item.intro}</p><strong>למדריך המלא <span aria-hidden="true">←</span></strong></div></Link>)}</div></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><SeoFooter/></main>;
}
