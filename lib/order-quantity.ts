import {MIN_SHIRT_QUANTITY,MAX_SHIRT_QUANTITY} from './catalog';
import type {ShirtSelection} from './catalog';

export const emptyShirt=():ShirtSelection=>({size:'',color:'',sizeType:'adult'});
export function normalizeOrderQuantity(value:number):number{
 return Number.isFinite(value)?Math.max(MIN_SHIRT_QUANTITY,Math.min(MAX_SHIRT_QUANTITY,Math.floor(value))):MIN_SHIRT_QUANTITY;
}
// Keep the unused tail so reducing and then increasing a quantity restores
// choices. Only the active prefix is displayed, validated or submitted.
export function ensureShirtCapacity(items:ShirtSelection[]|undefined,quantity:number):ShirtSelection[]{
 return Array.from({length:Math.max(items?.length??0,normalizeOrderQuantity(quantity))},(_,i)=>items?.[i]??emptyShirt());
}
export function mergeShirtChoices(saved:ShirtSelection[],visible:ShirtSelection[]):ShirtSelection[]{
 return [...visible,...saved.slice(visible.length)];
}
