/** Shared browser/server checks; accepts local Israeli and international numbers. */
export function validPhone(value:string){
 const phone=value.trim();
 if(!/^\+?[0-9() \-]{9,20}$/.test(phone))return false;
 const digits=phone.replace(/\D/g,'');
 if(/^0(?!0)/.test(digits))return /^0[1-9]\d{7,8}$/.test(digits);
 const international=digits.startsWith('00')?digits.slice(2):digits;
 return /^[1-9]\d{8,14}$/.test(international);
}
export function validCalendarDate(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00.000Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
