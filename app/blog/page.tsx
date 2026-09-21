import Link from 'next/link';
import type {Metadata} from 'next';
import {listBlogPosts} from '@/lib/blog';
import BlogIndex from './blog-index';
import './blog.css';

export const metadata:Metadata={title:'בלוג PARTYPRINT | רעיונות למתנות, חולצות ואירועים',description:'מדריכים ורעיונות למתנות בעיצוב אישי, חולצות לימי הולדת, מסיבות רווקים, מסיבות רווקות וערבי צוות.',alternates:{canonical:'/blog'}};
export const dynamic='force-dynamic';

export default async function BlogPage(){const posts=await listBlogPosts();return <main className="blog-page" dir="rtl"><BlogNav/><section className="blog-hero"><div className="blog-hero-inner"><span className="blog-kicker">PARTYPRINT / IDEAS TO WEAR</span><h1>רעיונות טובים<br/><span>נשארים איתכם.</span></h1><p>מדריכים קצרים שיעזרו לבחור מתנה, לבנות קונספט לאירוע ולהפוך תמונה או בדיחה לעיצוב אישי שאפשר ללבוש.</p></div></section><section className="blog-main"><div className="blog-section-head"><div><span className="blog-kicker">THE PARTYPRINT JOURNAL</span><h2>מה חוגגים הפעם?</h2></div><p>תוכן שימושי לפני שמזמינים: רעיונות, תכנון, מידות, תמונות וכל מה שעוזר להגיע לעיצוב שמרגיש באמת שלכם.</p></div><BlogIndex posts={posts}/></section><BlogFooter/></main>}
function BlogNav(){return <header className="blog-nav"><Link className="blog-brand" href="/" aria-label="PARTYPRINT — חזרה לאתר"/><nav className="blog-nav-links"><Link href="/">האתר הראשי</Link><Link href="/#packages">החבילות</Link><Link href="/#faq">שאלות נפוצות</Link></nav><Link className="blog-nav-cta" href="/#order">מתחילים בלי חיוב</Link></header>}
function BlogFooter(){return <footer className="blog-footer"><strong>PARTYPRINT · אנשים אמיתיים. עיצובים לא רגילים.</strong><Link href="/">חזרה לאתר הראשי</Link></footer>}
