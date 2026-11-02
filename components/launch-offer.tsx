'use client';
import {createPortal} from 'react-dom';
import {useEffect,useState} from 'react';
export default function LaunchOffer(){
 const [target,setTarget]=useState<HTMLElement|null>(null);
 useEffect(()=>{const slot=document.getElementById('launch-offer-slot');if(!slot)return;const timer=window.setTimeout(()=>setTarget(slot),0);return()=>window.clearTimeout(timer);},[]);
 if(!target)return null;
 return createPortal(<a className="launch-offer" href="#packages"><span>עיצוב אישי, הדפסה ומשלוח עד הבית</span></a>,target);
}
