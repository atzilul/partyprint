'use client';
import {createPortal} from 'react-dom';
import {useEffect,useLayoutEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
export default function LaunchOffer(){
 const pathname=usePathname();
 const [target,setTarget]=useState<HTMLElement|null>(null);
 const [promo,setPromo]=useState<{text:string;code:string}|null>(null);
 useEffect(()=>{let active=true;const slot=document.getElementById('launch-offer-slot');setTarget(slot);setPromo(null);if(!slot)return;void fetch('/api/promo',{cache:'no-store'}).then(r=>r.ok?r.json() as Promise<{text?:unknown;code?:unknown}>:null).then(value=>{if(active&&typeof value?.text==='string'){const text=value.text.replace(/(?:\s*[·•|–—-]\s*)?עיצוב אישי לקבוצה שלכם(?:\s*[·•|–—-]\s*)?/g,' ').replace(/\s+/g,' ').trim();const code=typeof value.code==='string'?value.code:'';if(text||code)setPromo({text,code});}}).catch(()=>{});return()=>{active=false;};},[pathname]);
 useLayoutEffect(()=>{const node=target?.closest('.topbar');node?.classList.toggle('has-launch-offer',!!promo);return()=>node?.classList.remove('has-launch-offer');},[target,promo]);
 if(!target||!promo)return null;
 return createPortal(<a className="launch-offer" href="#order">{promo.text&&<span>{promo.text}</span>}{promo.code&&<><small>עם הקוד</small><b dir="ltr">{promo.code}</b></>}</a>,target);
}
