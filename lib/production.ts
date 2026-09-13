import type {Order} from './orders';
export type DesignApproval={id:string;hash:string;expiresAt:number;state:'pending'|'approved'|'changes'|'stale';createdAt:string;respondedAt?:string;comment?:string;customerName?:string;sourceKeys:string[];images:{key:string;name:string}[];shirtsSignature:string;quantity:number;shirts:Order['shirts']};
export type PaymentEntry={id:string;kind:'deposit'|'balance'|'refund';amount:number;method:string;reference:string;at:string};
export const shirtSignature=(o:Order)=>JSON.stringify({quantity:o.quantity,shirts:o.shirts});
export function approvalCurrent(o:Order){const a=o.approval;return !!a&&a.shirtsSignature===shirtSignature(o)&&a.sourceKeys.every(k=>o.images.some(i=>i.key===k&&(i.role==='design'||i.role==='print')))}
export function paidTotal(o:Order){return (o.payments||[]).reduce((n,p)=>n+(p.kind==='refund'?-1:1)*Math.round(p.amount*100),0)/100}
export function productionReady(o:Order){return o.approval?.state==='approved'&&approvalCurrent(o)}
