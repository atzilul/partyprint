'use client';
/* eslint-disable @next/next/no-img-element -- responsive art through the same optimized pipeline as the home page. */
import {ArrowUpLeft} from 'lucide-react';
import OptimizedImage from '@/components/optimized-image';
import {LANDING_CONTENT} from '@/lib/landing-content';
import type {LandingVariantKey} from '@/lib/landing-variants';

/** Audience-specific design examples and idea chips for a paid landing page. */
export function LandingExamples({variant,onChoose}:{variant:LandingVariantKey;onChoose:()=>void}){
 const content=LANDING_CONTENT[variant];
 return <section className="design-gallery section landing-examples" aria-labelledby="landing-examples-title"><div className="wrap">
  <div className="section-head"><div><div className="eyebrow">YOUR IDEA. OUR DESIGN.</div><h2 id="landing-examples-title">{content.examplesTitle[0]}<br/><span>{content.examplesTitle[1]}</span></h2></div><p>{content.examplesIntro}</p></div>
  <div className="audience-gallery landing-gallery">{content.examples.map(item=><article className="gallery-card" key={item.title}><div><OptimizedImage asset={item.asset} alt={item.alt} sizes="(max-width: 680px) 82vw, (max-width: 1050px) 45vw, 30vw" loading="lazy"/><span className="gallery-sticker" dir="ltr" lang="en">{item.sticker}</span></div><div className="gallery-caption"><h3>{item.title}</h3></div><p>{item.text}</p></article>)}</div>
  <div className="landing-ideas"><span className="small-tag">{content.ideasTitle}</span><div className="landing-idea-chips">{content.ideas.map(idea=><span key={idea}>{idea}</span>)}</div></div>
  <p className="mock-caption">הדמיות AI להמחשת כיווני עיצוב. העיצוב שלכם ייווצר מהתמונות ומהרעיון שלכם, ויגיע לאישורכם לפני ההדפסה.</p>
  <div className="desktop-order-cta landing-examples-cta"><button type="button" className="cta orange-bg" onClick={onChoose}>עצבו מתנה עכשיו <ArrowUpLeft/></button></div>
 </div></section>;
}
