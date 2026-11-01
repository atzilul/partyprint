import {NextResponse,type NextRequest} from 'next/server';

// Use the fixed canonical origin and retain attribution parameters. The
// vinext config redirect drops the incoming query string in this runtime.
export function middleware(request:NextRequest){
 const host=(request.headers.get('host')||request.nextUrl.hostname).toLowerCase().replace(/:\d+$/,'');
 if(host!=='www.partyprint.co.il')return NextResponse.next();
 const destination=new URL('https://partyprint.co.il');
 destination.pathname=request.nextUrl.pathname;
 destination.search=request.nextUrl.search;
 return NextResponse.redirect(destination,308);
}
export const config={matcher:'/:path*'};
