import type {MetadataRoute} from 'next';
import {listBlogPosts} from '@/lib/blog';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';

export const dynamic='force-dynamic';

const base='https://partyprint.co.il';
const contentUpdatedAt=new Date(process.env.PARTYPRINT_CONTENT_UPDATED_AT||'2026-09-21T00:00:00.000Z');

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const posts=await listBlogPosts();
 const entries:MetadataRoute.Sitemap=[
  {url:base,lastModified:contentUpdatedAt,changeFrequency:'daily',priority:1},
  {url:base+'/blog',lastModified:contentUpdatedAt,changeFrequency:'weekly',priority:.9},
  {url:base+'/guides',lastModified:contentUpdatedAt,changeFrequency:'weekly',priority:.9},
  {url:base+'/faq',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.7},
  {url:base+'/policies/shipping',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.5},
  {url:base+'/policies/returns',lastModified:contentUpdatedAt,changeFrequency:'monthly',priority:.5},
  ...SEO_PAGES.map(page=>({url:base+SEO_PAGE_URL(page.slug),lastModified:contentUpdatedAt,changeFrequency:'weekly' as const,priority:.8})),
  ...posts.map(post=>({url:base+'/blog/'+post.slug,lastModified:new Date(post.updatedAt||post.publishedAt||contentUpdatedAt.toISOString()),changeFrequency:'monthly' as const,priority:.8})),
 ];
 return entries;
}
