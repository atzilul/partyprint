import {listBlogPosts} from '@/lib/blog';

export const dynamic='force-dynamic';
export default async function sitemap(){const posts=await listBlogPosts();const base='https://partyprint.co.il';return [{url:base,lastModified:new Date()},{url:base+'/blog',lastModified:new Date()},...posts.map(post=>({url:base+'/blog/'+post.slug,lastModified:new Date(post.updatedAt)}))]}
