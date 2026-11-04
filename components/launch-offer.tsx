'use client';
import {createPortal} from 'react-dom';
import {useEffect,useLayoutEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {paidCampaignOffer} from '@/lib/campaign-offer';
type Promo={text:string;code:string;paid:boolean};
// Paid visitors get the coupon applied automatically in the form, so the banner
// says so instead of asking them to type the code. Same session rule as the form.
function paidSession(){let eligible=paidCampaignOffer(location.href);try{if(eligible)sessionStorage.setItem('partyprint-paid-offer','1');else eligible=sessionStorage.getItem('partyprint-paid-offer')==='1';}catch{}return eligible;}
export default function LaunchOffer(){
 const pathname=usePathname();
 const [target,setTarget]=useState<HTMLElement|null>(null);
 const [promo,setPromo]=useState<Promo|null>(null);
 useEffect(()=>{let active=true;const slot=document.getElementById('launch-offer-slot');setTarget(slot);setPromo(null);if(!slot)return;void fetch('/api/promo',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<{text?:unknown;code?:unknown}>:null).then(value=>{if(active&&typeof value?.text==='string'){const text=value.text.replace(/(?:\s*[·•|–—-]\s*)?עיצוב אישי לקבוצה שלכם(?:\s*[·•|–—-]\s*)?/g,' ').replace(/\s+/g,' ').trim();const code=typeof value.code==='string'?value.code:'';if(text||code)setPromo({text,code,paid:paidSession()});}}).catch(()=>{});return()=>{active=false;};},[pathname]);
 useLayoutEffect(()=>{const node=target?.closest('.topbar');node?.classList.toggle('has-launch-offer',!!promo);return()=>node?.classList.remove('has-launch-offer');},[target,promo]);
 if(!target||!promo)return null;
 return createPortal(<a className={'launch-offer'+(promo.paid?' launch-offer-auto':'')} href="#order">{promo.text&&<span>{promo.text}</span>}{promo.code&&<><small>{promo.paid?'מוחלת אוטומטית בטופס ·':'עם הקוד'}</small><b dir="ltr">{promo.code}</b></>}</a>,target);
}
