import {unitPriceFor} from './pricing';
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
/** The questions a large group asks, with the prices that are in force. */
export function bundleFaq(pricing:Pricing):HomeFaqItem[]{
 const [small,medium,large]=bundleOffers(pricing).bundles;
 return [
  ['חייבים להזמין בדיוק 25, 50 או 100 חולצות?','לא. המחיר נקבע לפי הכמות: מ־'+small.size+' חולצות '+shekels(small.unit)+' ₪ לחולצה, מ־'+medium.size+' חולצות '+shekels(medium.unit)+' ₪ לחולצה, וב־'+large.size+' חולצות '+shekels(large.unit)+' ₪ לחולצה. בטופס בוחרים כל כמות עד '+large.size+', והמחיר מתעדכן מיד.'],
  ['מה כלול במחיר של הבאנדל?','עיצוב אישי אחד לכל החולצות, הדפסה ומשלוח. רואים את העיצוב ומאשרים אותו לפני ההדפסה, וסבב תיקונים אחד כלול.'],
  ['אנחנו יותר מ־'+large.size+'. מה עושים?','כתבו לנו ב־WhatsApp עם הכמות והתאריך, ונחזור אליכם עם הצעה מותאמת.'],
  ['אפשר לשלב מידות ילדים ומבוגרים באותה הזמנה?','כן. מידות ילדים מגיל 2 עד 18 ומידות מבוגרים S עד XL, באותה הזמנה ובאותו עיצוב. את המידות אפשר להשלים איתנו אחרי השליחה, כשכולם עונים.'],
  ['אפשר לשלב לוגו של הגן, בית הספר או החברה?','כן. מעלים את הלוגו בטופס יחד עם התמונות והרעיון, ואנחנו משלבים אותו בעיצוב. העיצוב מגיע אליכם לאישור לפני ההדפסה.'],
  ['כמה זמן מראש כדאי להזמין?','המשלוח הוא עד 5 ימי עסקים אחרי אישור העיצוב, ההזמנה והתשלום, וזמן העיצוב והתיקונים לא כלול בו. בהזמנה גדולה גם איסוף המידות לוקח זמן, ולכן מומלץ לשלוח פנייה לפחות שבועיים לפני האירוע. המועד מתואם איתכם לפי הכתובת וגודל ההזמנה.'],
 ];
}
