import {bindings} from './order-store';
export const OWNER_EMAIL='atzilul@gmail.com';
export type TeamRole='manager'|'designer'|'printer';
export type TeamMember={role?:TeamRole;email:string;name:string;addedAt:string};
export type Team={version:number;members:TeamMember[];history:{at:string;action:string;email:string}[]};
export async function getTeam():Promise<Team>{const row=await bindings().DB.prepare("SELECT data,version FROM studio_settings WHERE key='team'").first<{data:string;version:number}>();return row?{...JSON.parse(row.data),version:row.version}:{version:0,members:[],history:[]}}
