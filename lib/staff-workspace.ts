import type {Order} from './orders';
import {productionReady} from './production';
export type StaffJob={id:string;version:number;status:string;quantity:number;brief?:string;task?:string;taskDue?:string;ready?:boolean;printNote?:string;images?:{name:string;key:string;role?:string}[]};
/** Explicit allowlist shared by listing and save responses. */
export function staffJob(o:Order,role:string):StaffJob{
 const common={id:o.id,version:o.version!,status:o.status,quantity:o.quantity,task:o.task,taskDue:o.taskDue};
 return role==='printer'?{...common,ready:productionReady(o),printNote:o.printNote}:{...common,brief:o.brief,images:o.images.map(i=>({name:i.name,key:i.key,role:i.role}))};
}
