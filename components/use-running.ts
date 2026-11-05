'use client';
import {useEffect,useRef,useState} from 'react';

export const reducedMotion=()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Follows the page-wide motion switch set by <Motion/> and whether the node is on screen. */
export function useRunning<T extends HTMLElement>(threshold:number){
 const root=useRef<T>(null),[visible,setVisible]=useState(false),[motion,setMotion]=useState(false);
 useEffect(()=>{
  const update=()=>setMotion(document.documentElement.dataset.motion!=='off'&&!reducedMotion());
  const initial=window.setTimeout(update,0);
  window.addEventListener('party-motion',update);
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold});
  if(root.current)observer.observe(root.current);
  return()=>{window.clearTimeout(initial);window.removeEventListener('party-motion',update);observer.disconnect();};
 },[threshold]);
 return {root,running:visible&&motion};
}
