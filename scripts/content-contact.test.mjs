import test from 'node:test';
import assert from 'node:assert/strict';
import {contentWhatsappUrl,priceRows} from '../lib/content-contact.ts';

const limits={maxQuantity:100,singleShirtPrice:180};
const advertised=[{quantity:4,price:110},{quantity:6,price:105},{quantity:8,price:100},{quantity:10,price:95},{quantity:15,price:93},{quantity:20,price:90}];

test('content pages link to WhatsApp with a message that names the page',()=>{
 const url=new URL(contentWhatsappUrl('  חולצות   למסיבת רווקות  '));
 assert.equal(url.origin+url.pathname,'https://wa.me/972552896236');
 assert.equal(url.searchParams.get('text'),'היי PARTYPRINT, הגעתי מהעמוד "חולצות למסיבת רווקות" ואשמח להצעה לחולצות בעיצוב אישי.');
 assert.ok(decodeURIComponent(contentWhatsappUrl('x'.repeat(500))).length<260);
});

test('price rows follow the quantity tiers and end with the single shirt',()=>{
 const rows=priceRows({tiers:advertised},limits);
 assert.deepEqual(rows.map(row=>row.label),['4 עד 5 חולצות','6 עד 7 חולצות','8 עד 9 חולצות','10 עד 14 חולצות','15 עד 19 חולצות','20 עד 100 חולצות','חולצה אחת, מתנה אישית']);
 assert.deepEqual(rows.map(row=>row.price),[110,105,100,95,93,90,180]);
 const custom=priceRows({tiers:[{quantity:10,price:80},{quantity:4,price:99},{quantity:5,price:0}],singleShirtPrice:150},limits);
 assert.deepEqual(custom,[{label:'4 עד 9 חולצות',price:99},{label:'10 עד 100 חולצות',price:80},{label:'חולצה אחת, מתנה אישית',price:150}]);
 assert.deepEqual(priceRows({tiers:[]},limits),[{label:'חולצה אחת, מתנה אישית',price:180}]);
});
