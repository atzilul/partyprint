import type {MetadataRoute} from 'next';
import {listBlogPosts} from '@/lib/blog';
import type {BlogPost} from '@/lib/blog';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';
import {STUDIO_PAGES,STUDIO_PAGE_URL} from '@/lib/studio-pages';

export const dynamic='force-dynamic';
const base='https://partyprint.co.il';
const fallbackDate='2026-09-27T00:00:00.000Z';
function validDate(value:string|undefined|null):Date {
 const date=new Date(value||fallbackDate);
 return Number.isFinite(date.getTime())?date:new Date(fallbackDate);
}
const contentUpdatedAt=validDate(process.env.PARTYPRINT_CONTENT_UPDATED_AT);
const editorialUpdatedAt=new Date('2026-11-01T00:00:00.000Z');
const absoluteImage=(src:string)=>/^https?:\/\//.test(src)?src:`${base}${src}`;
const imageList=(...sources:(string|undefined)[])=>sources.filter((src):src is string=>Boolean(src)).map(absoluteImage);

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 let posts:BlogPost[]=[];
 try {posts=await listBlogPosts();}
 catch {console.warn('Sitemap: blog list unavailable; serving static public URLs.');}
 const blogUpdatedAt=posts.reduce((latest,post)=>{
  const date=validDate(post.updatedAt||post.publishedAt);
  return date>latest?date:latest;
 },contentUpdatedAt);
 const paths=['/guides','/about','/work','/faq','/policies/shipping','/policies/returns','/privacy-policy'];
 return [
  {url:base,lastModified:editorialUpdatedAt},
  {url:base+'/blog',lastModified:blogUpdatedAt},
  {url:base+'/ordering-guide',lastModified:new Date('2026-11-01T00:00:00.000Z')},
  ...paths.map(path=>({url:base+path,lastModified:path==='/faq'?editorialUpdatedAt:contentUpdatedAt})),
  ...SEO_PAGES.map(page=>({url:base+SEO_PAGE_URL(page.slug),lastModified:validDate(page.updatedAt),images:imageList(page.heroImage)})),
  ...STUDIO_PAGES.map(page=>({url:base+STUDIO_PAGE_URL(page.slug),lastModified:contentUpdatedAt,images:imageList(page.heroImage)})),
  ...posts.map(post=>({url:base+'/blog/'+post.slug,lastModified:validDate(post.updatedAt||post.publishedAt),images:imageList(post.coverImage,post.inlineImage1,post.inlineImage2)})),
 ];
}
