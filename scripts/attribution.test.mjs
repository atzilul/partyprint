import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAttribution,describeAttribution,attributionLines} from '../lib/attribution.ts';
import {responsePromiseText,withinBusinessHours,RESPONSE_PROMISE_STATIC} from '../lib/response-promise.ts';

test('attribution keeps only known keys with short safe values',()=>{
 const parsed=parseAttribution({utm_source:'facebook',utm_medium:'paid',utm_campaign:'bride_nov',utm_content:'video_01',fbclid:'IwAR2abc',email:'private@example.com',utm_term:'x'.repeat(300),landing_path:'/?v=bride',extra:'ignored',gclid:42});
 assert.deepEqual(parsed,{utm_source:'facebook',utm_medium:'paid',utm_campaign:'bride_nov',utm_content:'video_01',utm_term:'x'.repeat(200),fbclid:'IwAR2abc',landing_path:'/?v=bride'});
 assert.equal(parseAttribution(JSON.stringify({utm_source:'<script>alert(1)</script>'})).utm_source,'scriptalert(1)/script');
 assert.equal(parseAttribution({utm_source:'me@example.com'}),undefined);
 assert.equal(parseAttribution('not json'),undefined);
 assert.equal(parseAttribution([]),undefined);
 assert.equal(parseAttribution(null),undefined);
});

test('one line describes the source for emails and the admin panel',()=>{
 assert.equal(describeAttribution({utm_source:'facebook',utm_medium:'paid',utm_campaign:'bride_nov',utm_content:'video_01'}),'facebook / paid / bride_nov / video_01');
 assert.equal(describeAttribution({fbclid:'IwAR2abc'}),'facebook / click');
 assert.equal(describeAttribution({gclid:'abc'}),'google / click');
 assert.equal(describeAttribution({referrer:'https://www.google.com/'}),'organic / www.google.com');
 assert.equal(describeAttribution({landing_path:'/'}),'direct');
 assert.equal(describeAttribution(undefined),'direct');
 assert.deepEqual(attributionLines({utm_source:'facebook',utm_medium:'paid',landing_path:'/?v=bride',first_seen_at:'2026-11-04T10:00:00.000Z',fbclid:'IwAR2abc'}),['מקור: facebook / paid','דף נחיתה: /?v=bride','ביקור ראשון: 2026-11-04T10:00:00.000Z','מזהה קליק מטא: IwAR2abc']);
});

test('response promise follows Israel business hours',()=>{
 const tuesdayNoon=new Date('2026-11-03T10:00:00Z');
 const tuesdayNight=new Date('2026-11-03T20:00:00Z');
 const tuesdayDawn=new Date('2026-11-03T05:00:00Z');
 const thursdayNight=new Date('2026-11-05T18:30:00Z');
 const saturday=new Date('2026-11-07T12:00:00Z');
 assert.equal(withinBusinessHours(tuesdayNoon),true);
 assert.equal(responsePromiseText(tuesdayNoon),RESPONSE_PROMISE_STATIC);
 assert.match(responsePromiseText(tuesdayNight),/מחר בבוקר/);
 assert.match(responsePromiseText(tuesdayDawn),/הבוקר מ־9:00/);
 assert.match(responsePromiseText(thursdayNight),/ביום ראשון בבוקר/);
 assert.match(responsePromiseText(saturday),/ביום ראשון בבוקר/);
 assert.equal(RESPONSE_PROMISE_STATIC.includes('—'),false);
});
