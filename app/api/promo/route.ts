import {getPromoCoupon} from '@/lib/studio-settings';

export async function GET(){
 try{
  const coupon=await getPromoCoupon();
  return Response.json(coupon?{text:coupon.promoText,code:coupon.code}:{text:'',code:''},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({text:'',code:''},{headers:{'Cache-Control':'no-store'}});
 }
}
