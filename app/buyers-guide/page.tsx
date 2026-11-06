import type {Metadata} from 'next';
import Link from '@/components/safe-link';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import {shekels} from '@/lib/bundles';
import {answerUrl,BUNDLE_ANSWERS} from '@/lib/bundle-answers';
import {PRICE_ANSWERS} from '@/lib/price-answers';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING,priceFor,unitPriceFor,revisionFeeText} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';
import '@/components/content-contact.css';
import '../seo/seo.css';
import './buyers-guide.css';

/**
 * A fair buyer's guide: the kinds of shirt printers, ten questions to ask any of them,
 * our own answers in the open, and when another supplier fits better. No competitor is
 * named and nothing is claimed about anyone's prices but ours.
 */
export const dynamic='force-dynamic';
const origin='https://partyprint.co.il',url=origin+'/buyers-guide',updatedAt='2026-11-05T00:00:00.000Z';
const title='איך בוחרים ספק להדפסת חולצות לקבוצה?',seoTitle='איך בוחרים ספק להדפסת חולצות לקבוצה? 10 שאלות לשאול | PARTYPRINT';
const description='מדריך הוגן לבחירת ספק להדפסת חולצות: שלושה סוגי ספקים, עשר שאלות לשאול לפני שמזמינים, ומתי כדאי לבחור בספק אחר. כולל המחירים והתנאים של PARTYPRINT בגלוי.';
const keywords=['איך לבחור ספק להדפסת חולצות','הדפסה על חולצות המלצות','השוואת ספקי הדפסה על חולצות','הדפסה על חולצות לקבוצה','מה לשאול לפני הזמנת חולצות מודפסות','חולצות בעיצוב אישי'];
export const metadata:Metadata={
 title:seoTitle,description,keywords,alternates:{canonical:'/buyers-guide'},
 openGraph:{type:'article',locale:'he_IL',url,siteName:'PARTYPRINT',title:seoTitle,description,images:[{url:'/og-default.jpg',width:1200,height:630,alt:'קבוצה בחולצות בעיצוב אישי של PARTYPRINT'}]},
 twitter:{card:'summary_large_image',title:seoTitle,description,images:['/og-default.jpg']},
};
async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}

const SUPPLIERS=[
 {kind:'בית דפוס מקומי',gets:'הדפסה של קובץ שאתם מביאים, ולפעמים עזרה בעיצוב.',fits:'יש לכם עיצוב מוכן, חשוב לכם לראות ולמשש את החולצה, או שאתם צריכים כמות גדולה מאוד.',less:'אין לכם עיצוב, ואין לכם זמן להגיע פיזית.'},
 {kind:'אתר הדפסה עם מעצב עצמי',gets:'מעלים תמונה או טקסט, ממקמים לבד על החולצה ומזמינים אונליין.',fits:'אתם יודעים בדיוק מה אתם רוצים, העיצוב פשוט, והמחיר הוא השיקול הראשון.',less:'אתם רוצים עיצוב מקורי שמישהו בונה בשבילכם.'},
 {kind:'סטודיו לעיצוב אישי, כמו PARTYPRINT',gets:'שולחים תמונות ורעיון, מקבלים עיצוב שנבנה בשבילכם, מאשרים ורק אז מדפיסים.',fits:'אתם רוצים חולצה עם אופי, ואין לכם עיצוב מוכן.',less:'אתם צריכים את החולצות מחר, או רק לוגו פשוט במחיר הנמוך ביותר.'},
];
const questions=(pricing:Pricing)=>[
 {q:'מה כלול במחיר לחולצה?',why:'עיצוב, הדפסה ומשלוח מתומחרים לפעמים בנפרד, והמחיר הסופי גבוה מהמחיר שפורסם.',us:'עיצוב אישי אחד לכל הקבוצה, הדפסה ומשלוח כלולים במחיר.'},
 {q:'מה המינימום להזמנה?',why:'יש ספקים שמתחילים מעשרות חולצות, ויש שמדפיסים גם אחת.',us:'מחולצה אחת ('+shekels(unitPriceFor(pricing,1))+' ₪). לקבוצות הטופס מתחיל ב־4 חולצות.'},
 {q:'מי מעצב?',why:'תבנית מוכנה, מעצב עצמי או עיצוב שנבנה בשבילכם הם שלושה מוצרים שונים.',us:'אנחנו מעצבים מהתמונות ומהרעיון שלכם, עם AI ומגע אנושי.'},
 {q:'רואים את העיצוב לפני ההדפסה?',why:'הטעות היקרה ביותר היא הדפסה שלא אישרתם.',us:'כן. מדפיסים רק אחרי שאישרתם את העיצוב.'},
 {q:'כמה תיקונים כלולים?',why:'כדאי לדעת מראש מה קורה אם העיצוב הראשון לא מדויק.',us:'סבב תיקונים אחד כלול. כל סבב נוסף עולה '+revisionFeeText(pricing)+' ₪.'},
 {q:'אילו מידות וצבעים יש?',why:'קבוצה מעורבת צריכה גם מידות ילדים וגם מבוגרים, באותו עיצוב.',us:'ילדים מגיל 2 עד 18, מבוגרים S עד XL. לבן, שחור או אפור, ואפשר לערבב.'},
 {q:'מאיזה בד החולצה ובאיזו שיטה מדפיסים?',why:'הבד ושיטת ההדפסה משפיעים על התחושה ועל העמידות בכביסה.',us:'מאשרים איתכם בהצעת המחיר. שאלו אותנו ב־WhatsApp לפני ההזמנה.'},
 {q:'כמה זמן זה לוקח?',why:'זמן העיצוב וזמן המשלוח הם שני דברים, וספקים רבים מציינים רק אחד מהם.',us:'עד 5 ימי עסקים למשלוח אחרי אישור העיצוב, ההזמנה והתשלום. זמן העיצוב לא כלול.'},
 {q:'מתי משלמים?',why:'תשלום מלא לפני שראיתם עיצוב הוא סיכון.',us:'אין חיוב בשליחת הפנייה. מחיר סופי מאושר איתכם לפני התשלום.'},
 {q:'מה קורה אם צריך לשנות אחרי ההזמנה?',why:'אנשים מצטרפים, ומידות משתנות עד הרגע האחרון.',us:'מעדכנים ב־WhatsApp. שינוי אחרי אישור ההדפסה כפוף לאפשרות הביצוע.'},
];
const faqs=(pricing:Pricing)=>[
 {question:'מה ההבדל בין הדפסה על חולצות לבין עיצוב אישי?',answer:'בהדפסה רגילה אתם מביאים קובץ או ממקמים תמונה בעצמכם, והספק מדפיס. בעיצוב אישי שולחים תמונות ורעיון, והספק בונה בשבילכם עיצוב מקורי ומראה לכם אותו לפני ההדפסה.'},
 {question:'כמה עולה הדפסה על חולצות לקבוצה?',answer:'אצלנו המחיר לחולצה יורד עם הכמות: '+shekels(unitPriceFor(pricing,4))+' ₪ ב־4 חולצות, '+shekels(unitPriceFor(pricing,10))+' ₪ ב־10 חולצות, '+shekels(unitPriceFor(pricing,25))+' ₪ ב־25 חולצות ו־'+shekels(unitPriceFor(pricing,100))+' ₪ ב־100 חולצות, כולל עיצוב, הדפסה ומשלוח. אצל ספקים אחרים כדאי לבדוק מה מתוך אלה כלול במחיר.'},
 {question:'איך משווים בין הצעות מחיר של ספקים?',answer:'משווים את הסכום הכולל ולא את המחיר לחולצה: עיצוב, הדפסה, משלוח ותיקונים. בודקים גם אם רואים את העיצוב לפני ההדפסה ומתי משלמים.'},
 {question:'עיצוב עם AI טוב כמו עיצוב של מעצב?',answer:'אצלנו ה־AI הוא כלי ולא המעצב. אדם בוחר את הכיוון, בודק את התוצאה ומתקן, ואתם מאשרים את העיצוב לפני שמדפיסים.'},
 {question:'מה כדאי להכין לפני שפונים לספק?',answer:'מספר החולצות, תאריך האירוע, תמונות ברורות של האנשים, משפט אחד על הרעיון ולוגו אם יש. את רשימת המידות אפשר להשלים אחר כך.'},
];

export default async function BuyersGuidePage(){
 const pricing=await currentPricing(),list=questions(pricing),answers=faqs(pricing),rows=[4,10,25,50,100];
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:origin+'/'},{'@type':'ListItem',position:2,name:title,item:url}]},
  {'@type':'Article','@id':url+'#article',headline:title,description,inLanguage:'he-IL',dateModified:updatedAt,datePublished:updatedAt,mainEntityOfPage:url,author:{'@id':origin+'/#organization'},publisher:{'@id':origin+'/#organization'},image:origin+'/og-default.jpg'},
  {'@type':'FAQPage','@id':url+'#faq',inLanguage:'he-IL',mainEntity:[...list.map(item=>({question:item.q,answer:item.why+' אצל PARTYPRINT: '+item.us})),...answers].map(faq=>({'@type':'Question',name:faq.question,acceptedAnswer:{'@type':'Answer',text:faq.answer}}))},
 ]};
 return <main className="seo-page" dir="rtl"><SeoNav/><article className="seo-article">
  <nav className="seo-breadcrumbs" aria-label="פירורי לחם"><Link href="/">PARTYPRINT</Link><span aria-hidden="true">←</span><span aria-current="page">{title}</span></nav>
  <header className="seo-article-header"><span className="seo-kicker">מדריך לבחירת ספק · 10 שאלות לפני שמזמינים</span><h1>{title}</h1><p>בוחרים לפי שלושה דברים: מי מעצב, מה כלול במחיר, ומתי רואים את העיצוב לפני ההדפסה. מחיר לחולצה לבדו מטעה, כי הוא לא תמיד כולל עיצוב, משלוח או תיקונים. המדריך מסביר את סוגי הספקים, נותן עשר שאלות לשאול כל ספק, ומראה בגלוי מה התשובות אצלנו ומתי ספק אחר יתאים לכם יותר.</p><p className="seo-editorial-note">מדריך בעריכת צוות PARTYPRINT. עודכן ב־<time dateTime={updatedAt}>{new Date(updatedAt).toLocaleDateString('he-IL',{timeZone:'Asia/Jerusalem'})}</time>. אנחנו ספק בעצמנו, ולכן כתבנו כאן גם מתי לא כדאי לבחור בנו.</p></header>
  <div className="seo-article-layout"><div className="seo-content">
   <section className="seo-content-section"><span className="seo-section-number">01</span><div><h2>שלושה סוגי ספקים</h2><p>רוב הספקים בישראל שייכים לאחד משלושה סוגים. אף אחד מהם לא טוב יותר מהאחרים, כל אחד מתאים לצורך אחר.</p><div className="bg-table-wrap"><table className="bg-table"><thead><tr><th scope="col">סוג הספק</th><th scope="col">מה מקבלים</th><th scope="col">מתאים כש...</th><th scope="col">פחות מתאים כש...</th></tr></thead><tbody>{SUPPLIERS.map(item=><tr key={item.kind}><th scope="row">{item.kind}</th><td>{item.gets}</td><td>{item.fits}</td><td>{item.less}</td></tr>)}</tbody></table></div></div></section>
   <section className="seo-content-section"><span className="seo-section-number">02</span><div><h2>עשר שאלות לשאול כל ספק</h2><p>אלה השאלות שמבדילות בין הצעה טובה להפתעה לא נעימה. ליד כל שאלה כתבנו למה היא חשובה ומה התשובה אצלנו.</p><ol className="bg-questions">{list.map(item=><li key={item.q}><h3>{item.q}</h3><p>{item.why}</p><p className="bg-ours"><b>אצל PARTYPRINT:</b> {item.us}</p></li>)}</ol></div></section>
   <section className="content-contact" aria-labelledby="bg-prices-title"><div className="content-contact-head"><span className="content-contact-kicker">המחירים שלנו, בגלוי</span><h2 id="bg-prices-title">כמה עולה אצלנו חולצה, לפי כמות</h2><p>המחיר כולל עיצוב אישי אחד לכל הקבוצה, הדפסה ומשלוח. כך תוכלו להשוות להצעות אחרות.</p></div><table className="content-price-table"><thead><tr><th scope="col">כמות</th><th scope="col">מחיר לחולצה</th><th scope="col">סה״כ</th></tr></thead><tbody>{rows.map(quantity=><tr key={quantity}><td>{quantity} חולצות</td><td>{shekels(unitPriceFor(pricing,quantity))} ₪</td><td><b>{shekels(priceFor(pricing,4,quantity))} ₪</b></td></tr>)}</tbody></table><p className="content-contact-note">חולצה אחת עולה {shekels(unitPriceFor(pricing,1))} ₪. מחיר סופי מאושר איתכם לפני התשלום, ואין חיוב בשליחת הפנייה.</p></section>
   <section className="seo-content-section"><span className="seo-section-number">03</span><div><h2>מתי כדאי לבחור בספק אחר</h2><p>אנחנו לא מתאימים לכל הזמנה, ועדיף לדעת את זה לפני שמתחילים.</p><ul><li>אתם צריכים את החולצות בתוך יום או יומיים.</li><li>יש לכם קובץ עיצוב מוכן, ואתם מחפשים רק הדפסה במחיר הנמוך ביותר.</li><li>חשוב לכם לבחור סוג בד או שיטת הדפסה מתוך קטלוג.</li><li>אתם רוצים לראות ולמשש את החולצה בחנות לפני שמזמינים.</li></ul></div></section>
   <section className="seo-content-section"><span className="seo-section-number">04</span><div><h2>מתי PARTYPRINT מתאים</h2><p>אנחנו הבחירה הנכונה כשהחולצה צריכה לספר משהו על האנשים שלובשים אותה.</p><ul><li>אין לכם עיצוב מוכן, רק תמונות ורעיון.</li><li>לקבוצה יש בדיחה, סיפור או אירוע שרוצים להפוך להדפס.</li><li>חשוב לכם לראות ולאשר את העיצוב לפני שמדפיסים.</li><li>הקבוצה מעורבת: ילדים ומבוגרים באותה הזמנה.</li></ul></div></section>
   <section className="seo-reading" aria-labelledby="bg-next-title"><h2 id="bg-next-title">כמה זה יעלה לכם?</h2><div>{[...PRICE_ANSWERS,...BUNDLE_ANSWERS.slice(0,3)].map(item=><Link key={item.slug} href={answerUrl(item)}><strong>{item.title}</strong><span>{item.kicker.split(' ·')[0]}: טבלת מחירים לפי כמות, מה כלול ומתי להזמין.</span><b aria-hidden="true">לתשובה ←</b></Link>)}</div></section>
   <div className="seo-offer"><div><span className="seo-kicker">READY WHEN YOU ARE</span><h2>יש לכם רעיון?<br/><span>בואו נעצב אותו.</span></h2><p>שלחו כמה מילים ותמונות. מתחילים בלי חיוב, רואים את העיצוב ומאשרים לפני ההדפסה.</p></div><Link className="seo-primary-cta" href="/#order">שליחת רעיון <span aria-hidden="true">←</span></Link></div>
  </div><aside className="seo-aside"><div className="seo-aside-card"><strong>בקצרה</strong><ol><li>בודקים מי מעצב.</li><li>בודקים מה כלול במחיר.</li><li>מאשרים עיצוב לפני הדפסה.</li></ol><Link href="/bundle-sale">הזמנה גדולה? BUNDLE SALE ←</Link><p><Link href="/work">דוגמאות מהסטודיו</Link> · <Link href="/faq">שאלות ותשובות</Link></p></div></aside></div>
  <section className="seo-faq" aria-labelledby="seo-faq-title"><span className="seo-kicker">GOOD QUESTIONS</span><h2 id="seo-faq-title">שאלות נפוצות על בחירת ספק</h2>{answers.map(faq=><details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>
 </article>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
 <div className="seo-mobile-cta"><div><strong>מוכנים לעצב?</strong><span>מתחילים בלי חיוב</span></div><Link href="/#order">שליחת רעיון <span aria-hidden="true">←</span></Link></div>
 <SeoFooter/></main>;
}
