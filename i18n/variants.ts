import {responsePromiseText} from '@/lib/response-promise';

/**
 * Sentences that depend on the moment, so that rendering a page once does not meet all of
 * them. Each entry produces one of the forms; the sync asks for them when it collects.
 * Times are given in UTC; the sentence itself is computed for Israel time.
 */
export const VARIANTS:(()=>string)[]=[
 ()=>responsePromiseText(new Date('2026-11-09T08:00:00Z')), // a workday, inside hours
 ()=>responsePromiseText(new Date('2026-11-09T04:00:00Z')), // a workday, before opening
 ()=>responsePromiseText(new Date('2026-11-09T20:00:00Z')), // a workday evening: tomorrow morning
 ()=>responsePromiseText(new Date('2026-11-12T20:00:00Z')), // Thursday evening: Sunday morning
];
