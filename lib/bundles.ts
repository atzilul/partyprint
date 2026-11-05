import {unitPriceFor} from './pricing';
import {INDIVIDUAL_DESIGN_SURCHARGE} from './catalog';
import type {Pricing} from './pricing';
import type {HomeFaqItem} from './home-faq';

/**
 * Bundles for large orders (/bundle-sale). A bundle is not a separate product: its price
 * is the quantity tier of the same size, so every page and the request form quote the
 * same amount for the same number of shirts.
 */
export const BUNDLE_SIZES=[25,50,100] as const;
export const BUNDLE_MIN:number=BUNDLE_SIZES[0];
export const BUNDLE_MAX:number=BUNDLE_SIZES[BUNDLE_SIZES.length-1];
export type Bundle={size:number;unit:number;total:number;saving:number};
export type BundleOffers={regular:number;bundles:Bundle[]};
const money=(value:number)=>Math.round(value*100)/100;
/** Each bundle's price, and what it saves against the per-shirt price just below the first bundle. */
export function bundleOffers(pricing:Pricing):BundleOffers{
 const regular=unitPriceFor(pricing,BUNDLE_MIN-1);
 return {regular,bundles:BUNDLE_SIZES.map(size=>{const unit=unitPriceFor(pricing,size);return {size,unit,total:money(unit*size),saving:Math.max(0,money((regular-unit)*size))};})};
}
/** The bundle a quantity falls in, if any. */
export function bundleFor(quantity:number):number|null{
 let found:number|null=null;
 for(const size of BUNDLE_SIZES)if(quantity>=size)found=size;
 return found;
}
export const shekels=(value:number)=>value.toLocaleString('he-IL');
/** The searches this page answers; also its keywords metadata. */
export const BUNDLE_KEYWORDS=['חולצות מודפסות בכמויות','הדפסה על חולצות בכמות גדולה','חולצות בעיצוב אישי לקבוצות','חולצות לגן','חולצות סוף שנה לגן','חולצות מחזור','חולצות לבית ספר','חולצות לטיול שנתי','חולצות לחברה','חולצות ממותגות לעובדים','חולצות ליום גיבוש','הדפסת לוגו על חולצות','חולצות סוף מסלול','חולצות לחיילים','חולצות פלוגה','חולצות לתנועת נוער','חולצות למחנה קיץ','חולצות לקבוצת ריצה','חולצות לאירועים'];
/** Who orders in bulk, each under the words people search for, with the guide that goes deeper. */
export const BUNDLE_AUDIENCES:{icon:string;chip:string;title:string;text:string;guide?:{slug:string;label:string};
 /** The answer page (lib/bundle-answers.ts) that prices this audience. */
 answer?:string}[]=[
 {icon:'🧸',chip:'גנים',title:'חולצות לגן ולסוף שנה',text:'חולצות מודפסות לגן, לצהרון ולמסיבת סוף השנה: כל הילדים באיור אחד, עם שם הגן והשנה. מידות ילדים מגיל 2, ומידות מבוגרים לצוות הגן באותה הזמנה.',answer:'חולצות-לגן-מחיר'},
 {icon:'🎒',chip:'בתי ספר',title:'חולצות מחזור ולבית ספר',text:'חולצות מחזור לסוף י״ב, חולצות לטיול שנתי, ליום ספורט או למשלחת. שכבה שלמה באותו הדפס, עם השמות, הבדיחות והסמל שלכם.',answer:'חולצות-מחזור-מחיר'},
 {icon:'💻',chip:'הייטק',title:'חולצות לחברות הייטק',text:'חולצות ליום גיבוש, להאקתון או להשקה: עיצוב עם האנשים וההומור של החברה, והלוגו במקום הנכון.',guide:{slug:'חולצה-לצוות-ולעסק',label:'חולצה לצוות ולעסק'},answer:'חולצות-לעובדים-מחיר'},
 {icon:'🏢',chip:'מקומות עבודה',title:'חולצות ממותגות לעובדים',text:'חולצות ממותגות לכנס, לנופש חברה או ליום כיף, עם הדפסת לוגו ועיצוב אחד לכולם. משלוח אחד לכתובת של המשרד.',guide:{slug:'מתנות-לעובדים',label:'מתנות לעובדים'},answer:'חולצות-לעובדים-מחיר'},
 {icon:'🪖',chip:'חיילים',title:'חולצות סוף מסלול לחיילים',text:'חולצות סוף מסלול, חולצות פלוגה, מחזור או צוות: הסמל, הכינויים והמשפטים שרק אתם מבינים, על חולצה.',guide:{slug:'הדפסה-על-חולצות-צבא',label:'הדפסה על חולצות צבא'},answer:'חולצות-סוף-מסלול-מחיר'},
 {icon:'⛺',chip:'תנועות נוער',title:'חולצות לתנועות נוער',text:'חולצות לשבט, לקן, לגרעין או למחנה קיץ, במידות ילדים, נוער ומבוגרים באותה הזמנה. חולצה שממשיכים ללבוש גם אחרי.',answer:'חולצות-לתנועת-נוער-מחיר'},
 {icon:'🏃',chip:'קהילות',title:'חולצות לקבוצות ולאירועים',text:'חולצות לקבוצת ריצה, למקהלה, לעמותה או לאירוע גדול. כולם באותו עיצוב ובאותו צבע.',guide:{slug:'חולצות-לאירועים',label:'חולצות לאירועים'},answer:'חולצות-לקבוצת-ספורט-מחיר'},
];
/** The questions a large group asks, with the prices that are in force. */
export function bundleFaq(pricing:Pricing):HomeFaqItem[]{
 const [small,medium,large]=bundleOffers(pricing).bundles,per=(bundle:Bundle)=>shekels(bundle.unit)+' ₪ לחולצה';
 return [
  ['מה זה BUNDLE SALE של PARTYPRINT?','באנדלים של חולצות מודפסות בעיצוב אישי להזמנות גדולות: מ־'+small.size+' חולצות '+per(small)+', מ־'+medium.size+' חולצות '+per(medium)+', וב־'+large.size+' חולצות '+per(large)+'. המחיר כולל עיצוב אישי אחד לכל הקבוצה, הדפסה ומשלוח.'],
  ['כמה עולה להדפיס '+small.size+', '+medium.size+' או '+large.size+' חולצות?',small.size+' חולצות עולות '+shekels(small.total)+' ₪ ('+per(small)+'), '+medium.size+' חולצות עולות '+shekels(medium.total)+' ₪ ('+per(medium)+'), ו־'+large.size+' חולצות עולות '+shekels(large.total)+' ₪ ('+per(large)+'). המחיר כולל עיצוב אישי אחד, הדפסה ומשלוח, ומחיר סופי מאושר איתכם לפני התשלום.'],
  ['חייבים להזמין בדיוק '+small.size+', '+medium.size+' או '+large.size+' חולצות?','לא. המחיר נקבע לפי הכמות: מ־'+small.size+' חולצות '+per(small)+', מ־'+medium.size+' חולצות '+per(medium)+', וב־'+large.size+' חולצות '+per(large)+'. בטופס בוחרים כל כמות עד '+large.size+', והמחיר מתעדכן מיד.'],
  ['למי מתאימה הזמנה של חולצות בכמות גדולה?','לגנים ולצהרונים, לבתי ספר ולשכבות, לחברות הייטק ולמקומות עבודה, לחיילים וליחידות, לתנועות נוער, לקבוצות ספורט ולכל קבוצה של '+small.size+' איש ומעלה שרוצה עיצוב אחד לכולם.'],
  ['אפשר לשלב מידות ילדים ומבוגרים באותה הזמנה?','כן. מידות ילדים מגיל 2 עד 18 ומידות מבוגרים S עד XL, באותה הזמנה ובאותו עיצוב. זה מתאים לחולצות לגן, לבית ספר ולתנועת נוער, שבהן הילדים והצוות לובשים אותו הדפס.'],
  ['אפשר לשלב לוגו של הגן, בית הספר או החברה?','כן. מעלים את הלוגו בטופס יחד עם התמונות והרעיון, ואנחנו משלבים אותו בעיצוב. העיצוב מגיע אליכם לאישור לפני ההדפסה.'],
  ['באילו צבעי חולצה אפשר לבחור?','לבן, שחור או אפור, ואפשר לערבב בין החולצות באותה הזמנה. העיצוב נשאר אותו עיצוב על כל הצבעים.'],
  ['איך אוספים מידות מקבוצה גדולה?','שולחים את הפנייה עם הכמות, ואת המידות משלימים אחר כך. מרכזים רשימה אחת של מידות וצבעים, ושולחים לנו ב־WhatsApp עם מספר הפנייה.'],
  ['אפשר עיצוב שונה לכל חולצה?','הבאנדל כולל עיצוב אחד לכל הקבוצה. עיצוב אישי לכל חולצה, למשל פורטרט לכל אחד, אפשרי בחבילת הצוות בתוספת '+INDIVIDUAL_DESIGN_SURCHARGE+' ₪ לחולצה. בוחרים את החבילה ואת האפשרות בטופס.'],
  ['כמה זמן מראש כדאי להזמין?','המשלוח הוא עד 5 ימי עסקים אחרי אישור העיצוב, ההזמנה והתשלום, וזמן העיצוב והתיקונים לא כלול בו. בהזמנה גדולה גם איסוף המידות לוקח זמן, ולכן מומלץ לשלוח פנייה לפחות שבועיים לפני האירוע. המועד מתואם איתכם לפי הכתובת וגודל ההזמנה.'],
  ['אנחנו יותר מ־'+large.size+'. מה עושים?','כתבו לנו ב־WhatsApp עם הכמות והתאריך, ונחזור אליכם עם הצעה מותאמת.'],
 ];
}
