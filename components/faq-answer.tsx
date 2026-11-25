/**
 * One FAQ answer. The answers are plain strings, shared with the FAQPage structured
 * data, so the text stays one sentence for the translation gate; an answer that
 * mentions WhatsApp gets a link line after it that opens the studio chat.
 */
const STUDIO='https://wa.me/972552896236?text=';
const URGENT=STUDIO+encodeURIComponent('היי, יש לי אירוע בתאריך קרוב, אפשר לבדוק?');
const GENERAL=STUDIO+encodeURIComponent('היי, יש לי שאלה לפני הזמנה');

export default function FaqAnswer({text,className}:{text:string;className?:string}){
 const whatsapp=text.includes('WhatsApp');
 return <>
  <p className={className}>{text}</p>
  {whatsapp&&<a className="faq-whatsapp" href={text.includes('דחוף')?URGENT:GENERAL} target="_blank" rel="noopener noreferrer">פותחים שיחה ב-WhatsApp ↗</a>}
 </>;
}
