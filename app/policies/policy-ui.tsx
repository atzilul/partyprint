import Link from '@/components/safe-link';
import {AlertCircle,Check,Clock3,HeartHandshake,LucideIcon,MapPin,MessageCircle,PackageCheck,Palette,RefreshCw,ShieldCheck,Truck} from 'lucide-react';
import type {ReactNode,CSSProperties} from 'react';
import {SeoFooter,SeoNav} from '@/components/seo-layout';

export type PolicyFlowStep = {icon: LucideIcon; title: string; text: string};
export type PolicyFaqItem = {question: string; answer: string};

export function PolicyLayout({children}:{children:ReactNode}) {
  return <main className="seo-page policy-page" dir="rtl"><SeoNav/>{children}<SeoFooter/></main>;
}

export function PolicyHero({eyebrow,title,highlight,intro,icon:Icon}:{eyebrow:string;title:string;highlight:string;intro:string;icon:LucideIcon}) {
  return <section className="policy-hero"><div className="policy-hero-copy"><span className="seo-kicker">{eyebrow}</span><h1>{title}<br/><span>{highlight}</span></h1><p>{intro}</p><Link className="seo-primary-cta" href="/#order">יש לי רעיון · מתחילים בלי חיוב <span aria-hidden="true">←</span></Link></div><div className="policy-hero-icon" aria-hidden="true"><Icon size={72}/><i>✳</i></div></section>;
}

export function PolicyFlow({steps}:{steps:PolicyFlowStep[]}) {
  return <section className="policy-flow" aria-labelledby="policy-flow-title"><div className="policy-section-heading"><div><span className="seo-kicker">THE EASY PART</span><h2 id="policy-flow-title">ככה זה עובד</h2></div><p>כמה צעדים ברורים, בלי אותיות קטנות שמתחבאות באמצע.</p></div><div className="policy-flow-track">{steps.map((step,index)=>{const Icon=step.icon;return <div className="policy-flow-step" key={step.title} style={{'--step':index} as CSSProperties}><div className="policy-flow-icon"><Icon size={24}/><b>0{index+1}</b></div><div><h3>{step.title}</h3><p>{step.text}</p></div>{index<steps.length-1&&<span className="policy-flow-arrow" aria-hidden="true">←</span>}</div>})}</div></section>;
}

export function PolicyRibbon({icon:Icon,title,text,tone='acid'}:{icon:LucideIcon;title:string;text:string;tone?:'acid'|'dark'|'orange'}) {
  return <aside className={`policy-ribbon ${tone}`}><Icon size={28}/><div><strong>{title}</strong><p>{text}</p></div></aside>;
}

export function PolicySection({number,title,children}:{number:string;title:string;children:ReactNode}) {
  return <section className="policy-copy-section"><span className="policy-section-number">{number}</span><div><h2>{title}</h2>{children}</div></section>;
}

export function PolicyFAQ({items}:{items:PolicyFaqItem[]}) {
  return <section className="policy-faq" aria-labelledby="policy-faq-title"><span className="seo-kicker">GOOD QUESTIONS</span><h2 id="policy-faq-title">שאלות ששווה לשאול</h2>{items.map(item=><details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>;
}

export function PolicyCTA({title,text}:{title:string;text:string}) {
  return <section className="policy-cta"><div><span className="seo-kicker">READY WHEN YOU ARE</span><h2>{title}</h2><p>{text}</p></div><div className="policy-cta-actions"><Link className="seo-primary-cta" href="/#order">מתחילים בלי חיוב <span aria-hidden="true">←</span></Link><a className="policy-whatsapp" href="https://wa.me/972552896236" target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> שאלה? דברו איתנו</a></div></section>;
}

export const policyIcons = {check:Check,clock:Clock3,heart:HeartHandshake,map:MapPin,message:MessageCircle,package:PackageCheck,palette:Palette,refresh:RefreshCw,shield:ShieldCheck,truck:Truck,alert:AlertCircle};
