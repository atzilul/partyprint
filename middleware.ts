import {NextResponse,type NextRequest} from 'next/server';

const privatePrefixes=['/admin','/api','/track','/design','/signin-with-chatgpt','/signout-with-chatgpt','/chatgpt-auth'];
// Canonical production redirects preserve campaign attribution. The managed
// preview receives noindex when this source is eventually deployed there.
export function middleware(request:NextRequest){
 const host=(request.headers.get('host')||request.nextUrl.hostname).toLowerCase().replace(/:\d+$/,'');
 let response;
 if(host==='www.partyprint.co.il'){
  const destination=new URL('https://partyprint.co.il');
  destination.pathname=request.nextUrl.pathname;
  destination.search=request.nextUrl.search;
  response=NextResponse.redirect(destination,308);
 }else response=NextResponse.next();
 const privatePath=privatePrefixes.some(prefix=>request.nextUrl.pathname===prefix||request.nextUrl.pathname.startsWith(prefix+'/'));
 if(privatePath||host==='partyprint-ai.atzilul.chatgpt.site')response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
 return response;
}
export const config={matcher:'/:path*'};
