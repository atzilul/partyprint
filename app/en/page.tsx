import type {Metadata} from 'next';
import Link from '@/components/safe-link';
import {BUNDLE_SIZES} from '@/lib/bundles';
import {INDIVIDUAL_DESIGN_SURCHARGE} from '@/lib/catalog';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING,priceFor,unitPriceFor} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';
import {BUSINESS_DETAILS} from '@/lib/business-details';
import '@/components/content-contact.css';
import '../seo/seo.css';
import './en.css';

/**
 * The service in English, for visitors and assistants that ask in English. One page: what
 * we do, the prices in force, what is included and how to reach us. Ordering in English
 * goes through WhatsApp; the request form itself is in Hebrew.
 */
export const dynamic='force-dynamic';
const origin='https://partyprint.co.il',url=origin+'/en',updatedAt='2026-11-05T00:00:00.000Z';
const title='Custom Group T-Shirts in Israel | PARTYPRINT';
const whatsapp='https://wa.me/972552896236?text='+encodeURIComponent('Hi, I would like to order custom group T-shirts');
const ils=(value:number)=>'₪'+value.toLocaleString('en-US');
async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}
function describe(pricing:Pricing){return 'Custom T-shirts for groups in Israel, designed from your photos and ideas. From '+ils(unitPriceFor(pricing,4))+' per shirt for 4 shirts down to '+ils(unitPriceFor(pricing,100))+' per shirt for 100, including design, printing and delivery.';}
export async function generateMetadata():Promise<Metadata>{
 const description=describe(await currentPricing());
 return {
  title,description,
  keywords:['custom t-shirts Israel','group t-shirts Israel','t-shirt printing Israel','personalized shirts Israel','bachelorette party shirts Israel','team shirts Israel','bulk t-shirt printing Israel'],
  alternates:{canonical:'/en',languages:{he:'/',en:'/en','x-default':'/'}},
  openGraph:{type:'website',locale:'en_US',url,siteName:'PARTYPRINT',title,description,images:[{url:'/og-default.jpg',width:1200,height:630,alt:'A family in matching custom-designed T-shirts by PARTYPRINT'}]},
  twitter:{card:'summary_large_image',title,description,images:['/og-default.jpg']},
 };
}
const STEPS=[
 ['Send photos and an idea','A selfie of each person or one group photo, plus a sentence about the occasion. A phone photo is enough.'],
 ['We design','We turn your group into one shared design, using AI with a human touch.'],
 ['You approve','You see the design before anything is printed. One round of revisions is included.'],
 ['We print and deliver','After you approve the design and the order, we print and deliver across Israel.'],
];
export default async function EnglishPage(){
 const pricing=await currentPricing(),tiers=[1,4,6,8,10,15,20,...BUNDLE_SIZES],single=unitPriceFor(pricing,1);
 const faqs=[
  ['How much do custom group T-shirts cost?','The price per shirt goes down as the group grows: '+ils(unitPriceFor(pricing,4))+' per shirt for 4 shirts, '+ils(unitPriceFor(pricing,10))+' for 10, '+ils(unitPriceFor(pricing,25))+' for 25, '+ils(unitPriceFor(pricing,50))+' for 50 and '+ils(unitPriceFor(pricing,100))+' for 100. A single shirt costs '+ils(single)+'. Every price includes one custom design for the group, printing and delivery.'],
  ['Can I order in English?','Yes. The online form is in Hebrew, so the easiest way is to message us on WhatsApp at +972 55 289 6236 or email '+BUSINESS_DETAILS.email+'. We answer in English.'],
  ['Where do you deliver?','We deliver within Israel, to your door. Delivery is included in the price.'],
  ['How long does it take?','Delivery takes up to 5 business days after you approve the design, confirm the order and pay. Design and revision time is not included, so we recommend contacting us at least two weeks before your event.'],
  ['Which sizes and colours are available?','Kids sizes from age 2 to 18 and adult sizes S to XL, in white, black or grey. You can mix sizes and colours in one order with the same design.'],
  ['Can you add our company or school logo?','Yes. Send the logo together with your photos and idea, and we work it into the design. You approve the design before printing.'],
  ['Do I pay when I send a request?','No. Sending a request is free. The final price, payment method and timing are confirmed with you in advance, before printing.'],
  ['Can each person get a different design?','The price includes one shared design for the whole group. On the team package you can choose a separate design for every shirt, for example a portrait of each person, for '+ils(INDIVIDUAL_DESIGN_SURCHARGE)+' more per shirt.'],
 ];
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:origin+'/'},{'@type':'ListItem',position:2,name:'English',item:url}]},
  {'@type':'WebPage','@id':url+'#webpage',url,name:title,description:describe(pricing),inLanguage:'en',dateModified:updatedAt,isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#service'}},
  {'@type':'FAQPage','@id':url+'#faq',inLanguage:'en',mainEntity:faqs.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
 ]};
 return <main className="seo-page en-page" dir="ltr" lang="en">
  <header className="seo-nav"><Link className="seo-brand" href="/" aria-label="PARTYPRINT home page (Hebrew)"/><nav aria-label="Page sections"><a href="#how">How it works</a><a href="#prices">Prices</a><a href="#faq">FAQ</a><Link href="/" lang="he" hrefLang="he">עברית</Link></nav><a className="seo-nav-cta" href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta-location="header">Chat on WhatsApp</a></header>
  <article className="seo-article">
   <nav className="seo-breadcrumbs" aria-label="Breadcrumbs"><Link href="/">PARTYPRINT</Link><span aria-hidden="true">→</span><span aria-current="page">English</span></nav>
   <header className="seo-article-header"><span className="seo-kicker">PARTYPRINT · CUSTOM GROUP T-SHIRTS</span><h1>Custom group T-shirts in Israel, designed from your photos</h1><p>PARTYPRINT is an Israeli studio that turns your photos, inside jokes and ideas into one shared T-shirt design for your whole group. You send photos and a sentence about the idea, we design it with AI and a human touch, you approve it, and only then do we print and deliver across Israel.</p><p className="seo-editorial-note">Updated <time dateTime={updatedAt}>5 November 2026</time>. Our order form is in Hebrew. If you prefer English, message us on WhatsApp and we will take the order with you.</p><div className="en-actions"><a className="seo-primary-cta" href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta-location="hero">Order on WhatsApp <span aria-hidden="true">→</span></a><Link className="seo-secondary-cta" href="/#order" lang="he" hrefLang="he">Order form (Hebrew)</Link></div></header>
   <div className="seo-article-layout"><div className="seo-content">
    <section id="how" className="seo-content-section"><span className="seo-section-number">01</span><div><h2>How it works</h2><ol className="en-steps">{STEPS.map(([name,text])=><li key={name}><b>{name}.</b> {text}</li>)}</ol></div></section>
    <section id="prices" className="content-contact" aria-labelledby="en-prices-title"><div className="content-contact-head"><span className="content-contact-kicker">Prices</span><h2 id="en-prices-title">Price per shirt, by group size</h2><p>Prices are in Israeli shekels and include one custom design for the group, printing and delivery. The more shirts you order, the lower the price per shirt.</p></div><table className="content-price-table"><thead><tr><th scope="col">Shirts</th><th scope="col">Per shirt</th><th scope="col">Total</th></tr></thead><tbody>{tiers.map(quantity=><tr key={quantity}><td>{quantity===1?'1 shirt':quantity+' shirts'}</td><td>{ils(unitPriceFor(pricing,quantity))}</td><td><b>{ils(priceFor(pricing,4,quantity))}</b></td></tr>)}</tbody></table><p className="content-contact-note">You can order any quantity up to 100, not only the ones in the table. For more than 100 shirts, message us for a quote. The final price is confirmed with you before payment.</p></section>
    <section className="seo-content-section"><span className="seo-section-number">02</span><div><h2>What is included</h2><p>One price covers the whole job, with no separate design or delivery fee.</p><ul><li>One custom design for the whole group, built from your photos and idea</li><li>Printing and delivery within Israel</li><li>You see and approve the design before printing</li><li>One round of revisions. Each extra round costs ₪100</li><li>No charge for sending a request</li></ul></div></section>
    <section className="seo-content-section"><span className="seo-section-number">03</span><div><h2>Who orders from us</h2><p>Any group with a reason to celebrate or to look like a team.</p><ul><li>Family birthdays, with kids and adults in the same design</li><li>Bachelorette and bachelor parties</li><li>Teams, team days and company events, with your logo in the design</li><li>Kindergartens, school classes and graduating years</li><li>Soldiers and units, youth movements, sports groups and communities</li></ul></div></section>
    <section className="seo-content-section"><span className="seo-section-number">04</span><div><h2>Large orders</h2><p>For 25 shirts and up the price drops further: {ils(unitPriceFor(pricing,25))} per shirt from 25 shirts, {ils(unitPriceFor(pricing,50))} from 50, and {ils(unitPriceFor(pricing,100))} per shirt for 100. Kids and adult sizes can be mixed, and one delivery goes to one address. Details are on the <Link href="/bundle-sale" lang="he" hrefLang="he">BUNDLE SALE page (Hebrew)</Link>.</p></div></section>
    <div className="seo-offer"><div><span className="seo-kicker">READY WHEN YOU ARE</span><h2>Got a group?<br/><span>Let us design it.</span></h2><p>Send us a few words and photos on WhatsApp. It is free to start, and you approve the design before we print.</p></div><a className="seo-primary-cta" href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta-location="content">Chat on WhatsApp <span aria-hidden="true">→</span></a></div>
   </div><aside className="seo-aside"><div className="seo-aside-card"><strong>In short</strong><ol><li>Send photos and an idea.</li><li>Approve the design.</li><li>Get the shirts delivered.</li></ol><a href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta-location="content">WhatsApp: +972 55 289 6236 →</a><p><a href={'mailto:'+BUSINESS_DETAILS.email}>{BUSINESS_DETAILS.email}</a></p></div></aside></div>
   <section id="faq" className="seo-faq" aria-labelledby="seo-faq-title"><span className="seo-kicker">GOOD QUESTIONS</span><h2 id="seo-faq-title">Frequently asked questions</h2>{faqs.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
  </article>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
  <div className="seo-mobile-cta"><div><strong>PARTYPRINT</strong><span>Free to start</span></div><a href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta-location="footer">WhatsApp <span aria-hidden="true">→</span></a></div>
  <footer className="seo-footer"><div className="seo-footer-bottom"><strong>PARTYPRINT · Real people. Unusual designs.</strong><Link href="/" lang="he" hrefLang="he">Main site (Hebrew)</Link></div></footer>
 </main>;
}
