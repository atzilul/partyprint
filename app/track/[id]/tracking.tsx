"use client";
/* eslint-disable @next/next/no-img-element -- customer design previews are protected dynamic files. */
/* eslint-disable react-hooks/exhaustive-deps -- the route id is the intentional reload boundary. */
import Link from '@/components/safe-link';

import {useEffect,useState} from 'react';
import {COLOR_LABELS} from '@/lib/catalog';
import {STAGES as stages,whatsappLink} from '@/lib/orders';

type View={id:string;name:string;packageName:string;quantity:number;shirts:{size:string;color:string}[];price:number;paid:number;status:string;dueDate?:string;eventDate?:string;tracking?:string;brief:string;cancelled:boolean;approval?:{state:string;images:string[];comment?:string}};

export default function Tracking({id}:{id:string}){
 const [data,setData]=useState<View|null>(null),[error,setError]=useState(''),[token,setToken]=useState('');
 async function load(t:string){try{const r=await fetch('/api/track/'+id+'?token='+t);const v=await r.json() as View&{error?:string};if(!r.ok)throw Error(v.error);setData(v);setError('')}catch(e){setError((e as Error).message)}}
 useEffect(()=>{const t=location.hash.slice(1);const timer=window.setTimeout(()=>{setToken(t);void load(t)},0);return()=>window.clearTimeout(timer)},[id]);
 return <main className="customer-tracking" dir="rtl"><Link href="/">PARTYPRINT ✳</Link><h1>מהרעיון שלכם. עד הדלת.</h1>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>טוענים את ההזמנה…</p>}{data&&<><p>היי {data.name}, כאן אפשר לראות איך ההזמנה מתקדמת.</p><b>#{id.slice(0,8).toUpperCase()} · {data.packageName}</b>{data.cancelled?<p>ההזמנה בוטלה. לפרטים נוספים פנו לסטודיו.</p>:<ol className="tracking-steps">{stages.map(([key,label],i)=><li key={key} aria-current={key===data.status?'step':undefined} className={i<=stages.findIndex(s=>s[0]===data.status)?'complete':''}><b>{i+1}</b>{label}</li>)}</ol>}<section><h2>החולצות שלכם</h2><p>{data.quantity} חולצות · {data.price} ₪ · התקבל בתיעוד הסטודיו {data.paid} ₪</p><div className="summary-shirts">{data.shirts.map((s,i)=><span key={i}>{i+1}. {s.size} · {COLOR_LABELS[s.color as keyof typeof COLOR_LABELS]}</span>)}</div><p>{data.brief}</p><p>תאריך אירוע: {data.eventDate||'לא נמסר'} · מועד יעד שסוכם: {data.dueDate||'טרם אושר'}</p>{data.tracking&&<p>פרטי משלוח: {data.tracking}</p>}</section>{data.approval&&<section><h2>העיצוב הנוכחי</h2><p>{{pending:'ממתין לתשובתכם בקישור האישור שנשלח בנפרד',approved:'אישרתם את העיצוב',changes:'בקשת התיקון שלכם בטיפול',stale:'העיצוב בבדיקה'}[data.approval.state]}</p><div className="tracking-designs">{data.approval.images.map((name,i)=><img key={i} src={'/api/track/'+id+'?token='+token+'&image='+i} alt={name}/>)}</div>{data.approval.comment&&<blockquote>{data.approval.comment}</blockquote>}</section>}<button onClick={()=>void load(token)}>רענון מצב ההזמנה</button><a className="cta orange-bg" target="_blank" rel="noreferrer" href={whatsappLink('0552896236','היי, אשמח לעזרה בהזמנה '+id)}>שינוי או שאלה? דברו איתנו</a><p className="fine">הקישור פרטי ותקף ל־30 יום. שמרו אותו אצלכם. נתוני התשלום הם רישום ידני בסטודיו.</p></>}</main>
}
