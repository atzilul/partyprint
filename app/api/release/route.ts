import {buildIdentity} from '@/lib/release';

export const dynamic='force-dynamic';
export function GET(){
 return Response.json({app:'PARTYPRINT',...buildIdentity()},{headers:{
  'Cache-Control':'no-store',
  'X-Robots-Tag':'noindex, nofollow, noarchive',
  'X-Content-Type-Options':'nosniff',
 }});
}
