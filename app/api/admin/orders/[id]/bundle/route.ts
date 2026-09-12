import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {getOrder,bindings} from '@/lib/order-store';
import {orderSummary} from '@/lib/order-summary';
import {orderZip} from '@/lib/order-zip';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const denied=await guard();if(denied)return denied;try{const o=await getOrder((await params).id);if(!o)return new Response('Not found',{status:404});const files:File[]=[];for(const i of o.images){const f=await bindings().BUCKET.get(i.key);if(!f)throw Error('missing');files.push(new File([await f.arrayBuffer()],i.name,{type:f.httpMetadata?.contentType}))}const zip=await orderZip(new File(['\uFEFF',orderSummary(o)],'order.txt'),files,o.id);return new Response(zip,{headers:{...PRIVATE_HEADERS,'Content-Type':'application/zip','Content-Disposition':`attachment; filename="${zip.name}"`}})}catch(e){return adminError(e)}}
