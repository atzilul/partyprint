export const LANDING_VARIANT_COOKIE='partyprint_variant_v1';
export const LANDING_VARIANT_KEYS=['family','bride','groom','team','custom'] as const;
export type LandingVariantKey=(typeof LANDING_VARIANT_KEYS)[number];
export type LandingVariantCopy={index:number;title:string;description:string;ogImage:string;ogAlt:string;points:[string,string,string]};
export const LANDING_VARIANTS:Record<LandingVariantKey,LandingVariantCopy>={
 family:{index:0,title:'חולצות בעיצוב אישי ליום הולדת משפחתי | PARTYPRINT',description:'הופכים את יום ההולדת המשפחתי לחולצות בעיצוב אישי, בהשראת התמונות והרעיון שלכם.',ogImage:'/og-default.jpg',ogAlt:'משפחה בחולצות יום הולדת בעיצוב אישי של PARTYPRINT',points:['עיצוב מהתמונות של החוגג ושל כל המשפחה','מידות ילדים ומבוגרים באותה הזמנה','אתם מאשרים את העיצוב לפני ההדפסה']},
 bride:{index:1,title:'חולצות בעיצוב אישי למסיבת רווקות | PARTYPRINT',description:'חולצות למסיבת רווקות בעיצוב אישי לכלה ולחברות, בהשראת הסיפור והסטייל שלכן.',ogImage:'/og-bride.jpg',ogAlt:'חברות חוגגות במסיבת רווקות בחולצות בעיצוב אישי של PARTYPRINT',points:['עיצוב אחד לכל החברות, עם קריצה לכלה','כל כמות מ־4 חולצות, המחיר לחולצה יורד ככל שמוסיפים','אתן מאשרות את העיצוב לפני ההדפסה']},
 groom:{index:2,title:'חולצות בעיצוב אישי למסיבת רווקים | PARTYPRINT',description:'חולצות למסיבת רווקים בעיצוב אישי לחתן ולחבר׳ה, לפי הבדיחות והסיפור של הקבוצה.',ogImage:'/og-groom.jpg',ogAlt:'חברים במסיבת רווקים בחולצות בעיצוב אישי של PARTYPRINT',points:['הבדיחה הפנימית של החבר׳ה, בהדפס אחד משותף','כל כמות מ־4 חולצות, מחיר ברור מראש','אתם מאשרים את העיצוב לפני ההדפסה']},
 team:{index:3,title:'חולצות בעיצוב אישי לצוותים | PARTYPRINT',description:'חולצות צוות בעיצוב אישי, עם האנשים, ההומור והאופי שמייחדים את הצוות שלכם.',ogImage:'/og-team.jpg',ogAlt:'צוות בחולצות תואמות בעיצוב אישי של PARTYPRINT',points:['הצוות עצמו בעיצוב, לא רק הלוגו','מ־4 עד 100 חולצות באותה הזמנה','אישור העיצוב לפני ההדפסה, משלוח עד הבית']},
 custom:{index:4,title:'חולצות בעיצוב אישי לכל אירוע | PARTYPRINT',description:'יש לכם רעיון לאירוע? הופכים תמונות, בדיחות ורגעים שלכם לחולצות בעיצוב אישי.',ogImage:'/og-custom.jpg',ogAlt:'חברים חוגגים בחולצות בעיצוב אישי של PARTYPRINT',points:['כל אירוע, כל רעיון, עיצוב שנולד מכם','בוחרים כמות ומקבלים מחיר ברור מראש','אתם מאשרים את העיצוב לפני ההדפסה']}
};
/** Home page metadata when no audience was chosen by link or by an earlier visit: the studio as a whole, not one audience. */
export const HOME_DEFAULT_COPY:Pick<LandingVariantCopy,'title'|'description'|'ogImage'|'ogAlt'>={title:'PARTYPRINT | הדפסה על חולצות בעיצוב אישי לקבוצות ולאירועים',description:'חולצות בעיצוב אישי מתמונה ומרעיון: ימי הולדת, רווקות, רווקים וצוותים. מ־90 ₪ לחולצה כולל עיצוב, הדפסה ומשלוח. רואים ומאשרים לפני ההדפסה.',ogImage:'/og-default.jpg',ogAlt:'משפחה בחולצות יום הולדת בעיצוב אישי של PARTYPRINT'};
export function isLandingVariant(value:unknown):value is LandingVariantKey {
 return typeof value==='string'&&(LANDING_VARIANT_KEYS as readonly string[]).includes(value);
}
export function landingVariantIndex(variant:LandingVariantKey):number{return LANDING_VARIANTS[variant].index;}
export function landingVariantForPack(pack:number):LandingVariantKey {
 return LANDING_VARIANT_KEYS[Math.max(0,Math.min(4,Math.floor(Number.isFinite(pack)?pack:4)))];
}
export function resolveLandingVariant(urlValue:string|string[]|undefined,cookieValue?:string):LandingVariantKey|null {
 const candidate=Array.isArray(urlValue)?urlValue[0]:urlValue;
 if(isLandingVariant(candidate))return candidate;
 return isLandingVariant(cookieValue)?cookieValue:null;
}
