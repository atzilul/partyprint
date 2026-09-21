import Link from '@/components/safe-link';
import type {Metadata} from 'next';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';
import type {SeoFaq} from '@/lib/seo-pages';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import '../seo/seo.css';

export const metadata: Metadata = {
  title: 'שאלות ותשובות על מתנות וחולצות בעיצוב אישי | PARTYPRINT',
  description: 'תשובות על מתנה בעיצוב אישי, מתנה לאמא ולאבא, חולצות למסיבות, ימי הולדת, ערבי צוות, מתנות לעובדים, מחירים, תמונות ומשלוח.',
  alternates: {canonical: '/faq'},
};

const faqGroups: {title: string; items: SeoFaq[]}[] = [
  {title: 'מתנה בעיצוב אישי', items: [
    {question: 'מה כוללת מתנה בעיצוב אישי ב־PARTYPRINT?', answer: 'בוחרים רעיון, מצרפים תמונות, ואנחנו מפתחים עיצוב אישי בעזרת AI ומגע אנושי. החבילות כוללות עיצוב משותף, הדפסה ומשלוח עד הבית, והעיצוב נשלח לאישור לפני ההדפסה.'},
    {question: 'איזו תמונה מתאימה לעיצוב על חולצה?', answer: 'תמונה חדה וברורה עם דמות או רגע שקל לזהות. אפשר לצרף כמה תמונות השראה ולכתוב מה חשוב לכם שהעיצוב ישדר. אין צורך בתמונה מקצועית.'},
    {question: 'אפשר להזמין מתנה לאדם אחד וגם לקבוצה?', answer: 'כן. אפשר לעצב חולצה לאמא, לאבא, לגבר או לאישה, וגם לבנות סדרה משותפת למשפחה, לחברים או לצוות. בוחרים מידה וצבע לכל חולצה.'},
  ]},
  {title: 'אירועים וחגיגות', items: [
    {question: 'איזו מתנה מתאימה למסיבת רווקים?', answer: 'רעיון מרכזי סביב החתן והחבורה עובד טוב יותר מאוסף בדיחות. אפשר לבנות חולצה למסיבת רווקים עם גרסה מיוחדת לחתן, או עיצוב משותף לכולם.'},
    {question: 'מה כדאי לשים על חולצה למסיבת רווקות?', answer: 'מתחילים מהכלה, מהחברות ומהווייב של האירוע. אפשר לבחור לוק צבעוני, פוסטר של סרט, עטיפת אלבום או בדיחה פרטית, ולשמור על שפה אחת לכל הקבוצה.'},
    {question: 'איך יוצרים מתנה ליום הולדת של הבן או הבת?', answer: 'בוחרים משהו שהילד או הילדה אוהבים עכשיו — תחביב, דמות, חיית מחמד או משפט — ובונים סביבו עיצוב. אפשר להוסיף חולצות להורים ולאחים כדי להפוך את יום ההולדת לחוויה משפחתית.'},
    {question: 'האם יש חולצה ליום הולדת שמתאימה גם למבוגרים?', answer: 'בהחלט. חולצה ליום הולדת יכולה להיות מבוססת על תחביב, מקצוע, תמונה, הומור משפחתי או הפתעה. אותו תהליך עובד גם לחגיגה של מבוגרים וגם לחגיגה של ילדים.'},
  ]},
  {title: 'צוותים, עובדים ומתנות לאירוע', items: [
    {question: 'איך מתכננים מתנה לערב צוות?', answer: 'אוספים מהצוות מילים, בדיחות ורגעים שמאפיינים אותו, בוחרים כיוון אחד וממנים איש קשר שמרכז מידות והערות. כך מקבלים מתנה לערב צוות שמרגישה אנושית ולא רק ממותגת.'},
    {question: 'מה ההבדל בין חולצה לערב צוות לבין מתנות לעובדים?', answer: 'חולצה לערב צוות היא בדרך כלל חוויה קבוצתית סביב אירוע. מתנות לעובדים יכולות להיות אישיות יותר, אבל בשני המקרים אפשר להשתמש באותו רעיון עיצובי ולהתאים כמות, מידות וצבעים.'},
    {question: 'אפשר להזמין מתנות לאירוע משפחתי או עסקי?', answer: 'כן. מתנות לאירוע יכולות להתאים ליום הולדת, מסיבת סיום, טיול משפחתי, ערב חברה או מפגש חברים. מתאימים את הסגנון לאנשים ולאופי האירוע.'},
  ]},
  {title: 'מחיר, תמונות ותהליך', items: [
    {question: 'איך המחיר של החולצות מחושב?', answer: 'המחיר מחושב לפי כמות החולצות ומדרגת המחיר הרלוונטית. באתר מוצגים מחיר החבילה ומחיר לחולצה, כולל עיצוב, הדפסה ומשלוח עד הבית. המחיר הסופי מתואם לפני התשלום.'},
    {question: 'כמה תמונות אפשר להעלות?', answer: 'אפשר לצרף עד 10 תמונות השראה בטופס. מומלץ לבחור תמונות ברורות ולצרף רעיון קצר שמסביר את ההקשר, כדי שהעיצוב לא יישען רק על מה שרואים בתמונה.'},
    {question: 'האם יש חיוב כששולחים את הטופס?', answer: 'לא. הטופס שולח בקשת הזמנה או התייעצות ללא חיוב. ממשיכים לתיאום ולתשלום רק לאחר שהפרטים והעיצוב ברורים לכם.'},
    {question: 'מתי מקבלים את החולצות?', answer: 'לאחר אישור העיצוב, ההזמנה והתשלום, מתאמים משלוח לפי הכתובת, הכמות והזמינות. זמן המשלוח המוצהר הוא עד 5 ימי עסקים לאחר האישור, לא כולל זמן עיצוב ותיקונים.'},
    {question: 'אפשר לתקן את העיצוב?', answer: 'כן. סבב תיקונים אחד כלול בחבילה. מדפיסים רק לאחר האישור שלכם, ותיקונים נוספים מתואמים מראש אם נדרשים.'},
  ]},
];

function pageLink(keyword: string) {
  const page = SEO_PAGES.find(item => item.keywords.includes(keyword) || item.title.startsWith(keyword));
  return page ? SEO_PAGE_URL(page.slug) : '/guides';
}

export default function FaqPage() {
  const allItems = faqGroups.flatMap(group => group.items);
  const schema = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: allItems.map(item => ({'@type': 'Question', name: item.question, acceptedAnswer: {'@type': 'Answer', text: item.answer}}))};
  return <main className="seo-page" dir="rtl"><SeoNav/><section className="faq-hero"><div><span className="seo-kicker">PARTYPRINT / GOOD QUESTIONS</span><h1>שאלות טובות<br/><span>עושות סדר.</span></h1><p>כל מה שחשוב לדעת לפני שמעצבים מתנה, חולצה לקבוצה או מזכרת לאירוע.</p><Link className="seo-primary-cta" href="/#order">יש לי רעיון · מתחילים בלי חיוב <span aria-hidden="true">←</span></Link></div><div className="faq-hero-note"><strong>לא מצאתם תשובה?</strong><span>ספרו לנו מה אתם חוגגים, ונעזור לבחור כיוון.</span><Link href="/#contact">מדברים איתנו ←</Link></div></section><section className="faq-content"><div className="seo-section-heading"><div><span className="seo-kicker">ANSWERS BEFORE THE ORDER</span><h2>מה רציתם לדעת?</h2></div><p>תשובות קצרות וברורות על רעיונות, הזמנה, תמונות, מחירים ומשלוח.</p></div><div className="faq-groups">{faqGroups.map(group => <section className="faq-group" key={group.title}><h2>{group.title}</h2>{group.items.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>)}</div><div className="faq-related"><h2>עמודים שיעזרו לכם לבחור</h2><div><Link href={pageLink('מתנה בעיצוב אישי')}>מתנה בעיצוב אישי <span>↗</span></Link><Link href={pageLink('מתנה לאמא')}>מתנה לאמא <span>↗</span></Link><Link href={pageLink('חולצה למסיבת רווקים')}>חולצה למסיבת רווקים <span>↗</span></Link><Link href={pageLink('מתנה לערב צוות')}>מתנה לערב צוות <span>↗</span></Link><Link href="/blog">עוד רעיונות בבלוג <span>↗</span></Link></div></div></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g, '\\u003c')}}/><SeoFooter/></main>;
}
