import {env} from 'cloudflare:workers';
import {packs,calculatePrice,EXTRA_SHIRT_PRICE,validateShirts} from '@/lib/catalog';
import {readLimitedForm,validImage} from '@/lib/order-security';
import {orderSummary} from '@/lib/order-summary';
import {notifyOrder} from '@/lib/order-mail';
import {createOrderAccess} from '@/lib/order-access';
import {insertOrder,saveOrder} from '@/lib/order-store';
import {getPricing,getCoupon} from '@/lib/studio-settings';
import {priceFor,couponDiscount} from '@/lib/pricing';
import {imageUploadError} from '@/lib/upload-limits';
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('הבקשה אינה מורשית.',403);
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return fail('פורמט בקשה לא תקין.',415);
 try{
 const bindings=env as unknown as {DB:D1Database;BUCKET:R2Bucket;RESEND_API_KEY?:string;MAIL_FROM?:string};
 if(!bindings.DB||!bindings.BUCKET)return fail('שמירת פניות אינה זמינה כרגע. אפשר לפנות אלינו ב־WhatsApp.',503);
 const now=Date.now();const ip=request.headers.get('CF-Connecting-IP')||request.headers.get('oai-authenticated-user-id')||'anonymous';const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const key=`${Math.floor(now/3600000)}:${hash}`;
 const count=await bindings.DB.prepare('INSERT INTO form_rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<8 RETURNING count').bind(key,now+7200000).first<{count:number}>();
 if(!count)return fail('נשלחו יותר מדי פניות. נסו שוב בעוד שעה או פנו ב־WhatsApp.',429);
 await bindings.DB.prepare('DELETE FROM form_rate_limits WHERE expires_at < ?').bind(now).run();
 const data=await readLimitedForm(request);if(String(data.get('website')||''))return fail('לא ניתן לשלוח את הפנייה.',400);
 const name=String(data.get('name')||'').trim(),phone=String(data.get('phone')||'').trim(),email=String(data.get('email')||'').trim(),brief=String(data.get('brief')||'');const pack=Number(data.get('package')),quantity=Number(data.get('quantity')),mode=String(data.get('mode'));
 const pricing=await getPricing();let subtotal:number;try{subtotal=priceFor(pricing,pack,quantity)}catch{return fail('בחרו חבילה וכמות חולצות תקינה.')}
 const code=String(data.get('coupon')||'').trim().toUpperCase();let coupon=null,discount=0;if(code){coupon=await getCoupon(code);if(!coupon)return fail('קוד המבצע לא נמצא.');try{discount=couponDiscount(coupon,subtotal,quantity,pack)}catch{return fail('קוד המבצע אינו פעיל או לא מתאים להזמנה.')}}const total=Math.round((subtotal-discount)*100)/100;
 if(data.has('expectedPrice')&&Number(data.get('expectedPrice'))!==total)return fail('המחיר עודכן. בדקו את הסכום החדש ולחצו שוב על שליחה.',409);
 if(!name||name.length>100||!/^\+?[0-9() \-]{9,20}$/.test(phone)||brief.length>3000||email.length>150||!['lead','order','custom'].includes(mode))return fail('בדקו שהשם והטלפון מלאים ותקינים.');
 if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail('כתובת המייל אינה תקינה.');
 let shirts:unknown;try{shirts=JSON.parse(String(data.get('shirts')||'[]'))}catch{return fail('בחרו מידות וצבעים תקינים.')}
 if(mode==='lead'){if(!Array.isArray(shirts)||shirts.length!==0)return fail('פניית התייעצות אינה דורשת בחירת מידות.');shirts=[];}
 else if(!validateShirts(shirts,quantity))return fail('יש לבחור מידה וצבע מותרים לכל חולצה.');
 const files=data.getAll('images').filter((f):f is File=>f instanceof File&&f.size>0);
 const uploadError=imageUploadError(files);if(uploadError)return fail(uploadError);
 const payloads=[];for(const f of files){const bytes=await f.arrayBuffer();if(!validImage(new Uint8Array(bytes),f.type))return fail('אחד הקבצים אינו תמונת JPG, PNG או WEBP תקינה.');payloads.push({name:f.name,bytes,type:f.type})}
 const id=crypto.randomUUID(),saved:string[]=[];
 const order={subtotal,discount,...(coupon?{couponCode:coupon.code}:{}),pricingVersion:pricing.version,id,name,phone,email,brief,package:pack,packageName:packs[pack].name,quantity,price:total,shirts:shirts as {size:string;color:string}[],baseQuantity:packs[pack].n,extraShirtPrice:pricing.extraShirtPrice,priceStatus:'advertised',mode,createdAt:new Date().toISOString(),status:'received',communicationChannel:'email',communicationStatus:'pending',images:[] as {name:string;key:string;size:number;role:string}[]};
 try{for(let i=0;i<payloads.length;i++){const f=payloads[i],key=`orders/${id}/reference-${i}`;await bindings.BUCKET.put(key,f.bytes,{httpMetadata:{contentType:f.type}});saved.push(key);order.images.push({name:f.name,key,size:f.bytes.byteLength,role:"reference"})}}catch(e){await Promise.allSettled(saved.map(k=>bindings.BUCKET.delete(k)));throw e}
 const summary=orderSummary(order);
 await bindings.BUCKET.put(`orders/${id}/order.txt`,summary,{httpMetadata:{contentType:'text/plain; charset=utf-8'}});
 let stored;try{stored=await insertOrder(order,coupon)}catch(e){await Promise.allSettled([...saved,`orders/${id}/order.txt`].map(k=>bindings.BUCKET.delete(k)));throw e}
 let emailSent=false;try{const bundleUrl=await createOrderAccess(bindings.BUCKET,id);emailSent=await notifyOrder(bindings,stored,bundleUrl)}catch{console.error("Order mail link unavailable")}
 try{await saveOrder({...stored,emailStatus:emailSent?'accepted':bindings.RESEND_API_KEY&&bindings.MAIL_FROM?'failed':'not_configured'},1,'הזמנה התקבלה מהאתר','אתר');}catch{console.error('Order delivery status update failed')}
 return Response.json({id,summary,emailSent},{status:201,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){if(e instanceof Error&&e.message==='coupon_unavailable')return fail('המבצע הסתיים בזמן השליחה. הסירו את הקוד ונסו שוב.',409);if(e instanceof Error&&e.message==='too_large')return fail('הקבצים גדולים מדי. עד 10 תמונות, 5MB לתמונה ו־15MB בסך הכול.',413);console.error('Order save failed');return fail('לא הצלחנו לשמור את הפנייה. הפרטים נשארו בטופס, נסו שוב או פנו ב־WhatsApp.',503)}
}
