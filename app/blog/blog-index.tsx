'use client';
/* eslint-disable @next/next/no-img-element -- editorial images may be selected by admins. */
import Link from '@/components/safe-link';
import {Search,SlidersHorizontal} from 'lucide-react';
import {useState} from 'react';
import type {BlogPost} from '@/lib/blog';

const topics=['הכול','מתנות','יום הולדת','אירועים','משפחה','מסיבת רווקים','מסיבת רווקות','ערב צוות'];
const matches=(post:BlogPost,query:string,topic:string)=>{
 const haystack=[post.title,post.excerpt,...post.keywords].join(' ').toLowerCase();
 return (!query||haystack.includes(query.toLowerCase()))&&(topic==='הכול'||haystack.includes(topic.toLowerCase()));
};

export default function BlogIndex({posts}:{posts:BlogPost[]}){
 const [query,setQuery]=useState(''),[topic,setTopic]=useState('הכול');
 const visible=posts.filter(post=>matches(post,query,topic));
 const featured=!query&&topic==='הכול'?posts[0]:null;
 const cards=featured?posts.slice(1):visible;
 return <>
  <section className="blog-tools" aria-label="חיפוש וסינון מדריכים">
   <div className="blog-tools-title"><SlidersHorizontal size={19}/><strong>מצאו רעיון שמתאים לאירוע שלכם</strong></div>
   <label className="blog-search"><Search size={20}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="חיפוש: מתנה לאמא, יום הולדת, ערב צוות…" aria-label="חיפוש במדריכי הבלוג"/><span>{visible.length} מדריכים</span></label>
   <div className="blog-topics" aria-label="סינון לפי נושא">{topics.map(item=><button type="button" key={item} className={topic===item?'active':''} aria-pressed={topic===item} onClick={()=>setTopic(item)}>{item}</button>)}</div>
  </section>
  {featured&&<article className="blog-feature"><Link className="blog-feature-image" href={'/blog/'+featured.slug}><img src={featured.coverImage} alt={featured.coverAlt} loading="eager"/></Link><div className="blog-feature-copy"><span className="blog-category">הכתבה המומלצת</span><h2>{featured.title}</h2><p>{featured.excerpt}</p><Link href={'/blog/'+featured.slug}>לקריאת המדריך <span aria-hidden="true">←</span></Link></div></article>}
  {cards.length?<div className="blog-grid">{cards.map(post=><BlogCard key={post.id} post={post}/>)}</div>:<div className="blog-empty"><Search size={30}/><h2>לא מצאנו מדריך כזה עדיין</h2><p>נסו מילת חיפוש אחרת או בחרו נושא מהרשימה.</p><button type="button" onClick={()=>{setQuery('');setTopic('הכול')}}>ניקוי החיפוש</button></div>}
 </>;
}

function BlogCard({post}:{post:BlogPost}){return <article className="blog-card"><Link className="blog-card-image" href={'/blog/'+post.slug}><img src={post.coverImage} alt={post.coverAlt} loading="lazy"/></Link><div className="blog-card-body"><div className="blog-card-meta"><span className="blog-category">{post.keywords[0]||'מדריך PARTYPRINT'}</span><span>{Math.max(3,Math.ceil(post.content.split(/\s+/).length/180))} דקות</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><Link className="blog-card-link" href={'/blog/'+post.slug}>למדריך המלא <span aria-hidden="true">↙</span></Link></div></article>}
