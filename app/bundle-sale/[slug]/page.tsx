/* eslint-disable @next/next/no-img-element -- curated local editorial images. */
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from '@/components/safe-link';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import {BUNDLE_ANSWERS,BUNDLE_ANSWER_URL,answerRows,getBundleAnswer} from '@/lib/bundle-answers';
import {SEO_PAGE_URL} from '@/lib/seo-pages';
import {shekels} from '@/lib/bundles';
import {getPricing} from '@/lib/studio-settings';
import {DEFAULT_PRICING} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';
import '@/components/content-contact.css';
import '../../seo/seo.css';

/**
 * Answer pages for large orders: one question, a direct answer, a price table and the
 * questions around it (lib/bundle-answers.ts). The numbers are computed from the prices
 * in force on every request.
 */
export const dynamic='force-dynamic';
const origin='https://partyprint.co.il';
type PageProps={params:Promise<{slug:string}>};
async function currentPricing():Promise<Pricing>{try{return await getPricing();}catch{return DEFAULT_PRICING;}}
function find(slug:string){try{return getBundleAnswer(decodeURIComponent(slug));}catch{return null;}}

export async function generateMetadata({params}:PageProps):Promise<Metadata>{
 const {slug}=await params,item=find(slug);
 if(!item)return {robots:{index:false,follow:false}};
 const description=item.description(await currentPricing()),url=origin+BUNDLE_ANSWER_URL(item.slug),image=item.heroImage?.src||'/og-team.jpg';
 return {
  title:item.seoTitle,
  description,
  keywords:item.keywords,
  alternates:{canonical:BUNDLE_ANSWER_URL(item.slug)},
  openGraph:{type:'article',locale:'he_IL',url,siteName:'PARTYPRINT',title:item.seoTitle,description,images:[{url:image,alt:item.heroImage?.alt||item.title}]},
  twitter:{card:'summary_large_image',title:item.seoTitle,description,images:[image]},
 };
}

export default async function BundleAnswerPage({params}:PageProps){
 const {slug}=await params,item=find(slug);
 if(!item)notFound();
 const pricing=await currentPricing(),url=origin+BUNDLE_ANSWER_URL(item.slug),answer=item.answer(pricing),sections=item.sections(pricing),faqs=item.faqs(pricing),rows=answerRows(pricing,item.quantities);
 const topic=item.kicker.split(' ·')[0],whatsapp='https://wa.me/972552896236?text='+encodeURIComponent('היי, יש לי שאלה על '+topic);
 const others=BUNDLE_ANSWERS.filter(other=>other.slug!==item.slug);
 const crumbs=[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:origin+'/'},{'@type':'ListItem',position:2,name:'BUNDLE SALE',item:origin+'/bundle-sale'},{'@type':'ListItem',position:3,name:item.title,item:url}];
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:crumbs},
  {'@type':'WebPage','@id':url+'#webpage',url,name:item.title,headline:item.title,description:item.description(pricing),inLanguage:'he-IL',dateModified:item.updatedAt,author:{'@id':origin+'/#organization'},isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#service'}},
  {'@type':'FAQPage','@id':url+'#faq',inLanguage:'he-IL',mainEntity:[{question:item.title,answer},...faqs].map(faq=>({'@type':'Question',name:faq.question,acceptedAnswer:{'@type':'Answer',text:faq.answer}}))},
 ]};
 return <main className="seo-page" dir="rtl"><SeoNav/><article className="seo-article">
  <nav className="seo-breadcrumbs" aria-label="פירורי לחם"><Link href="/">PARTYPRINT</Link><span aria-hidden="true">←</span><Link href="/bundle-sale">BUNDLE SALE</Link><span aria-hidden="true">←</span><span aria-current="page">{item.title}</span></nav>
  <header className="seo-article-header"><span className="seo-kicker">{item.kicker}</span><h1>{item.title}</h1><p>{answer}</p><p className="seo-editorial-note">תשובה בעריכת צוות PARTYPRINT. עודכנה ב־<time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString('he-IL',{timeZone:'Asia/Jerusalem'})}</time>. המחירים מחושבים מהמחירון שבתוקף, כפי שהוא מופיע בטופס ההזמנה.</p></header>
  {item.heroImage&&<figure className="seo-hero-image"><img src={item.heroImage.src} width={1254} height={1254} sizes="(max-width: 680px) 100vw, 1050px" alt={item.heroImage.alt} fetchPriority="high" decoding="async"/><figcaption>{item.heroImage.alt}</figcaption></figure>}
  <div className="seo-article-layout"><div className="seo-content">
   <section className="content-contact" aria-labelledby="answer-table-title">
    <div className="content-contact-head"><span className="content-contact-kicker">מחירים</span><h2 id="answer-table-title">{item.tableTitle}</h2><p>המחיר כולל עיצוב אישי אחד לכל הקבוצה, הדפסה ומשלוח. ככל שמזמינים יותר חולצות, המחיר לחולצה יורד.</p></div>
    <table className="content-price-table"><thead><tr><th scope="col">כמות</th><th scope="col">מחיר לחולצה</th><th scope="col">סה״כ</th></tr></thead><tbody>{rows.map(row=><tr key={row.quantity}><td>{row.quantity} חולצות</td><td>{shekels(row.unit)} ₪</td><td><b>{shekels(row.total)} ₪</b></td></tr>)}</tbody></table>
    <div className="content-contact-actions"><a className="content-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer" data-cta-location="content">שואלים ב־WhatsApp</a><Link className="content-form-link" href="/bundle-sale#order">להזמנה בבאנדל <span aria-hidden="true">←</span></Link></div>
    <p className="content-contact-note">אפשר להזמין כל כמות, לא רק את הכמויות שבטבלה. מחיר סופי מאושר איתכם לפני התשלום, ואין חיוב בשליחת הפנייה.</p>
   </section>
   {sections.map((section,index)=><section id={'answer-section-'+index} key={section.title} className="seo-content-section"><span className="seo-section-number">0{index+1}</span><div><h2>{section.title}</h2><p>{section.body}</p>{section.bullets&&<ul>{section.bullets.map(bullet=><li key={bullet}>{bullet}</li>)}</ul>}</div></section>)}
   <div className="seo-offer"><div><span className="seo-kicker">BUNDLE SALE</span><h2>כמה אתם?<br/><span>המחיר יורד איתכם.</span></h2><p>בוחרים כמות, משאירים פרטים ומוסיפים רעיון. מתחילים בלי חיוב, רואים את העיצוב ומאשרים לפני ההדפסה.</p></div><Link className="seo-primary-cta" href="/bundle-sale#bundles">לבאנדלים <span aria-hidden="true">←</span></Link></div>
  </div><aside className="seo-aside"><div className="seo-aside-card"><strong>איך מזמינים</strong><ol><li>בוחרים כמות בעמוד הבאנדלים.</li><li>מצרפים רעיון, תמונות ולוגו.</li><li>רואים ומאשרים לפני הדפסה.</li></ol><Link href="/bundle-sale">לעמוד BUNDLE SALE ←</Link>{item.guide&&<p><Link href={SEO_PAGE_URL(item.guide.slug)}>מדריך רעיונות: {item.guide.label}</Link></p>}<p><Link href="/ordering-guide#sizes">מידות</Link> · <Link href="/ordering-guide#photos">הכנת תמונות</Link></p></div></aside></div>
  <section className="seo-faq" aria-labelledby="seo-faq-title"><span className="seo-kicker">GOOD QUESTIONS</span><h2 id="seo-faq-title">שאלות נפוצות על {topic}</h2>{faqs.map(faq=><details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section>
  <section className="seo-related" aria-labelledby="seo-related-title"><div><span className="seo-kicker">KEEP EXPLORING</span><h2 id="seo-related-title">עוד תשובות על הזמנות גדולות</h2></div><div>{others.map(other=><Link key={other.slug} href={BUNDLE_ANSWER_URL(other.slug)}><span>{other.kicker.split(' ·')[0]}</span><strong>{other.title}</strong><i aria-hidden="true">↗</i></Link>)}</div></section>
 </article>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
 <div className="seo-mobile-cta"><div><strong>BUNDLE SALE</strong><span>מתחילים בלי חיוב</span></div><Link href="/bundle-sale#order">להזמנה <span aria-hidden="true">←</span></Link></div>
 <SeoFooter/></main>;
}
