import {guard,adminRole,PRIVATE_HEADERS,adminError} from '@/lib/admin-auth';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getOwnerEmail,getTeam,memberFor} from '@/lib/team';
import {bindings} from '@/lib/order-store';
import {readLimitedForm,validImage} from '@/lib/order-security';

function profileResponse(team:Awaited<ReturnType<typeof getTeam>>,email:string,origin:string){
 const owner=email===getOwnerEmail();
 const member=memberFor(team,email);
 if(!owner&&!member)return null;
 return {email,name:owner?team.ownerProfile?.name||'בעל האתר':member?.name||email,role:owner?'owner':member?.role||'manager',avatarUrl:(owner?team.ownerProfile?.avatarKey:member?.avatarKey)?`${origin}/api/admin/profile/avatar?email=${encodeURIComponent(email)}`:null,isOwner:owner};
}
export async function GET(request:Request){
 const denied=await guard(undefined,'team');if(denied)return denied;
 try{const user=await getChatGPTUser();if(!user)return new Response(null,{status:401,headers:PRIVATE_HEADERS});const target=(new URL(request.url).searchParams.get('email')||user.email).trim().toLowerCase();const role=await adminRole();if(target!==user.email.toLowerCase()&&role!=='owner')return new Response(null,{status:403,headers:PRIVATE_HEADERS});const team=await getTeam();const profile=profileResponse(team,target,new URL(request.url).origin);return profile?Response.json({profile},{headers:PRIVATE_HEADERS}):new Response(null,{status:404,headers:PRIVATE_HEADERS})}catch(e){return adminError(e)}
}
export async function POST(request:Request){
 const denied=await guard(request,'team');if(denied)return denied;
 let newKey='';
 try{
  const user=await getChatGPTUser();if(!user)return new Response(null,{status:401,headers:PRIVATE_HEADERS});
  const role=await adminRole(),form=await readLimitedForm(request),requested=(String(form.get('targetEmail')||user.email)).trim().toLowerCase(),target=requested||user.email.toLowerCase();
  if(target!==user.email.toLowerCase()&&role!=='owner')return new Response(null,{status:403,headers:PRIVATE_HEADERS});
  const name=String(form.get('name')||'').trim();if(!name||name.length>100)return Response.json({error:'הזינו שם לתצוגה עד 100 תווים.'},{status:400,headers:PRIVATE_HEADERS});
  const file=form.get('avatar');if(file instanceof File&&file.size>2*1024*1024)return Response.json({error:'תמונת הפרופיל יכולה להיות עד 2MB.'},{status:400,headers:PRIVATE_HEADERS});
  let bytes:ArrayBuffer|undefined;let type='';if(file instanceof File&&file.size){bytes=await file.arrayBuffer();type=file.type;if(!validImage(new Uint8Array(bytes),type))return Response.json({error:'בחרו תמונת JPG, PNG או WEBP תקינה.'},{status:400,headers:PRIVATE_HEADERS});newKey='profiles/'+crypto.randomUUID();await bindings().BUCKET.put(newKey,bytes,{httpMetadata:{contentType:type}})}
  const team=await getTeam();const owner=target===getOwnerEmail(),member=memberFor(team,target);if(!owner&&!member)return new Response(null,{status:404,headers:PRIVATE_HEADERS});const next={...team,ownerProfile:owner?{name, ...(newKey?{avatarKey:newKey}:team.ownerProfile?.avatarKey?{avatarKey:team.ownerProfile.avatarKey}:{})}:team.ownerProfile,members:owner?team.members:team.members.map(item=>item.email===target?{...item,name,...(newKey?{avatarKey:newKey}:item.avatarKey?{avatarKey:item.avatarKey}:{})}:item),history:[...team.history,{at:new Date().toISOString(),action:'profile',email:target}].slice(-200)};const db=bindings().DB;const result=team.version===0?await db.prepare("INSERT OR IGNORE INTO studio_settings (key,version,data) VALUES ('team',1,?) RETURNING version").bind(JSON.stringify(next)).first():await db.prepare("UPDATE studio_settings SET version=version+1,data=? WHERE key='team' AND version=? RETURNING version").bind(JSON.stringify(next),team.version).first();if(!result)throw Error('conflict');const oldKey=owner?team.ownerProfile?.avatarKey:member?.avatarKey;if(newKey&&oldKey)await bindings().BUCKET.delete(oldKey);return Response.json({profile:profileResponse({...next,version:Number(result.version)},target,new URL(request.url).origin)},{headers:PRIVATE_HEADERS});
 }catch(e){if(newKey)await bindings().BUCKET.delete(newKey).catch(()=>{});return adminError(e)}
}
