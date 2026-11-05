'use client';
import {Fragment,useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {ArrowUpLeft,Check,Sparkles,Truck,Palette,Plus,Phone,MessageCircle,ShieldCheck,CreditCard,Upload,Layers} from 'lucide-react';
import Link from '@/components/safe-link';
import OrderRequestForm from '@/components/order-request-form';
import OccasionsMenu,{BundleSaleLink} from '@/components/occasions-menu';
import {Motion} from '@/app/home-client';
import {useRunning,reducedMotion} from '@/components/use-running';
import {landingFaq} from '@/lib/home-faq';
import {packs,SINGLE_PACK_INDEX} from '@/lib/catalog';
import type {DesignMode} from '@/lib/catalog';
import {priceFor,unitPriceFor} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';
import {normalizeOrderQuantity} from '@/lib/order-quantity';
import {track,siteEvent,packageType,requestMode} from '@/lib/analytics';
import {BUNDLE_SIZES,BUNDLE_MIN,BUNDLE_MAX,bundleOffers,bundleFor,bundleFaq,shekels} from '@/lib/bundles';
import type {BundleOffers} from '@/lib/bundles';
import './bundle-sale.css';

/**
 * BUNDLE SALE: large orders (25 shirts and up) at the quantity prices of the same sizes.
 * The page speaks the home page's language (same header, sections, form and motion) and
 * adds its own pieces: the bundle meter in the hero, the bundle cards and the calculator.
 */
const WHATSAPP='https://wa.me/972552896236';
const WHATSAPP_BUNDLE=WHATSAPP+'?text='+encodeURIComponent('היי, אשמח להצעה להזמנה גדולה של חולצות בעיצוב אישי');
/** Any group, one shared design: the open-ended package. */
const PACK=4;
const AUDIENCES=[
 {icon:'🧸',chip:'גנים',title:'גנים וצהרונים',text:'מסיבת סוף שנה עם כל הילדים באיור אחד. מידות מגיל 2.'},
 {icon:'🎒',chip:'בתי ספר',title:'בתי ספר ושכבות',text:'חולצת מחזור, טיול שנתי או יום ספורט. שכבה שלמה באותו הדפס.'},
 {icon:'💻',chip:'הייטק',title:'חברות הייטק',text:'יום גיבוש, האקתון או השקה. האנשים במרכז, הלוגו לצידם.'},
 {icon:'🏢',chip:'מקומות עבודה',title:'מקומות עבודה',text:'כנס, נופש חברה או יום כיף. משלוח אחד לכתובת אחת.'},
 {icon:'🪖',chip:'חיילים',title:'חיילים ויחידות',text:'סוף מסלול, מחזור או פלוגה. הבדיחות שרק אתם מבינים, על חולצה.'},
 {icon:'⛺',chip:'תנועות נוער',title:'תנועות נוער',text:'מחנה קיץ, שבט או גרעין. חולצה שממשיכים ללבוש גם אחרי.'},
 {icon:'🏃',chip:'קהילות',title:'קבוצות וקהילות',text:'קבוצת ריצה, מקהלה או עמותה. כולם באותו צבע, באותו סיפור.'},
];
const STEPS=[
 {icon:Layers,title:'בוחרים באנדל',text:'25, 50 או 100, או כל כמות ביניהם. המחיר מוצג מראש.'},
 {icon:Upload,title:'שולחים רעיון ולוגו',text:'משפט אחד, תמונות ולוגו אם יש. את השאר נפתח יחד.'},
 {icon:Palette,title:'מאשרים עיצוב אחד',text:'רואים את ההדפס לפני שמדפיסים. סבב תיקונים אחד כלול.'},
 {icon:Truck,title:'מקבלים משלוח אחד',text:'אוספים מידות בנחת, ואנחנו שולחים הכול לכתובת אחת.'},
];
const CARD_TAGS=['לגן, לצוות, לכיתה','לשכבה, לחברה, לשבט','הכי משתלם'];
const CONFIDENCE_ICONS=[CreditCard,Palette,Check,Truck];
const TRUST_ICONS=[Truck,Palette,ShieldCheck];

/** Counts towards a number over a short time, starting from wherever it stands. */
function useCountTo(target:number,animate:boolean,duration=850){
 const [value,setValue]=useState(target),current=useRef(target);
 useEffect(()=>{
  const from=current.current,started=performance.now();let frame=0;
  const tick=(now:number)=>{
   const progress=animate?Math.min(1,(now-started)/duration):1,next=Math.round(from+(target-from)*(1-Math.pow(1-progress,3)));
   current.current=next;setValue(next);
   if(progress<1)frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[target,animate,duration]);
 return value;
}

const STAGE_MS=3800;
/** The hero artwork: the bundle grows, the shirts light up and the price per shirt drops. */
function BundleMeter({offers}:{offers:BundleOffers}){
 const {root,running}=useRunning<HTMLDivElement>(.3),[stage,setStage]=useState(0);
 useEffect(()=>{if(!running)return;const id=window.setTimeout(()=>setStage(value=>(value+1)%BUNDLE_SIZES.length),STAGE_MS);return()=>window.clearTimeout(id);},[running,stage]);
 const bundle=offers.bundles[stage],count=useCountTo(bundle.size,running),unit=useCountTo(bundle.unit,running,650);
 return <div ref={root} className={'hero-art bs-meter '+(running?'is-running':'is-paused')}>
  <div className="bs-meter-head"><span dir="ltr" lang="en">BUNDLE<b>SALE</b></span><i aria-hidden="true">✳</i></div>
  <div className="bs-meter-count"><strong>{count}</strong><span>חולצות<br/>בעיצוב אחד</span></div>
  <div className="bs-shirts" aria-hidden="true">{Array.from({length:BUNDLE_MAX},(_,n)=><i key={n} className={n<count?'is-on':''}/>)}</div>
  <div className="bs-meter-price"><div><small>מחיר לחולצה</small><b>{shekels(unit)} ₪</b></div>{bundle.saving>0&&<><del>{shekels(offers.regular)} ₪</del><em key={stage}>חוסכים {shekels(bundle.saving)} ₪</em></>}</div>
  <div className="bs-meter-tabs" role="group" aria-label="גודל הבאנדל">{offers.bundles.map((item,i)=><button type="button" key={item.size} className={i===stage?'is-active':''} aria-pressed={i===stage} onClick={()=>setStage(i)}><b>{item.size}</b><span>חולצות</span><i style={{animationDuration:STAGE_MS+'ms'}} aria-hidden="true"/></button>)}</div>
 </div>;
}

/** The four steps, lit one after the other while they are on screen. */
function BundleSteps(){
 const {root,running}=useRunning<HTMLOListElement>(.3),[active,setActive]=useState(0);
 useEffect(()=>{if(!running)return;const id=window.setTimeout(()=>setActive(value=>(value+1)%STEPS.length),2600);return()=>window.clearTimeout(id);},[running,active]);
 return <ol ref={root} className="bs-steps">{STEPS.map((step,i)=>{const Icon=step.icon;return <li key={step.title} className={'bs-reveal'+(i===active?' is-active':'')} style={{'--d':i*90+'ms'} as CSSProperties} onPointerEnter={()=>setActive(i)}><span className="bs-step-number">0{i+1}</span><Icon size={26} aria-hidden="true"/><h3>{step.title}</h3><p>{step.text}</p></li>;})}</ol>;
}

type Props={initialPricing:Pricing;businessEmail:string;paymentDisclosure:string};
export default function BundleSale({initialPricing,businessEmail,paymentDisclosure}:Props){
 const [mobileNavOpen,setMobileNavOpen]=useState(false),[quantities,setQuantities]=useState<number[]>(()=>packs.map((_,i)=>i===SINGLE_PACK_INDEX?1:BUNDLE_SIZES[1])),[selectedPack,setSelectedPack]=useState(PACK),[mode,setMode]=useState('order'),[busy,setBusy]=useState(false),[openSignal,setOpenSignal]=useState(0),[pricing,setPricing]=useState<Pricing>(initialPricing),[orderVisible,setOrderVisible]=useState(false),[designMode,setDesignMode]=useState<DesignMode>('shared');
 useEffect(()=>{
  fetch('/api/pricing').then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>setPricing(v as Pricing)).catch(()=>{});
  siteEvent('view');
  const node=document.getElementById('order'),observer=new IntersectionObserver(([entry])=>setOrderVisible(entry.isIntersecting),{threshold:0});if(node)observer.observe(node);
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in');reveal.unobserve(entry.target);}}),{threshold:.12});
  document.querySelectorAll('.bs-reveal').forEach(item=>reveal.observe(item));
  return()=>{observer.disconnect();reveal.disconnect();};
 },[]);
 const offers=bundleOffers(pricing),[small,medium,large]=offers.bundles;
 const pack=selectedPack===SINGLE_PACK_INDEX?PACK:selectedPack,quantity=quantities[pack],shown=Math.min(BUNDLE_MAX,Math.max(BUNDLE_MIN,quantity)),unit=unitPriceFor(pricing,shown),current=bundleFor(shown),next=offers.bundles.find(item=>item.size>shown);
 function setQuantity(i:number,n:number){if(busy||!packs[i]||i===SINGLE_PACK_INDEX)return;const value=normalizeOrderQuantity(n);setQuantities(previous=>previous.map((old,index)=>index===i?value:old));}
 function choose(size?:number,nextMode='order'){
  if(busy)return;
  const amount=size??shown;
  if(amount!==quantity)setQuantity(pack,amount);
  track('select_package',{package_type:packageType(pack),request_mode:requestMode(nextMode),value:priceFor(pricing,pack,amount),currency:'ILS',num_items:amount});
  setSelectedPack(pack);setMode(nextMode);setOpenSignal(value=>value+1);setMobileNavOpen(false);
  document.getElementById('order')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
 }
 const faq=landingFaq(paymentDisclosure,bundleFaq(pricing));
 const ticker=[...offers.bundles.map(item=>item.size+' חולצות · '+shekels(item.unit)+' ₪ לחולצה'),'גנים','בתי ספר','הייטק','חיילים','תנועות נוער'];
 const closeNav=()=>setMobileNavOpen(false);
 return <main className="bs-page">
  <a className="skip-link" href="#order">דילוג לטופס</a>
  <div className="topbar"><div className="topbar-message"><span>✳</span> מחיר ברור · אישור לפני הדפסה · משלוח עד הבית</div><div className="topbar-promo" id="launch-offer-slot" aria-live="polite"><span className="promo-fallback">מתחילים בלי חיוב · מאשרים לפני הדפסה</span></div></div>
  <header className="nav wrap"><Link href="/" className="logo" dir="ltr" aria-label="PARTYPRINT, לאתר המלא">PARTY<span>PRINT</span><i>✳</i></Link><button type="button" className="mobile-nav-toggle" aria-label="פתיחת תפריט ניווט" aria-expanded={mobileNavOpen} aria-controls="site-navigation" onClick={()=>setMobileNavOpen(value=>!value)}>☰</button><nav id="site-navigation" className={mobileNavOpen?'is-open':''}><OccasionsMenu current="bundle"/><a onClick={closeNav} href="#bundles">הבאנדלים</a><a onClick={closeNav} href="#who">למי זה מתאים?</a><a onClick={closeNav} href="#how">איך זה עובד?</a><a onClick={closeNav} href="#faq">שאלות טובות</a><BundleSaleLink current/><a href="#order-form" onClick={event=>{event.preventDefault();choose(undefined,'lead');}}>דברו איתנו</a></nav><button className="small-cta" onClick={()=>choose()}>התחילו לעצב <ArrowUpLeft size={17}/></button></header>

  <section className="hero wrap audience-family bs-hero">
   <div className="hero-copy">
    <div className="audience-copy"><span className="bs-badge" dir="ltr" lang="en">BUNDLE SALE</span><h1><small>{BUNDLE_MIN} חולצות ומעלה?</small>המחיר<br/><span>צונח.</span><i>✳</i></h1><p>גן, שכבה, צוות, פלוגה או שבט שלם: עיצוב אישי אחד, הדפסה ומשלוח, במחיר שיורד ככל שאתם יותר. {small.size} חולצות ב־{shekels(small.unit)} ₪ לחולצה, {medium.size} ב־{shekels(medium.unit)} ₪, ו־{large.size} ב־{shekels(large.unit)} ₪.</p><div className="custom-event-chips" aria-label="למי זה מתאים">{AUDIENCES.slice(0,6).map(item=><span key={item.title}>{item.icon} {item.chip}</span>)}</div></div>
    <button className="cta orange-bg" onClick={()=>document.getElementById('bundles')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'})}>בחרו את הבאנדל שלכם <ArrowUpLeft/></button>
    <ul className="bs-facts"><li className="bs-facts-price">מ־<b>{shekels(large.unit)} ₪</b> לחולצה</li><li><Check size={15} aria-hidden="true"/>כולל עיצוב אישי אחד, הדפסה ומשלוח</li><li><Check size={15} aria-hidden="true"/>מאשרים לפני שמדפיסים</li><li><Check size={15} aria-hidden="true"/>אין חיוב בשליחת הטופס</li></ul>
   </div>
   <BundleMeter offers={offers}/>
  </section>

  <div className="ticker" aria-label={ticker.join(', ')}><div className="marquee-track" aria-hidden="true">{[0,1].map(n=><div className="marquee-group" key={n}>{ticker.map(word=><Fragment key={word}>{word} <i>✳</i></Fragment>)}</div>)}</div></div>

  <section id="bundles" className="bs-bundles section"><div className="wrap">
   <div className="section-head"><div><div className="eyebrow">PICK YOUR BUNDLE</div><h2>שלושה באנדלים.<br/><span>מחיר שרק יורד.</span></h2></div><p>כל באנדל כולל עיצוב אישי אחד,<br/>הדפסה ומשלוח.<br/><strong>לא חייבים מספר עגול: המחיר חל מהכמות ומעלה.</strong></p></div>
   <div className="bs-cards">{offers.bundles.map((item,i)=><article className={'bs-card bs-card-'+i+' bs-reveal'+(current===item.size?' is-current':'')} style={{'--d':i*110+'ms'} as CSSProperties} key={item.size}>
    <span className="bs-card-tag">{CARD_TAGS[i]}</span>
    {current===item.size&&<span className="bs-card-yours"><Check size={14} aria-hidden="true"/> הבאנדל שלכם</span>}
    <div className="bs-card-size"><strong>{item.size}</strong><span>חולצות{item.size<BUNDLE_MAX?' ומעלה':''}</span></div>
    <div className="bs-card-unit"><b>{shekels(item.unit)} ₪</b><span>לחולצה</span>{item.saving>0&&<del>{shekels(offers.regular)} ₪</del>}</div>
    <p className="bs-card-total">{item.size} חולצות: <b>{shekels(item.total)} ₪</b></p>
    {item.saving>0&&<p className="bs-card-save"><Sparkles size={16} aria-hidden="true"/> חוסכים {shekels(item.saving)} ₪ לעומת {shekels(offers.regular)} ₪ לחולצה</p>}
    <ul><li><Check size={16} aria-hidden="true"/> עיצוב אישי אחד לכולם</li><li><Check size={16} aria-hidden="true"/> הדפסה ומשלוח כלולים</li><li><Check size={16} aria-hidden="true"/> מאשרים לפני שמדפיסים</li></ul>
    <button type="button" onClick={()=>choose(item.size)}>זה הבאנדל שלנו <ArrowUpLeft size={19}/></button>
   </article>)}</div>
   <div className="bs-calc bs-reveal">
    <div className="bs-calc-head"><h3>כמה אתם בדיוק?</h3><p>גוררים, והמחיר מתעדכן.</p></div>
    <div className="bs-calc-range"><input type="range" min={BUNDLE_MIN} max={BUNDLE_MAX} step={1} value={shown} aria-label="כמות חולצות" aria-valuetext={shown+' חולצות, '+shekels(unit)+' ₪ לחולצה'} disabled={busy} style={{'--fill':(shown-BUNDLE_MIN)/(BUNDLE_MAX-BUNDLE_MIN)*100+'%'} as CSSProperties} onChange={event=>setQuantity(pack,Number(event.target.value))}/><div className="bs-calc-marks" aria-hidden="true">{offers.bundles.map(item=><span key={item.size} style={{'--at':(item.size-BUNDLE_MIN)/(BUNDLE_MAX-BUNDLE_MIN)*100+'%'} as CSSProperties}>{item.size}</span>)}</div></div>
    <div className="bs-calc-out" aria-live="polite"><div><small>חולצות</small><b>{shown}</b></div><div><small>לחולצה</small><b>{shekels(unit)} ₪</b></div><div className="bs-calc-total"><small>סה״כ</small><b>{shekels(priceFor(pricing,pack,shown))} ₪</b></div></div>
    <p className="bs-calc-next">{next?<>עוד {next.size-shown} {next.size-shown===1?'חולצה':'חולצות'} ואתם בבאנדל {next.size}: <b>{shekels(next.unit)} ₪ לחולצה</b></>:<>זה המחיר הכי טוב שלנו. מעל {BUNDLE_MAX} חולצות? <a href={WHATSAPP_BUNDLE} target="_blank" rel="noopener noreferrer" data-cta-location="bundle_calculator">דברו איתנו</a></>}</p>
    <button type="button" className="cta orange-bg" onClick={()=>choose()}>ממשיכים עם {shown} חולצות <ArrowUpLeft/></button>
   </div>
   <p className="bs-foot">* המחיר מחושב לפי מדרגת הכמות וכולל עיצוב אישי אחד לכל החולצות, הדפסה ומשלוח. נשלח לכם מחיר סופי לאישור לפני התשלום. עיצובים נוספים יתומחרו בנפרד.</p>
  </div></section>

  <section id="who" className="bs-who section"><div className="wrap">
   <div className="section-head"><div><div className="eyebrow">ONE DESIGN. THE WHOLE GANG.</div><h2>כולם באותה חולצה.<br/><span>אף אחד לא נשאר בחוץ.</span></h2></div><p>כל קבוצה גדולה עם סיבה לחגוג,<br/>להתגבש או פשוט להיראות כמו קבוצה.</p></div>
   <div className="bs-who-grid">{AUDIENCES.map((item,i)=><article className={'bs-who-card bs-who-'+i%4+' bs-reveal'} style={{'--d':i%4*80+'ms','--n':i} as CSSProperties} key={item.title}><span aria-hidden="true">{item.icon}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
    <article className="bs-who-card bs-who-more bs-reveal" style={{'--d':'240ms'} as CSSProperties}><span aria-hidden="true">✳</span><h3>ועוד</h3><p>חתונה גדולה, כנס או מפגש מחזור? ספרו לנו מה חוגגים.</p><button type="button" onClick={()=>choose()}>יש לנו קבוצה <ArrowUpLeft size={18}/></button></article>
   </div>
  </div></section>

  <section id="how" className="how section"><div className="wrap"><div className="section-head"><div><div className="eyebrow">FOUR STEPS. ONE DELIVERY.</div><h2>הזמנה גדולה.<br/><span>כאב ראש קטן.</span></h2></div><p>אחד מארגן, כולם לובשים.<br/>אנחנו מעצבים, אתם מאשרים,<br/>והכול מגיע במשלוח אחד.</p></div><BundleSteps/><p className="terms">* העיצוב כולל סבב תיקונים אחד. כל סבב תיקונים נוסף כרוך בתשלום נוסף של 100 ₪.</p><div className="desktop-order-cta"><button type="button" className="cta orange-bg" onClick={()=>choose()}>מתחילים הזמנה גדולה <ArrowUpLeft/></button></div></div></section>

  <section id="confidence" className="confidence section"><div className="wrap"><div className="section-head"><div><div className="eyebrow">הזמנה גדולה. בהירות מלאה.</div><h2>הכול ברור.<br/><span>לפני שמדפיסים.</span></h2></div><p>אתם יודעים מה מזמינים,<br/>כמה זה עולה ומה השלב הבא.</p></div><div className="offer-summary"><div><span className="small-tag">מה מקבלים?</span><strong>באנדל שלם, בלי הפתעות.</strong><p>המחיר לחולצה כולל עיצוב אישי אחד, הדפסה ומשלוח.<br/><strong>ככל שמזמינים יותר חולצות, המחיר לחולצה יורד.</strong></p></div><ul><li><Check size={17}/> סבב תיקונים אחד כלול</li><li><Check size={17}/> אתם מאשרים לפני הדפסה</li><li><Check size={17}/> אין חיוב בשליחת הטופס</li></ul></div><div className="confidence-grid">{[
   {title:'מתחילים בלי חיוב',text:'הטופס שולח בקשת הזמנה או התייעצות. מסכמים מחיר ותנאי תשלום לפני תחילת העבודה.'},
   {title:'רואים. מדייקים. מאשרים.',text:'אנחנו מעצבים מהרעיון, מהתמונות ומהלוגו שלכם. מדפיסים רק אחרי שאישרתם את העיצוב.'},
   {title:'מידות בלי לחץ',text:'ילדים מגיל 2 עד 18 ומבוגרים S עד XL באותה הזמנה. את המידות משלימים אחרי השליחה.'},
   {title:'מתאמים לפי האירוע',text:'עד 5 ימי עסקים למשלוח לאחר אישור העיצוב, ההזמנה והתשלום. המועד כפוף לאישור מראש; זמן העיצוב אינו כלול.'},
  ].map((item,i)=>{const Icon=CONFIDENCE_ICONS[i];return <article key={item.title}><div className={'confidence-illustration illustration-'+i} aria-hidden="true"><Icon size={32}/></div><h3>{item.title}</h3><p>{item.text}</p></article>;})}</div><div className="studio-contact"><div><span className="studio-mark" aria-hidden="true">P✳</span><div><strong>יותר מ־{BUNDLE_MAX} חולצות? יש עם מי לדבר.</strong><p>כתבו לנו את הכמות והתאריך, ונחזור אליכם עם הצעה מותאמת.</p></div></div><div className="studio-links"><a href={WHATSAPP_BUNDLE} target="_blank" rel="noopener noreferrer" data-cta-location="bundle_confidence"><MessageCircle size={19}/> שואלים ב־WhatsApp</a><a href={WHATSAPP}><Phone size={17}/><b dir="ltr">055 289 6236</b></a></div></div></div></section>

  <section id="order" className="order section pp-order-section"><div className="wrap pp-order-layout"><aside className="pp-order-aside"><h2>אתם מביאים את הקבוצה.<br/>אנחנו את העיצוב.</h2><p>בוחרים כמות, משאירים פרטים, ומוסיפים רעיון ולוגו. משם ממשיכים יחד.</p><ul><li><Palette size={20}/><span>עיצוב אישי אחד עם AI ומגע אנושי</span></li><li><ShieldCheck size={20}/><span>אתם רואים ומאשרים לפני הדפסה</span></li><li><Truck size={20}/><span>הדפסה ומשלוח כלולים במחיר</span></li></ul><div className="pp-order-help"><span>מעדיפים לדבר קודם?</span><a href={WHATSAPP_BUNDLE} target="_blank" rel="noopener noreferrer" data-cta-location="order_form"><MessageCircle size={18}/> מתייעצים ב־WhatsApp</a></div></aside><OrderRequestForm pack={selectedPack} quantities={quantities} pricing={pricing} mode={mode} openSignal={openSignal} onPack={setSelectedPack} onQuantity={setQuantity} onMode={setMode} onPricing={setPricing} onBusy={setBusy} designMode={designMode} onDesignMode={setDesignMode}/></div></section>

  <section id="faq" className="faq wrap section"><div><div className="eyebrow">GOOD QUESTIONS</div><h2>רגע, ומה עם...?</h2></div><div>{faq.map(([question,answer])=><details key={question}><summary>{question}<Plus size={18}/></summary><p>{answer}</p></details>)}</div></section>

  <section id="contact" className="contact-section wrap"><div><div className="eyebrow">REAL PEOPLE. REAL HELP.</div><h2>משנים משהו?<br/><span>אנחנו כאן.</span></h2><p>עוד חמישה הצטרפו, מידות שהתעדכנו או לוגו חדש.<br/>שלחו לנו ב־WhatsApp את מספר הפנייה והשינוי. שינוי לאחר אישור ההדפסה כפוף לאפשרות הביצוע.</p></div><div className="contact-actions"><a className="contact-whatsapp" href={WHATSAPP_BUNDLE} target="_blank" rel="noopener noreferrer" data-cta-location="bundle_contact"><MessageCircle/> מדברים ב־WhatsApp <ArrowUpLeft/></a><a href={WHATSAPP}><Phone size={20}/><span dir="ltr">055 289 6236</span></a><a href={'mailto:'+businessEmail}>{businessEmail}</a></div></section>

  <section className="trust-strip"><div className="wrap">{[
   {title:'משלוח מהיר עד 5 ימי עסקים*',text:'לאחר אישור עיצוב, הזמנה ותשלום'},
   {title:'מעצבים במיוחד בשבילכם',text:'רעיון שלכם. ביצוע שלנו.'},
   {title:'אתם מאשרים לפני הדפסה',text:'כולל סבב תיקונים אחד'},
  ].map((item,i)=>{const Icon=TRUST_ICONS[i];return <div key={item.title}><Icon/><strong>{item.title}</strong><span>{item.text}</span></div>;})}<div><Phone/><strong>יש עם מי לדבר</strong><a href={WHATSAPP} dir="ltr">055 289 6236</a></div></div><p>* המועד כפוף לאישור מראש לפי הכתובת והיקף ההזמנה. לא כולל זמן עיצוב ותיקונים.</p><div className="payment-status"><CreditCard size={19}/><span>הטופס אינו גובה תשלום. אמצעי התשלום יתואמו לאחר אישור ההזמנה.</span></div></section>

  <Motion/>
  <footer className="wrap"><Link className="logo" dir="ltr" href="/">PARTY<span>PRINT</span><i>✳</i></Link><p>אנשים אמיתיים. עיצובים לא רגילים.</p><div className="footer-contact"><Link href="/">לאתר המלא</Link><a href="#contact">יצירת קשר</a><Link href="/terms">תקנון</Link><Link href="/privacy-policy">מדיניות פרטיות</Link><a href={'mailto:'+businessEmail}>{businessEmail}</a></div></footer>
  <div className="mobile-sticky" hidden={orderVisible}><div><b>BUNDLE SALE</b><span>מ־{shekels(large.unit)} ₪ לחולצה</span></div><button onClick={()=>choose()}>בחרו באנדל <ArrowUpLeft size={18}/></button></div>
 </main>;
}
