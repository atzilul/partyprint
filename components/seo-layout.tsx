import Link from '@/components/safe-link';
import SeoFooterLinks from './seo-footer-links';
import OrderFormLink from '@/components/order-form-link';
import BusinessDetails from '@/components/business-details';
import {BUSINESS_DETAILS} from '@/lib/business-details';

export function SeoNav() {
  return <header className="seo-nav">
    <Link className="seo-brand" href="/" aria-label="PARTYPRINT — חזרה לאתר" />
    <nav aria-label="ניווט עמודי תוכן"><Link href="/about">אודות</Link><Link href="/work">דוגמאות</Link><Link href="/guides">מדריכי רעיונות</Link><Link href="/blog">בלוג</Link><Link href="/faq">שאלות ותשובות</Link><Link href="/ordering-guide">מדריך הזמנה</Link><Link href="/contact">יצירת קשר</Link></nav>
    <OrderFormLink className="seo-nav-cta">מתחילים בלי חיוב</OrderFormLink>
  </header>;
}

export function SeoFooter() {
  return <footer className="seo-footer"><SeoFooterLinks/><div className="seo-footer-bottom"><strong>PARTYPRINT · אנשים אמיתיים. עיצובים לא רגילים.</strong><Link href="/">חזרה לאתר הראשי</Link></div><BusinessDetails details={BUSINESS_DETAILS}/></footer>;
}
