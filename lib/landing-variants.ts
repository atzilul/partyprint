export const LANDING_VARIANT_COOKIE='partyprint_variant_v1';
export const LANDING_VARIANT_KEYS=['family','bride','groom','team','custom'] as const;
export type LandingVariantKey=(typeof LANDING_VARIANT_KEYS)[number];
export type LandingVariantCopy={index:number;title:string;description:string;ogImage:string;ogAlt:string};
export const LANDING_VARIANTS:Record<LandingVariantKey,LandingVariantCopy>={
 family:{index:0,title:'חולצות בעיצוב אישי ליום הולדת משפחתי | PARTYPRINT',description:'הופכים את יום ההולדת המשפחתי לחולצות בעיצוב אישי, בהשראת התמונות והרעיון שלכם.',ogImage:'/og-default.jpg',ogAlt:'משפחה בחולצות יום הולדת בעיצוב אישי של PARTYPRINT'},
 bride:{index:1,title:'חולצות בעיצוב אישי למסיבת רווקות | PARTYPRINT',description:'חולצות למסיבת רווקות בעיצוב אישי לכלה ולחברות, בהשראת הסיפור והסטייל שלכן.',ogImage:'/og-bride.jpg',ogAlt:'חברות חוגגות במסיבת רווקות בחולצות בעיצוב אישי של PARTYPRINT'},
 groom:{index:2,title:'חולצות בעיצוב אישי למסיבת רווקים | PARTYPRINT',description:'חולצות למסיבת רווקים בעיצוב אישי לחתן ולחבר׳ה, לפי הבדיחות והסיפור של הקבוצה.',ogImage:'/og-groom.jpg',ogAlt:'חברים במסיבת רווקים בחולצות בעיצוב אישי של PARTYPRINT'},
 team:{index:3,title:'חולצות בעיצוב אישי לצוותים | PARTYPRINT',description:'חולצות צוות בעיצוב אישי, עם האנשים, ההומור והאופי שמייחדים את הצוות שלכם.',ogImage:'/og-team.jpg',ogAlt:'צוות בחולצות תואמות בעיצוב אישי של PARTYPRINT'},
 custom:{index:4,title:'חולצות בעיצוב אישי לכל אירוע | PARTYPRINT',description:'יש לכם רעיון לאירוע? הופכים תמונות, בדיחות ורגעים שלכם לחולצות בעיצוב אישי.',ogImage:'/og-custom.jpg',ogAlt:'חברים חוגגים בחולצות בעיצוב אישי של PARTYPRINT'}
};
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
