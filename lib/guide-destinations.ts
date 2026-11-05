/**
 * Where a guide's reader goes next: the audience page that sells what the guide is about,
 * and the page that answers what it costs. Guides give ideas; these pages take the order.
 */
export type GuideDestination={href:string;title:string;text:string};
const page=(href:string,title:string,text:string):GuideDestination=>({href,title,text});
const BRIDE=[
 page('/lp/bride','חולצות למסיבת רווקות','העמוד המלא: התהליך, דוגמאות, החבילה לכלה ולחברות וטופס ההזמנה.'),
 page('/prices/חולצות-למסיבת-רווקות-מחיר','כמה עולות חולצות למסיבת רווקות?','טבלת מחירים לפי מספר החברות, מה כלול ומתי להזמין.'),
];
const GROOM=[
 page('/lp/groom','חולצות למסיבת רווקים','העמוד המלא: התהליך, דוגמאות, החבילה לחתן ולחבר׳ה וטופס ההזמנה.'),
 page('/prices/חולצות-למסיבת-רווקים-מחיר','כמה עולות חולצות למסיבת רווקים?','טבלת מחירים לפי מספר החברים, מה כלול ומתי להזמין.'),
];
const FAMILY=[
 page('/lp/family','חולצות ליום הולדת משפחתי','העמוד המלא: התהליך, דוגמאות, החבילה המשפחתית וטופס ההזמנה.'),
 page('/prices/חולצות-ליום-הולדת-מחיר','כמה עולות חולצות ליום הולדת?','טבלת מחירים לפי גודל המשפחה, מידות ילדים ומבוגרים ומתי להזמין.'),
];
const TEAM=[
 page('/lp/team','חולצות לצוותים ולימי גיבוש','העמוד המלא: עיצוב אחד לכולם או עיצוב אישי לכל חולצה, המחירים וטופס ההזמנה.'),
 page('/bundle-sale/חולצות-לעובדים-מחיר','כמה עולה להדפיס חולצות לעובדים?','טבלת מחירים לפי גודל הצוות, עם לוגו, ומתי להזמין.'),
];
const SOLDIERS=[
 page('/bundle-sale','BUNDLE SALE להזמנות גדולות','באנדלים של 25, 50 ו־100 חולצות, במחיר שיורד עם הכמות.'),
 page('/bundle-sale/חולצות-סוף-מסלול-מחיר','כמה עולות חולצות סוף מסלול?','טבלת מחירים לצוות ולפלוגה, מה כלול ומתי להזמין.'),
];
const EVENTS=[
 page('/lp/custom','חולצות לכל אירוע','העמוד המלא: מסיבת סיום, טיול, בר מצווה או כל רעיון אחר, עם המחירים וטופס ההזמנה.'),
 page('/bundle-sale','BUNDLE SALE להזמנות גדולות','באנדלים של 25, 50 ו־100 חולצות, במחיר שיורד עם הכמות.'),
];
const GENERAL=[
 page('/lp/custom','חולצות בעיצוב אישי לכל רעיון','העמוד המלא: התהליך, דוגמאות, המחירים וטופס ההזמנה.'),
 page('/buyers-guide','איך בוחרים ספק להדפסת חולצות?','עשר שאלות לשאול כל ספק, והתשובות שלנו בגלוי.'),
];
const BY_GUIDE:Record<string,GuideDestination[]>={
 'חולצה-למסיבת-רווקות':BRIDE,'מתנה-למסיבת-רווקות':BRIDE,
 'חולצה-למסיבת-רווקים':GROOM,'מתנה-למסיבת-רווקים':GROOM,
 'חולצה-ליום-הולדת':FAMILY,'חולצות-לימי-הולדת':FAMILY,'מתנה-ליום-הולדת-של-הבן':FAMILY,'מתנה-ליום-הולדת-של-הבת':FAMILY,
 'חולצה-לערב-צוות':TEAM,'מתנה-לערב-צוות':TEAM,'חולצה-לצוות-ולעסק':TEAM,'מתנות-לעובדים':TEAM,
 'הדפסה-על-חולצות-צבא':SOLDIERS,
 'חולצות-לאירועים':EVENTS,'מתנות-לאירוע':EVENTS,
};
/** Every guide gets two destinations; guides without a specific audience get the general pair. */
export function destinationsForGuide(slug:string):GuideDestination[]{return BY_GUIDE[slug]||GENERAL;}
export const GUIDE_DESTINATION_SLUGS=Object.keys(BY_GUIDE);
