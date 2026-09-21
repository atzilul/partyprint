import {listBlogPosts} from '@/lib/blog';
import {SEO_PAGES,SEO_PAGE_URL} from '@/lib/seo-pages';

export const dynamic='force-dynamic';
export default async function sitemap(){const posts=await listBlogPosts();const base='https://partyprint.co.il';const now=new Date();return [{url:base,lastModified:now},{url:base+'/blog',lastModified:now},{url:base+'/guides',lastModified:now},{url:base+'/faq',lastModified:now},{url:base+'/policies/shipping',lastModified:now},{url:base+'/policies/returns',lastModified:now},...SEO_PAGES.map(page=>({url:base+SEO_PAGE_URL(page.slug),lastModified:now})),...posts.map(post=>({url:base+'/blog/'+post.slug,lastModified:new Date(post.updatedAt)}))]}
