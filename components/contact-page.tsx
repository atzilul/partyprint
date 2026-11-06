'use client';
import {Fragment,useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import {ArrowDown,ArrowUpLeft,Check,Clock,Mail,Phone,Send} from 'lucide-react';
import Link from '@/components/safe-link';
import OccasionsMenu,{BundleSaleLink} from '@/components/occasions-menu';
import ResponsePromise from '@/components/response-promise';
import WhatsAppLogo from '@/components/whatsapp-logo';
import {Motion} from '@/app/home-client';
import {useRunning} from '@/components/use-running';
import {siteEvent} from '@/lib/analytics';
import {CONTACT_TOPICS,MESSAGE_LIMITS,messageProblems} from '@/lib/contact-messages';
import type {ContactTopic,MessageProblem} from '@/lib/contact-messages';
import {RESPONSE_PROMISE} from '@/lib/response-promise';
import './contact-page.css';
import LanguageMenu,{LanguageRow} from '@/components/language-menu';

/**
 * Contact page (/contact): talking to the studio. WhatsApp comes first, because that is
 * where the studio answers fastest; a short form follows for people who prefer to write.
 * The page speaks the home page's language: same header, hero, type and motion.
 */
const WHATSAPP='https://wa.me/972552896236';
const chat=(text:string)=>WHATSAPP+'?text='+encodeURIComponent(text);

/** What people usually write about. Each card opens WhatsApp with the first line already written. */
const SUBJECTS=[
 {icon:'🎉',tone:'acid',title:'הזמנה חדשה',text:'יש אירוע ויש רעיון. או רק אירוע, וזה מספיק.',message:'היי, אשמח להתייעץ על חולצות בעיצוב אישי לאירוע'},
 {icon:'📦',tone:'lilac',title:'הזמנה גדולה',text:'25 חולצות ומעלה, לגן, לצוות או לשכבה שלמה.',message:'היי, אשמח להצעה להזמנה גדולה של חולצות בעיצוב אישי'},
 {icon:'✏️',tone:'pink',title:'שינוי בהזמנה',text:'מידה אחרת, תמונה חדשה או תיקון בעיצוב.',message:'היי, אשמח לעזרה בהזמנה קיימת. מספר הפנייה שלי: '},
 {icon:'📏',tone:'white',title:'מידות וצבעים',text:'לא בטוחים מה לבחור? נעבור על זה יחד.',message:'היי, אשמח לעזרה בבחירת מידות וצבעים'},
 {icon:'🧮',tone:'orange',title:'כמה זה עולה?',text:'נחשב יחד כמה זה יוצא לקבוצה שלכם.',message:'היי, אשמח לדעת כמה יעלו חולצות בעיצוב אישי לקבוצה שלנו'},
 {icon:'✳',tone:'ink',title:'משהו אחר',text:'כל שאלה. גם כזו שלא חשבנו עליה.',message:'היי, יש לי שאלה'},
] as const;

/** The conversation in the hero: how a first chat with the studio usually goes. */
const SCRIPT:{from:'them'|'us';text:string}[]=[
 {from:'them',text:'היי! אנחנו 12 חברות ויש מסיבת רווקות 🎉'},
 {from:'us',text:'מזל טוב! שלחו תמונות ומשפט על הכלה, ונחזור אליכן עם כיוון לעיצוב ✳'},
 {from:'them',text:'ומה אם לא נאהב את העיצוב?'},
 {from:'us',text:'רואים אותו ומאשרים לפני שמדפיסים. סבב תיקונים אחד כלול.'},
 {from:'them',text:'סגור. שולחת תמונות 📸'},
];

/** The hero's chat: messages arrive one by one, with the studio "typing" before each answer. */
function ChatDemo(){
 const {root,running}=useRunning<HTMLDivElement>(.3);
 // Shown in full until motion starts, so a visitor without motion sees the whole conversation.
 const [shown,setShown]=useState(SCRIPT.length),[typing,setTyping]=useState(false);
 useEffect(()=>{
  if(!running)return;
  let timer=0,cancelled=false;
  const wait=(ms:number)=>new Promise<void>(resolve=>{timer=window.setTimeout(resolve,ms);});
  (async()=>{
   while(!cancelled){
    setShown(0);setTyping(false);
    await wait(700);
    for(let index=0;index<SCRIPT.length&&!cancelled;index++){
     if(SCRIPT[index].from==='us'){setTyping(true);await wait(1300);if(cancelled)return;setTyping(false);}
     setShown(index+1);
     await wait(SCRIPT[index].from==='us'?1900:1300);
    }
    await wait(3600);
   }
  })();
  return()=>{cancelled=true;window.clearTimeout(timer);};
 },[running]);
 const visible=running?shown:SCRIPT.length;
 return <div className="cp-chat" ref={root} aria-hidden="true">
  <div className="cp-chat-head"><span className="cp-chat-avatar">✳</span><div><b dir="ltr">PARTYPRINT</b><small>{typing&&running?'מקלידים…':'הסטודיו · אנשים אמיתיים'}</small></div><i className="cp-chat-dot"/></div>
  <div className="cp-chat-body">
   {SCRIPT.slice(0,visible).map((line,index)=><p key={index} className={'cp-bubble cp-'+line.from}>{line.text}</p>)}
   {typing&&running&&<p className="cp-bubble cp-us cp-typing"><i/><i/><i/></p>}
  </div>
  <div className="cp-chat-foot"><span>כתבו הודעה</span><b><Send size={16}/></b></div>
 </div>;
}

const FIELD_ERRORS:Record<MessageProblem,string>={
 name:'כתבו שם, כדי שנדע למי לחזור.',
 phone:'כתבו מספר טלפון תקין, כדי שנוכל לחזור אליכם ב־WhatsApp.',
 email:'בדקו את כתובת המייל.',
 body:'כתבו לנו כמה מילים על מה שאתם צריכים.',
};

function MessageForm(){
 const [values,setValues]=useState({name:'',phone:'',email:'',topic:'new' as ContactTopic,body:'',website:''});
 const [problems,setProblems]=useState<MessageProblem[]>([]),[busy,setBusy]=useState(false),[failure,setFailure]=useState(''),[reference,setReference]=useState('');
 const set=(name:keyof typeof values)=>(event:{target:{value:string}})=>{setValues(current=>({...current,[name]:event.target.value}));setProblems(current=>current.filter(problem=>problem!==name));};
 async function send(event:FormEvent){
  event.preventDefault();
  const found=messageProblems(values);
  setProblems(found);setFailure('');
  if(found.length){document.getElementById('cp-'+found[0])?.focus();return;}
  setBusy(true);
  try{
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
   const result=await response.json() as {reference?:string;error?:string};
   if(!response.ok||!result.reference)throw Error(result.error||'');
   setReference(result.reference);
  }catch(error){
   setFailure((error as Error).message||'לא הצלחנו לשלוח את ההודעה. נסו שוב, או כתבו לנו ב־WhatsApp.');
  }finally{setBusy(false);}
 }
 if(reference)return <div className="cp-form cp-sent" role="status">
  <span className="cp-sent-mark"><Check size={38} strokeWidth={3}/></span>
  <h3>ההודעה אצלנו.</h3>
  <p>מספר הפנייה שלכם: <b dir="ltr">{reference}</b>. נחזור אליכם ב־WhatsApp או במייל.</p>
  <ResponsePromise/>
  <a className="cp-whatsapp" href={chat('היי, שלחתי הודעה דרך האתר. מספר הפנייה: '+reference)} target="_blank" rel="noopener noreferrer" data-cta-location="contact"><WhatsAppLogo size={22}/>ממשיכים ב־WhatsApp<ArrowUpLeft size={19}/></a>
 </div>;
 const error=(name:MessageProblem)=>problems.includes(name)?<small className="cp-error" id={'cp-'+name+'-error'}>{FIELD_ERRORS[name]}</small>:null;
 const invalid=(name:MessageProblem)=>problems.includes(name)?{'aria-invalid':true,'aria-describedby':'cp-'+name+'-error'}:{};
 return <form className="cp-form" onSubmit={send} noValidate>
  <div className="cp-form-row">
   <label htmlFor="cp-name">שם<input id="cp-name" name="name" autoComplete="name" maxLength={MESSAGE_LIMITS.name} value={values.name} onChange={set('name')} disabled={busy} {...invalid('name')}/>{error('name')}</label>
   <label htmlFor="cp-phone">טלפון<input id="cp-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={values.phone} onChange={set('phone')} disabled={busy} {...invalid('phone')}/>{error('phone')}</label>
  </div>
  <label htmlFor="cp-email">מייל<input id="cp-email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" maxLength={MESSAGE_LIMITS.email} value={values.email} onChange={set('email')} disabled={busy} {...invalid('email')}/>{error('email')}</label>
  <label htmlFor="cp-topic">על מה מדברים?<select id="cp-topic" name="topic" value={values.topic} onChange={set('topic')} disabled={busy}>{CONTACT_TOPICS.map(topic=><option key={topic.id} value={topic.id}>{topic.label}</option>)}</select></label>
  <label htmlFor="cp-body">ההודעה שלכם<textarea id="cp-body" name="body" rows={5} maxLength={MESSAGE_LIMITS.body} placeholder="למשל: יום גיבוש ל־20 אנשים בעוד חודש, ורוצים חולצות עם כל הצוות" value={values.body} onChange={set('body')} disabled={busy} {...invalid('body')}/>{error('body')}</label>
  <label className="cp-website" aria-hidden="true">אתר<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')}/></label>
  {failure&&<p className="cp-failure" role="alert">{failure}</p>}
  <button type="submit" className="cta orange-bg" disabled={busy}>{busy?'שולחים…':'שולחים הודעה'}<ArrowUpLeft size={22}/></button>
  <p className="cp-consent">בשליחה אתם מאשרים שניצור איתכם קשר לגבי הפנייה. הפרטים נשמרים לצורך הטיפול בה בלבד. <Link href="/privacy-policy">מדיניות פרטיות</Link></p>
 </form>;
}

export default function ContactPage({businessEmail,businessPhone}:{businessEmail:string;businessPhone:string}){
 const [mobileNavOpen,setMobileNavOpen]=useState(false);
 useEffect(()=>{siteEvent('view');},[]);
 const closeNav=()=>setMobileNavOpen(false);
 const ticker=['WHATSAPP','אנשים אמיתיים','בלי בוט','בלי התחייבות','עיצוב שרואים לפני שמדפיסים','REAL PEOPLE. REAL HELP.'];
 return <main className="cp-page">
  <a className="skip-link" href="#message">דילוג לטופס</a>
  <div className="topbar"><div className="topbar-message"><span>✳</span> מחיר ברור · אישור לפני הדפסה · משלוח עד הבית</div><div className="topbar-promo" id="launch-offer-slot" aria-live="polite"><span className="promo-fallback">מתחילים בלי חיוב · מאשרים לפני הדפסה</span></div></div>
  <header className="nav wrap"><Link href="/" className="logo" dir="ltr" aria-label="PARTYPRINT, לעמוד הבית">PARTY<span>PRINT</span><i>✳</i></Link><button type="button" className="mobile-nav-toggle" aria-label="פתיחת תפריט ניווט" aria-expanded={mobileNavOpen} aria-controls="site-navigation" onClick={()=>setMobileNavOpen(value=>!value)}>☰</button><nav id="site-navigation" className={mobileNavOpen?'is-open':''}><LanguageRow/><OccasionsMenu/><Link onClick={closeNav} href="/#packages">החבילות שלנו</Link><Link onClick={closeNav} href="/#how">איך זה עובד?</Link><BundleSaleLink/><Link onClick={closeNav} href="/blog">בלוג</Link><a onClick={closeNav} href="#talk" aria-current="page">דברו איתנו</a></nav><LanguageMenu/><Link className="small-cta" href="/#order">התחילו לעצב <ArrowUpLeft size={17}/></Link></header>

  <section className="hero wrap cp-hero" id="talk">
   <div className="hero-copy">
    <div className="audience-copy"><span className="cp-badge" dir="ltr" lang="en">REAL PEOPLE. REAL HELP.</span><h1><small>יש רעיון? שאלה? חצי מחשבה?</small>דברו<br/><span>איתנו.</span><i>✳</i></h1><p>הדרך הכי מהירה היא WhatsApp. עונים לכם אנשים מהסטודיו, בלי בוט ובלי טפסים ארוכים. מעדיפים לכתוב בנחת? יש טופס קצר בהמשך העמוד.</p></div>
    <a className="cp-whatsapp cp-whatsapp-big" href={chat('היי, אשמח להתייעץ על חולצות בעיצוב אישי')} target="_blank" rel="noopener noreferrer" data-cta-location="hero"><WhatsAppLogo size={26}/>מדברים ב־WhatsApp<ArrowUpLeft size={22}/></a>
    <ResponsePromise className="cp-promise"/>
    <a className="cp-to-form" href="#message">או משאירים הודעה בטופס <ArrowDown size={16}/></a>
    <ul className="cp-points"><li><Check size={16}/>עונים אנשים, לא בוט</li><li><Check size={16}/>בלי חיוב ובלי התחייבות</li><li><Check size={16}/>רואים את העיצוב לפני שמדפיסים</li></ul>
   </div>
   <div className="hero-art cp-art"><span className="cp-sticker cp-sticker-a" aria-hidden="true">HELLO ✳</span><span className="cp-sticker cp-sticker-b" aria-hidden="true">שלום!</span><ChatDemo/><span className="cp-sticker cp-sticker-c" aria-hidden="true">👋</span></div>
  </section>

  <div className="ticker cp-ticker" aria-hidden="true"><div>{[...ticker,...ticker].map((item,index)=><Fragment key={index}><span>{item}</span><i>✳</i></Fragment>)}</div></div>

  <section className="wrap section cp-subjects" id="subjects">
   <div className="section-head"><div><div className="eyebrow"><span dir="ltr" lang="en">PICK A SUBJECT</span></div><h2>על מה<br/><span>מדברים?</span></h2></div><p>בוחרים נושא ו־WhatsApp נפתח עם שורה ראשונה מוכנה. נשאר רק לשלוח.</p></div>
   <div className="cp-cards">{SUBJECTS.map((subject,index)=><a key={subject.title} className={'cp-card cp-'+subject.tone} href={chat(subject.message)} target="_blank" rel="noopener noreferrer" data-cta-location="contact" style={{'--cp-turn':(index%2?1:-1)*(1+index%3)*.45+'deg'} as React.CSSProperties}>
    <span className="cp-card-icon" aria-hidden="true">{subject.icon}</span>
    <strong>{subject.title}</strong>
    <span className="cp-card-text">{subject.text}</span>
    <b className="cp-card-go"><WhatsAppLogo size={17}/>פותחים שיחה<ArrowUpLeft size={16}/></b>
   </a>)}</div>
  </section>

  <section className="cp-ways" aria-label="דרכים נוספות ליצור קשר"><div className="wrap">
   <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-cta-location="contact"><WhatsAppLogo size={26}/><span><small>WhatsApp</small><b dir="ltr">{businessPhone}</b></span></a>
   <a href={'tel:'+businessPhone.replace(/\s/g,'')} data-cta-location="contact"><Phone size={24}/><span><small>טלפון</small><b dir="ltr">{businessPhone}</b></span></a>
   <a href={'mailto:'+businessEmail} data-cta-location="contact"><Mail size={24}/><span><small>מייל</small><b dir="ltr">{businessEmail}</b></span></a>
   <div><Clock size={24}/><span><small>שעות המענה</small><b>{RESPONSE_PROMISE.hoursLabel}</b></span></div>
  </div></section>

  <section className="wrap section cp-message" id="message">
   <div className="cp-message-copy"><div className="eyebrow"><span dir="ltr" lang="en">PREFER TO WRITE?</span></div><h2>מעדיפים<br/><span>לכתוב?</span></h2><p>כתבו לנו מה אתם צריכים, ונחזור אליכם ב־WhatsApp או במייל. אין חיוב ואין התחייבות.</p><ResponsePromise/><ul className="cp-points cp-points-dark"><li><Check size={16}/>שלושה פרטים והודעה, וזהו</li><li><Check size={16}/>עונה לכם אדם מהסטודיו</li><li><Check size={16}/>רוצים להזמין כבר עכשיו? <Link href="/#order">לטופס ההזמנה</Link></li></ul></div>
   <MessageForm/>
  </section>
  <Motion/>
 </main>;
}
