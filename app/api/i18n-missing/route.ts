import {reportMissing,sentencesToTranslate} from '@/i18n/server';

/**
 * Translation sync only (PP_I18N_COLLECT=1): the sentences that were shown on a translated
 * address without a translation. The server lists what it rendered; the browser adds what
 * appeared after a click (errors, dialogs, later steps).
 */
export const dynamic='force-dynamic';
const collecting=()=>process.env.PP_I18N_COLLECT==='1';
export async function GET(){
 if(!collecting())return new Response(null,{status:404});
 return Response.json(sentencesToTranslate(),{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:Request){
 if(!collecting())return new Response(null,{status:404});
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response(null,{status:403});
 const raw=await request.text();
 if(raw.length>200000)return new Response(null,{status:413});
 try{
  const {language,keys}=JSON.parse(raw) as {language?:unknown;keys?:unknown};
  if(typeof language!=='string'||!/^[a-z]{2}$/.test(language)||!Array.isArray(keys))return new Response(null,{status:400});
  for(const key of keys)if(typeof key==='string'&&key.length<=2000)reportMissing(language,key);
  return new Response(null,{status:204});
 }catch{return new Response(null,{status:400});}
}
