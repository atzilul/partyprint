'use client';
/* eslint-disable @next/next/no-img-element -- responsive art through the same optimized pipeline as the home page. */
import {useEffect,useLayoutEffect,useState} from 'react';
import type {CSSProperties} from 'react';
import {ArrowUpLeft,Camera,Ruler,ShieldCheck,Truck,Users,Tag,Palette,Sparkles,MessageCircle,Check,Minus,Plus,Coins} from 'lucide-react';
import Link from '@/components/safe-link';
import OptimizedImage,{imageSrcSet,imageSetFor} from '@/components/optimized-image';
import OrderRequestForm from '@/components/order-request-form';
import ResponsePromise from '@/components/response-promise';
import {Process} from '@/app/home-client';
import {LANDING_CONTENT} from '@/lib/landing-content';
import type {LandingIcon} from '@/lib/landing-content';
import {landingFaq} from '@/lib/home-faq';
import {packs,MIN_SHIRT_QUANTITY,MAX_SHIRT_QUANTITY,SINGLE_PACK_INDEX} from '@/lib/catalog';
import {DEFAULT_PRICING,priceFor,unitPriceFor} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';
import {normalizeOrderQuantity} from '@/lib/order-quantity';
import {track,siteEvent,packageType,requestMode} from '@/lib/analytics';
import type {LandingVariantKey} from '@/lib/landing-variants';
import './landing.css';

const ICONS:Record<LandingIcon,typeof Camera>={photo:Camera,sizes:Ruler,approve:ShieldCheck,speed:Truck,group:Users,logo:Tag,colors:Palette,idea:Sparkles,price:Coins};
const heroSizes='(max-width: 680px) 100vw, (min-width: 1500px) 720px, 50vw';
const WHATSAPP='https://wa.me/972552896236';
const reducedMotion=()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cycles the audience words in the custom hero. Static first word on the server. */
function RotatingWord({words}:{words:string[]}){
 const [index,setIndex]=useState(0);
 useEffect(()=>{if(reducedMotion())return;const timer=window.setInterval(()=>setIndex(v=>(v+1)%words.length),2200);return()=>window.clearInterval(timer);},[words.length]);
 return <span className="lp-rotating" key={index}>{words[index]}</span>;
}
/**
 * Reveals [data-reveal] blocks as they scroll into view. Without JavaScript, or
 * until it runs, everything is visible: the hidden state is only applied under
 * .lp-js, and blocks already on screen are marked visible in the same frame.
 */
function useReveal(){
 useLayoutEffect(()=>{
  const root=document.querySelector('.lp');
  const nodes=Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if(!root||reducedMotion())return;
  const viewport=window.innerHeight;
  const pending=nodes.filter(node=>{const inView=node.getBoundingClientRect().top<viewport*.92;if(inView)node.classList.add('is-in');return !inView;});
  root.classList.add('lp-js');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-in');observer.unobserve(entry.target);}}),{threshold:.1,rootMargin:'0px 0px -6% 0px'});
  pending.forEach(node=>observer.observe(node));
  // Safety net: nothing stays hidden if intersection callbacks never arrive (throttled or odd embeds).
  const fallback=window.setTimeout(()=>{pending.forEach(node=>node.classList.add('is-in'));observer.disconnect();},4000);
  return()=>{window.clearTimeout(fallback);observer.disconnect();root.classList.remove('lp-js');};
 },[]);
}
const delay=(ms:number)=>({'--d':ms+'ms'} as CSSProperties);

type Props={variant:LandingVariantKey;businessEmail:string;paymentDisclosure:string};
export default function LandingPage({variant,businessEmail,paymentDisclosure}:Props){
 const c=LANDING_CONTENT[variant],packIndex=c.packIndex,pack=packs[packIndex];
 const [quantities,setQuantities]=useState(()=>packs.map((p,i)=>i===4?4:p.n)),[selectedPack,setSelectedPack]=useState(packIndex),[mode,setMode]=useState<string>(c.mode),[busy,setBusy]=useState(false),[openSignal,setOpenSignal]=useState(0),[pricing,setPricing]=useState<Pricing>(DEFAULT_PRICING),[orderVisible,setOrderVisible]=useState(false);
 useReveal();
 useEffect(()=>{
  fetch('/api/pricing').then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>setPricing(v as Pricing)).catch(()=>{});
  siteEvent('view');
  // The home page later opens on the same audience.
  try{document.cookie='partyprint_variant_v1='+variant+'; Max-Age=604800; Path=/; SameSite=Lax; Secure';}catch{}
  const node=document.getElementById('order');const observer=new IntersectionObserver(([entry])=>setOrderVisible(entry.isIntersecting),{threshold:0});if(node)observer.observe(node);
  return()=>observer.disconnect();
 },[variant]);
 const quantity=quantities[packIndex];
 function setQuantity(i:number,n:number){if(busy||!packs[i]||i===SINGLE_PACK_INDEX)return;const next=normalizeOrderQuantity(n);setQuantities(previous=>previous.map((value,index)=>index===i?next:value));}
 function choose(){
  if(busy)return;
  track('select_package',{package_type:packageType(packIndex),request_mode:requestMode(c.mode),value:priceFor(pricing,packIndex,quantity),currency:'ILS',num_items:quantity});
  setSelectedPack(packIndex);setMode(c.mode);setOpenSignal(v=>v+1);
  document.getElementById('order')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
 }
 const faq=landingFaq(paymentDisclosure,c.faq);
 const fromPrice=unitPriceFor(pricing,Math.max(pack.n,MIN_SHIRT_QUANTITY));
 return <main className={'lp lp-'+variant} data-vertical={variant}>
  <link rel="preload" as="image" type="image/avif" href={imageSetFor(c.heroAsset).avif.find(item=>item.width===960)?.src} imageSrcSet={imageSrcSet(c.heroAsset,'avif')} imageSizes={heroSizes} fetchPriority="high"/>
  <a className="skip-link" href="#order">דילוג לטופס</a>
  <div className="topbar lp-topbar"><div className="topbar-message"><span>✳</span> מחיר ברור · אישור לפני הדפסה · משלוח עד הבית</div><div className="topbar-promo" id="launch-offer-slot" aria-live="polite"><span className="promo-fallback">מתחילים בלי חיוב · מאשרים לפני הדפסה</span></div></div>
  <header className="lp-nav"><div className="wrap"><Link href="/" className="logo" dir="ltr" aria-label="PARTYPRINT, לאתר המלא">PARTY<span>PRINT</span><i>✳</i></Link><div className="lp-nav-actions"><a className="lp-nav-wa" href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-cta-location="landing_nav"><MessageCircle size={17}/><span>WhatsApp</span></a><button type="button" className="lp-nav-cta" onClick={choose}><span className="lp-nav-cta-long">{c.cta}</span><span className="lp-nav-cta-short">עצבו עכשיו</span> <ArrowUpLeft size={16}/></button></div></div></header>

  <section className="lp-hero"><div className="lp-hero-fx" aria-hidden="true"/><div className="wrap lp-hero-grid">
   <div className="lp-hero-copy">
    <span className="lp-kicker" dir="ltr" lang="en">{c.kicker}</span>
    <h1>{c.headline[0]}{c.rotating&&<> <RotatingWord words={c.rotating}/></>}<br/><span className="lp-accent">{c.headline[1]}</span></h1>
    <p className="lp-sub">{c.sub}</p>
    <div className="lp-hero-actions"><button type="button" className="cta lp-cta" onClick={choose}>{c.cta} <ArrowUpLeft/></button><span className="lp-hero-price">מ־<b>{fromPrice.toLocaleString('he-IL')} ₪</b> לחולצה · כולל עיצוב, הדפסה ומשלוח</span></div>
    <ul className="lp-hero-checks">{c.promises.slice(0,3).map(item=><li key={item.title}><Check size={14} aria-hidden="true"/>{item.title}</li>)}</ul>
   </div>
   <div className="lp-hero-art"><div className="lp-hero-frame"><OptimizedImage asset={c.heroAsset} alt={c.heroAlt} sizes={heroSizes} fetchPriority="high" loading="eager"/><span className="lp-sticker lp-sticker-a" dir="ltr" lang="en">{c.stickers[0]}</span><span className="lp-sticker lp-sticker-b" dir="ltr" lang="en">{c.stickers[1]}</span><span className="lp-sticker lp-sticker-c" dir="ltr" lang="en">{c.stickers[2]}</span><span className="lp-caption">{c.heroCaption}</span></div></div>
  </div></section>

  <div className="lp-marquee" aria-hidden="true"><div className="lp-marquee-track">{[0,1].map(n=><div key={n}>{c.marquee.map(word=><span key={word}>{word}<i>✳</i></span>)}</div>)}</div></div>

  <section className="lp-promise"><div className="wrap"><div className="lp-promise-grid">{c.promises.map((item,i)=>{const Icon=ICONS[item.icon];return <article key={item.title} data-reveal style={delay(i*90)}><div className="lp-promise-icon"><Icon size={26} aria-hidden="true"/></div><h3>{item.title}</h3><p>{item.text}</p></article>;})}</div></div></section>

  <section id="order" className="order section pp-order-section lp-order"><div className="wrap pp-order-layout"><aside className="pp-order-aside"><h2>{c.formTitle[0]}<br/>{c.formTitle[1]}</h2><p>{c.formText}</p><ul>{c.includes.slice(0,3).map(text=><li key={text}><Check size={20} aria-hidden="true"/><span>{text}</span></li>)}</ul><div className="pp-order-help"><span>מעדיפים לדבר קודם?</span><a href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-cta-location="order_form"><MessageCircle size={18}/> מתייעצים ב־WhatsApp</a></div></aside><OrderRequestForm pack={selectedPack} quantities={quantities} pricing={pricing} mode={mode} openSignal={openSignal} onPack={setSelectedPack} onQuantity={setQuantity} onMode={setMode} onPricing={setPricing} onBusy={setBusy}/></div></section>

  <section className="lp-examples"><div className="wrap"><div className="lp-head" data-reveal><div><div className="eyebrow">YOUR IDEA. OUR DESIGN.</div><h2>{c.examplesTitle[0]}<br/><span>{c.examplesTitle[1]}</span></h2></div><p>{c.examplesIntro}</p></div>
   <div className="lp-example-grid">{c.examples.map((item,i)=><article className="lp-example" key={item.title} data-reveal style={delay(i*120)}><div className="lp-example-art"><OptimizedImage asset={item.asset} alt={item.alt} sizes="(max-width: 680px) 88vw, (max-width: 1050px) 45vw, 31vw" loading="lazy"/><span className="lp-sticker" dir="ltr" lang="en">{item.sticker}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
   <div className="lp-ideas" data-reveal><span className="lp-ideas-title">{c.ideasTitle}</span><div className="lp-idea-chips">{c.ideas.map(idea=><button type="button" key={idea} onClick={choose}>{idea}</button>)}</div></div>
   <p className="lp-mock">הדמיות AI להמחשת כיווני עיצוב. העיצוב שלכם ייווצר מהתמונות ומהרעיון שלכם, ויגיע לאישורכם לפני ההדפסה.</p>
  </div></section>

  <section className="lp-story"><div className="wrap"><div className="lp-head" data-reveal><div><div className="eyebrow">FROM YOUR CAMERA ROLL TO YOUR CLOSET</div><h2>{c.storyTitle[0]}<br/><span>{c.storyTitle[1]}</span></h2></div><p>{c.storyIntro}</p></div>
   <ol className="lp-steps">{c.steps.map((step,i)=><li key={step.title} data-reveal style={delay(i*100)}><b aria-hidden="true">0{i+1}</b><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
   <div className="lp-machine" data-reveal><Process/></div>
  </div></section>

  <section className="lp-pricing"><div className="wrap lp-pricing-grid">
   <div className="lp-pricing-copy" data-reveal><div className="eyebrow" dir="ltr" lang="en">{pack.tag}</div><h2>{c.pricingTitle[0]}<br/><span>{c.pricingTitle[1]}</span></h2><p>{c.pricingNote}</p><ul className="lp-includes">{c.includes.map(text=><li key={text}><Check size={16} aria-hidden="true"/>{text}</li>)}</ul></div>
   <article className="lp-price-card" data-reveal style={delay(120)} aria-label="מחשבון מחיר">
    <span className="lp-price-name">{pack.name}</span>
    <div className="lp-qty"><span>כמה חולצות?</span><div className="lp-qty-control"><button type="button" aria-label="הפחתת חולצה" disabled={busy||quantity<=MIN_SHIRT_QUANTITY} onClick={()=>setQuantity(packIndex,quantity-1)}><Minus size={16}/></button><b aria-live="polite">{quantity}</b><button type="button" aria-label="הוספת חולצה" disabled={busy||quantity>=MAX_SHIRT_QUANTITY} onClick={()=>setQuantity(packIndex,quantity+1)}><Plus size={16}/></button></div></div>
    <div className="lp-price-total"><strong>{priceFor(pricing,packIndex,quantity).toLocaleString('he-IL')} ₪</strong><span>{unitPriceFor(pricing,quantity).toLocaleString('he-IL')} ₪ לחולצה</span></div>
    <p className="lp-price-fine">ככל שמוסיפים חולצות, המחיר לחולצה יורד. אין חיוב בשליחת הטופס. מחיר סופי לאישור לפני התשלום.</p>
    <button type="button" className="cta lp-cta" onClick={choose}>{c.cta} <ArrowUpLeft/></button>
   </article>
  </div></section>

  <section id="faq" className="lp-faq"><div className="wrap"><div className="lp-head" data-reveal><div><div className="eyebrow">GOOD QUESTIONS</div><h2>רגע, ומה עם...?</h2></div></div><div className="lp-faq-list" data-reveal>{faq.map(([question,answer])=><details key={question}><summary>{question}<Plus size={18} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></div></section>

  <section className="lp-final"><div className="wrap" data-reveal><h2>{c.finalTitle[0]}<br/><span>{c.finalTitle[1]}</span></h2><p>{c.finalText}</p><div className="lp-hero-actions"><button type="button" className="cta lp-cta" onClick={choose}>{c.cta} <ArrowUpLeft/></button><a className="lp-final-wa" href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-cta-location="landing_final"><MessageCircle size={18}/> או שואלים ב־WhatsApp</a></div><ResponsePromise className="lp-promise-line"/></div></section>

  <footer className="wrap lp-footer"><Link className="logo" dir="ltr" href="/">PARTY<span>PRINT</span><i>✳</i></Link><div className="footer-contact"><Link href="/">לאתר המלא</Link><Link href="/terms">תקנון</Link><Link href="/privacy-policy">מדיניות פרטיות</Link><a href={'mailto:'+businessEmail}>{businessEmail}</a></div></footer>
  <div className="mobile-sticky" hidden={orderVisible}><div><b>{c.stickyTitle}</b><span>{c.stickyText}</span></div><button onClick={choose}>{c.cta} <ArrowUpLeft size={18}/></button></div>
 </main>;
}
