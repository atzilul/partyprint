const RESPONSE_SCHEDULE = {
  timeZone: 'Asia/Jerusalem',
  openingHour: 9,
  closingHour: 19,
  workdays: [0, 1, 2, 3, 4], // Sunday–Thursday
  publicHours: 'א׳–ה׳ 9:00–19:00',
} as const;

function israelParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESPONSE_SCHEDULE.timeZone,
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const read = (key: string) => parts.find(item => item.type === key)?.value || '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(read('weekday'));
  return {weekday, hour: Number(read('hour')), minute: Number(read('minute')), year: Number(read('year')), month: Number(read('month')), day: Number(read('day'))};
}

function isBusinessDay(day: number) { return (RESPONSE_SCHEDULE.workdays as readonly number[]).includes(day); }

export function responsePromiseMessage(now = new Date()): string {
  const {weekday, hour} = israelParts(now);
  if (isBusinessDay(weekday) && hour >= RESPONSE_SCHEDULE.openingHour && hour < RESPONSE_SCHEDULE.closingHour) {
    return 'חוזרים אליכם ב־WhatsApp תוך שעתיים בשעות הפעילות (' + RESPONSE_SCHEDULE.publicHours + ').';
  }
  if (isBusinessDay(weekday) && hour < RESPONSE_SCHEDULE.openingHour) {
    return 'כרגע לפני שעות הפעילות — נחזור אליכם היום בבוקר (' + RESPONSE_SCHEDULE.publicHours + ').';
  }
  if (weekday === 0 || weekday === 1 || weekday === 2 || weekday === 3) {
    return 'כרגע מחוץ לשעות הפעילות — נחזור אליכם מחר בבוקר (' + RESPONSE_SCHEDULE.publicHours + ').';
  }
  return 'כרגע מחוץ לשעות הפעילות — נחזור אליכם ביום ראשון בבוקר (' + RESPONSE_SCHEDULE.publicHours + ').';
}

function nextWorkingMinute(value: Date) {
  while (true) {
    const weekday = value.getUTCDay();
    const minuteOfDay = value.getUTCHours() * 60 + value.getUTCMinutes();
    if (!isBusinessDay(weekday) || minuteOfDay >= RESPONSE_SCHEDULE.closingHour * 60) {
      value.setUTCDate(value.getUTCDate() + 1);
      value.setUTCHours(RESPONSE_SCHEDULE.openingHour, 0, 0, 0);
      continue;
    }
    if (minuteOfDay < RESPONSE_SCHEDULE.openingHour * 60) {
      value.setUTCHours(RESPONSE_SCHEDULE.openingHour, 0, 0, 0);
    }
    return;
  }
}

/** Returns a manually editable first-reply deadline in Israel time (two business hours). */
export function firstReplyDeadline(now = new Date()): string {
  const p = israelParts(now);
  const wallClock = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
  nextWorkingMinute(wallClock);
  let remaining = 120;
  while (remaining > 0) {
    nextWorkingMinute(wallClock);
    const available = RESPONSE_SCHEDULE.closingHour * 60 - (wallClock.getUTCHours() * 60 + wallClock.getUTCMinutes());
    const used = Math.min(remaining, available);
    wallClock.setUTCMinutes(wallClock.getUTCMinutes() + used);
    remaining -= used;
  }
  const h = String(wallClock.getUTCHours()).padStart(2, '0');
  const m = String(wallClock.getUTCMinutes()).padStart(2, '0');
  const startDate = Date.UTC(p.year, p.month - 1, p.day);
  const deadlineDate = Date.UTC(wallClock.getUTCFullYear(), wallClock.getUTCMonth(), wallClock.getUTCDate());
  const startDay = new Date(startDate).getUTCDay();
  const offset = Math.round((deadlineDate - startDate) / 86400000);
  const deadlineDay = new Date(deadlineDate).getUTCDay();
  const dayPhrase = deadlineDay === startDay ? 'היום' : deadlineDay === (startDay + 1) % 7 ? 'מחר' : 'ביום ראשון';
  return 'עד ' + h + ':' + m + ' ' + dayPhrase;
}

export function firstReplyMessage(input: {name: string; reference: string; quantity: number; event: string}, now = new Date()): string {
  const firstName = input.name.trim().split(/\s+/)[0] || 'שם';
  return 'היי ' + firstName + ', קיבלנו את הפנייה ' + input.reference + ' ל־' + input.quantity + ' חולצות ל־' + input.event + '. אני מ־PARTYPRINT, חוזר/ת אליך עם כיוון ראשון ' + firstReplyDeadline(now) + '. בינתיים, יש תמונה שאתם הכי אוהבים?';
}
