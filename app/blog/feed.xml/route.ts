import {listBlogPosts} from '@/lib/blog';

const base='https://partyprint.co.il';

function escapeXml(value:string){return value.replace(/[<>&'\"]/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[char]||char))}

export async function GET(){
 const posts=await listBlogPosts();
 const items=posts.map(post=>`<item><title>${escapeXml(post.title)}</title><link>${base}/blog/${post.slug}</link><guid isPermaLink="true">${base}/blog/${post.slug}</guid><description>${escapeXml(post.excerpt)}</description><pubDate>${new Date(post.publishedAt||post.createdAt).toUTCString()}</pubDate><author>atzilul@gmail.com (${escapeXml(post.author)})</author><category>${escapeXml(post.keywords[0]||'PARTYPRINT')}</category></item>`).join('');
 const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>בלוג PARTYPRINT</title><link>${base}/blog</link><description>רעיונות למתנות, חולצות ואירועים בעיצוב אישי.</description><language>he-IL</language><ttl>1440</ttl>${items}</channel></rss>`;
 return new Response(xml,{headers:{'content-type':'application/rss+xml; charset=utf-8','cache-control':'public, max-age=900, s-maxage=3600'}});
}
