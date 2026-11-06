'use client';
import {Fragment,useEffect,useMemo,useState} from 'react';
import type {CSSProperties} from 'react';
import {ArrowUpLeft,ArrowLeft,Sparkles,Upload,Check,CheckCheck,Truck,Palette,Plus,Phone,MessageCircle,ShieldCheck,CreditCard} from 'lucide-react';
import Link from '@/components/safe-link';
import OptimizedImage,{imageSrcSet,imageSetFor} from '@/components/optimized-image';
import OrderRequestForm from '@/components/order-request-form';
import OccasionsMenu,{BundleSaleLink} from '@/components/occasions-menu';
import {useRunning,reducedMotion} from '@/components/use-running';
import {Quantity,Motion} from '@/app/home-client';
import {LANDING_HOME_CONTENT} from '@/lib/landing-home-content';
import {PRICE_PAGE_FOR} from '@/lib/price-answers';
import type {Crop,LandingHomeContent} from '@/lib/landing-home-content';
import {landingFaq} from '@/lib/home-faq';
import {packs,MIN_SHIRT_QUANTITY,MAX_SHIRT_QUANTITY,SINGLE_PACK_INDEX,designModeFor,designSurcharge} from '@/lib/catalog';
import type {DesignMode} from '@/lib/catalog';
import {DEFAULT_PRICING,priceFor,unitPriceFor,designFeeFor} from '@/lib/pricing';
import {withFees} from '@/lib/fee-text';
import type {Pricing} from '@/lib/pricing';
import {normalizeOrderQuantity} from '@/lib/order-quantity';
import {track,siteEvent,packageType,requestMode} from '@/lib/analytics';
import type {LandingVariantKey} from '@/lib/landing-variants';
import './landing-home.css';

/**
 * A landing page that is the home page for one audience: the same classes,
 * sections and motion as app/home-client.tsx, with every word and picture about
 * that audience. The process (photos, design, the group wearing it) plays in the
 * hero and again, step by step, in the machine.
 */
const heroSizes='(max-width: 680px) 100vw, (min-width: 1500px) max(52vw, 820px), max(52vw, 730px)';
const detailSizes='1254px';
const WHATSAPP='https://wa.me/972552896236';
const WHATSAPP_QUESTION=WHATSAPP+'?text='+encodeURIComponent('היי, יש לי שאלה לפני הזמנה');

/**
 * A magnified part of an artwork, filling its (positioned) parent. The image is laid out at
 * the size that covers the frame times the scale, then shifted so the chosen point sits in
 * the middle, so the view is exact whatever the proportions of the artwork and the frame.
 */
const round=(value:number)=>Math.round(value*1000)/1000;
function CropImage({asset,alt,crop,sizes=detailSizes,eager=false}:{asset:string;alt:string;crop:Crop;sizes?:string;eager?:boolean}){
 const set=imageSetFor(asset),ratio=set.width/set.height,scale=crop.scale*100;
 const width='max('+round(scale)+'cqw, '+round(scale*ratio)+'cqh)',height='max('+round(scale)+'cqh, '+round(scale/ratio)+'cqw)';
 const style:CSSProperties={position:'absolute',inset:'auto',left:'calc(50cqw - '+round(crop.x/100)+' * '+width+')',top:'calc(50cqh - '+round(crop.y/100)+' * '+height+')',width,height,maxWidth:'none',maxHeight:'none',objectFit:'cover',transform:'none',animation:'none',transition:'none'};
 return <span className="lh-crop"><OptimizedImage asset={asset} alt={alt} sizes={sizes} loading={eager?'eager':'lazy'} style={style}/></span>;
}
const STAGE_MS=[4200,3800,5200];
/** The hero artwork tells the story in three beats: the photos they send, the design, the group wearing it. */
function HeroStory({c}:{c:LandingHomeContent}){
 const s=c.story,{root,running}=useRunning<HTMLDivElement>(.35),[stage,setStage]=useState(0);
 useEffect(()=>{if(!reducedMotion())return;const id=window.setTimeout(()=>setStage(2),0);return()=>window.clearTimeout(id);},[]);
 useEffect(()=>{if(!running)return;const id=window.setTimeout(()=>setStage(v=>(v+1)%3),STAGE_MS[stage]);return()=>window.clearTimeout(id);},[running,stage]);
 return <div ref={root} className={'hero-art lh-story lh-stage-'+stage+(running?' is-running':' is-paused')}>
  <OptimizedImage asset={s.asset} alt={s.alt} sizes={heroSizes} fetchPriority="high" loading="eager"/>
  <div className="lh-veil" aria-hidden="true"/>
  <div className="lh-chat" aria-hidden={stage!==0}>
   <div className="lh-chat-head"><span aria-hidden="true">{s.chatIcon}</span><div><b>{s.chatTitle}</b><small>{s.chatMembers}</small></div></div>
   <p className="lh-bubble">{s.chatMessage}</p>
   <div className="lh-thumbs">{s.faces.map((crop,i)=><span key={i} style={{'--i':i} as CSSProperties}><CropImage asset={s.asset} alt="" crop={crop} sizes={heroSizes} eager/></span>)}</div>
   <span className="lh-sent">{s.chatPhotos} <CheckCheck size={15} aria-hidden="true"/></span>
  </div>
  <div className="lh-design" aria-hidden={stage!==1}>
   <span className="lh-design-tag"><Sparkles size={14} aria-hidden="true"/> {s.designTag}</span>
   <div className="lh-design-art"><CropImage asset={s.asset} alt="" crop={s.print} eager/><i className="lh-scan" aria-hidden="true"/></div>
   <span className="lh-design-stamp"><Check size={15} aria-hidden="true"/> {s.stamp}</span>
  </div>
  <div className="lh-confetti" aria-hidden="true">{Array.from({length:14},(_,n)=><i key={n} style={{'--n':n} as CSSProperties}/>)}</div>
  <div className="art-label" dir="ltr" lang="en">DESIGNED<br/><b>JUST FOR YOU.</b></div>
  <span className="art-note" dir="ltr" lang="en">{c.hero.english}</span>
  <span className="image-caption">{c.hero.caption}</span>
  <div className="lh-steps" role="group" aria-label="שלבי התהליך">{s.steps.map((label,i)=><button type="button" key={label} className={i===stage?'is-active':i<stage?'is-done':''} aria-pressed={i===stage} onClick={()=>setStage(i)}><span>0{i+1}</span><b>{label}</b><i style={{animationDuration:STAGE_MS[i]+'ms'}} aria-hidden="true"/></button>)}</div>
 </div>;
}

const STEP_ICONS=[Upload,Palette,Sparkles,Truck];
/** The home page's machine, playing this audience's own story. */
function LandingProcess({c}:{c:LandingHomeContent}){
 const h=c.how,m=c.machine,{root,running}=useRunning<HTMLDivElement>(.2),[active,setActive]=useState(0);
 useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setActive(v=>(v+1)%4),5000);return()=>window.clearInterval(id);},[running,active]);
 return <div ref={root} className={'magic-machine '+(running?'is-running':'is-paused')}>
  <div className="machine-top"><span><Sparkles size={17}/> THE WOW MACHINE</span></div>
  <div className="machine-flow">{h.steps.map((step,i)=>{const Icon=STEP_ICONS[i];return <div className={'machine-step '+(active===i?'is-active':'')+(active>i?' is-complete':'')} key={step.short}>
   <button className="machine-tab" aria-current={active===i?'step':undefined} onClick={()=>setActive(i)}><span>0{i+1}</span><b>{step.short}</b><Icon size={18}/></button>
   <div className={'machine-visual machine-visual-'+i} key={i+'-'+(active===i)}>
    {i===0?<><div className="machine-photo photo-reference"><CropImage asset={m.faceAsset??m.asset} alt={m.faceAlt} crop={m.face}/></div><div className="upload-chip"><Upload size={14}/> {h.fileChip} <Check size={14}/></div></>
    :i===1?<><div className="prompt-window"><span dir="ltr">{h.brief.label}</span><p>{h.brief.lines.map(line=><span key={line}>{line}<br/></span>)}<b>{h.brief.bold}</b><i/></p><div>{h.brief.chips.map(chip=><span key={chip}>{chip}</span>)}</div></div><Sparkles className="prompt-spark" size={36}/></>
    :i===2?<><div className="machine-photo photo-art"><CropImage asset={m.artAsset??m.asset} alt={m.artAlt} crop={m.art}/></div><div className="scan-line"/><span className="approval-stamp"><Check size={15}/> {h.stamp}</span></>
    :<><div className="machine-photo photo-shirt"><CropImage asset={m.wornAsset??m.asset} alt={m.wornAlt} crop={m.worn}/></div><div className="delivery-chip"><Truck size={17}/> {h.delivery}</div><div className="celebration" aria-hidden="true">{Array.from({length:10},(_,n)=><i key={n} style={{'--n':n} as CSSProperties}/>)}</div></>}
   </div>
   <p className="machine-description">{step.text}</p>
   {i<3&&<div className="machine-connector" aria-hidden="true"><ArrowLeft size={24}/><span/></div>}
   <div className="step-timer"><span/></div>
  </div>;})}</div>
  <div className="machine-bottom"><span>{h.note}</span><button onClick={()=>setActive((active+1)%4)}>לשלב הבא <ArrowLeft size={17}/></button></div>
 </div>;
}

/** A framed crop's own shape and backdrop, when it sets them. */
const frame=(crop:Crop):CSSProperties=>({...(crop.aspect?{aspectRatio:String(crop.aspect)}:{}),...(crop.bg?{background:crop.bg}:{})});
const CONFIDENCE_ICONS=[CreditCard,Palette,Check,Truck];
const TRUST_ICONS=[Truck,Palette,ShieldCheck];
const lines=(items:string[])=>items.map((line,i)=><span key={line}>{i>0&&<br/>}{line}</span>);

/** `initialPricing` is the admin price list read on the server, so the first HTML already carries the prices in force. */
type Props={variant:LandingVariantKey;initialPricing?:Pricing;businessEmail:string;paymentDisclosure:string};
export default function LandingHome({variant,initialPricing,businessEmail,paymentDisclosure}:Props){
 const base=LANDING_HOME_CONTENT[variant],packIndex=base.packIndex,pack=packs[packIndex];
 // The open-ended package starts at four shirts, as on the home page.
 const startQuantity=packIndex===4?4:pack.n;
 const [mobileNavOpen,setMobileNavOpen]=useState(false),[quantities,setQuantities]=useState(()=>packs.map((p,i)=>i===4?4:p.n)),[selectedPack,setSelectedPack]=useState(packIndex),[mode,setMode]=useState<string>(base.mode),[busy,setBusy]=useState(false),[openSignal,setOpenSignal]=useState(0),[pricing,setPricing]=useState<Pricing>(initialPricing??DEFAULT_PRICING),[orderVisible,setOrderVisible]=useState(false),[designMode,setDesignMode]=useState<DesignMode>('shared');
 // The audience copy with the fees of the price list in force.
 const c=useMemo(()=>withFees(base,pricing),[base,pricing]);
 useEffect(()=>{
  fetch('/api/pricing').then(r=>{if(!r.ok)throw Error();return r.json();}).then(v=>setPricing(v as Pricing)).catch(()=>{});
  siteEvent('view');
  // The home page later opens on the same audience.
  try{document.cookie='partyprint_variant_v1='+variant+'; Max-Age=604800; Path=/; SameSite=Lax; Secure';}catch{}
  const node=document.getElementById('order');const observer=new IntersectionObserver(([entry])=>setOrderVisible(entry.isIntersecting),{threshold:0});if(node)observer.observe(node);
  return()=>observer.disconnect();
 },[variant]);
 // Where the audience offers it (team), the visitor picks one shared design or a design for every shirt.
 const design=designModeFor(packIndex,designMode),designExtra=designSurcharge(packIndex,1,design,designFeeFor(pricing));
 const quantity=quantities[packIndex],unit=unitPriceFor(pricing,quantity)+designExtra;
 function setQuantity(i:number,n:number){if(busy||!packs[i]||i===SINGLE_PACK_INDEX)return;const next=normalizeOrderQuantity(n);setQuantities(previous=>previous.map((value,index)=>index===i?next:value));}
 function choose(nextMode:string=c.mode){
  if(busy)return;
  track('select_package',{package_type:packageType(packIndex),request_mode:requestMode(nextMode),value:priceFor(pricing,packIndex,quantity,design),currency:'ILS',num_items:quantity});
  setSelectedPack(packIndex);setMode(nextMode);setOpenSignal(v=>v+1);setMobileNavOpen(false);
  document.getElementById('order')?.scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'start'});
 }
 const faq=landingFaq(paymentDisclosure,c.faq,pricing);
 const tiers=(Array.isArray(pricing.tiers)?pricing.tiers:[]).filter(tier=>Number.isFinite(tier.quantity)&&tier.price>0).sort((a,b)=>a.quantity-b.quantity);
 const ladder=tiers.map((tier,i)=>{const upper=i<tiers.length-1?tiers[i+1].quantity-1:MAX_SHIRT_QUANTITY;return {label:tier.quantity===upper?tier.quantity+' חולצות':i===tiers.length-1?tier.quantity+' חולצות ומעלה':tier.quantity+' עד '+upper+' חולצות',price:tier.price+designExtra,here:quantity>=tier.quantity&&quantity<=upper};});
 const closeNav=()=>setMobileNavOpen(false);
 return <main className={'lh-page lh-'+c.accent} data-vertical={variant}>
  <link rel="preload" as="image" type="image/avif" href={imageSetFor(c.story.asset).avif.find(item=>item.width===960)?.src} imageSrcSet={imageSrcSet(c.story.asset,'avif')} imageSizes={heroSizes} fetchPriority="high"/>
  <a className="skip-link" href="#order">דילוג לטופס</a>
  <div className="topbar"><div className="topbar-message"><span>✳</span> מחיר ברור · אישור לפני הדפסה · משלוח עד הבית</div><div className="topbar-promo" id="launch-offer-slot" aria-live="polite"><span className="promo-fallback">מתחילים בלי חיוב · מאשרים לפני הדפסה</span></div></div>
  <header className="nav wrap"><Link href="/" className="logo" dir="ltr" aria-label="PARTYPRINT, לאתר המלא">PARTY<span>PRINT</span><i>✳</i></Link><button type="button" className="mobile-nav-toggle" aria-label="פתיחת תפריט ניווט" aria-expanded={mobileNavOpen} aria-controls="site-navigation" onClick={()=>setMobileNavOpen(value=>!value)}>☰</button><nav id="site-navigation" className={mobileNavOpen?'is-open':''}><a onClick={closeNav} href="#how">איך זה עובד?</a><OccasionsMenu current={variant}/><a onClick={closeNav} href="#packages">{c.nav.price}</a><a onClick={closeNav} href="#confidence">{c.nav.confidence}</a><a onClick={closeNav} href="#faq">שאלות טובות</a><BundleSaleLink/><a href="#order-form" onClick={e=>{e.preventDefault();choose('lead');}}>דברו איתנו</a></nav><button className="small-cta" onClick={()=>choose()}>התחילו לעצב <ArrowUpLeft size={17}/></button></header>

  <section className={'hero wrap audience-'+c.accent+' lh-hero'}>
   <div className="hero-copy">
    <div className="audience-copy"><h1><small>{c.hero.lead}</small>{c.hero.pre}<br/><span>{c.hero.headline}</span><i>✳</i></h1><p>{c.hero.desc}</p><div className="custom-event-chips" aria-label="כיוונים לעיצוב">{c.hero.chips.map(chip=><span key={chip}>{chip}</span>)}</div></div>
    <button className="cta orange-bg" onClick={()=>choose()}>{c.hero.cta} <ArrowUpLeft/></button>
    <ul className="lh-hero-facts"><li className="lh-hero-price"><b>{unitPriceFor(pricing,startQuantity).toLocaleString('he-IL')} ₪</b> {c.hero.priceNote}</li>{c.hero.facts.map(fact=><li key={fact}><Check size={15} aria-hidden="true"/>{fact}</li>)}</ul>
   </div>
   <HeroStory c={c}/>
  </section>

  <section id="how" className="how section"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{c.how.eyebrow}</div><h2>{c.how.title[0]}<br/><span>{c.how.title[1]}</span></h2></div><p>{lines(c.how.intro)}</p></div><LandingProcess c={c}/><p className="terms">{c.how.terms}</p><div className="desktop-order-cta"><button type="button" className="cta orange-bg" onClick={()=>choose()}>{c.hero.cta} <ArrowUpLeft/></button></div></div></section>

  <div className="ticker" aria-label={c.ticker.join(', ')}><div className="marquee-track" aria-hidden="true">{[0,1].map(n=><div className="marquee-group" key={n}>{c.ticker.map(word=><Fragment key={word}>{word} <i>✳</i></Fragment>)}</div>)}</div></div>

  <section className="inspiration section"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{c.inspo.eyebrow}</div><h2>{c.inspo.title[0]}<br/><span>{c.inspo.title[1]}</span></h2></div><p>{lines(c.inspo.intro)}</p></div><div className="inspo-grid"><div className="inspo-photo">{c.inspo.crop?<div className="lh-inspo-crop" style={frame(c.inspo.crop)}><CropImage asset={c.inspo.asset} alt={c.inspo.alt} crop={c.inspo.crop}/></div>:<OptimizedImage asset={c.inspo.asset} sizes="(max-width: 680px) calc(100vw - 40px), 52vw" alt={c.inspo.alt}/>}<span className="photo-stamp">{c.inspo.stamp}</span></div><div className="inspo-copy"><span className="small-tag">{c.inspo.tag}</span><h3>{c.inspo.lines.map(line=><span key={line}>{line}<br/></span>)}<em>{c.inspo.accent}</em></h3><p>{c.inspo.text}</p><div className="idea-chips">{c.inspo.ideas.map(idea=><span key={idea}>{idea}</span>)}</div><a href="#order" className="text-link" onClick={e=>{e.preventDefault();choose();}}>{c.inspo.link} <ArrowUpLeft size={23}/></a></div></div><p className="mock-caption">{c.inspo.caption}</p></div></section>

  <section id="examples" className="design-gallery section"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{c.examples.eyebrow}</div><h2>{c.examples.title[0]}<br/><span>{c.examples.title[1]}</span></h2></div><p>{lines(c.examples.intro)}</p></div><div className="audience-gallery lh-gallery">{c.examples.cards.map((card,i)=><article className={'gallery-card gallery-'+(i+1)+(card.crop?' lh-card-crop':'')} key={card.title}><div style={card.crop?frame(card.crop):undefined}>{card.crop?<CropImage asset={card.asset} alt={card.alt} crop={card.crop}/>:<OptimizedImage asset={card.asset} alt={card.alt} sizes="(max-width: 680px) 82vw, 30vw"/>}<span className="gallery-sticker" dir="ltr" lang="en">{card.sticker}</span></div><div className="gallery-caption"><h3>{card.title}</h3><button onClick={()=>choose()}>עצבו גם לנו <ArrowUpLeft size={19}/></button></div>{card.badge&&<span className={'lh-card-badge'+(card.badge.extra?' is-extra':'')}>{card.badge.text}</span>}<p>{card.text}</p></article>)}</div><p className="mock-caption">{c.examples.caption}</p></div></section>

  <section id="packages" className="packages wrap section"><div className="section-head"><div><div className="eyebrow">{c.packages.eyebrow}</div><h2>{c.packages.title[0]}<br/><span>{c.packages.title[1]}</span></h2></div><p>{c.packages.intro.slice(0,-1).map(line=><span key={line}>{line}<br/></span>)}<strong>{c.packages.intro[c.packages.intro.length-1]}</strong></p></div>
   {c.design&&<div className="lh-design-choice" role="radiogroup" aria-labelledby="lh-design-title"><div className="lh-design-head"><h3 id="lh-design-title">{c.design.title}</h3><p>{c.design.intro}</p></div>{(['shared','individual'] as const).map(option=>{const copy=c.design![option],selected=design===option;return <button type="button" role="radio" aria-checked={selected} key={option} className={selected?'is-selected':''} onClick={()=>setDesignMode(option)}><span className="lh-design-mark" aria-hidden="true">{selected&&<Check size={15}/>}</span><b>{copy.label}</b><em>{copy.price}</em><p>{copy.text}</p><small>{quantity===1?'חולצה אחת':quantity+' חולצות'}: {priceFor(pricing,packIndex,quantity,option).toLocaleString('he-IL')} ₪ · {(unitPriceFor(pricing,quantity)+designSurcharge(packIndex,1,option)).toLocaleString('he-IL')} ₪ לחולצה</small></button>;})}</div>}
   <div className="lh-pack-grid">
    <article className={'package '+pack.cls+' lh-package'}><div className="pack-top"><span>{pack.tag}</span><b>{pack.icon}</b></div><span className="pack-number" aria-hidden="true">0{packIndex+1}</span><h3>{pack.name}</h3><p>{pack.desc}</p><div className="pack-price"><strong>{priceFor(pricing,packIndex,quantity,design).toLocaleString()}<small> ₪</small></strong><span className="price-per-shirt"><b>{unit.toLocaleString()} ₪</b> לחולצה</span><span className="price-includes">{c.design?c.design.priceIncludes[design]:'כולל עיצוב אישי, הדפסה ומשלוח עד הבית'}</span></div><Quantity label="כמה חולצות?" value={quantity} min={MIN_SHIRT_QUANTITY} onChange={n=>setQuantity(packIndex,n)}/><div className="pack-includes">{(c.design&&design==='individual'?[c.design.includes,...c.packages.includes.slice(1)]:c.packages.includes).map(text=><span key={text}><Check/> {text}</span>)}</div><button onClick={()=>choose()}>{c.packages.button} <ArrowUpLeft size={19}/></button></article>
    <div className="lh-pack-side">
     <div className="lh-ladder"><h3>{c.packages.ladderTitle}</h3>{c.design&&design==='individual'&&<p className="lh-ladder-note">{c.design.ladderNote}</p>}<ol>{ladder.map(row=><li key={row.label} className={row.here?'is-here':''}><span>{row.label}</span>{row.here&&<em>{c.packages.ladderHere}</em>}<b>{row.price.toLocaleString('he-IL')} ₪ <small>לחולצה</small></b></li>)}</ol></div>
     <div className="lh-pack-notes"><h3>{c.packages.sideTitle}</h3><ul>{c.packages.side.map(item=><li key={item.title}><Check size={17} aria-hidden="true"/><div><b>{item.title}</b><p>{item.text}</p></div></li>)}</ul></div>
    </div>
   </div>
   <p className="package-foot">{c.packages.foot}</p>
   <p className="lh-price-link"><Link href={PRICE_PAGE_FOR[variant].href}>{PRICE_PAGE_FOR[variant].label} <ArrowUpLeft size={16} aria-hidden="true"/></Link></p>
  </section>

  <section id="confidence" className="confidence section"><div className="wrap"><div className="section-head"><div><div className="eyebrow">{c.confidence.eyebrow}</div><h2>{c.confidence.title[0]}<br/><span>{c.confidence.title[1]}</span></h2></div><p>{lines(c.confidence.intro)}</p></div><div className="offer-summary"><div><span className="small-tag">{c.confidence.summaryTag}</span><strong>{c.confidence.summaryTitle}</strong><p>{c.confidence.summaryText}<br/><strong>{c.confidence.summaryBold}</strong></p></div><ul>{c.confidence.checks.map(text=><li key={text}><Check size={17}/> {text}</li>)}</ul></div><div className="confidence-grid">{c.confidence.cards.map((item,i)=>{const Icon=CONFIDENCE_ICONS[i];return <article key={item.title}><div className={'confidence-illustration illustration-'+i} aria-hidden="true"><Icon size={32}/></div><h3>{item.title}</h3><p>{item.text}</p></article>;})}</div><div className="studio-contact"><div><span className="studio-mark" aria-hidden="true">P✳</span><div><strong>{c.confidence.contactTitle}</strong><p>{c.confidence.contactText}</p></div></div><div className="studio-links"><a href={WHATSAPP_QUESTION} target="_blank" rel="noopener noreferrer" data-cta-location="landing_confidence"><MessageCircle size={19}/> שואלים ב־WhatsApp</a><a href={WHATSAPP}><Phone size={17}/><b dir="ltr">055 289 6236</b></a></div></div></div></section>

  <section className="statement"><div className="statement-image" style={{height:'100%',background:'var(--lh-photo)'}}><OptimizedImage asset={c.statement.asset} sizes="(max-width: 680px) 100vw, 55vw" alt={c.statement.alt} style={{position:'absolute',inset:0,display:'block',width:'100%',height:'100%',minWidth:'100%',minHeight:'100%',maxWidth:'none',objectFit:'cover',objectPosition:'center 30%',backfaceVisibility:'hidden'}}/></div><div className="statement-copy"><span dir="ltr" lang="en">{c.statement.tag}</span><h2>{c.statement.lines.map(line=><span key={line}>{line}<br/></span>)}<em>{c.statement.accent}</em></h2><a href="#order" onClick={e=>{e.preventDefault();choose();}}>{c.statement.link} <ArrowUpLeft/></a></div></section>

  <section id="order" className="order section pp-order-section"><div className="wrap pp-order-layout"><aside className="pp-order-aside"><h2>{c.order.title[0]}<br/>{c.order.title[1]}</h2><p>{c.order.text}</p><ul><li><Palette size={20}/><span>{c.order.points[0]}</span></li><li><ShieldCheck size={20}/><span>{c.order.points[1]}</span></li><li><Truck size={20}/><span>{c.order.points[2]}</span></li></ul><div className="pp-order-help"><span>{c.order.help}</span><a href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-cta-location="order_form"><MessageCircle size={18}/> מתייעצים ב־WhatsApp</a></div></aside><OrderRequestForm pack={selectedPack} quantities={quantities} pricing={pricing} mode={mode} openSignal={openSignal} onPack={setSelectedPack} onQuantity={setQuantity} onMode={setMode} onPricing={setPricing} onBusy={setBusy} designMode={designMode} onDesignMode={setDesignMode}/></div></section>

  <section id="faq" className="faq wrap section"><div><div className="eyebrow">GOOD QUESTIONS</div><h2>רגע, ומה עם...?</h2></div><div>{faq.map(([question,answer])=><details key={question}><summary>{question}<Plus size={18}/></summary><p>{answer}</p></details>)}</div></section>

  <section id="contact" className="contact-section wrap"><div><div className="eyebrow">REAL PEOPLE. REAL HELP.</div><h2>{c.contact.title[0]}<br/><span>{c.contact.title[1]}</span></h2><p>{lines(c.contact.text)}</p></div><div className="contact-actions"><a className="contact-whatsapp" href={WHATSAPP+'?text='+encodeURIComponent(c.contact.whatsapp)} target="_blank" rel="noopener noreferrer" data-cta-location="landing_contact"><MessageCircle/> מדברים ב־WhatsApp <ArrowUpLeft/></a><a href={WHATSAPP}><Phone size={20}/><span dir="ltr">055 289 6236</span></a><a href={'mailto:'+businessEmail}>{businessEmail}</a></div></section>

  <section className="trust-strip"><div className="wrap">{c.trust.map((item,i)=>{const Icon=TRUST_ICONS[i];return <div key={item.title}><Icon/><strong>{item.title}</strong><span>{item.text}</span></div>;})}<div><Phone/><strong>יש עם מי לדבר</strong><a href={WHATSAPP} dir="ltr">055 289 6236</a></div></div><p>* המועד כפוף לאישור מראש לפי הכתובת והיקף ההזמנה. לא כולל זמן עיצוב ותיקונים.</p><div className="payment-status"><CreditCard size={19}/><span>הטופס אינו גובה תשלום. אמצעי התשלום יתואמו לאחר אישור ההזמנה.</span></div></section>

  <Motion/>
  <footer className="wrap"><Link className="logo" dir="ltr" href="/">PARTY<span>PRINT</span><i>✳</i></Link><p>אנשים אמיתיים. עיצובים לא רגילים.</p><div className="footer-contact"><Link href="/">לאתר המלא</Link><a href="#contact">יצירת קשר</a><Link href="/terms">תקנון</Link><Link href="/privacy-policy">מדיניות פרטיות</Link><a href={'mailto:'+businessEmail}>{businessEmail}</a></div></footer>
  <div className="mobile-sticky" hidden={orderVisible}><div><b>{c.sticky.title}</b><span>{c.sticky.text}</span></div><button onClick={()=>choose()}>{c.sticky.button} <ArrowUpLeft size={18}/></button></div>
 </main>;
}
