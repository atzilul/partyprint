/* eslint-disable @next/next/no-img-element -- curated local editorial images. */
import Link from 'next/link';
import type {Metadata} from 'next';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import '../seo/seo.css';

export const metadata: Metadata = {
  title: 'מדריכי מתנות וחולצות בעיצוב אישי | PARTYPRINT',
  description: 'רעיונות מעשיים למתנה בעיצוב אישי, חולצות לימי הולדת, מסיבות, ערבי צוות ומתנות לאנשים שאוהבים.',
  alternates: {canonical: '/guides'},
};

export default function GuidesPage() {
  return <main className="seo-page" dir="rtl"><SeoNav/><section className="seo-hub-hero"><div><span className="seo-kicker">PARTYPRINT / IDEA GUIDE</span><h1>המתנה הנכונה<br/><span>מתחילה ברעיון.</span></h1><p>מדריכים קצרים שיעזרו לבחור קונספט, לאסוף תמונות ולהפוך אנשים, בדיחות וזיכרונות לעיצוב שאפשר ללבוש.</p><Link className="seo-primary-cta" href="/#order">יש לי רעיון · מתחילים בלי חיוב <span aria-hidden="true">←</span></Link></div><div className="seo-hub-stamp" aria-hidden="true"><strong>16</strong><span>עמודי השראה</span></div></section><section className="seo-hub-content"><div className="seo-section-heading"><div><span className="seo-kicker">CHOOSE YOUR MOMENT</span><h2>לאיזה אירוע אתם מתכוננים?</h2></div><p>כל עמוד מתמקד בכוונת חיפוש אחרת, עם טיפים פרקטיים וקישור ישיר לעיצוב שלכם.</p></div><div className="seo-card-grid">{SEO_PAGES.map(item => <Link className="seo-card" href={SEO_PAGE_URL(item.slug)} key={item.slug}><div className="seo-card-image"><img src={item.heroImage} alt={item.heroAlt} loading="lazy"/></div><div className="seo-card-body"><span>{item.kicker.split('·')[0].trim()}</span><h2>{item.title}</h2><p>{item.intro}</p><strong>למדריך המלא <span aria-hidden="true">←</span></strong></div></Link>)}</div></section><SeoFooter/></main>;
}
