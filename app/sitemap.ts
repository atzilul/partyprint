import type {MetadataRoute} from 'next';
import {listBlogPosts} from '@/lib/blog';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';
import {STUDIO_PAGES,STUDIO_PAGE_URL} from '@/lib/studio-pages';

export const dynamic='force-dynamic';

const base='https://partyprint.co.il';
const contentUpdatedAt=new Date(process.env.PARTYPRINT_CONTENT_UPDATED_AT||'2026-09-26T00:00:00.000Z');

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=await listBlogPosts();
 const entries:MetadataRoute.Sitemap=[
  {url:base,lastModified:contentUpdatedAt,changeFrequency:'daily',priority:1},
  {url:base+'/blog',lastModified:contentUpdatedAt,changeFrequency:'weekly',priority:.9},
  {url:base+'/blog/feed.xml',lastModified:contentUpdatedAt,changeFrequency:'daily',priority:.4},
  {url:base+'/guides',lastModified:contentUpdatedAt,changeFrequency:'weekly',priority:.9},
  {url:base+'/about',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.7},
  {url:base+'/work',lastModified:contentUpdatedAt,changeFrequency:'weekly',priority:.8},
  {url:base+'/faq',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.7},
  {url:base+'/policies/shipping',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.5},
  {url:base+'/policies/returns',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.5},
  ...SEO_PAGES.map(page=>({url:base+SEO_PAGE_URL(page.slug),lastModified:contentUpdatedAt,changeFrequency:'weekly' as const,priority:.8})),
  ...STUDIO_PAGES.map(page=>({url:base+STUDIO_PAGE_URL(page.slug),lastModified:contentUpdatedAt,changeFrequency:'monthly' as const,priority:.7})),
  ...posts.map(post=>({url:base+'/blog/'+post.slug,lastModified:new Date(post.updatedAt||post.publishedAt||contentUpdatedAt.toISOString()),changeFrequency:'monthly' as const,priority:.8})),
 ];
 return entries;
}
