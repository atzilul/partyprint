'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import Link from '@/components/safe-link';
import type {LandingVariantKey} from '@/lib/landing-variants';

/**
 * "Shirts for every occasion": the navigation entry that opens the audience pages
 * (/lp/...). A hover menu where the pointer can hover, a tap-to-open group inside the
 * mobile navigation. Styles live in app/globals.css next to the navigation.
 */
const OCCASIONS:{key:LandingVariantKey;icon:string;label:string;hint:string}[]=[
 {key:'family',icon:'✳',label:'יום הולדת משפחתי',hint:'הילד גיבור־על, כל המשפחה לצידו'},
 {key:'bride',icon:'♡',label:'מסיבת רווקות',hint:'הכלה והחברות בהדפס אחד'},
 {key:'groom',icon:'✦',label:'מסיבת רווקים',hint:'החתן והחבר׳ה ככרזת סרט'},
 {key:'team',icon:'↗',label:'צוותים וימי גיבוש',hint:'האנשים, לא רק הלוגו'},
 {key:'custom',icon:'✺',label:'כל אירוע אחר',hint:'יש לכם רעיון? יש לו חולצה'},
];
const canHover=()=>typeof window!=='undefined'&&window.matchMedia('(hover: hover) and (min-width: 681px)').matches;

export default function OccasionsMenu({current}:{current?:LandingVariantKey}){
 const root=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <div ref={root} className={'nav-menu'+(open?' is-open':'')} onMouseEnter={()=>{if(canHover())setOpen(true);}} onMouseLeave={()=>{if(canHover())setOpen(false);}} onBlur={event=>{if(!root.current?.contains(event.relatedTarget as Node|null))setOpen(false);}}>
  <button type="button" className="nav-menu-toggle" aria-expanded={open} aria-controls="occasions-menu" onClick={()=>setOpen(value=>canHover()?true:!value)}>חולצות לכל אירוע <ChevronDown size={15} aria-hidden="true"/></button>
  <div id="occasions-menu" className="nav-menu-panel">{OCCASIONS.map(item=><Link key={item.key} href={'/lp/'+item.key} aria-current={current===item.key?'page':undefined}><i aria-hidden="true">{item.icon}</i><span><b>{item.label}</b><small>{item.hint}</small></span></Link>)}</div>
 </div>;
}
