import {bindings} from './order-store';
export const DEFAULT_OWNER_EMAIL='atzilul@gmail.com';
export function getOwnerEmail(){const email=(process.env.PARTYPRINT_ADMIN_EMAIL||'').trim().toLowerCase();return email||DEFAULT_OWNER_EMAIL}
export type TeamRole='manager'|'designer'|'printer';
export type TeamProfile={name:string;avatarKey?:string};
export type TeamMember={role?:TeamRole;email:string;name:string;addedAt:string;avatarKey?:string;passwordHash?:string};
export type Team={version:number;members:TeamMember[];history:{at:string;action:string;email:string}[];ownerProfile?:TeamProfile};
export async function getTeam():Promise<Team>{
 const row=await bindings().DB.prepare("SELECT data,version FROM studio_settings WHERE key='team'").first<{data:string;version:number}>();
 if(!row)return {version:0,members:[],history:[],ownerProfile:{name:'בעל האתר'}};
 try{const value=JSON.parse(row.data) as Partial<Team>;return {version:row.version,members:Array.isArray(value.members)?value.members:[],history:Array.isArray(value.history)?value.history:[],ownerProfile:value.ownerProfile||{name:'בעל האתר'}}}catch{return {version:row.version,members:[],history:[],ownerProfile:{name:'בעל האתר'}}}
}
export function memberFor(team:Team,email:string){return team.members.find(member=>member.email.toLowerCase()===email.toLowerCase())||null}
export function publicMember(member:TeamMember,origin?:string){return {email:member.email,name:member.name,role:member.role||'manager',addedAt:member.addedAt,avatarUrl:member.avatarKey&&origin?`${origin}/api/admin/profile/avatar?email=${encodeURIComponent(member.email)}`:undefined}}
export function publicTeam(team:Team,origin?:string){return {version:team.version,members:team.members.map(member=>publicMember(member,origin)),history:team.history,ownerEmail:getOwnerEmail(),ownerProfile:{name:team.ownerProfile?.name||'בעל האתר',avatarUrl:team.ownerProfile?.avatarKey&&origin?`${origin}/api/admin/profile/avatar?email=${encodeURIComponent(getOwnerEmail())}`:undefined}}}
