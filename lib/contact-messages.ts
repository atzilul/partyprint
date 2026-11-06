import {cleanSingleLine,validPhone} from './contact-validation';

/**
 * A message from the contact page (/contact): someone who wants to talk before, or instead
 * of, filling in the order request. Shared by the form and by the endpoint that saves it.
 * It is kept as a ticket, so the studio answers it where it already works.
 */
export const CONTACT_TOPICS=[
 {id:'new',label:'הזמנה חדשה'},
 {id:'bundle',label:'הזמנה גדולה, 25 חולצות ומעלה'},
 {id:'existing',label:'שינוי או שאלה על הזמנה קיימת'},
 {id:'sizes',label:'מידות וצבעים'},
 {id:'price',label:'מחיר והצעת מחיר'},
 {id:'other',label:'משהו אחר'},
] as const;
export type ContactTopic=(typeof CONTACT_TOPICS)[number]['id'];
export type ContactMessage={name:string;phone:string;email:string;topic:ContactTopic;body:string};
export const MESSAGE_LIMITS={name:100,email:150,body:2000,minimumBody:5};
export const topicLabel=(topic:string)=>CONTACT_TOPICS.find(item=>item.id===topic)?.label||CONTACT_TOPICS[CONTACT_TOPICS.length-1].label;

export type MessageProblem='name'|'phone'|'email'|'body';
/** What stops a message from being sent, field by field. An empty list means it is ready. */
export function messageProblems(value:{name?:unknown;phone?:unknown;email?:unknown;body?:unknown}):MessageProblem[]{
 const text=(item:unknown)=>typeof item==='string'?item.trim():'';
 const problems:MessageProblem[]=[];
 if(!text(value.name)||text(value.name).length>MESSAGE_LIMITS.name)problems.push('name');
 if(!validPhone(text(value.phone)))problems.push('phone');
 if(text(value.email).length>MESSAGE_LIMITS.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value.email)))problems.push('email');
 if(text(value.body).length<MESSAGE_LIMITS.minimumBody||text(value.body).length>MESSAGE_LIMITS.body)problems.push('body');
 return problems;
}
/** The message as it is saved. Throws when a field is not valid. */
export function contactMessage(value:Record<string,unknown>):ContactMessage{
 if(messageProblems(value).length)throw Error('invalid_message');
 const topic=CONTACT_TOPICS.some(item=>item.id===value.topic)?value.topic as ContactTopic:'other';
 return {name:cleanSingleLine(String(value.name),MESSAGE_LIMITS.name),phone:String(value.phone).trim(),email:String(value.email).trim(),topic,body:String(value.body).trim()};
}
