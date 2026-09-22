import {guard,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getOwnerEmail,getTeam,memberFor} from '@/lib/team';
import {bindings} from '@/lib/order-store';
export async function GET(request:Request){
 const denied=await guard(undefined,'team');if(denied)return denied;
 try{const user=await getChatGPTUser();if(!user)return new Response(null,{status:401,headers:PRIVATE_HEADERS});const requested=(new URL(request.url).searchParams.get('email')||user.email).trim().toLowerCase();const isOwner=user.email.toLowerCase()===getOwnerEmail();if(requested!==user.email.toLowerCase()&&!isOwner)return new Response(null,{status:403,headers:PRIVATE_HEADERS});const team=await getTeam(),key=requested===getOwnerEmail()?team.ownerProfile?.avatarKey:memberFor(team,requested)?.avatarKey;if(!key)return new Response(null,{status:404,headers:PRIVATE_HEADERS});const file=await bindings().BUCKET.get(key);if(!file)return new Response(null,{status:404,headers:PRIVATE_HEADERS});return new Response(file.body,{headers:{...PRIVATE_HEADERS,'Content-Type':file.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'private, max-age=300'}})}catch(e){return adminError(e)}
}
