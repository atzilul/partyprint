'use client';

import {createPortal} from 'react-dom';
import {useEffect,useState} from 'react';

type Promo={text:string;code:string};

export default function LaunchOffer(){
 const [target,setTarget]=useState<HTMLElement|null>(null),[promo,setPromo]=useState<Promo|null>(null),[copied,setCopied]=useState(false);
 useEffect(()=>{
  const node=document.querySelector<HTMLElement>('.topbar');
  if(!node)return;
  const reveal=window.setTimeout(()=>setTarget(node),0);
  fetch('/api/promo').then(r=>r.ok?r.json() as Promise<Promo>:null).then(v=>{if(v?.text&&v.code){node.classList.add('has-launch-offer');setPromo({text:v.text,code:v.code})}}).catch(()=>{});
  return()=>{window.clearTimeout(reveal);node.classList.remove('has-launch-offer')};
 },[]);
 async function copyCode(){
  if(!promo)return;
  try{await navigator.clipboard.writeText(promo.code)}catch{
   const input=document.createElement('textarea');input.value=promo.code;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();document.execCommand('copy');input.remove();
  }
  setCopied(true);window.setTimeout(()=>setCopied(false),1800);
 }
 if(!target||!promo)return null;
 return createPortal(<button type="button" className="launch-offer" onClick={()=>void copyCode()} title="לחצו להעתקת קוד ההנחה"><span>{promo.text}</span><b dir="ltr">{promo.code}</b>{copied&&<small role="status">הועתק!</small>}</button>,target);
}
