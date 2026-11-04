/**
 * The studio's response promise, defined once. Change the hours here and every
 * form step, the confirmation page and the emails change together.
 */
export const RESPONSE_PROMISE={
 /** Sunday to Thursday (0 = Sunday), Israel time. */
 days:[0,1,2,3,4],
 openHour:9,
 closeHour:19,
 hoursLabel:'א׳ עד ה׳, 9:00 עד 19:00',
 within:'תוך שעתיים',
 channel:'WhatsApp',
} as const;

/** Time-independent sentence, safe for server rendering and emails. */
export const RESPONSE_PROMISE_STATIC='חוזרים אליכם ב־WhatsApp תוך שעתיים בשעות הפעילות ('+RESPONSE_PROMISE.hoursLabel+').';

const WEEKDAYS:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
export function israelClock(now:Date){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jerusalem',weekday:'short',hour:'numeric',hour12:false}).formatToParts(now);
 const weekday=WEEKDAYS[parts.find(p=>p.type==='weekday')?.value||'']??now.getDay();
 const hour=Number(parts.find(p=>p.type==='hour')?.value||now.getHours())%24;
 return {weekday,hour};
}
export function withinBusinessHours(now=new Date()){
 const {weekday,hour}=israelClock(now);
 return (RESPONSE_PROMISE.days as readonly number[]).includes(weekday)&&hour>=RESPONSE_PROMISE.openHour&&hour<RESPONSE_PROMISE.closeHour;
}
/** Sentence for the current moment: inside hours, before opening, or until the next business morning. */
export function responsePromiseText(now=new Date()){
 if(withinBusinessHours(now))return RESPONSE_PROMISE_STATIC;
 const {weekday,hour}=israelClock(now);
 const workday=(RESPONSE_PROMISE.days as readonly number[]).includes(weekday);
 const when=workday&&hour<RESPONSE_PROMISE.openHour?'הבוקר מ־'+RESPONSE_PROMISE.openHour+':00':weekday===4||weekday===5||weekday===6?'ביום ראשון בבוקר':'מחר בבוקר';
 return 'אנחנו מחוץ לשעות הפעילות כרגע. חוזרים אליכם ב־WhatsApp '+when+' ('+RESPONSE_PROMISE.hoursLabel+').';
}
