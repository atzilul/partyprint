import {guard} from '@/lib/admin-auth';
import {PRIVATE_HEADERS} from '@/lib/security';
import {bindings} from '@/lib/order-store';
import {normalizeOrder,Order} from '@/lib/orders';
import {assignees,failure} from '../_shared';
export async function GET(){
 const denied=await guard();if(denied)return denied;
 try{
  const rows=await bindings().DB.prepare('SELECT id,data FROM orders ORDER BY created_at DESC LIMIT 300').all<{id:string;data:string}>();
  const orders=rows.results.map(row=>{const order=normalizeOrder(JSON.parse(row.data) as Order);return {id:row.id,name:order.name,email:order.email,packageName:order.packageName,quantity:order.quantity,status:order.status,createdAt:order.createdAt}});
  return Response.json({assignees:await assignees(),orders},{headers:PRIVATE_HEADERS});
 }catch(error){return failure(error)}
}
