import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

// The translation gate, without a browser or a build: elements are plain objects here.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),urls=new Map();
function moduleUrl(file){
 if(urls.has(file))return urls.get(file);
 let code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from ["'](\.\.?\/[^"']+)["']/g,(_m,name)=>{const path=resolve(dirname(file),name);return 'from '+JSON.stringify(moduleUrl(extname(path)?path:path+'.ts'))});
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');urls.set(file,url);return url;
}
const core=await import(moduleUrl(resolve(root,'i18n/core.ts')));
const {createGate}=await import(moduleUrl(resolve(root,'i18n/gate.ts')));

const element=(type,props,key)=>({$$typeof:Symbol.for('react.transitional.element'),type,props,key:key??null});
function gateFor(dictionary,language='ar',nouns={}){
 const missing=[];
 const wrap=createGate({language:()=>language,lookup:(_language,key)=>dictionary[key],nouns:()=>nouns,missing:(_language,key)=>missing.push(key),scripts:()=>[{src:'/i18n/ar.js?v=1'}]});
 return {jsx:wrap(element,element),missing};
}
const NOUNS={tshirt:{one:'تيشيرت واحد',two:'تيشيرتان',few:'{n} تيشيرتات',many:'{n} تيشيرت',other:'{n} تيشيرت'}};

test('a Hebrew address passes through untouched',()=>{
 const {jsx,missing}=gateFor({},'he');
 const props={children:'שלום',alt:'תמונה'};
 assert.equal(jsx('p',props).props,props);assert.deepEqual(missing,[]);
});

test('numbers are masked, kept and put back; an unknown sentence stays Hebrew and is reported',()=>{
 assert.deepEqual(core.maskNumbers('מ־80 ₪ לחולצה, עד 1,450 ₪'),{key:'מ־{0} ₪ לחולצה, עד {1} ₪',numbers:['80','1,450']});
 const {jsx,missing}=gateFor({'מ־{0} ₪ לחולצה':'ابتداءً من {0} ₪ للتيشيرت'});
 assert.equal(jsx('p',{children:'מ־80 ₪ לחולצה'}).props.children,'ابتداءً من 80 ₪ للتيشيرت');
 assert.equal(jsx('p',{children:'  מ־93.5 ₪ לחולצה '}).props.children,'  ابتداءً من 93.5 ₪ للتيشيرت ');
 assert.equal(jsx('p',{children:'משפט חדש'}).props.children,'משפט חדש');
 assert.deepEqual(missing,['משפט חדש']);
 assert.equal(jsx('p',{children:'PARTYPRINT 2026'}).props.children,'PARTYPRINT 2026');
});

test('a sentence written in pieces is translated as one and keeps the places of its siblings',()=>{
 const {jsx}=gateFor({'כל סבב נוסף עולה {0} ₪.':'كل جولة إضافية تكلّف {0} ₪.'});
 const icon=element('svg',{});
 assert.deepEqual(jsx('p',{children:['כל סבב נוסף עולה ',100,' ₪.',icon]}).props.children,['كل جولة إضافية تكلّف 100 ₪.',null,null,icon]);
});

test('a counted noun takes the form its number calls for',()=>{
 const {jsx}=gateFor({'{0} חולצות':'{0:tshirt}','עד {0} חולצות':'حتى {0:tshirt}'},'ar',NOUNS);
 const shown=count=>jsx('b',{children:[count,' חולצות']}).props.children[0];
 assert.equal(shown(1),'تيشيرت واحد');assert.equal(shown(2),'تيشيرتان');assert.equal(shown(4),'4 تيشيرتات');assert.equal(shown(12),'12 تيشيرت');assert.equal(shown(100),'100 تيشيرت');
 assert.equal(jsx('p',{children:'עד 100 חולצות'}).props.children,'حتى 100 تيشيرت');
});

test('a sentence that runs through elements is translated whole, and the elements move with it',()=>{
 const dictionary={
  '<0>{0}–{1}</0> חולצות':'<0>{0}–{1}</0> {1#tshirt}',
  'עוד {0} חולצות ויורדים ל־<0>{1} ₪ לחולצה</0>':'<0>{1} ₪ للتيشيرت</0> إذا أضفتم {0:tshirt}',
  'אנחנו מעצבים, אתם מאשרים,<0/>והחולצות מגיעות עד הבית.':'نحن نصمّم، أنتم توافقون،<0/>والتيشيرتات تصل إلى باب البيت.',
  '{0} ₪ לחולצה':'{0} ₪ للتيشيرت','{0}–{1}':'{0}–{1}',
 };
 const {jsx,missing}=gateFor(dictionary,'ar',NOUNS);
 const range=(from,to)=>jsx('span',{children:[jsx('bdi',{dir:'ltr',children:from+'–'+to}),' חולצות']}).props.children;
 assert.equal(range(4,5)[1],' تيشيرتات');assert.equal(range(10,14)[1],' تيشيرت');
 assert.equal(range(4,5)[0].type,'bdi');assert.equal(range(4,5)[0].props.dir,'ltr');assert.equal(range(4,5)[0].props.children[0],'4–5');
 const note=jsx('p',{children:['עוד ',3,' חולצות ויורדים ל־',jsx('b',{children:[93,' ₪ לחולצה']})]}).props.children;
 assert.equal(note[0].type,'b');assert.deepEqual(note[0].props.children,['93 ₪ للتيشيرت']);assert.equal(note[1],' إذا أضفتم 3 تيشيرتات');
 const line=jsx('h2',{children:['אנחנו מעצבים, אתם מאשרים,',jsx('br',{}),'והחולצות מגיעות עד הבית.']}).props.children;
 assert.equal(line[0],'نحن نصمّم، أنتم توافقون،');assert.equal(line[1].type,'br');assert.equal(line[2],'والتيشيرتات تصل إلى باب البيت.');
 assert.deepEqual(missing,[]);
});

test('an icon beside a line of text is not a split sentence; a block element ends a sentence',()=>{
 const {jsx,missing}=gateFor({'מאשרים לפני שמדפיסים':'توافقون قبل الطباعة'});
 const icon=jsx('svg',{});
 assert.deepEqual(jsx('li',{children:[icon,'מאשרים לפני שמדפיסים']}).props.children,[icon,'توافقون قبل الطباعة']);
 const block=jsx('div',{children:'בלוק'});
 jsx('section',{children:['מאשרים לפני שמדפיסים',block]});
 assert.deepEqual(missing,['בלוק']);
});

test('without a whole translation a split sentence falls back to its pieces and is reported',()=>{
 const {jsx,missing}=gateFor({'חולצות':'تيشيرتات'});
 const out=jsx('span',{children:[jsx('bdi',{children:'4–5'}),' חולצות']}).props.children;
 assert.equal(out[1],' تيشيرتات');
 assert.deepEqual(missing,['<0>{0}–{1}</0> חולצות']);
});

test('spoken attributes, structured data, links, the page language and the dictionary script',()=>{
 const dictionary={'תמונה של הצוות':'صورة الفريق','שם':'الاسم','שאלה?':'سؤال؟','תשובה.':'جواب.'};
 const {jsx}=gateFor(dictionary);
 assert.equal(jsx('img',{alt:'תמונה של הצוות',src:'/a.webp'}).props.alt,'صورة الفريق');
 assert.equal(jsx('input',{placeholder:'שם',defaultValue:'שם'}).props.defaultValue,'שם');
 const data=JSON.stringify({'@type':'FAQPage',url:'https://partyprint.co.il/lp/team',mainEntity:[{name:'שאלה?',acceptedAnswer:{text:'תשובה.'}}]});
 const script=jsx('script',{type:'application/ld+json',dangerouslySetInnerHTML:{__html:data}}).props.dangerouslySetInnerHTML.__html;
 assert.deepEqual(JSON.parse(script).mainEntity[0],{name:'سؤال؟',acceptedAnswer:{text:'جواب.'}});assert.equal(JSON.parse(script).url,'https://partyprint.co.il/lp/team');
 assert.equal(jsx('a',{href:'/lp/team#order',children:'x'}).props.href,'/ar/lp/team#order');
 assert.equal(jsx('a',{href:'/bundle-sale',children:'x'}).props.href,'/bundle-sale');
 assert.equal(jsx('a',{href:'/lp/team',translate:'no',children:'שם'}).props.href,'/lp/team');
 assert.equal(jsx('a',{href:'/lp/team',translate:'no',children:'שם'}).props.children,'שם');
 const html=jsx('html',{lang:'he',dir:'rtl',children:[]}).props;
 assert.equal(html.lang,'ar');assert.equal(html.dir,'rtl');
 const body=jsx('body',{children:'x'}).props.children;
 assert.equal(body[0].type,'script');assert.equal(body[0].props.src,'/i18n/ar.js?v=1');assert.equal(body[1],'x');
});

test('the browser dictionary key is stable and the address language is read from the first segment',()=>{
 assert.equal(core.hashKey('מ־{0} ₪ לחולצה'),core.hashKey('מ־{0} ₪ לחולצה'));
 assert.notEqual(core.hashKey('מ־{0} ₪ לחולצה'),core.hashKey('מ־{0} ₪ לחולצה.'));
 assert.equal(core.languageOfPath('/ar/lp/team'),'ar');assert.equal(core.languageOfPath('/lp/team'),'he');assert.equal(core.languageOfPath('/article'),'he');assert.equal(core.languageOfPath(undefined),'he');
 assert.equal(core.parseRich('<0>a<1/></0>b</2>'),null);
});
