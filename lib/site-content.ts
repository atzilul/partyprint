import {bindings} from './order-store';
export type SiteContent={version:number;leadDays:number|null;sizes:{size:string;width:number;length:number}[];gallery:{id:string;key:string;title:string;quote:string;customer:string;consent:boolean}[]};
export async function getContent():Promise<SiteContent>{const row=await bindings().DB.prepare("SELECT data,version FROM studio_settings WHERE key='content'").first<{data:string;version:number}>();return row?{...JSON.parse(row.data),version:row.version}:{version:0,leadDays:null,sizes:[],gallery:[]}}
