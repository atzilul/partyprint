'use client';
import {useState} from 'react';
import {Order,STAGES,whatsappLink} from '@/lib/orders';
export default function OrderActions({order,onChange}:{order:Order;onChange:()=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const next=STAGES[STAGES.findIndex(s=>s[0]===order.status)+1];
 const text=order.status==='review'?`היי ${order.name}, כאן PARTYPRINT. רצינו לבדוק אם הספקת לעבור על העיצוב להזמנה ${order.id.slice(0,8)}. נשמח לאישור או להערות שלך.`:`היי ${order.name}, כאן PARTYPRINT לגבי הזמנה ${order.id.slice(0,8)}. `;
 async function act(action:string){if(action==='next'&&!confirm(`להעביר את ההזמנה של ${order.name} לשלב ״${next?.[1]}״?`))return;setBusy(true);setError('');try{const r=await fetch(`/api/admin/orders/${order.id}/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,version:order.version})});const v=await r.json() as {error?:string};if(!r.ok)throw Error(v.error||'הפעולה נכשלה');onChange()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="quick-actions"><a href={whatsappLink(order.phone,text)||undefined} target="_blank" rel="noreferrer">WhatsApp ללקוח ↗</a><a href={`/api/admin/orders/${order.id}/bundle`}>הורדת קבצים</a>{next&&<button disabled={busy} onClick={()=>void act('next')}>העברה: {next[1]}</button>}{order.status==='review'&&<button disabled={busy} title="סימון ידני בלבד. לא שולח הודעה. דוחה את רשימת המעקב בשלושה ימים." onClick={()=>void act('followup')}>בוצע מעקב · תזכורת בעוד 3 ימים</button>}{error&&<p role="alert" className="studio-error">{error}<button onClick={onChange}>רענון נתונים</button></p>}</div>
}
