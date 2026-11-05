import type {LandingVariantKey} from './landing-variants';
import type {HomeFaqItem} from './home-faq';

/**
 * Copy for the "home page for one audience" landing pages (components/landing-home.tsx).
 * The page keeps the home page's visual language and section rhythm; everything it
 * says is about one audience. Crops describe which part of an artwork a frame shows.
 */
/** A zoomed view of an artwork: the point (x%, y%) is centred and magnified by scale. */
export type Crop={x:number;y:number;scale:number};
export type LandingHomeContent={
 accent:'family'|'bride'|'groom'|'team'|'custom';
 packIndex:number;
 mode:'order'|'custom';
 nav:{examples:string;price:string;confidence:string};
 hero:{lead:string;pre:string;headline:string;desc:string;chips:string[];cta:string;priceNote:string;facts:string[];english:string;caption:string};
 /** One artwork tells the whole story: faces (the photos they send), the print (the design), the group (the result). */
 story:{asset:string;alt:string;faces:Crop[];print:Crop;chatTitle:string;chatMembers:string;chatMessage:string;chatPhotos:string;steps:[string,string,string];designTag:string;stamp:string};
 /** The same journey for one person, shown inside the machine: her selfie, her illustration, the shirt on her. */
 machine:{asset:string;face:Crop;art:Crop;worn:Crop;faceAlt:string;artAlt:string;wornAlt:string};
 ticker:string[];
 how:{eyebrow:string;title:[string,string];intro:string[];steps:{short:string;text:string}[];brief:{label:string;lines:string[];bold:string;chips:string[]};fileChip:string;stamp:string;delivery:string;note:string;terms:string};
 inspo:{eyebrow:string;title:[string,string];intro:string[];asset:string;alt:string;crop?:Crop;stamp:string;tag:string;lines:string[];accent:string;text:string;ideas:string[];link:string;caption:string};
 examples:{eyebrow:string;title:[string,string];intro:string[];cards:{asset:string;alt:string;crop?:Crop;sticker:string;title:string;text:string}[];caption:string};
 packages:{eyebrow:string;title:[string,string];intro:string[];includes:string[];button:string;ladderTitle:string;ladderHere:string;sideTitle:string;side:{title:string;text:string}[];foot:string};
 confidence:{eyebrow:string;title:[string,string];intro:string[];summaryTag:string;summaryTitle:string;summaryText:string;summaryBold:string;checks:string[];cards:{title:string;text:string}[];contactTitle:string;contactText:string};
 statement:{asset:string;alt:string;tag:string;lines:string[];accent:string;link:string};
 order:{title:[string,string];text:string;points:string[];help:string};
 contact:{title:[string,string];text:string[]};
 trust:{title:string;text:string}[];
 faq:HomeFaqItem[];
 sticky:{title:string;text:string;button:string};
};

const LEAD_TIME_Q:HomeFaqItem=['כמה זמן לפני המסיבה כדאי לשלוח פנייה?','המשלוח הוא עד 5 ימי עסקים אחרי אישור העיצוב, ההזמנה והתשלום, וזמן העיצוב והתיקונים לא כלול בו. לכן מומלץ לשלוח פנייה לפחות שבועיים לפני המסיבה. אם היא קרובה יותר, כתבו את התאריך בטופס ונבדוק יחד מה אפשרי.'];

export const LANDING_HOME_CONTENT:Partial<Record<LandingVariantKey,LandingHomeContent>>={
 bride:{
  accent:'bride',
  packIndex:1,
  mode:'order',
  nav:{examples:'דוגמאות לחברות',price:'כמה זה עולה?',confidence:'מזמינות בראש שקט'},
  hero:{
   lead:'הכלה והחברות.',
   pre:'בגרסת',
   headline:'האיקוניות',
   desc:'שולחות תמונות של החבורה ומשפט אחד על הכלה. אנחנו הופכים אתכן להדפס אחד, נוצץ ומצחיק, שכולכן לובשות בערב שלה. בלי ״כלה לעתיד״ בפונט מתולתל.',
   chips:['🪩 כלת הדיסקו','💍 ONE LAST FLING','🍸 הקוקטייל של כל אחת','+ הבדיחה שלכן'],
   cta:'עצבו לכלה ולחברות',
   priceNote:'לחולצה, לחבורה של שש',
   facts:['כולל עיצוב אישי, הדפסה ומשלוח','מאשרות לפני שמדפיסים','אין חיוב בשליחת הטופס'],
   english:'CITY GIRLS.',
   caption:'הדמיית AI • עיצוב אישי למסיבת הרווקות שלכן',
  },
  story:{
   asset:'/bride-shared-v2.webp',
   alt:'שש חברות בחולצות עם הדפס משותף של כל החבורה',
   faces:[{x:24,y:18.5,scale:3.6},{x:49.5,y:20.5,scale:3.6},{x:77,y:26.5,scale:3.6}],
   print:{x:53.5,y:75.2,scale:4.5},
   chatTitle:'הרווקות של נועה 💍',
   chatMembers:'שש חברות, כלה אחת',
   chatMessage:'זאת נועה והחבורה. היא אוהבת דיסקו ושונאת קלישאות. תפתיעו אותנו 🪩',
   chatPhotos:'📷 6 תמונות נשלחו',
   steps:['שולחות תמונות','אנחנו מעצבים','כולן לובשות'],
   designTag:'AI + מגע אנושי',
   stamp:'מאושר להדפסה',
  },
  machine:{
   asset:'/bride-city.webp',
   face:{x:49.5,y:20.5,scale:3.3},
   art:{x:47.5,y:40.8,scale:4.7},
   worn:{x:50,y:38,scale:1.5},
   faceAlt:'סלפי של אחת החברות',
   artAlt:'האיור שנוצר מהסלפי, עם כדור דיסקו',
   wornAlt:'החברות לובשות את החולצות עם האיורים שלהן',
  },
  ticker:['מסיבת רווקות','ONE LAST FLING','כלת הדיסקו','צוות הכלה','SIX IN THE CITY','לילה אחד בעיר'],
  how:{
   eyebrow:'FROM THE GROUP CHAT TO THE DANCE FLOOR',
   title:['מהקבוצה בוואטסאפ.','לרחבה.'],
   intro:['שולחות תמונות ורעיון.','אנחנו מעצבים, אתן מאשרות,','והחולצות מגיעות עד הבית.'],
   steps:[
    {short:'שולחות תמונות',text:'סלפי של כל אחת או תמונה של כל החבורה. כן, גם ההיא מהטיול ביוון.'},
    {short:'מספרות על הכלה',text:'״נועה. אוהבת דיסקו. מאחרת לכל מקום. תעשו ממנה אגדה.״ זה לגמרי בריף.'},
    {short:'מאשרות את העיצוב',text:'אנחנו הופכים את החבורה לאיור אחד, עם AI ומגע אנושי. אתן מאשרות לפני שמדפיסים.'},
    {short:'מקבלות עד הדלת',text:'אחרי אישור העיצוב וההזמנה, מדפיסים ושולחים. נשאר רק להתלבש ולהרים.'},
   ],
   brief:{label:'THE BRIEF /',lines:['נועה מתחתנת.','אוהבת דיסקו.'],bold:'תעשו מאיתנו אגדה.',chips:['🪩 דיסקו','💍 רווקות']},
   fileChip:'squad.jpg',
   stamp:'מאושר להדפסה',
   delivery:'עד הדלת שלכן',
   note:'התמונות להמחשה • אתן תמיד מאשרות לפני שמדפיסים',
   terms:'* העיצוב כולל סבב תיקונים אחד. כל סבב תיקונים נוסף כרוך בתשלום נוסף של 100 ₪.',
  },
  inspo:{
   eyebrow:'BORING BRIDE SHIRTS? NOT INVITED.',
   title:['תשכחו מ״כלה לעתיד״.','תחשבו אופי.'],
   intro:['הופכים את הכלה ואת החברות','ליצירת אמנות שאפשר ללבוש.'],
   asset:'/shirts.webp',
   alt:'חולצה עם פורטרט של כלה במשקפי לב, כדור דיסקו והכיתוב Disco Bride',
   crop:{x:17.7,y:41.5,scale:2.45},
   stamp:'DISCO BRIDE ✳',
   tag:'הרעיון שלכן יכול להיות הכול',
   lines:['הכלה ככוכבת פופ?','החברות כלהקת בנות?'],
   accent:'ברור שכן.',
   text:'פורטרט נוצץ, פוסטר של הסרט שלכן או הבדיחה מהקבוצה בוואטסאפ. יוצרים במיוחד בשבילכן, מהתמונות ומהסיפור שלכן.',
   ideas:['🪩 כלת הדיסקו','💍 ONE LAST FLING','🍸 הקוקטייל של כל אחת','✈️ הטיסה של הכלה','👯 צוות הכלה, עם תפקידים','📸 הפוסטר של הסרט שלכן'],
   link:'יש לנו כבר רעיון',
   caption:'התמונות בעמוד הן הדמיות AI להמחשת אפשרויות העיצוב.',
  },
  examples:{
   eyebrow:'YOUR SQUAD. OUR DESIGN.',
   title:['שש חברות. הדפס אחד.','אפס קלישאות.'],
   intro:['שלושה כיוונים לאותה חבורה.','העיצוב שלכן ייוולד מהתמונות','ומהבדיחות שלכן.'],
   cards:[
    {asset:'/bride-shared-v2.webp',alt:'שש חברות בחולצות עם הדפס SIX IN THE CITY',sticker:'SIX IN THE CITY',title:'כל החבורה באיור אחד',text:'שש חברות, שקיעה מעל העיר וכדור דיסקו. אותו הדפס על כולן, והכלה במרכז.'},
    {asset:'/bride-city.webp',alt:'שש חברות על גג בעיר בחולצות עם פורטרטים נוצצים',sticker:'DISCO BRIDE',title:'פורטרט לכל אחת',text:'כל חברה מקבלת את הפנים שלה בסגנון פופ נוצץ. כולן באותו לוק, ואף אחת לא אותו דבר.'},
    {asset:'/review-shirts-v1.webp',alt:'חולצה לבנה עם איור של שש חברות, כדור דיסקו והכיתוב ONE LAST FLING',crop:{x:15.6,y:50,scale:2.05},sticker:'ONE LAST FLING',title:'הבדיחה שרק אתן מבינות',text:'השם של הקבוצה בוואטסאפ, המשפט מהטיול, הקוקטייל הקבוע. ספרו לנו, וזה נכנס להדפס.'},
   ],
   caption:'הדמיות להשראה. העיצוב שלכן ייווצר במיוחד מהתמונות ומהבריף שלכן.',
  },
  packages:{
   eyebrow:'BRIDE SQUAD',
   title:['החבילה לכלה ולחברות.','הוסיפו את כולן.'],
   intro:['המחיר מוצג גם לפי חולצה.','כולל עיצוב אישי, הדפסה ומשלוח עד הבית.','ככל שמצטרפות עוד חברות, המחיר לחולצה יורד.'],
   includes:['עיצוב משותף אישי לכל החבורה','הדפסה ומשלוח עד הדלת','אישור שלכן לפני הדפסה'],
   button:'זאת החבילה שלנו',
   ladderTitle:'עוד חברה מצטרפת? המחיר לחולצה יורד',
   ladderHere:'אתן כאן',
   sideTitle:'מה חשוב לדעת לפני שסוגרות',
   side:[
    {title:'אחת מארגנת, כולן מרוויחות',text:'ממלאת את הטופס פעם אחת. את המידות של כולן אפשר להשלים אחר כך, גם בוואטסאפ.'},
    {title:'הכלה במרכז',text:'העיצוב המשותף בנוי סביבה. רוצות גרסה נפרדת רק לה? כתבו ברעיון ונחזור עם הצעה.'},
    {title:'לבן, שחור או אפור',text:'בוחרות צבע ומידה לכל חולצה. אפשר לערבב, העיצוב נשאר אותו עיצוב.'},
   ],
   foot:'* המחיר מחושב לפי מדרגת הכמות וכולל עיצוב אישי משותף, הדפסה ומשלוח עד הבית. נשלח לכן מחיר סופי לאישור לפני התשלום. עיצובים נוספים יתומחרו בנפרד.',
  },
  confidence:{
   eyebrow:'הפתעה לכלה. בהירות בהזמנה.',
   title:['הכול ברור.','לפני שמדפיסים.'],
   intro:['אתן יודעות מה מזמינות,','מי מעצב ומה השלב הבא.'],
   summaryTag:'מה מקבלות?',
   summaryTitle:'חבילה שלמה, בלי הפתעות.',
   summaryText:'המחיר לחולצה כולל עיצוב משותף אחד, הדפסה ומשלוח עד הבית.',
   summaryBold:'ככל שמזמינות יותר חולצות, המחיר לחולצה יורד.',
   checks:['סבב תיקונים אחד כלול','אתן מאשרות לפני הדפסה','אין חיוב בשליחת הטופס'],
   cards:[
    {title:'מתחילות בלי חיוב',text:'הטופס שולח בקשת הזמנה או התייעצות. מסכמים מחיר ותנאי תשלום לפני תחילת העבודה.'},
    {title:'רואות. מדייקות. מאשרות.',text:'אנחנו מעצבים מהתמונות ומהרעיון שלכן. מדפיסים רק אחרי שאישרתן את העיצוב.'},
    {title:'התיקונים ברורים מראש',text:'עיצוב משותף אחד לחבילה וסבב תיקונים אחד כלולים. כל סבב נוסף: 100 ₪.'},
    {title:'מתאמות לפי המסיבה',text:'עד 5 ימי עסקים למשלוח לאחר אישור העיצוב, ההזמנה והתשלום. המועד כפוף לאישור מראש; זמן העיצוב אינו כלול.'},
   ],
   contactTitle:'יש לכן שאלה? יש עם מי לדבר.',
   contactText:'התייעצות, אישור עיצוב ועדכונים, הכול באותה שיחת WhatsApp עם PARTYPRINT.',
  },
  statement:{
   asset:'/bride-city.webp',
   alt:'שש חברות חוגגות על גג בעיר בחולצות תואמות',
   tag:'WEAR YOUR SQUAD.',
   lines:['יותר נוצץ.','יותר מצחיק.'],
   accent:'יותר אתן.',
   link:'טוב, אנחנו בפנים',
  },
  order:{
   title:['אתן מביאות את הכלה.','אנחנו את העיצוב.'],
   text:'מתמונה, בדיחה או סיפור של החבורה, לחולצה עם אופי. משאירות פנייה, וממשיכים יחד.',
   points:['עיצוב אישי עם AI ומגע אנושי','אתן רואות ומאשרות לפני הדפסה','הדפסה ומשלוח עד הבית כלולים במחיר'],
   help:'מעדיפות לדבר קודם?',
  },
  contact:{
   title:['משנות משהו?','אנחנו כאן.'],
   text:['עוד חברה הצטרפה, מידה אחרת או תמונה חדשה.','שלחו לנו ב־WhatsApp את מספר הפנייה, המידות החדשות או התמונה המעודכנת. שינוי לאחר אישור ההדפסה כפוף לאפשרות הביצוע.'],
  },
  trust:[
   {title:'משלוח מהיר עד 5 ימי עסקים*',text:'לאחר אישור עיצוב, הזמנה ותשלום'},
   {title:'מעצבים במיוחד בשבילכן',text:'רעיון שלכן. ביצוע שלנו.'},
   {title:'אתן מאשרות לפני הדפסה',text:'כולל סבב תיקונים אחד'},
  ],
  faq:[
   ['אפשר עיצוב שונה לכלה?','החבילה כוללת עיצוב משותף אחד לכל החבורה, ובדרך כלל הכלה מקבלת בו מקום מרכזי. גרסה נפרדת לכלה היא עיצוב נוסף שמתומחר בנפרד. כתבו את זה ברעיון, ונחזור אליכן עם הצעה לפני שמתחילים.'],
   ['איזו תמונה כדאי לשלוח?','תמונה ברורה של הפנים, באור טוב, בלי משקפי שמש אם אפשר. סלפי מהטלפון מספיק. אפשר לצרף עד 10 תמונות, ואנחנו בוחרים איתכן את הכיוון.'],
   LEAD_TIME_Q,
  ],
  sticky:{title:'מסיבת רווקות בדרך?',text:'עיצוב אחד לכל החברות',button:'עצבו לנו'},
 },
};
