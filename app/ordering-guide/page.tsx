import OrderFormLink from '@/components/order-form-link';
import type {Metadata} from 'next';
import Link from '@/components/safe-link';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import {currentPricing} from '@/lib/current-pricing';
import {SINGLE_SHIRT_PRICE} from '@/lib/catalog';
import {revisionFeeText} from '@/lib/pricing';

// Rendered per request: the single-shirt price is the one in the admin price list.
export const dynamic='force-dynamic';

const title='איך מזמינים חולצות בעיצוב אישי? תמונות, מידות ומחיר | PARTYPRINT';
const description='מדריך מעשי להזמנת חולצות לקבוצה: איך בוחרים תמונות, אוספים מידות למבוגרים ולילדים, מחשבים מחיר, מאשרים את העיצוב ומתכננים את המשלוח לפני האירוע.';
const canonical='https://partyprint.co.il/ordering-guide';
export const metadata:Metadata={title,description,alternates:{canonical:'/ordering-guide'},openGraph:{title,description,url:canonical,type:'article',locale:'he_IL',images:[{url:'/transformation.webp',alt:'מתמונה ורעיון לעיצוב אישי על חולצה'}]}};
const sectionsFor=(singleShirtPrice:string,revisionFee:string)=>[
 {id:'photos',question:'איזו תמונה כדאי לשלוח לעיצוב על חולצה?',answer:'בחרו תמונה חדה ומוארת שבה רואים היטב את האדם או הקבוצה. העדיפו את הקובץ המקורי מהטלפון על פני צילום מסך או תמונה שנשלחה שוב ושוב. אין צורך להכין עיצוב גמור.',tips:['אם רוצים לזהות פנים, בחרו צילום שבו הן גלויות ובגודל ברור.','אפשר לצרף כמה זוויות, ולציין מי האדם שצריך להופיע בעיצוב.','בטופס אפשר להעלות עד 10 תמונות מסוג JPG, PNG או WEBP, עד 5MB לתמונה ועד 15MB בסך הכול.','צרפו רק תמונות שיש לכם הרשאה להשתמש בהן. אם אין תמונות כרגע, אפשר להשלים אותן בתיאום ב־WhatsApp.']},
 {id:'brief',question:'מה לכתוב כשאין עדיין רעיון לעיצוב?',answer:'כתבו למי מכינים את החולצות, מה האירוע, ופרט אחד שמאפיין את האנשים: תחביב, משפט קבוע או בדיחה משותפת. אפשר לתאר אווירה רצויה בלי לבחור סגנון מקצועי.',tips:['לדוגמה: ״יום הולדת 40 לדני, אוהב חלל, רוצים עיצוב משותף לכל המשפחה.״','אם יש טקסט שחייב להופיע, כתבו אותו בדיוק כפי שתרצו שיודפס.','ציינו מה לא מתאים לכם, למשל צבע מסוים או כיוון רציני מדי.']},
 {id:'sizes',question:'איך אוספים מידות למבוגרים ולילדים באותה הזמנה?',answer:'אפשר לבחור מידות וצבעים כבר בטופס באמצעות ״מידות וצבעים״, או להשלים אותם אחרי השמירה ובעזרת הסטודיו. הבחירה אופציונלית ואינה חוסמת את שליחת הפנייה. לכל חולצה בוחרים בנפרד מבוגר או ילד, מידה וצבע. מידות המבוגרים בטופס הן S, M, L ו־XL; מידות הילדים מסומנות לפי גיל: 2, 4, 6, 8, 10, 12, 14, 16 ו־18. סימון גיל הוא מידת דגם ואינו מבטיח התאמה לכל ילד באותו גיל.',tips:['אספו מראש רשימה מסודרת של המשתתפים, סוג המידה, המידה והצבע.','אפשר להחיל בחירה אחת על כל החולצות ואז לשנות את החריגות.','להתאמה טובה יותר, מדדו חולצה מתאימה על משטח ישר: רוחב בין בתי השחי ואורך מהכתף למכפלת.','שלחו לסטודיו את מדידות החולצה שמתאימה לכם ובדקו התאמה לפני אישור ההזמנה. אין להמיר אוטומטית מידת מבוגר לגיל ילד.']},
 {id:'price',question:'מה כלול במחיר של חולצות בעיצוב אישי?',answer:'המחיר המוצג באתר מבוסס על מספר החולצות ומדרגת הכמות, וכולל עיצוב משותף אחד לחבילה, הדפסה ומשלוח עד הבית. בטופס מוצגים מחיר לחולצה וסכום כולל. חולצה אחת ב־'+singleShirtPrice+' ₪ כוללת עיצוב אישי, הדפסה ומשלוח. הטופס מציע להתחיל ב־4 חולצות ואפשר להפחית עד חולצה אחת. בכמות של 2–3 חולצות חל מחיר מדרגת הכמות הראשונה, ומעליה התמחור לפי המדרגה האחרונה שהושגה. המחיר העדכני מוצג בטופס.',tips:['השוו הצעות לפי אותו מספר חולצות ולפי מה שכלול בעיצוב, בהדפסה ובמשלוח.','עיצוב משותף אחד וסבב תיקונים אחד כלולים בחבילה. סבב נוסף עולה '+revisionFee+' ₪ לפי התנאים המוצגים באתר.','עיצובים נפרדים, התאמות נוספות וכמות שאינה מוצגת בטופס דורשים תיאום והצעה.','אם יש קוד מבצע, הפעילו אותו ובדקו שהסכום השתנה לפני השליחה. שליחת הבקשה אינה גובה תשלום.']},
 {id:'schedule',question:'מתי צריך להזמין לפני האירוע?',answer:'משאירים זמן גם לפיתוח העיצוב ולאישורו וגם לייצור ולמשלוח. זמן המשלוח המוצג באתר הוא עד 5 ימי עסקים לאחר אישור העיצוב, ההזמנה והתשלום; זמן העיצוב והתיקונים אינו כלול. המועד הסופי תלוי בכתובת, בכמות ובזמינות ומאושר מראש.',tips:['הזינו את תאריך האירוע כדי שהסטודיו יוכל לבדוק זמינות.','תאריך בטופס אינו אישור שהחולצות יגיעו עד אותו יום. באירוע קרוב מתייעצים לפני שמתקדמים.','ליעדים מסוימים עשוי להיות זמן משלוח ארוך יותר; בדקו את מדיניות המשלוחים.']},
 {id:'approval',question:'מה קורה אחרי ששולחים את הטופס?',answer:'פרטי הקשר נשמרים כשממשיכים ממסך הפרטים לרעיון, גם אם לא משלימים אותו. לאחר שליחת הרעיון נשמרת הבקשה המלאה, כולל המידות שאישרתם אם בחרתם אותן בטופס, ומופיע עמוד אישור עם מספר פנייה וקישור ל־WhatsApp. בעמוד האישור אפשר להשלים מידות וצבעים, או לתאם אותם בשיחה. לאחר מכן מתאמים את הפרטים ותנאי התשלום ומפתחים כיוון עיצובי. אתם רואים את העיצוב ומאשרים אותו לפני ההדפסה.',tips:['שמרו את מספר הפנייה שמופיע באישור.','עברו על האיות, התמונה, המידות, הצבעים והכמות לפני אישור ההדפסה.','עדכונים שולחים באותה שיחת WhatsApp בצירוף מספר הפנייה. שינוי אחרי אישור הדפסה תלוי באפשרות הביצוע.','אם לא התקבל אישור שמירה, אל תניחו שהבקשה נשלחה. בדקו את הודעת השגיאה ופנו לסטודיו אם צריך.']},
];
export default async function OrderingGuide(){
 const pricing=await currentPricing(),sections=sectionsFor((pricing.singleShirtPrice??SINGLE_SHIRT_PRICE).toLocaleString('he-IL'),revisionFeeText(pricing));
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,description,inLanguage:'he-IL',isPartOf:{'@id':'https://partyprint.co.il/#website'},dateModified:'2026-11-02',author:{'@id':'https://partyprint.co.il/#organization'}},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:'https://partyprint.co.il/'},{'@type':'ListItem',position:2,name:'מדריך הזמנה',item:canonical}]},
  {'@type':'FAQPage',mainEntity:sections.map(section=>({'@type':'Question',name:section.question,acceptedAnswer:{'@type':'Answer',text:section.answer}}))}
 ]};
 return <main className="seo-page" dir="rtl"><SeoNav/><article className="seo-article">
 <header className="seo-article-header"><span className="seo-kicker">PARTYPRINT / לפני שמזמינים</span><h1>איך מזמינים חולצות<br/>בעיצוב אישי לקבוצה?</h1><p>{description}</p><p className="seo-editorial-note">בעריכת צוות PARTYPRINT · עודכן ב־2 בנובמבר 2026. המחיר והזמינות הקובעים נבדקים בטופס ובתיאום עם הסטודיו.</p></header>
 <div className="seo-quick-answer"><div><strong>מה צריך להכין?</strong><p>מספר חולצות, שם, טלפון ומייל. רעיון, תמונות ותאריך אירוע עוזרים; מידות וצבעים אפשר לבחור בטופס או להשלים אחרי השליחה. ממלאים בקשה ללא חיוב, מתאמים פרטים ומאשרים עיצוב לפני שמדפיסים.</p></div><OrderFormLink className="seo-primary-cta" href="/#order">מתחילים בבקשה ←</OrderFormLink></div>
 <nav aria-label="תוכן המדריך"><ul>{sections.map(section=><li key={section.id}><a href={'#'+section.id}>{section.question}</a></li>)}</ul></nav>
 <div className="seo-content">{sections.map((section,index)=><section id={section.id} className="seo-content-section" key={section.id}><span className="seo-section-number">0{index+1}</span><div><h2>{section.question}</h2><p>{section.answer}</p><ul>{section.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></div></section>)}</div>
 <section className="seo-offer"><div><h2>מוכנים לרכז את כולם?</h2><p>עברו לטופס לבחירת החבילה, הכמות ותאריך האירוע. משאירים שם, טלפון ומייל; מידות אפשר להשלים אחר כך. אפשר גם להתחיל בהתייעצות.</p><p><Link href="/policies/shipping">תנאי המשלוח</Link> · <Link href="/policies/returns">שינויים וביטולים</Link> · <Link href="/faq">עוד שאלות ותשובות</Link></p></div><OrderFormLink className="seo-primary-cta" href="/#order">לטופס ההזמנה ←</OrderFormLink></section>
 </article><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><SeoFooter/></main>;
}
