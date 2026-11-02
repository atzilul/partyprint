import {validCalendarDate} from './contact-validation';
// Sunday–Thursday planning aid, not a delivery promise. Holidays and studio
// capacity need manual confirmation before payment or print approval.
export function eventPlanning(eventDate:string){
 if(!validCalendarDate(eventDate))return null;
 const arrival=new Date(eventDate+'T12:00:00Z');
 while(arrival.getUTCDay()===5||arrival.getUTCDay()===6)arrival.setUTCDate(arrival.getUTCDate()-1);
 const approval=new Date(arrival);let left=5;
 while(left){approval.setUTCDate(approval.getUTCDate()-1);if(approval.getUTCDay()!==5&&approval.getUTCDay()!==6)left--;}
 return {approvalBy:approval.toISOString().slice(0,10),arrivalBy:arrival.toISOString().slice(0,10)};
}
