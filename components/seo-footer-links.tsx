import Link from '@/components/safe-link';
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
  {
    title: 'שירותי הדפסה',
    slugs: ['הדפסה-על-חולצות', 'הדפסה-בעיצוב-אישי', 'חולצות-לימי-הולדת', 'חולצה-לצוות-ולעסק', 'חולצות-לאירועים', 'הדפסה-על-חולצות-צבא'],
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
  'הדפסה-על-חולצות': 'הדפסה על חולצות',
  'הדפסה-בעיצוב-אישי': 'הדפסה בעיצוב אישי',
  'חולצות-לימי-הולדת': 'חולצה לימי הולדת',
  'חולצה-לצוות-ולעסק': 'חולצה לצוות ולעסק',
  'חולצות-לאירועים': 'חולצות לאירועים',
  'הדפסה-על-חולצות-צבא': 'הדפסה על חולצות צבא',
};

export default function SeoFooterLinks() {
  return <section className="footer-seo" aria-labelledby="footer-seo-title">
    <div className="footer-seo-heading">
      <div><span className="eyebrow">FIND YOUR IDEA</span><h2 id="footer-seo-title">מחפשים את הרעיון שלכם?</h2></div>
      <span className="footer-seo-note">מתנות, חולצות ועיצובים אישיים לכל חגיגה</span>
    </div>
    <nav className="footer-seo-groups" aria-label="עמודים לפי רעיון">
      {groups.map(group => <section className="footer-seo-group" key={group.title}>
        <h3>{group.title}</h3>
        <ul>{group.slugs.map(slug => <li key={slug}><Link href={SEO_PAGE_URL(slug)}>{labels[slug]}</Link></li>)}</ul>
      </section>)}
    </nav>
    <nav className="footer-seo-utility" aria-label="ניווט מהיר"><span>ניווט מהיר</span><div><Link href="/about">אודות PARTYPRINT</Link><Link href="/work">דוגמאות ותהליכים</Link><Link href="/guides">מדריכי רעיונות</Link><Link href="/faq">שאלות ותשובות</Link><Link href="/policies/shipping">משלוחים</Link><Link href="/policies/returns">ביטולים והחזרות</Link><Link href="/blog">בלוג PARTYPRINT</Link></div></nav>
  </section>;
}
