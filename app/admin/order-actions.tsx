'use client';
import {stageMessage} from '@/lib/workflow';
import {useEffect,useState} from 'react';
import {Order,STAGES,reviewRequestMessage,whatsappLink} from '@/lib/orders';
export default function OrderActions({order,onChange}:{order:Order;onChange:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reviewUrl,setReviewUrl]=useState('');
 // The Google review link lives in the studio settings; read it only when it can be used.
 useEffect(()=>{if(order.status!=='shipped')return;let active=true;fetch('/api/admin/settings').then(r=>r.ok?r.json() as Promise<{review?:{url?:string}}>:null).then(v=>{if(active&&v?.review?.url)setReviewUrl(String(v.review.url));}).catch(()=>{});return()=>{active=false;};},[order.status]);
 const next=STAGES[STAGES.findIndex(s=>s[0]===order.status)+1];
 const text=stageMessage(order);
 async function act(action:string){if(action==='next'&&!confirm(`להעביר את ההזמנה של ${order.name} לשלב ״${next?.[1]}״?`))return;setBusy(true);setError('');try{const r=await fetch(`/api/admin/orders/${order.id}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,version:order.version})});const v=await r.json() as {error?:string};if(!r.ok)throw Error(v.error||'הפעולה נכשלה');onChange()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="quick-actions"><a href={whatsappLink(order.phone,text)||undefined} target="_blank" rel="noreferrer">WhatsApp ללקוח ↗</a><a href={`/api/admin/orders/${order.id}/bundle`}>הורדת קבצים</a>{next&&<button disabled={busy} onClick={()=>void act('next')}>לשלב הבא: {next[1]}</button>}{order.status==='shipped'&&<a href={whatsappLink(order.phone,reviewRequestMessage(order,reviewUrl))||undefined} target="_blank" rel="noreferrer" title={reviewUrl?'הודעה מוכנה עם בקשה לתמונה וקישור לביקורת בגוגל':'הודעה מוכנה עם בקשה לתמונה. קישור לביקורת בגוגל יתווסף כשיוגדר בהגדרות'}>בקשת תמונה וביקורת ב-WhatsApp ↗</a>}{order.status==='shipped'&&!order.reviewAskedAt&&<button disabled={busy} title="סימון ידני בלבד. לא שולח הודעה. מוריד מרשימת הביקורות." onClick={()=>void act('review_asked')}>סומן: נשלחה בקשת ביקורת</button>}{order.status==='review'&&<button disabled={busy} title="סימון ידני בלבד. לא שולח הודעה. דוחה את רשימת המעקב בשלושה ימים." onClick={()=>void act('followup')}>בוצע מעקב · תזכורת בעוד 3 ימים</button>}{error&&<p role="alert" className="studio-error">{error}<button onClick={onChange}>רענון נתונים</button></p>}</div>
}
