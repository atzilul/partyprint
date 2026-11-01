import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,analyze} from './search-metrics.mjs';
test('Hebrew CSV and quoted commas/newlines survive import',()=>{
 assert.deepEqual(parseCsv('\uFEFFdate,query,page,clicks,impressions,position\r\n2026-10-31,"חולצות, למשפחה",https://partyprint.co.il/,1,10,4\r\n')[0].query,'חולצות, למשפחה');
 assert.throws(()=>parseCsv('a,a\n1,2'));
 assert.throws(()=>parseCsv(' a,a\n1,2'));
 assert.throws(()=>parseCsv('a,b\n"unfinished,2'));
});
test('CTR and position use correct weights, not averages of averages',()=>{
 const r=analyze([{date:'2026-10-30',query:'א',page:'/',clicks:'1',impressions:'10',position:'2'},{date:'2026-10-31',query:'ב',page:'/',clicks:'9',impressions:'90',position:'12'}]);
 assert.equal(r.gsc.ctr,.1);
 assert.equal(r.gsc.position,11);
});
test('missing is not zero and event counts are not lead sessions',()=>{
 assert.throws(()=>analyze([{date:'2026-10-31',page:'/',clicks:'',impressions:'10'}]));
 const r=analyze([],[{date:'20261031',landing_page:'/',sessions:'10',generate_lead_events:'12'}]);
 assert.equal(r.ga4.leadSessionRate,null);
 assert.equal(r.ga4.leadSessions,null);
 assert.equal(r.ga4.generateLeadEvents,12);
 assert.throws(()=>analyze([],[{date:'2026-10-31',landing_page:'/',sessions:10,lead_sessions:12}]));
});
test('duplicate grains and other domains fail; private customer URLs are excluded',()=>{
 const row={date:'2026-10-31',query:'x',page:'/',clicks:'1',impressions:'2',position:'3'};
 assert.throws(()=>analyze([row,row]));
 assert.throws(()=>analyze([{...row,page:''}]));
 assert.throws(()=>analyze([{...row,page:'https://unrelated.example/'}]));
 const r=analyze([{...row,page:'/track/private-token'}]);
 assert.equal(r.gsc.rows,0);assert.equal(r.gsc.excludedPrivateRows,1);
});
