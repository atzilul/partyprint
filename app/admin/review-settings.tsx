'use client';

import {useEffect,useState} from 'react';
import {Star,LoaderCircle} from 'lucide-react';

type ReviewSettings={enabled:boolean;url:string;version:number};

/** The review request sent when an order is marked shipped (lib/review-request.ts). */
export default function ReviewSettingsCard(){
 const [saved,setSaved]=useState<ReviewSettings|null>(null),[url,setUrl]=useState(''),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let live=true;fetch('/api/admin/settings').then(r=>r.json() as Promise<{review?:ReviewSettings}>).then(v=>{if(!live||!v.review)return;setSaved(v.review);setUrl(v.review.url);setEnabled(v.review.enabled);}).catch(()=>{});return()=>{live=false;};},[]);
 const changed=!!saved&&(url.trim()!==saved.url||enabled!==saved.enabled);
 async function save(){
  if(!saved)return;setBusy(true);setError('');setNotice('');
  try{
   const r=await fetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'review',review:{enabled,url:url.trim(),version:saved.version}})});
   const v=await r.json() as {error?:string;review?:ReviewSettings};
   if(!r.ok||!v.review)throw Error(v.error||'השמירה לא הצליחה.');
   setSaved(v.review);setUrl(v.review.url);setEnabled(v.review.enabled);
   setNotice(v.review.enabled?'נשמר. כל הזמנה שתסומן מעכשיו כ״נשלחה ללקוח״ תשלח ללקוח בקשת ביקורת אחת, בשפה שלו.':'נשמר. בקשות ביקורת כבויות.');
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <section className="settings-card" dir="rtl" style={{textAlign:'right'}}>
  <div className="settings-card-title"><Star/><div><h3>בקשת ביקורת אחרי משלוח</h3><p>כשהזמנה מסומנת ״נשלחה ללקוח״, הלקוח מקבל מייל אחד עם קישור לכתיבת ביקורת בגוגל, וגם קישור ל־WhatsApp אם משהו לא יצא כמו שציפה. כל לקוח מקבל את שניהם.</p></div></div>
  {!saved?<p className="studio-note"><LoaderCircle className="spin" size={16}/> טוענים…</p>:<>
   <label className="pp-field" style={{display:'grid',gap:6}}>קישור לכתיבת ביקורת בגוגל
    <input dir="ltr" type="url" inputMode="url" placeholder="https://g.page/r/…/review" value={url} maxLength={500} onChange={e=>{setUrl(e.target.value);setNotice('');}}/>
   </label>
   <p className="studio-note">את הקישור מקבלים בפרופיל העסק בגוגל: ״בקשת ביקורות״ או ״שיתוף טופס ביקורת״.</p>
   <label style={{display:'flex',gap:8,alignItems:'center',margin:'10px 0'}}><input type="checkbox" checked={enabled} onChange={e=>{setEnabled(e.target.checked);setNotice('');}}/> לשלוח בקשת ביקורת כשהזמנה נשלחת</label>
   {error&&<p className="studio-error" role="alert">{error}</p>}
   {notice&&<p className="studio-note" role="status">{notice}</p>}
   <div className="settings-save"><span>{changed?'יש שינוי שלא נשמר':enabled?'פעיל':'כבוי'}</span><button className="save-order" disabled={busy||!changed||(enabled&&!url.trim())} onClick={()=>void save()}>{busy?'שומרים…':'שמירה'}</button></div>
  </>}
 </section>;
}
