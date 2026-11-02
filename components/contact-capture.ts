import type {ShirtSelection} from '@/lib/catalog';
export type ContactKey={id:string;token:string;version:number;at:number};
export type CapturedDetails={name:string;phone:string;email:string;package:number;quantity:number;mode:string;eventDate:string;source:string;shirts?:ShirtSelection[]};
export type ContactReply={saved:true;id:string;version:number;completed?:boolean;details:CapturedDetails;mailStatus?:string};
export class CaptureError extends Error{constructor(message:string,public status:number){super(message);}}
const KEY='partyprint-contact-v1';
export function readContactKey():ContactKey|null{try{const v=JSON.parse(sessionStorage.getItem(KEY)||'null');if(v&&/^[a-f0-9-]{36}$/.test(v.id)&&/^[a-f0-9]{64}$/.test(v.token)&&Number.isInteger(v.version)&&v.version>=0&&Date.now()-v.at<86400000)return v;}catch{}return null;}
export function storeContactKey(value:ContactKey){try{sessionStorage.setItem(KEY,JSON.stringify(value));}catch{}}
export function clearContactKey(){try{sessionStorage.removeItem(KEY);}catch{}}
export function createContactKey():ContactKey{const key={id:crypto.randomUUID(),token:Array.from(crypto.getRandomValues(new Uint8Array(32))).map(n=>n.toString(16).padStart(2,'0')).join(''),version:0,at:Date.now()};storeContactKey(key);return key;}
export async function contactRequest(key:ContactKey,action:'save'|'read',details?:CapturedDetails,website=''):Promise<ContactReply>{
 const r=await fetch('/api/contacts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:key.id,token:key.token,version:key.version,...details,website}),signal:AbortSignal.timeout(12000)}),v=await r.json() as ContactReply&{error?:string};
 if(!r.ok)throw new CaptureError(v.error||'לא הצלחנו לשמור את הפרטים. נסו שוב.',r.status);
 if(v.saved!==true||v.id!==key.id||!Number.isInteger(v.version)||v.version<1)throw new CaptureError('לא התקבל אישור שמירת פרטים. נסו שוב.',0);
 return v;
}
