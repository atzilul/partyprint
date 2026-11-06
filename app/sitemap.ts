import {editorialModifiedAt} from '@/lib/editorial-preparation';
import type {MetadataRoute} from 'next';
import {listBlogPosts} from '@/lib/blog';
import type {BlogPost} from '@/lib/blog';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';
import {STUDIO_PAGES,STUDIO_PAGE_URL} from '@/lib/studio-pages';
import {LANDING_VARIANT_KEYS} from '@/lib/landing-variants';
import {LANDING_HOME_CONTENT} from '@/lib/landing-home-content';
import {BUNDLE_ANSWERS,answerUrl} from '@/lib/bundle-answers';
import {PRICE_ANSWERS} from '@/lib/price-answers';

export const dynamic='force-dynamic';
const base='https://partyprint.co.il';
const fallbackDate='2026-09-27T00:00:00.000Z';
function validDate(value:string|undefined|null):Date {
 const date=new Date(value||fallbackDate);
 return Number.isFinite(date.getTime())?date:new Date(fallbackDate);
}
const contentUpdatedAt=validDate(process.env.PARTYPRINT_CONTENT_UPDATED_AT);
const editorialUpdatedAt=new Date('2026-11-03T00:00:00.000Z');
const occasionsUpdatedAt=new Date('2026-11-05T00:00:00.000Z');
const absoluteImage=(src:string)=>/^https?:\/\//.test(src)?src:`${base}${src}`;
const imageList=(...sources:(string|undefined)[])=>sources.filter((src):src is string=>Boolean(src)).map(absoluteImage);

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 let posts:BlogPost[]=[];
 try {posts=await listBlogPosts();}
 catch {console.warn('Sitemap: blog list unavailable; serving static public URLs.');}
 const blogUpdatedAt=posts.reduce((latest,post)=>{
  const date=validDate(editorialModifiedAt(post.slug,post.updatedAt||post.publishedAt||fallbackDate));
  return date>latest?date:latest;
 },contentUpdatedAt);
 const paths=['/guides','/about','/work','/faq','/policies/shipping','/policies/returns','/privacy-policy','/terms'];
 return [
  {url:base,lastModified:editorialUpdatedAt},
  {url:base+'/blog',lastModified:blogUpdatedAt},
  {url:base+'/ordering-guide',lastModified:new Date('2026-11-01T00:00:00.000Z')},
  {url:base+'/bundle-sale',lastModified:occasionsUpdatedAt,images:imageList('/og-team.jpg')},
  ...[...BUNDLE_ANSWERS,...PRICE_ANSWERS].map(item=>({url:base+answerUrl(item),lastModified:new Date(item.updatedAt),images:imageList(item.heroImage?.src)})),
  {url:base+'/buyers-guide',lastModified:occasionsUpdatedAt},
  {url:base+'/contact',lastModified:occasionsUpdatedAt},
  {url:base+'/en',lastModified:occasionsUpdatedAt},
  ...LANDING_VARIANT_KEYS.map(key=>({url:base+'/lp/'+key,lastModified:occasionsUpdatedAt,images:imageList(LANDING_HOME_CONTENT[key].story.asset)})),
  ...paths.map(path=>({url:base+path,lastModified:path==='/faq'||path==='/terms'?editorialUpdatedAt:contentUpdatedAt})),
  ...SEO_PAGES.map(page=>({url:base+SEO_PAGE_URL(page.slug),lastModified:validDate(page.updatedAt),images:imageList(page.heroImage)})),
  ...STUDIO_PAGES.map(page=>({url:base+STUDIO_PAGE_URL(page.slug),lastModified:contentUpdatedAt,images:imageList(page.heroImage)})),
  ...posts.map(post=>({url:base+'/blog/'+post.slug,lastModified:validDate(editorialModifiedAt(post.slug,post.updatedAt||post.publishedAt||fallbackDate)),images:imageList(post.coverImage,post.inlineImage1,post.inlineImage2)})),
 ];
}
