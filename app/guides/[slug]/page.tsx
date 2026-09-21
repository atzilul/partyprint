/* eslint-disable @next/next/no-img-element -- curated local editorial images. */
import Link from '@/components/safe-link';
import type {Metadata} from 'next';
import {getSeoPage,SEO_PAGE_SLUGS,SEO_PAGE_URL} from '@/lib/seo-pages';
import {SeoFooter,SeoNav} from '@/components/seo-layout';
import '../../seo/seo.css';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return SEO_PAGE_SLUGS.map(slug => ({slug}));
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const {slug} = await params;
  const item = getSeoPage(decodeURIComponent(slug));
  if (!item) return {title: 'העמוד לא נמצא | PARTYPRINT'};
  const canonical=`https://partyprint.co.il${SEO_PAGE_URL(item.slug)}`;
  return {title: item.seoTitle, description: item.seoDescription, keywords: item.keywords, alternates: {canonical: SEO_PAGE_URL(item.slug)}, robots: {index:true,follow:true}, openGraph: {title: item.seoTitle, description: item.seoDescription, url: canonical, type: 'article', locale:'he_IL', images: [{url: item.heroImage, alt: item.heroAlt}]}, twitter:{card:'summary_large_image',title:item.seoTitle,description:item.seoDescription,images:[item.heroImage]} };
}

export default async function SeoGuidePage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const decodedSlug = decodeURIComponent(slug);
  const item = getSeoPage(decodedSlug);
  if (!item) return <main className="seo-page" dir="rtl"><SeoNav/><section className="seo-not-found"><h1>העמוד לא נמצא</h1><p>אפשר לחזור לכל מדריכי הרעיונות ולבחור כיוון אחר.</p><Link className="seo-primary-cta" href="/guides">לכל המדריכים</Link></section><SeoFooter/></main>;
  const canonicalUrl = `https://partyprint.co.il${SEO_PAGE_URL(item.slug)}`;
  const breadcrumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'PARTYPRINT', item: 'https://partyprint.co.il/' }, { '@type': 'ListItem', position: 2, name: 'מדריכי רעיונות', item: 'https://partyprint.co.il/guides' }, { '@type': 'ListItem', position: 3, name: item.title, item: canonicalUrl }]};
  const faqSchema = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: item.faqs.map(faq => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}}))};
  const pageSchema = {'@context': 'https://schema.org', '@type': 'WebPage', '@id': canonicalUrl+'#webpage', name: item.title, headline:item.title, description: item.seoDescription, url: canonicalUrl, inLanguage:'he-IL', isPartOf:{'@id':'https://partyprint.co.il/#website'}, breadcrumb:{'@type':'BreadcrumbList',itemListElement:breadcrumbs.itemListElement}, primaryImageOfPage: {'@type': 'ImageObject', url: `https://partyprint.co.il${item.heroImage}`, caption: item.heroAlt}};
  return <main className="seo-page" dir="rtl"><SeoNav/><article className="seo-article"><nav className="seo-breadcrumbs" aria-label="פירורי לחם"><Link href="/">PARTYPRINT</Link><span aria-hidden="true">←</span><Link href="/guides">מדריכי רעיונות</Link><span aria-hidden="true">←</span><span aria-current="page">{item.title}</span></nav><header className="seo-article-header"><span className="seo-kicker">{item.kicker}</span><h1>{item.title}</h1><p>{item.intro}</p><div className="seo-keywords">{item.keywords.slice(0, 5).map(keyword => <span key={keyword}>{keyword}</span>)}</div></header><figure className="seo-hero-image"><img src={item.heroImage} alt={item.heroAlt} fetchPriority="high"/><figcaption>{item.heroAlt}</figcaption></figure><div className="seo-article-layout"><div className="seo-content">{item.sections.map((section,index) => <section key={section.title} className="seo-content-section"><span className="seo-section-number">0{index + 1}</span><div><h2>{section.title}</h2><p>{section.body}</p>{section.bullets && <ul>{section.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}</div></section>)}<div className="seo-offer"><div><span className="seo-kicker">READY WHEN YOU ARE</span><h2>יש לכם רעיון?<br/><span>בואו נעצב אותו.</span></h2><p>שלחו כמה מילים ותמונות. מתחילים בלי חיוב, רואים את העיצוב ומאשרים לפני ההדפסה.</p></div><Link className="seo-primary-cta" href="/#order">שליחת רעיון <span aria-hidden="true">←</span></Link></div></div><aside className="seo-aside"><div className="seo-aside-card"><strong>הופכים את זה לפשוט</strong><ol><li>בוחרים כמות ומידות.</li><li>מצרפים רעיון ותמונות.</li><li>רואים ומאשרים לפני הדפסה.</li></ol><Link href="/#packages">לצפייה בחבילות ←</Link></div><div className="seo-support-images">{item.supportingImages.map(image => <figure key={image.src}><img src={image.src} alt={image.alt} loading="lazy"/><figcaption>{image.caption}</figcaption></figure>)}</div></aside></div><section className="seo-faq" aria-labelledby="seo-faq-title"><span className="seo-kicker">GOOD QUESTIONS</span><h2 id="seo-faq-title">שאלות נפוצות על {item.title.split(':')[0]}</h2>{item.faqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</section><section className="seo-related" aria-labelledby="seo-related-title"><div><span className="seo-kicker">KEEP EXPLORING</span><h2 id="seo-related-title">עוד רעיונות שיכולים להתאים</h2></div><div>{item.relatedSlugs.map(slug => {const related = getSeoPage(slug); return related ? <Link key={slug} href={SEO_PAGE_URL(related.slug)}><span>{related.kicker.split('·')[0].trim()}</span><strong>{related.title}</strong><i aria-hidden="true">↗</i></Link> : null;})}</div></section></article><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c')}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(pageSchema).replace(/</g, '\\u003c')}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(faqSchema).replace(/</g, '\\u003c')}}/><div className="seo-mobile-cta"><div><strong>מוכנים לעצב?</strong><span>מתחילים בלי חיוב</span></div><Link href="/#order">שליחת רעיון <span aria-hidden="true">←</span></Link></div><SeoFooter/></main>;
}
