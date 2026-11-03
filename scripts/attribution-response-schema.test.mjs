import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMarketingAttributionConsent, createFirstTouch, readFirstTouchAttribution, FIRST_TOUCH_KEY, sanitizeAttribution, attributionSummary} from '../lib/attribution.ts';
import {firstReplyDeadline, responsePromiseMessage} from '../lib/response-promise.ts';
import {homeFaqItems} from '../lib/home-faq.ts';
import {homeStructuredData} from '../lib/home-schema.ts';
import {organizationStructuredData} from '../lib/organization-schema.ts';
import {BUSINESS_DETAILS, PAYMENT_DISCLOSURE} from '../lib/business-details.ts';
import {marketingIdentifiersAllowedFor} from '../lib/analytics.ts';

test('first-touch attribution retains campaign, landing path, safe referrer, and direct/organic defaults', () => {
  const first = createFirstTouch({
    href:'https://partyprint.co.il/?utm_source=facebook&utm_medium=paid&utm_campaign=bride_nov&utm_content=video_01&utm_term=matching&fbclid=click_123',
    referrer:'https://l.instagram.com/path?q=private',
    cookie:'_fbp=fb.1.100.200; _fbc=fb.1.100.click_123',
    now:new Date('2026-11-03T10:00:00.000Z'),
  });
  assert.equal(first.utm_source,'facebook');
  assert.equal(first.utm_medium,'paid');
  assert.equal(first.utm_campaign,'bride_nov');
  assert.equal(first.utm_content,'video_01');
  assert.equal(first.utm_term,'matching');
  assert.equal(first.fbclid,'click_123');
  assert.equal(first.fbp,'');
  assert.equal(first.fbc,'');
  assert.equal(first.landing_path,'/');
  assert.equal(first.referrer,'https://l.instagram.com/path');
  assert.equal(first.first_seen_at,'2026-11-03T10:00:00.000Z');

  const consented=createFirstTouch({href:'https://partyprint.co.il/lp/bride',cookie:'_fbp=fb.1.1.2; _fbc=fb.1.1.abc',marketingConsent:true,now:new Date('2026-11-03T10:00:00Z')});
  assert.equal(consented.fbp,'fb.1.1.2');
  assert.equal(consented.fbc,'fb.1.1.abc');
  assert.equal(consented.utm_source,'direct');
  const organic=createFirstTouch({href:'https://partyprint.co.il/',referrer:'https://www.google.co.il/search?q=private'});
  assert.equal(organic.utm_source,'google');
  assert.equal(organic.utm_medium,'organic');
  const direct=createFirstTouch({href:'https://partyprint.co.il/'});
  assert.equal(direct.utm_source,'direct');
  assert.equal(direct.utm_medium,'direct');
});

test('attribution sanitization and manager summary are bounded and strip URL query data', () => {
  const safe=sanitizeAttribution({utm_source:'facebook\n<script>',fbclid:'x/?@y',landing_path:'//evil.example',referrer:'https://example.com/path?email=private#hash'});
  assert.equal(safe.utm_source,'facebook <script>');
  assert.equal(safe.fbclid,'xy');
  assert.equal(safe.landing_path,'/');
  assert.equal(safe.referrer,'https://example.com/path');
  assert.match(attributionSummary({utm_source:'facebook',utm_medium:'paid',utm_campaign:'bride_nov',utm_content:'video_01'}),/^מקור: facebook \/ paid \/ bride_nov \/ video_01/);
});

test('Meta attribution cookies follow the selected regional consent mode', () => {
  assert.equal(marketingIdentifiersAllowedFor(null, 'notice'), true);
  assert.equal(marketingIdentifiersAllowedFor(null, 'strict'), false);
  assert.equal(marketingIdentifiersAllowedFor('granted', 'strict'), true);
  assert.equal(marketingIdentifiersAllowedFor('denied', 'notice'), false);
  assert.deepEqual(applyMarketingAttributionConsent({utm_source:'facebook',fbc:'fb.1.1.id',fbp:'fb.1.1.2'},false),{
    utm_source:'facebook',utm_medium:'',utm_campaign:'',utm_content:'',utm_term:'',fbclid:'',fbc:'',fbp:'',landing_path:'/',first_seen_at:'',referrer:''
  });
});

test('revoking consent clears stored Meta cookies from the first-touch record', () => {
  const original = Object.fromEntries(['window','localStorage','location','history','document'].map(key => [key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const values=new Map();
  globalThis.window={};
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  globalThis.location=new URL('https://partyprint.co.il/?utm_source=facebook');
  globalThis.history={state:null,replaceState(){}};
  globalThis.document={referrer:'',cookie:'_fbp=fb.1.1.2; _fbc=fb.1.1.click'};
  try{
    const allowed=readFirstTouchAttribution(true);
    assert.equal(allowed.fbc,'fb.1.1.click');
    assert.equal(allowed.fbp,'fb.1.1.2');
    const denied=readFirstTouchAttribution(false);
    assert.equal(denied.fbc,'');
    assert.equal(denied.fbp,'');
    assert.equal(JSON.parse(values.get(FIRST_TOUCH_KEY)).fbc,'');
    assert.equal(JSON.parse(values.get(FIRST_TOUCH_KEY)).fbp,'');
  }finally{
    for(const [key,descriptor] of Object.entries(original)){
      if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
    }
  }
});

test('response promise and manually prepared first reply use the shared Israel work schedule', () => {
  assert.match(responsePromiseMessage(new Date('2026-11-03T08:00:00Z')),/תוך שעתיים בשעות הפעילות/);
  assert.match(responsePromiseMessage(new Date('2026-11-03T20:00:00Z')),/מחר בבוקר/);
  assert.match(responsePromiseMessage(new Date('2026-11-05T20:00:00Z')),/ביום ראשון בבוקר/);
  assert.match(responsePromiseMessage(new Date('2026-11-06T12:00:00Z')),/ביום ראשון בבוקר/);
  assert.equal(firstReplyDeadline(new Date('2026-11-03T08:00:00Z')),'עד 12:00 היום');
  assert.equal(firstReplyDeadline(new Date('2026-11-03T16:30:00Z')),'עד 10:30 מחר');
  assert.equal(firstReplyDeadline(new Date('2026-11-05T16:30:00Z')),'עד 10:30 ביום ראשון');
});

test('homepage FAQ accordion source has 13 items and Product/Offer schema reflects the live pricing model', () => {
  const faq=homeFaqItems(PAYMENT_DISCLOSURE);
  assert.equal(faq.length,13);
  assert.equal(new Set(faq.map(item=>item.question)).size,13);
  const schema=homeStructuredData(faq,{singleShirtPrice:180,tiers:[{quantity:4,price:110},{quantity:6,price:105},{quantity:8,price:100},{quantity:10,price:95},{quantity:15,price:93},{quantity:20,price:90}]});
  const faqNode=schema['@graph'].find(node=>node['@type']==='FAQPage');
  const products=schema['@graph'].filter(node=>node['@type']==='Product');
  assert.equal(faqNode.mainEntity.length,13);
  const single=products.find(node=>node['@id'].endsWith('#single-shirt'));
  assert.equal(single.offers.price,180);
  assert.equal(single.offers.priceCurrency,'ILS');
  assert.equal(single.offers.availability,'https://schema.org/InStock');
  const group=products.find(node=>node['@id'].endsWith('#group-shirts'));
  assert.equal(group.offers['@type'],'AggregateOffer');
  assert.equal(group.offers.lowPrice,90);
  assert.equal(group.offers.highPrice,110);
  assert.equal(group.offers.priceCurrency,'ILS');
  assert.equal(BUSINESS_DETAILS.email,'hello@partyprint.co.il');
  const organization=organizationStructuredData(BUSINESS_DETAILS);
  assert.equal(organization.name,'partyprint.co.il');
  assert.equal(organization.contactPoint[0].email,'hello@partyprint.co.il');
  assert.equal('legalName' in organization,false);
  assert.equal('taxID' in organization,false);
  const filled=organizationStructuredData({...BUSINESS_DETAILS,legalName:'PartyPrint Studio Ltd',businessId:'515555555',address:'דרך לדוגמה 1, תל אביב'});
  assert.equal(filled.legalName,'PartyPrint Studio Ltd');
  assert.equal(filled.taxID,'515555555');
  assert.equal(filled.address.streetAddress,'דרך לדוגמה 1, תל אביב');
});
