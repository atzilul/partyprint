/**
 * First-touch traffic attribution that travels with a saved contact or request,
 * so the studio can tell which campaign, ad set and ad produced each enquiry.
 * Values are short opaque strings supplied by the browser; they are allowlisted
 * by key, length-limited and never trusted beyond reporting.
 */
export const ATTRIBUTION_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','fbc','fbp','landing_path','referrer','first_seen_at'] as const;
export type AttributionKey=typeof ATTRIBUTION_KEYS[number];
export type Attribution=Partial<Record<AttributionKey,string>>;
export const ATTRIBUTION_STORAGE_KEY='partyprint-attribution-v1';

function cleanValue(value:unknown){
 if(typeof value!=='string')return '';
 const clean=value.replace(/[\u0000-\u001f\u007f<>"'`\\]/g,'').trim().slice(0,200);
 return clean.includes('@')?'':clean;
}
/** Accepts an object or its JSON string; returns only known keys with safe values. */
export function parseAttribution(value:unknown):Attribution|undefined{
 let raw=value;
 if(typeof raw==='string'){if(raw.length>4000)return undefined;try{raw=JSON.parse(raw);}catch{return undefined;}}
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return undefined;
 const input=raw as Record<string,unknown>,out:Attribution={};
 for(const key of ATTRIBUTION_KEYS){const clean=cleanValue(input[key]);if(clean)out[key]=clean;}
 return Object.keys(out).length?out:undefined;
}
/** One human line for emails and the admin panel: "facebook / paid / bride_nov / video_01". */
export function describeAttribution(value?:Attribution|null):string{
 if(!value)return 'direct';
 if(value.utm_source)return [value.utm_source,value.utm_medium,value.utm_campaign,value.utm_content,value.utm_term].filter(Boolean).join(' / ');
 if(value.fbclid||value.fbc)return 'facebook / click';
 if(value.gclid)return 'google / click';
 if(value.referrer){try{return 'organic / '+new URL(value.referrer).hostname;}catch{return 'organic / '+value.referrer;}}
 return 'direct';
}
/** Longer multi-line version for the plain-text email and the order summary. */
export function attributionLines(value?:Attribution|null):string[]{
 if(!value)return ['מקור: direct'];
 const lines=['מקור: '+describeAttribution(value)];
 if(value.landing_path)lines.push('דף נחיתה: '+value.landing_path);
 if(value.first_seen_at)lines.push('ביקור ראשון: '+value.first_seen_at);
 if(value.fbclid||value.fbc)lines.push('מזהה קליק מטא: '+(value.fbclid||value.fbc));
 if(value.gclid)lines.push('מזהה קליק גוגל: '+value.gclid);
 return lines;
}
