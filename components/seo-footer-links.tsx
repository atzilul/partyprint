import Link from 'next/link';
import {SEO_PAGE_URL} from '@/lib/seo-pages';

const groups = [
  {
    title: 'מתנות אישיות',
    slugs: ['מתנה-בעיצוב-אישי', 'מתנה-לאמא', 'מתנה-לאבא', 'מתנות-לגבר', 'מתנות-לאישה'],
  },
  {
    title: 'אירועים וחגיגות',
    slugs: ['מתנה-למסיבת-רווקים', 'מתנה-למסיבת-רווקות', 'מתנה-ליום-הולדת-של-הבן', 'מתנה-ליום-הולדת-של-הבת', 'מתנות-לאירוע'],
  },
  {
    title: 'חולצות לקבוצות',
    slugs: ['חולצה-למסיבת-רווקים', 'חולצה-למסיבת-רווקות', 'חולצה-ליום-הולדת', 'מתנה-לערב-צוות', 'חולצה-לערב-צוות', 'מתנות-לעובדים'],
  },
];

const labels: Record<string, string> = {
  'מתנה-בעיצוב-אישי': 'מתנה בעיצוב אישי',
  'מתנה-לאמא': 'מתנה לאמא',
  'מתנה-לאבא': 'מתנה לאבא',
  'מתנות-לגבר': 'מתנות לגבר',
  'מתנות-לאישה': 'מתנות לאישה',
  'מתנה-למסיבת-רווקים': 'מתנה למסיבת רווקים',
  'מתנה-למסיבת-רווקות': 'מתנה למסיבת רווקות',
  'מתנה-ליום-הולדת-של-הבן': 'מתנה ליום הולדת של הבן',
  'מתנה-ליום-הולדת-של-הבת': 'מתנה ליום הולדת של הבת',
  'מתנות-לאירוע': 'מתנות לאירוע',
  'חולצה-למסיבת-רווקים': 'חולצה למסיבת רווקים',
  'חולצה-למסיבת-רווקות': 'חולצה למסיבת רווקות',
  'חולצה-ליום-הולדת': 'חולצה ליום הולדת',
  'מתנה-לערב-צוות': 'מתנה לערב צוות',
  'חולצה-לערב-צוות': 'חולצה לערב צוות',
  'מתנות-לעובדים': 'מתנות לעובדים',
};

export default function SeoFooterLinks() {
  return <section className="footer-seo" aria-labelledby="footer-seo-title">
    <div className="footer-seo-heading">
      <span className="eyebrow">FIND YOUR IDEA</span>
      <h2 id="footer-seo-title">מחפשים את הרעיון שלכם?</h2>
      <p>עמודים קצרים עם רעיונות וטיפים לפני שמתחילים לעצב.</p>
    </div>
    <div className="footer-seo-groups">
      {groups.map(group => <div className="footer-seo-group" key={group.title}>
        <h3>{group.title}</h3>
        <div>{group.slugs.map(slug => <Link href={SEO_PAGE_URL(slug)} key={slug}>{labels[slug]}</Link>)}</div>
      </div>)}
    </div>
    <div className="footer-seo-utility"><Link href="/guides">כל מדריכי הרעיונות</Link><Link href="/faq">שאלות ותשובות</Link><Link href="/blog">בלוג PARTYPRINT</Link></div>
  </section>;
}
