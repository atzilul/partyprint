import {listBlogPosts} from '@/lib/blog';
export async function GET(){try{return Response.json({posts:await listBlogPosts()},{headers:{'Cache-Control':'public, max-age=300, s-maxage=900'}})}catch{return Response.json({error:'הבלוג אינו זמין כרגע.'},{status:503})}}
