'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {ATTRIBUTION_STORAGE_KEY,parseAttribution} from '@/lib/attribution';
import type {Attribution} from '@/lib/attribution';
import {isExcludedPath} from '@/lib/analytics';

const URL_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid'] as const;
function fromUrl(url:URL):Attribution{
 const out:Attribution={};
 for(const key of URL_KEYS){const value=url.searchParams.get(key);if(value&&!value.includes('@'))out[key]=value.slice(0,200);}
 return out;
}
function externalReferrer(){
 try{if(!document.referrer)return '';const ref=new URL(document.referrer);return ref.origin===location.origin?'':ref.origin+'/';}catch{return '';}
}
/**
 * Remembers the first visit's campaign parameters (first touch). A later visit
 * that carries a campaign while the stored record has none upgrades it, so an
 * organic first look followed by an ad click still credits the ad.
 */
export function captureAttribution(){
 try{
  if(isExcludedPath(location.pathname))return;
  const url=new URL(location.href),current=fromUrl(url);
  const stored=parseAttribution(localStorage.getItem(ATTRIBUTION_STORAGE_KEY));
  const campaign=(a:Attribution)=>!!(a.utm_source||a.fbclid||a.gclid);
  if(stored){
   if(!campaign(stored)&&campaign(current))localStorage.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify({...stored,...current}));
   return;
  }
  const referrer=externalReferrer();
  localStorage.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify({...current,landing_path:url.pathname.slice(0,200),...(referrer?{referrer}:{}),first_seen_at:new Date().toISOString()}));
 }catch{/* storage unavailable: the request is still saved without attribution */}
}
function cookie(name:string){
 const match=document.cookie.split('; ').find(part=>part.startsWith(name+'='));
 const value=match?decodeURIComponent(match.slice(name.length+1)):'';
 return /^[A-Za-z0-9._-]{1,256}$/.test(value)?value:'';
}
/** Stored first touch plus Meta's current browser and click cookies. */
export function readAttribution():Attribution|undefined{
 try{
  const stored=parseAttribution(localStorage.getItem(ATTRIBUTION_STORAGE_KEY))||{};
  const fbp=cookie('_fbp'),fbc=cookie('_fbc');
  return parseAttribution({...stored,...(fbp?{fbp}:{}),...(fbc?{fbc}:{})});
 }catch{return undefined;}
}
export default function AttributionCapture(){
 const pathname=usePathname();
 useEffect(()=>{captureAttribution();},[pathname]);
 return null;
}
