import {getTeam,getOwnerEmail} from './team';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {PRIVATE_HEADERS} from './security';
export {PRIVATE_HEADERS} from './security';
export async function isAdmin(){const u=await getChatGPTUser();if(!u)return null;if(u.email.toLowerCase()===getOwnerEmail())return u;try{return (await getTeam()).members.some(m=>m.email===u.email.toLowerCase())?u:null}catch{return null}}
export async function adminRole(){const u=await isAdmin();if(!u)return null;if(u.email.toLowerCase()===getOwnerEmail())return 'owner' as const;return (await getTeam()).members.find(m=>m.email===u.email.toLowerCase())?.role||'manager'}
export async function guard(request?:Request,access:'manage'|'team'|'owner'='manage'){const role=await adminRole();if(!role||(access==='manage'&&!['owner','manager'].includes(role))||(access==='owner'&&role!=='owner'))return Response.json({error:'הגישה מוגבלת לצוות מורשה.'},{status:403,headers:PRIVATE_HEADERS});if(request&&request.method!=='GET'&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'בקשה אינה מורשית.'},{status:403,headers:PRIVATE_HEADERS});return null}
export function adminError(e:unknown){const message=e instanceof Error?e.message:'';return Response.json({error:message==='conflict'?'ההזמנה עודכנה במכשיר אחר. רעננו לפני שמירה.':message==='too_large'?'הבקשה או הקבצים גדולים מדי.':message==='invalid_json'?'הבקשה לא תקינה.':'לא ניתן להשלים את הפעולה. נסו שוב.'},{status:message==='conflict'?409:message==='too_large'?413:message==='invalid_json'?400:503,headers:PRIVATE_HEADERS})}
