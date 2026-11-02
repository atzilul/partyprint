// A click id alone is not proof of a paid campaign. The URL selects eligibility
// only; the active coupon and its amount/constraints always come from the server.
export function paidCampaignOffer(url:string){try{const p=new URL(url).searchParams;return !!p.get('utm_source')&&['cpc','ppc','paid','paid_social','paid-social','paidsocial','display','cpm'].includes((p.get('utm_medium')||'').toLowerCase())}catch{return false}}
