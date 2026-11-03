'use client';
import Link from 'next/link';
import type {AnchorHTMLAttributes,ReactNode} from 'react';
import {useEffect,useState} from 'react';
import {isLandingVariant,LANDING_VARIANT_COOKIE,type LandingVariantKey} from '@/lib/landing-variants';

type Props=AnchorHTMLAttributes<HTMLAnchorElement> & {children:ReactNode};
function storedVariant():LandingVariantKey|null {
 try{
  const cookie=document.cookie.split(';').map(part=>part.trim()).find(part=>part.startsWith(LANDING_VARIANT_COOKIE+'='));
  const cookieValue=cookie?.slice(LANDING_VARIANT_COOKIE.length+1);
  if(isLandingVariant(cookieValue))return cookieValue;
  const raw=localStorage.getItem('partyprint-draft-v2')||localStorage.getItem('partyprint-draft-v1');
  if(!raw)return null;
  const draft=JSON.parse(raw) as {variant?:unknown};
  return isLandingVariant(draft.variant)?draft.variant:null;
 }catch{return null;}
}
export default function OrderFormLink({children,...props}:Props){
 const [href,setHref]=useState('/#order');
 useEffect(()=>{
  const current=new URL(window.location.href);
  const query=new URLSearchParams();
  for(const [key,value] of current.searchParams){
   const lower=key.toLowerCase();
   if(/^utm_/.test(lower)||['fbclid','gclid','wbraid','gbraid'].includes(lower))query.append(key,value);
  }
  const variant=current.searchParams.get('v');
  const selected=isLandingVariant(variant)?variant:storedVariant();
  if(selected)query.set('v',selected);
  const serialized=query.toString();
  setHref('/'+(serialized?'?'+serialized:'')+'#order');
 },[]);
 return <Link {...props} href={href}>{children}</Link>;
}
