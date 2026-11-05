import type {Metadata} from 'next';
import Link from '@/components/safe-link';
import OrderFormLink from '@/components/order-form-link';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import './seo/seo.css';

// A missing page answers in Hebrew, tells crawlers once not to index it, and
// points the visitor back into the site.
export const metadata:Metadata={title:'העמוד לא נמצא | PARTYPRINT',description:'העמוד שחיפשתם לא נמצא. מכאן אפשר להמשיך לדף הבית, למדריכים ולדוגמאות.',robots:{index:false,follow:true}};

export default function NotFound(){
 return <main className="seo-page" dir="rtl"><SeoNav/><article className="seo-article"><header className="seo-article-header"><span className="seo-kicker">404</span><h1>העמוד הזה לא נמצא</h1><p>ייתכן שהקישור השתנה או שהכתובת הוקלדה אחרת. מכאן אפשר להמשיך לכל מקום באתר.</p></header><div className="seo-quick-answer"><div><span className="seo-kicker">לאן ממשיכים?</span><p><Link href="/">לדף הבית</Link> · <Link href="/guides">מדריכי רעיונות</Link> · <Link href="/work">דוגמאות</Link> · <Link href="/faq">שאלות ותשובות</Link></p></div><OrderFormLink className="seo-primary-cta" href="/#order">שליחת רעיון <span aria-hidden="true">←</span></OrderFormLink></div></article><SeoFooter/></main>;
}
