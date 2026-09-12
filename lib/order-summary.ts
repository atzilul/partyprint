import {COLOR_LABELS} from './catalog';
type SummaryOrder={subtotal?:number;discount?:number;couponCode?:string;address?:string;tracking?:string;dueDate?:string;revisions?:number;id:string;name:string;phone:string;email?:string;brief:string;packageName:string;quantity:number;price:number;mode:string;createdAt:string;priceStatus:string;shirts:{size:string;color:string}[];images:{name:string}[]};
export function orderSummary(o:SummaryOrder){return [
'PARTYPRINT | פרטי הזמנה',`מספר פנייה: ${o.id}`,`נוצרה: ${o.createdAt}`,'',
`סוג פנייה: ${o.mode==='lead'?'התייעצות':'בקשת הזמנה'}`,`שם: ${o.name}`,`WhatsApp של הלקוח: ${o.phone}`,`מייל: ${o.email||'לא נמסר'}`,`חבילה: ${o.packageName}`,`כמות חולצות: ${o.quantity}`,`מחיר ${['agreed','adjusted'].includes(o.priceStatus)?'מעודכן':o.priceStatus==='advertised'?'החבילה':'משוער, לאישור'}: ${o.price} ₪`,
...(o.couponCode?[`קוד מבצע בעת ההזמנה: ${o.couponCode}`,`הנחה שניתנה: ${o.discount||0} ₪`]:[]),'כולל עיצוב משותף אחד, הדפסה ומשלוח.',...(o.address?[`כתובת למשלוח: ${o.address}`]:[]),...(o.dueDate?[`מועד יעד שסוכם: ${o.dueDate}`]:[]),...(o.tracking?[`מעקב משלוח: ${o.tracking}`]:[]),'',
'מידות וצבעים:',o.shirts.length?o.shirts.map((s,i)=>`חולצה ${i+1}: ${s.size}, ${COLOR_LABELS[s.color as keyof typeof COLOR_LABELS]}`).join('\n'):'לתיאום ב־WhatsApp','',
'הרעיון והבריף:',o.brief||'נפתח את הרעיון יחד בשיחה.','',
`תמונות רפרנס: ${o.images.length}`, ...o.images.map((f,i)=>`${i+1}. ${f.name}`),...(o.images.length?['התמונות המקוריות כלולות בתיקיית images בקובץ ההזמנה המרוכז.']:[]),'',
'סבב תיקונים אחד כלול. כל סבב נוסף: 100 ₪.',
'עד 3 ימי עסקים למשלוח לאחר אישור העיצוב, ההזמנה והתשלום, ובכפוף לאישור המועד. זמן העיצוב אינו כלול.',
'זוהי בקשה בלבד. לא בוצע חיוב ולא אושר מועד אספקה.',
'נמען: PARTYPRINT | 0552896236',
'ניצור קשר לתיאום הרעיון, המחיר והמועד.'
].join('\n')}
