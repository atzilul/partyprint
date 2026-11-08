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
 let code=file.endsWith('.json')?'export default '+readFileSync(file,'utf8'):ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from ["'](\.\.?\/[^"']+)["']/g,(_m,name)=>{const path=resolve(dirname(file),name);return 'from '+JSON.stringify(moduleUrl(extname(path)?path:path+'.ts'))});
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');urls.set(file,url);return url;
}
const core=await import(moduleUrl(resolve(root,'i18n/core.ts')));
const {createGate}=await import(moduleUrl(resolve(root,'i18n/gate.ts')));
const html=await import(moduleUrl(resolve(root,'i18n/html.ts')));
const routes=await import(moduleUrl(resolve(root,'i18n/routes.ts')));

const element=(type,props,key)=>({$$typeof:Symbol.for('react.transitional.element'),type,props,key:key??null});
function gateFor(dictionary,language='ar',nouns={}){
 const missing=[];
 const wrap=createGate({language:()=>language,lookup:(_language,key)=>dictionary[key],nouns:()=>nouns,missing:(_language,key)=>missing.push(key),scripts:()=>[{src:'/i18n/ar.js?v=1',async:true}]});
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
 assert.deepEqual(JSON.parse(script).mainEntity[0],{name:'سؤال؟',acceptedAnswer:{text:'جواب.'}});assert.equal(JSON.parse(script).url,'https://partyprint.co.il/ar/lp/team');
 assert.equal(routes.localizedAddress('ar','https://partyprint.co.il/#organization'),'https://partyprint.co.il/ar#organization');assert.equal(routes.localizedAddress('ar','https://partyprint.co.il/blog'),'https://partyprint.co.il/blog');assert.equal(routes.localizedAddress('ar','https://schema.org'),'https://schema.org');
 assert.equal(core.isAddress('/bundle-sale/x-y'),true);assert.equal(core.isAddress('שלום עולם'),false);
 assert.equal(jsx('a',{href:'/lp/team#order',children:'x'}).props.href,'/ar/lp/team#order');
 assert.equal(jsx('a',{href:'/bundle-sale',children:'x'}).props.href,'/ar/bundle-sale');
 assert.equal(jsx('a',{href:'/blog',children:'x'}).props.href,'/blog');
 assert.equal(jsx('a',{href:'/lp/team',hrefLang:'he',children:'x'}).props.href,'/lp/team');
 assert.equal(jsx('a',{href:'/lp/team',translate:'no',children:'שם'}).props.href,'/lp/team');
 assert.equal(jsx('a',{href:'/lp/team',translate:'no',children:'שם'}).props.children,'שם');
 const html=jsx('html',{lang:'he',dir:'rtl',children:[]}).props;
 assert.equal(html.lang,'ar');assert.equal(html.dir,'rtl');
 const body=jsx('body',{children:'x'}).props.children;
 assert.equal(body[0].type,'script');assert.equal(body[0].props.src,'/i18n/ar.js?v=1');assert.equal(body[0].props.async,true);
 // The dictionary does not hold up the page; it tells the page when it has arrived (i18n/env-client.ts).
 for(const language of ['ar','en'])assert.equal(readFileSync(resolve(root,'public/i18n/'+language+'.js'),'utf8').trimEnd().endsWith('dispatchEvent(new Event("pp-i18n"));'),true);
 assert.equal(body[1],'x');
});

test('the browser dictionary key is stable and the address language is read from the first segment',()=>{
 assert.equal(core.hashKey('מ־{0} ₪ לחולצה'),core.hashKey('מ־{0} ₪ לחולצה'));
 assert.notEqual(core.hashKey('מ־{0} ₪ לחולצה'),core.hashKey('מ־{0} ₪ לחולצה.'));
 assert.equal(core.languageOfPath('/ar/lp/team'),'ar');assert.equal(core.languageOfPath('/lp/team'),'he');assert.equal(core.languageOfPath('/article'),'he');assert.equal(core.languageOfPath(undefined),'he');
 assert.equal(core.parseRich('<0>a<1/></0>b</2>'),null);
});

test('a sentence around a value the site cannot know keeps the value and translates its own words',()=>{
 const {jsx}=gateFor({'שלום,':'مرحبًا،','ההזמנה שלך התקבלה.':'تم استلام طلبيتك.'});
 assert.deepEqual(jsx('p',{children:['שלום, ','דנה',' ','ההזמנה שלך התקבלה.']}).props.children,['مرحبًا، ','דנה',' ','تم استلام طلبيتك.']);
});

test('a WhatsApp link sends a message the reader can read',()=>{
 const {jsx}=gateFor({'היי, יש לי שאלה על חולצות לצוות':'مرحبًا، لديّ سؤال عن تيشيرتات للفريق'});
 const href=jsx('a',{href:'https://wa.me/972552896236?text='+encodeURIComponent('היי, יש לי שאלה על חולצות לצוות'),children:'x'}).props.href;
 assert.equal(decodeURIComponent(href.split('text=')[1]),'مرحبًا، لديّ سؤال عن تيشيرتات للفريق');
 assert.equal(jsx('a',{href:'https://wa.me/972552896236',children:'x'}).props.href,'https://wa.me/972552896236');
});

test('addresses: the pages of the purchase path exist in Arabic, with their own slugs',()=>{
 assert.equal(routes.toLanguage('ar','/'),'/ar');assert.equal(routes.toLanguage('ar','/lp/team'),'/ar/lp/team');assert.equal(routes.toLanguage('ar','/track/abc-123'),'/ar/track/abc-123');
 assert.equal(routes.toLanguage('ar','/guides'),'/ar/guides');assert.equal(routes.toLanguage('ar','/blog'),null);assert.equal(routes.toLanguage('ar','/lp/unknown'),null);assert.equal(routes.toLanguage('he','/guides'),'/guides');
 const slugs=JSON.parse(readFileSync(resolve(root,'i18n/ar.slugs.json'),'utf8')),hebrew=Object.keys(slugs)[0];
 const translated=routes.toLanguage('ar','/prices/'+hebrew);
 assert.equal(translated,'/ar/prices/'+slugs[hebrew]);
 assert.equal(routes.toLanguage('ar','/prices/'+encodeURIComponent(hebrew)),translated);
 assert.deepEqual(routes.toHebrew('ar',['prices',slugs[hebrew]]),{pattern:'/prices/[slug]',path:'/prices/'+hebrew,params:{slug:hebrew}});
 assert.deepEqual(routes.toHebrew('ar',[]),{pattern:'/',path:'/',params:{}});
 assert.deepEqual(routes.toHebrew('ar',['lp','team']).params,{slug:'team'});
 assert.equal(routes.toHebrew('ar',['blog']),null);
 assert.equal(routes.localizedHref('ar','/prices/'+hebrew+'#faq'),translated+'#faq');
 assert.equal(routes.localizedHref('ar','https://example.com/lp/team'),'https://example.com/lp/team');
});

test('an email is translated as finished HTML: whole sentences, small tags as places, private values kept',()=>{
 const dictionary={
  'היי {v0}, בקשת ההזמנה <0>{v1}</0> נשמרה ב־PARTYPRINT.':'مرحبًا {v0}، تم حفظ طلبكم <0>{v1}</0> في PARTYPRINT.',
  '<0>{0} חולצות · <1>{1} ₪</1></0>':'<0>{0:tshirt} · <1>{1} ₪</1></0>',
  'ומה עכשיו?':'وماذا الآن؟',
  'מעקב אחר ההזמנה (קישור פרטי ל־{0} יום): {v0}':'متابعة الطلبية (رابط خاص لمدة {0} يومًا): {v0}',
  'PARTYPRINT · קיבלנו את הרעיון שלכם':'PARTYPRINT · استلمنا فكرتكم',
 };
 const missing=[],env={lookup:(_l,key)=>dictionary[key],nouns:()=>NOUNS,missing:(_l,key)=>missing.push(key)};
 const source='<html lang="he"><body><style>.a{color:red}</style><p style="margin:0">היי Dana &amp; Co, בקשת ההזמנה <span dir="ltr">1A2B3C4D</span> נשמרה ב־PARTYPRINT.</p><p><b>12 חולצות · <span dir="ltr">1,140 ₪</span></b></p><h2>ומה עכשיו?</h2><p>משפט בלי תרגום</p></body></html>';
 const out=html.translateHtml(source,'ar',env,['Dana & Co','1A2B3C4D']);
 assert.ok(out.includes('<html lang="ar">'));assert.ok(out.includes('<style>.a{color:red}</style>'));
 assert.ok(out.includes('<p style="margin:0">مرحبًا Dana &amp; Co، تم حفظ طلبكم <span dir="ltr">1A2B3C4D</span> في PARTYPRINT.</p>'));
 assert.ok(out.includes('<p><b>12 تيشيرت · <span dir="ltr">1,140 ₪</span></b></p>'));
 assert.ok(out.includes('<h2>وماذا الآن؟</h2>'));assert.ok(out.includes('<p>משפט בלי תרגום</p>'));
 assert.deepEqual([...new Set(missing)],['משפט בלי תרגום']);
 const url='https://partyprint.co.il/ar/track/0f8e7d6c-1111-4222-8333-444455556666#abc123';
 assert.equal(html.translateLines('מעקב אחר ההזמנה (קישור פרטי ל־7 יום): '+url+'\nשורה באנגלית only','ar',env,[url]).split('\n')[0],'متابعة الطلبية (رابط خاص لمدة 7 يومًا): '+url);
 assert.equal(html.translateLine('PARTYPRINT · קיבלנו את הרעיון שלכם','ar',env),'PARTYPRINT · استلمنا فكرتكم');
 assert.equal(html.translateHtml(source,'he',env),source);
});

test('the confirmation email a customer receives is complete in Arabic, in both design choices',async()=>{
 const {renderCustomerConfirmation}=await import('../lib/order-mail-template.mjs');
 const promise=(await import(moduleUrl(resolve(root,'lib/response-promise.ts')))).RESPONSE_PROMISE_STATIC;
 const dictionary=JSON.parse(readFileSync(resolve(root,'i18n/ar.json'),'utf8')),nouns=JSON.parse(readFileSync(resolve(root,'i18n/ar.nouns.json'),'utf8'));
 const missing=[],env={lookup:(_l,key)=>dictionary[key],nouns:()=>nouns,missing:(_l,key)=>missing.push(key)};
 const url='https://partyprint.co.il/ar/track/0f8e7d6c-1111-4222-8333-444455556666#abcdef0123456789';
 for(const designMode of [undefined,'individual']){
  const order={id:'0f8e7d6c-1111-4222-8333-444455556666',name:'Rana Khoury',email:'rana@example.com',quantity:12,price:1140,images:[{},{},{}],designMode,revisionPrice:120};
  const rendered=renderCustomerConfirmation(order,{origin:'https://partyprint.co.il',url,days:7,promise});
  const values=[url,order.name,order.id.slice(0,8).toUpperCase()];
  const page=html.translateHtml(rendered.html,'ar',env,values),text=html.translateLines(rendered.text,'ar',env,values);
  assert.deepEqual([...new Set(missing)],[],'sentences of the email without a translation');
  assert.doesNotMatch(page.replace(/<style[\s\S]*?<\/style>/g,''),/[֐-׿]/,'Hebrew left in the email');
  assert.doesNotMatch(text,/[֐-׿]/,'Hebrew left in the text version');
  assert.ok(page.includes('Rana Khoury')&&page.includes('0F8E7D6C')&&page.includes(url.replace(/&/g,'&amp;')),'the name, the reference and the private link are kept');
  assert.ok(text.includes(url)&&text.includes('120 ₪')&&text.includes('12 تيشيرت'),'numbers and the counted noun are filled in');
 }
 assert.equal(html.translateLine('PARTYPRINT · קיבלנו את הרעיון שלכם','ar',env).includes('PARTYPRINT'),true);
 assert.doesNotMatch(html.translateLine('PARTYPRINT · קיבלנו את הרעיון שלכם','ar',env),/[֐-׿]/);
});

// English: the same mechanism, read left to right.
const EN_NOUNS=JSON.parse(readFileSync(resolve(root,'i18n/en.nouns.json'),'utf8'));
test('English is a translated language that reads left to right; its page takes lang and dir',()=>{
 assert.equal(core.languageOfPath('/en/lp/team'),'en');assert.equal(core.DIRECTION.en,'ltr');
 const {jsx}=gateFor({},'en');
 assert.deepEqual([jsx('html',{lang:'he',dir:'rtl'}).props.lang,jsx('html',{lang:'he',dir:'rtl'}).props.dir],['en','ltr']);
 // A part of the page that states the Hebrew direction (a radio group, a form) follows the reader.
 assert.equal(jsx('div',{dir:'rtl'}).props.dir,'ltr');assert.equal(jsx(function Group(){},{dir:'rtl'}).props.dir,'ltr');
 // Latin text marked left to right stays so.
 assert.equal(jsx('span',{dir:'ltr'}).props.dir,'ltr');
 const arabic=gateFor({},'ar').jsx('div',{dir:'rtl'});assert.equal(arabic.props.dir,'rtl');
});

test('left to right, a price puts the shekel sign first and a separator arrow turns around',()=>{
 const {jsx}=gateFor({'₪ לחולצה':'₪ per shirt'},'en');
 assert.equal(jsx('b',{children:['440',' ₪']}).props.children[0],'₪440');
 assert.equal(jsx('b',{children:'1,140 ₪'}).props.children,'₪1,140');
 const sign=jsx('small',{children:' ₪'}),boxed=jsx('strong',{children:['630',sign]}).props.children;
 assert.equal(boxed[0].props.children,'₪');assert.equal(boxed[1],'630');
 const number=jsx('b',{children:'105'}),label=jsx('span',{children:'₪ לחולצה'}),pair=jsx('div',{children:[number,label]}).props.children;
 assert.equal(pair[0].props.children,'₪105');assert.equal(pair[1].props.children,'per shirt');
 assert.equal(jsx('span',{children:' ← '}).props.children,' → ');
 assert.deepEqual(jsx('a',{children:['BUNDLE SALE',' ←']}).props.children,['BUNDLE SALE',' →'],'an arrow the code writes beside Latin text points forward');
 assert.equal(jsx('a',{children:'PARTYPRINT ↖'}).props.children,'PARTYPRINT ↗');
 assert.equal(jsx('i',{children:'↗'}).props.children,'↗','a decorative ↗ stays');
 assert.equal(jsx('time',{dateTime:'2026-11-01',children:'1.11.2026'}).props.children,'November 1, 2026','a date is written out for an English reader');
 assert.equal(gateFor({},'ar').jsx('time',{dateTime:'2026-11-01',children:'1.11.2026'}).props.children,'1.11.2026');
 const dated=gateFor({'עודכן ב־<0>{0}</0>.':'Updated on <0>{0}</0>.'},'en').jsx;
 const sentence=dated('p',{children:['עודכן ב־',dated('time',{dateTime:'2026-11-05',children:'5.11.2026'}),'.']}).props.children;
 assert.equal(sentence.find(part=>part&&part.type==='time').props.children,'November 5, 2026','also inside a translated sentence');
 assert.equal(gateFor({'לעמוד {0} ←':'Go to page {0} →'},'en').jsx('a',{children:['לעמוד ',7,' ←']}).props.children[0],'Go to page 7 →','an arrow inside a Hebrew sentence is the translation’s');
 assert.equal(gateFor({'חזרה →':'← Back'},'en').jsx('a',{children:'חזרה →'}).props.children,'← Back','a translation writes its own arrows');
 // Hebrew and Arabic pages keep the order they were written in.
 assert.deepEqual(gateFor({},'ar').jsx('b',{children:['440',' ₪']}).props.children,['440',' ₪']);
});

test('English counts shirts in the singular and the plural',()=>{
 const {jsx}=gateFor({'{0} חולצות':'{0:tshirt}','<0>{0}–{1}</0> חולצות':'<0>{0}–{1}</0> {1#tshirt}'},'en',EN_NOUNS);
 const shown=count=>jsx('b',{children:[count,' חולצות']}).props.children[0];
 assert.equal(shown(1),'1 shirt');assert.equal(shown(2),'2 shirts');assert.equal(shown(12),'12 shirts');assert.equal(shown('1,000'),'1,000 shirts');
});

test('addresses: every page of the purchase path exists in English, with English slugs',()=>{
 assert.equal(routes.toLanguage('en','/'),'/en');assert.equal(routes.toLanguage('en','/contact'),'/en/contact');
 // The content pages exist in English and Arabic; the blog is Hebrew only.
 assert.equal(routes.toLanguage('en','/guides'),'/en/guides');assert.equal(routes.toLanguage('en','/faq'),'/en/faq');
 assert.equal(routes.toLanguage('ar','/guides'),'/ar/guides');assert.equal(routes.toLanguage('en','/blog'),null);
 const slugs=JSON.parse(readFileSync(resolve(root,'i18n/en.slugs.json'),'utf8')),arabic=JSON.parse(readFileSync(resolve(root,'i18n/ar.slugs.json'),'utf8'));
 for(const hebrew of Object.keys(arabic))assert.ok(slugs[hebrew],'every Arabic slug has an English one: '+hebrew);
 assert.equal(new Set(Object.values(slugs)).size,Object.keys(slugs).length,'English slugs are unique');
 // Each section's own Hebrew slugs, read from its source file.
 const owned=file=>new Set([...readFileSync(resolve(root,file),'utf8').matchAll(/^\s*["']?slug["']?\s*:\s*["']([^"']+)["']/gm)].map(match=>match[1]));
 const sections={'bundle-sale':owned('lib/bundle-answers.ts'),prices:owned('lib/price-answers.ts'),guides:owned('lib/seo-pages.ts'),work:owned('lib/studio-pages.ts')};
 for(const [section,own] of Object.entries(sections))for(const hebrew of own){
  const english=slugs[hebrew];
  assert.ok(english,'the '+section+' page '+hebrew+' has an English slug');
  assert.match(english,/^[a-z0-9-]+$/,'an English slug is plain lowercase ASCII');
  assert.equal(routes.toLanguage('en','/'+section+'/'+hebrew),'/en/'+section+'/'+english);
  assert.deepEqual(routes.toHebrew('en',[section,english]).params,{slug:hebrew});
 }
 assert.deepEqual(routes.translationsOf('/lp/team').map(entry=>entry.language),['ar','en']);
 assert.equal(routes.localizedHref('en','/lp/team?v=team#order'),'/en/lp/team?v=team#order');
});

test('the confirmation email a customer receives is complete in English and reads left to right',async()=>{
 const {renderCustomerConfirmation}=await import('../lib/order-mail-template.mjs');
 const promise=(await import(moduleUrl(resolve(root,'lib/response-promise.ts')))).RESPONSE_PROMISE_STATIC;
 const dictionary=JSON.parse(readFileSync(resolve(root,'i18n/en.json'),'utf8'));
 const missing=[],env={lookup:(_l,key)=>dictionary[key],nouns:()=>EN_NOUNS,missing:(_l,key)=>missing.push(key)};
 const url='https://partyprint.co.il/en/track/0f8e7d6c-1111-4222-8333-444455556666#abcdef0123456789';
 for(const designMode of [undefined,'individual']){
  const order={id:'0f8e7d6c-1111-4222-8333-444455556666',name:'Sarah Cohen',email:'sarah@example.com',quantity:12,price:1140,images:[{},{},{}],designMode,revisionPrice:120};
  const rendered=renderCustomerConfirmation(order,{origin:'https://partyprint.co.il',url,days:7,promise});
  const values=[url,order.name,order.id.slice(0,8).toUpperCase()];
  const page=html.translateHtml(rendered.html,'en',env,values),text=html.translateLines(rendered.text,'en',env,values);
  assert.deepEqual([...new Set(missing)],[],'sentences of the email without a translation');
  assert.doesNotMatch(page.replace(/<style[\s\S]*?<\/style>/g,''),/[֐-׿]/,'Hebrew left in the email');
  assert.doesNotMatch(text,/[֐-׿]/,'Hebrew left in the text version');
  assert.doesNotMatch(page,/dir="rtl"|text-align:\s*right|align="right"/,'the email reads left to right');
  assert.match(page,/<html[^>]*lang="en"/);
  assert.ok(page.includes('Sarah Cohen')&&page.includes('0F8E7D6C')&&page.includes(url.replace(/&/g,'&amp;')),'the name, the reference and the private link are kept');
  assert.ok(text.includes(url)&&text.includes('₪120')&&text.includes('12 shirts'),'numbers, the shekel sign and the counted noun are in English order');
 }
});

test('the English dictionary keeps the markup of every Hebrew sentence and holds no Hebrew',()=>{
 const english=JSON.parse(readFileSync(resolve(root,'i18n/en.json'),'utf8')),arabic=JSON.parse(readFileSync(resolve(root,'i18n/ar.json'),'utf8'));
 const places=text=>[...text.matchAll(/\{(v?\d+)(?::[a-z]+)?\}/g)].map(match=>'n'+match[1]).concat([...text.matchAll(/<\/?(\d+)\/?>/g)].map(match=>match[0])).sort().join(' ');
 // English covers the content pages too, so it holds every Arabic sentence and more.
 assert.deepEqual(Object.keys(arabic).filter(key=>!(key in english)),[],'every sentence translated into Arabic is translated into English');
 const broken=Object.entries(english).filter(([hebrew,text])=>!text.trim()||/[֐-׿]/.test(text)||places(hebrew)!==places(text)||/\}\s?₪|₪\s\{/.test(text)).map(([hebrew])=>hebrew);
 assert.deepEqual(broken,[]);
});

test('a WhatsApp message is translated line by line, so a request number on its own line stays out of the sentence',()=>{
 const {jsx}=gateFor({'היי, יש לי שאלה. מספר הפנייה:':'Hi, I have a question. Request number:'},'en');
 const href='https://wa.me/972552896236?text='+encodeURIComponent('היי, יש לי שאלה. מספר הפנייה:\nedb4c381-c39d-4546');
 assert.equal(decodeURIComponent(jsx('a',{href,children:'x'}).props.href.split('text=')[1]),'Hi, I have a question. Request number:\nedb4c381-c39d-4546');
});
