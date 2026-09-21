import Link from 'next/link';
import SeoFooterLinks from './seo-footer-links';

export function SeoNav() {
  return <header className="seo-nav">
    <Link className="seo-brand" href="/" aria-label="PARTYPRINT — חזרה לאתר" />
    <nav aria-label="ניווט עמודי תוכן"><Link href="/guides">מדריכי רעיונות</Link><Link href="/blog">בלוג</Link><Link href="/faq">שאלות ותשובות</Link></nav>
    <Link className="seo-nav-cta" href="/#order">מתחילים בלי חיוב</Link>
  </header>;
}

export function SeoFooter() {
  return <footer className="seo-footer"><SeoFooterLinks/><div className="seo-footer-bottom"><strong>PARTYPRINT · אנשים אמיתיים. עיצובים לא רגילים.</strong><Link href="/">חזרה לאתר הראשי</Link></div></footer>;
}
