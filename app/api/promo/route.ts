import {getPromoCoupon} from '@/lib/studio-settings';
import {promoTexts} from '@/lib/promo-translation';

export async function GET(){
 try{
  const coupon=await getPromoCoupon();
  return Response.json(coupon?{text:coupon.promoText,code:coupon.code,texts:promoTexts(coupon.promoText||'',coupon)}:{text:'',code:'',texts:{en:'',ar:''}},{headers:{'Cache-Control':'no-store'}});
 }catch{
  return Response.json({text:'',code:'',texts:{en:'',ar:''}},{headers:{'Cache-Control':'no-store'}});
 }
}
