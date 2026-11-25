import type {ReactNode} from 'react';

const STUDIO='https://wa.me/972552896236?text=';
const URGENT=STUDIO+encodeURIComponent('היי, יש לי אירוע בתאריך קרוב, אפשר לבדוק?');
const GENERAL=STUDIO+encodeURIComponent('היי, יש לי שאלה לפני הזמנה');

/**
 * One FAQ answer. The answers are plain strings, shared with the FAQPage structured
 * data; here every "WhatsApp" in the text becomes a link that opens the studio chat.
 * The children stay a flat list of strings and inline links, which the translation
 * gate reads as one sentence with numbered places.
 */
export default function FaqAnswer({text,className}:{text:string;className?:string}){
 const parts=text.split('WhatsApp');
 if(parts.length===1)return <p className={className}>{text}</p>;
 const href=text.includes('דחוף')?URGENT:GENERAL;
 const children:ReactNode[]=[];
 parts.forEach((part,index)=>{
  if(part)children.push(part);
  if(index<parts.length-1)children.push(<a key={index} href={href} target="_blank" rel="noopener noreferrer">WhatsApp</a>);
 });
 return <p className={className}>{children}</p>;
}
