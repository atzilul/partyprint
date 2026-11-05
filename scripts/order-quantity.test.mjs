import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),urls=new Map();
function moduleUrl(file){
 if(urls.has(file))return urls.get(file);
 let code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from ["'](\.\.?\/[^"']+)["']/g,(_m,name)=>{const path=resolve(dirname(file),name);return 'from '+JSON.stringify(moduleUrl(extname(path)?path:path+'.ts'))});
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');urls.set(file,url);return url;
}
const catalog=await import(moduleUrl(resolve(root,'lib/catalog.ts')));
const pricing=await import(moduleUrl(resolve(root,'lib/pricing.ts')));
const quantity=await import(moduleUrl(resolve(root,'lib/order-quantity.ts')));

test('all packages accept every integer quantity from one to one hundred, with a four-shirt starting suggestion',()=>{
 assert.equal(catalog.MIN_SHIRT_QUANTITY,1);assert.equal(catalog.DEFAULT_SHIRT_QUANTITY,4);assert.equal(catalog.MAX_SHIRT_QUANTITY,100);
 for(let pack=0;pack<catalog.SINGLE_PACK_INDEX;pack++)for(let n=1;n<=100;n++)assert.doesNotThrow(()=>pricing.priceFor(pricing.DEFAULT_PRICING,pack,n));
 for(const n of [-1,0,4.5,101,NaN,Infinity,'4',null])for(let pack=0;pack<5;pack++)assert.throws(()=>pricing.priceFor(pricing.DEFAULT_PRICING,pack,n));
 for(const pack of [-1,6,0.5,NaN])assert.throws(()=>pricing.priceFor(pricing.DEFAULT_PRICING,pack,4));
});
test('the reached tier applies through the quantity before the next threshold',()=>{
 const cases=[[1,180,180],[2,110,220],[3,110,330],[4,110,440],[5,110,550],[6,105,630],[7,105,735],[8,100,800],[9,100,900],[10,95,950],[14,95,1330],[15,93,1395],[19,93,1767],[20,90,1800],[21,90,1890],[100,90,9000]];
 for(const [n,unit,total] of cases){assert.equal(pricing.unitPriceFor(pricing.DEFAULT_PRICING,n),unit);for(let pack=0;pack<5;pack++)assert.equal(pricing.priceFor(pricing.DEFAULT_PRICING,pack,n),total,'package '+pack+', quantity '+n);}
});
test('a design for every shirt adds its surcharge per shirt, on the team package only',()=>{
 assert.equal(catalog.INDIVIDUAL_DESIGN_PACK,3);assert.equal(catalog.INDIVIDUAL_DESIGN_SURCHARGE,50);
 for(const [n,total] of [[1,230],[4,640],[10,1450],[20,2800],[100,14000]])assert.equal(pricing.priceFor(pricing.DEFAULT_PRICING,3,n,'individual'),total,'team, quantity '+n);
 for(const mode of [undefined,'shared','','INDIVIDUAL',true,1])assert.equal(pricing.priceFor(pricing.DEFAULT_PRICING,3,10,mode),950);
 for(const pack of [0,1,2,4])assert.equal(pricing.priceFor(pricing.DEFAULT_PRICING,pack,10,'individual'),950,'package '+pack+' has one shared design only');
 assert.equal(catalog.designModeFor(3,'individual'),'individual');assert.equal(catalog.designModeFor(2,'individual'),'shared');
 assert.equal(catalog.packageLabel(3,'individual'),catalog.packs[3].name+' · עיצוב אישי לכל חולצה');assert.equal(catalog.packageLabel(3,'shared'),catalog.packs[3].name);assert.equal(catalog.packageLabel(1,'individual'),catalog.packs[1].name);
});
test('configured studio tiers and decimal prices remain authoritative',()=>{
 const config=pricing.pricingForTiers([{quantity:4,price:120},{quantity:8,price:99.99},{quantity:13,price:82.5},{quantity:20,price:80.01}],7);
 assert.equal(pricing.priceFor(config,4,7),840);
 assert.equal(pricing.priceFor(config,3,8),799.92);
 assert.equal(pricing.priceFor(config,1,12),1199.88);
 assert.equal(pricing.priceFor(config,2,13),1072.5);
 assert.equal(pricing.priceFor(config,0,19),1567.5);
 assert.equal(pricing.priceFor(config,4,20),1600.2);
 assert.equal(config.version,7);
});
test('shrinking and regrowing restores adult and child choices without submitting the hidden tail',()=>{
 const original=Array.from({length:4},()=>({size:'M',color:'white',sizeType:'adult'}));
 const saved=quantity.ensureShirtCapacity(original,9);saved[8]={size:'18',color:'gray',sizeType:'child'};
 const smaller=quantity.ensureShirtCapacity(saved,4);assert.equal(smaller.length,9);
 const visible=smaller.slice(0,4).map(s=>({...s}));visible[1]={size:'8',color:'black',sizeType:'child'};
 const merged=quantity.mergeShirtChoices(smaller,visible);
 assert.equal(catalog.validateShirts(merged.slice(0,4),4),true);assert.equal(catalog.validateShirts(merged,4),false);
 assert.deepEqual(quantity.ensureShirtCapacity(merged,9)[8],{size:'18',color:'gray',sizeType:'child'});
 assert.deepEqual(merged[1],{size:'8',color:'black',sizeType:'child'});
 assert.deepEqual(original[1],{size:'M',color:'white',sizeType:'adult'});
 assert.equal(catalog.validateShirts(merged.slice(0,9),9),false,'new shirts still need choices');
 assert.deepEqual(saved[4],{size:'',color:'',sizeType:'adult'});
});
test('quantity input normalization enforces whole shirts and the supported bounds',()=>{
 for(const [input,expected] of [[0,1],[1,1],[2,2],[3,3],[4,4],[7,7],[100,100],[101,100],[7.8,7],[NaN,4],[Infinity,4]])assert.equal(quantity.normalizeOrderQuantity(input),expected);
});

test('reducing any occasion to one uses configured single price; two/three use the first tier; legacy single SKU remains valid',()=>{const config=pricing.normalizePricing({...pricing.DEFAULT_PRICING,singleShirtPrice:195},7);for(const p of [0,1,2,3,4]){assert.equal(pricing.priceFor(config,p,1),195);assert.equal(pricing.priceFor(config,p,2),220);assert.equal(pricing.priceFor(config,p,3),330);assert.equal(pricing.priceFor(config,p,4),440);}assert.equal(pricing.priceFor(config,catalog.SINGLE_PACK_INDEX,1),195);for(const n of [0,2,3,4,100])assert.throws(()=>pricing.priceFor(config,5,n));assert.equal(pricing.validPricing({...config,singleShirtPrice:-1}),false);});
