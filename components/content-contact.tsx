'use client';
import {useEffect,useState} from 'react';
import {MessageCircle} from 'lucide-react';
import OrderFormLink from '@/components/order-form-link';
import {MAX_SHIRT_QUANTITY,SINGLE_SHIRT_PRICE} from '@/lib/catalog';
import {DEFAULT_PRICING} from '@/lib/pricing';
import type {Pricing} from '@/lib/pricing';
import {contentWhatsappUrl,priceRows} from '@/lib/content-contact';
import './content-contact.css';

/**
 * "Price, minimum and timing" block with a WhatsApp button for guides, blog
 * posts and work pages: visitors arriving from search can see what it costs and
 * write to the studio without going back to the home page. The server renders
 * the advertised default prices; the browser refreshes them from the live price list.
 */
export default function ContentContact({title}:{title:string}){
 const [pricing,setPricing]=useState<Pricing>(DEFAULT_PRICING);
 useEffect(()=>{
  let active=true;
  fetch('/api/pricing').then(response=>response.ok?response.json() as Promise<Pricing>:null).then(value=>{if(active&&value&&Array.isArray(value.tiers)&&value.tiers.length)setPricing(value);}).catch(()=>{});
  return()=>{active=false;};
 },[]);
 return <section className="content-contact" aria-labelledby="content-contact-title" data-cta-location="content">
  <div className="content-contact-head"><span className="content-contact-kicker">מחיר, מינימום וזמנים</span><h2 id="content-contact-title">כמה זה עולה ומתי זה מגיע?</h2><p>המחיר לחולצה כולל עיצוב אישי אחד לכל הקבוצה, הדפסה ומשלוח עד הבית. ככל שמזמינים יותר חולצות, המחיר לחולצה יורד.</p></div>
  <table className="content-price-table"><thead><tr><th scope="col">כמות</th><th scope="col">מחיר לחולצה</th></tr></thead><tbody>{priceRows(pricing,{maxQuantity:MAX_SHIRT_QUANTITY,singleShirtPrice:SINGLE_SHIRT_PRICE}).map(row=><tr key={row.label}><td>{row.label}</td><td><b>{row.price.toLocaleString('he-IL')+' ₪'}</b></td></tr>)}</tbody></table>
  <ul className="content-contact-facts">
   <li><b>מינימום:</b> חבילה קבוצתית מ־4 חולצות, או חולצה אחת כמתנה אישית.</li>
   <li><b>זמנים:</b> משלוח עד 5 ימי עסקים אחרי אישור העיצוב, ההזמנה והתשלום. זמן העיצוב והתיקונים אינו כלול.</li>
   <li><b>בלי התחייבות:</b> אין חיוב בשליחת הפנייה. רואים את העיצוב ומאשרים לפני ההדפסה.</li>
  </ul>
  <div className="content-contact-actions"><a className="content-whatsapp" href={contentWhatsappUrl(title)} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true"/> שואלים ב־WhatsApp</a><OrderFormLink className="content-form-link" href="/#order">לטופס ההצעה <span aria-hidden="true">←</span></OrderFormLink></div>
  <p className="content-contact-note">המחירים לפי מדרגת הכמות, כפי שהם מופיעים בטופס. מחיר סופי מאושר איתכם לפני התשלום.</p>
 </section>;
}
