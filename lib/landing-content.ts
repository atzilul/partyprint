import type {LandingVariantKey} from './landing-variants';
import type {HomeFaqItem} from './home-faq';

/**
 * Audience-specific content for the paid landing pages (/lp/[slug]): design
 * examples, idea chips, which package card to show and extra FAQ items.
 * Every image is an AI mock-up and is labelled as such on the page.
 */
export type LandingExample={asset:string;alt:string;sticker:string;title:string;text:string};
export type LandingContent={
 examplesTitle:[string,string];
 examplesIntro:string;
 examples:LandingExample[];
 ideasTitle:string;
 ideas:string[];
 packIndex:number;
 showSingleShirt:boolean;
 packagesTitle:[string,string];
 faq:HomeFaqItem[];
};

const LEAD_TIME_Q:HomeFaqItem=['כמה זמן לפני האירוע כדאי לשלוח פנייה?','המשלוח הוא עד 5 ימי עסקים אחרי אישור העיצוב, ההזמנה והתשלום, וזמן העיצוב והתיקונים לא כלול בו. לכן מומלץ לשלוח פנייה לפחות שבועיים לפני האירוע. אם האירוע קרוב יותר, כתבו את התאריך בטופס ונבדוק יחד מה אפשרי.'];
const COLORS_Q:HomeFaqItem=['באילו צבעי חולצה אפשר לבחור?','לבן, שחור או אפור, ואפשר לערבב בין החולצות באותה הזמנה. את הצבעים והמידות בוחרים בטופס או משלימים איתנו אחרי השליחה.'];

export const LANDING_CONTENT:Record<LandingVariantKey,LandingContent>={
 family:{
  examplesTitle:['ככה זה יכול להיראות','ביום ההולדת המשפחתי.'],
  examplesIntro:'שולחים תמונה של החוגג ושל המשפחה, ואנחנו הופכים אותה להדפס משותף. הדמיות להמחשת הכיוון.',
  examples:[
   {asset:'/family-heroes.webp',alt:'משפחה עם שלושה ילדים בחולצות עם פורטרטים של גיבורי־על',sticker:'SUPER FAMILY',title:'משפחת גיבורי־על',text:'הילד במרכז, ההורים והאחים לצידו. הדפס אחד משותף, וכל אחד בגרסת הגיבור שלו.'},
   {asset:'/family-shared-v2.webp',alt:'משפחה חוגגת יום הולדת בחולצות תואמות בעיצוב אישי',sticker:'BIRTHDAY CREW',title:'כל המשפחה בתמונה אחת',text:'אותו עיצוב על כולם, במידות ילדים ומבוגרים. מתנה שנשארת גם אחרי שהעוגה נגמרת.'},
   {asset:'/statement-family-fixed.webp',alt:'משפחה מחייכת בחולצות תואמות',sticker:'MATCHING',title:'תואמות, לא משעממות',text:'מתאים גם ליום הולדת 40 לאבא או 70 לסבתא: כולם לובשים את אותו הסיפור.'},
  ],
  ideasTitle:'רעיונות שעובדים ליום הולדת משפחתי',
  ideas:['🦸 משפחת גיבורי־על','🚀 יום הולדת בחלל','🎂 40 לאבא, כולם בתמונה','🐶 גם הכלב בהדפס','👑 מלכת המסיבה בת 6'],
  packIndex:0,
  showSingleShirt:true,
  packagesTitle:['החבילה המשפחתית.','הוסיפו את כולם.'],
  faq:[LEAD_TIME_Q],
 },
 bride:{
  examplesTitle:['ככה זה יכול להיראות','במסיבת הרווקות.'],
  examplesIntro:'הכלה במרכז, החברות סביבה, והסטייל של החבורה בהדפס. הדמיות להמחשת הכיוון.',
  examples:[
   {asset:'/bride-city.webp',alt:'שש חברות על גג בעיר בחולצות עם פורטרטים נוצצים בסגנון דיסקו',sticker:'DISCO BRIDE',title:'כלת הדיסקו',text:'פורטרט של כל אחת בסגנון פופ נוצץ, כדורי דיסקו ושקיעה. החבורה כולה באותו לוק.'},
   {asset:'/bride-shared-v2.webp',alt:'שש חברות בחולצות אופנתיות עם הדפסי פורטרט אישיים',sticker:'SIX IN THE CITY',title:'SIX IN THE CITY',text:'שש חברות, איור אחד, אותו הדפס על כל החולצות. ONE LAST FLING כבר כתוב.'},
   {asset:'/shirts.webp',alt:'חולצות עם עיצובים אישיים, ביניהן כלת דיסקו',sticker:'INSIDE JOKE',title:'הבדיחה הפנימית',text:'כיתוב שרק אתן מבינות, על רקע שמתאים לסטייל של המסיבה. אנחנו מציעים כיוון, אתן מאשרות.'},
  ],
  ideasTitle:'רעיונות שעובדים למסיבת רווקות',
  ideas:['🪩 כלת הדיסקו','💍 ONE LAST FLING','🍸 הקוקטייל של כל אחת','✈️ הטיסה של הכלה','👯 צוות הכלה, עם תפקידים'],
  packIndex:1,
  showSingleShirt:false,
  packagesTitle:['החבילה לכלה ולחברות.','הוסיפו את כולן.'],
  faq:[['אפשר עיצוב שונה לכלה?','החבילה כוללת עיצוב משותף אחד לכל החבורה, ובדרך כלל הכלה מקבלת בו מקום מרכזי. גרסה נפרדת לכלה היא עיצוב נוסף שמתומחר בנפרד. כתבו את זה ברעיון, ונחזור אליכן עם הצעה לפני שמתחילים.'],LEAD_TIME_Q],
 },
 groom:{
  examplesTitle:['ככה זה יכול להיראות','במסיבת הרווקים.'],
  examplesIntro:'החתן בתפקיד הראשי, החבר׳ה בקאסט. הדמיות להמחשת הכיוון.',
  examples:[
   {asset:'/groom-crew.webp',alt:'ארבעה חברים על גג בלילה בחולצות שחורות עם פורטרטים בסגנון כרזת סרט',sticker:'THE MAIN CREW',title:'הקאסט של הלילה',text:'כל אחד בפורטרט בסגנון כרזת סרט, עיר בלילה ברקע. על חולצה שחורה זה נראה כמו פוסטר.'},
   {asset:'/groom-shared-v2.webp',alt:'חברים במסיבת רווקים בחולצות כהות עם הדפסים קולנועיים',sticker:'GAME OVER',title:'GAME OVER',text:'החתן והחבר׳ה באותו הדפס קבוצתי, עם קריצה. הבדיחה הפנימית נכנסת לעיצוב.'},
   {asset:'/party-crew.webp',alt:'חבורה חוגגת בחולצות מעוצבות בהתאמה אישית',sticker:'THE SQUAD',title:'כל החבורה, הדפס אחד',text:'מהצבא, מהלימודים או מהשכונה. הסיפור של החבר׳ה הופך לעיצוב שכולם לובשים.'},
  ],
  ideasTitle:'רעיונות שעובדים למסיבת רווקים',
  ideas:['🎬 כרזת סרט עם החתן בתפקיד הראשי','🎮 GAME OVER','🏆 הנבחרת של החתן','🍺 הבדיחה מהצבא','🕶️ הקאסט של הלילה'],
  packIndex:2,
  showSingleShirt:false,
  packagesTitle:['החבילה לחתן ולחבר׳ה.','הוסיפו את כולם.'],
  faq:[COLORS_Q,LEAD_TIME_Q],
 },
 team:{
  examplesTitle:['ככה זה יכול להיראות','בצוות שלכם.'],
  examplesIntro:'האנשים עצמם בעיצוב, לא רק הלוגו. הדמיות להמחשת הכיוון.',
  examples:[
   {asset:'/tech-team.webp',alt:'צוות בחברת הייטק בחולצות עם פורטרטים בסגנון עתידני',sticker:'TEAM UNREAL',title:'הצוות בגרסה עתידנית',text:'פורטרט לכל אחד מהצוות באותו סגנון. חולצה שאנשים באמת לובשים גם אחרי יום הגיבוש.'},
   {asset:'/shirts.webp',alt:'חולצות עם עיצובים אישיים בסגנונות שונים',sticker:'OFFICE JOKES',title:'ההומור של המשרד',text:'קפה, קוד והבדיחות מהמשרד. רעיון משותף אחד שמחבר את כולם, עם מקום ללוגו.'},
   {asset:'/party-crew.webp',alt:'חבורה חוגגת בחולצות מעוצבות בהתאמה אישית',sticker:'TEAM DAY',title:'יום גיבוש שנשאר',text:'ריצת צוות, אירוע חברה או חופשת צוות. עיצוב אחד, כמות גמישה עד 100 חולצות.'},
  ],
  ideasTitle:'רעיונות שעובדים לצוותים',
  ideas:['☕ קפה, קוד והבדיחות','🚀 יום גיבוש','🏃 ריצת צוות','🎉 אירוע חברה','🧢 הצוות כנבחרת'],
  packIndex:3,
  showSingleShirt:false,
  packagesTitle:['חבילת הצוות.','הוסיפו את כולם.'],
  faq:[['אפשר לשלב את הלוגו של החברה?','כן. מעלים את הלוגו בטופס יחד עם התמונות, ואנחנו משלבים אותו בעיצוב לצד האנשים. העיצוב מגיע אליכם לאישור לפני ההדפסה.'],['אנחנו צוות גדול. יש מחיר לכמות?','בטופס בוחרים כל כמות עד 100 חולצות, והמחיר לחולצה יורד לפי מדרגות הכמות שמוצגות שם. מעל 100 חולצות כתבו לנו ב־WhatsApp ונתאים הצעה.'],LEAD_TIME_Q],
 },
 custom:{
  examplesTitle:['ככה זה יכול להיראות','באירוע שלכם.'],
  examplesIntro:'מסיבת סיום, טיול, בר מצווה או סתם רעיון טוב. הדמיות להמחשת הכיוון.',
  examples:[
   {asset:'/party-crew.webp',alt:'חבורה חוגגת בחולצות מעוצבות בהתאמה אישית',sticker:'ANY OCCASION',title:'כל אירוע הוא סיבה',text:'מסיבת סיום, הטיול השנתי או מפגש של חברים ותיקים. ספרו לנו מה חוגגים.'},
   {asset:'/shirts.webp',alt:'חולצות עם עיצובים אישיים: יום הולדת, כלת דיסקו וכלב אסטרונאוט',sticker:'YOUR IDEA',title:'הרעיון שלכם',text:'פורטרט מצחיק, כרזת סרט או בדיחה שרק אתם מבינים. גם הכלב יכול להיות אסטרונאוט.'},
   {asset:'/statement-family-fixed.webp',alt:'משפחה מחייכת בחולצות תואמות',sticker:'TOGETHER',title:'מפגש שכולם זוכרים',text:'חולצות תואמות לחופשה משפחתית או למפגש מחזור. העיצוב נולד מהתמונות שלכם.'},
  ],
  ideasTitle:'רעיונות שעובדים לכל אירוע',
  ideas:['🎓 מסיבת סיום','✈️ הטיול השנתי','♡ בר או בת מצווה','🏖️ חופשה משפחתית','🎤 מסיבת פרישה'],
  packIndex:4,
  showSingleShirt:true,
  packagesTitle:['בוחרים כמות.','אנחנו מעצבים.'],
  faq:[COLORS_Q,LEAD_TIME_Q],
 },
};
