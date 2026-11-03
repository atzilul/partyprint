import assert from 'node:assert/strict';
import {renderOrderMail,renderCustomerConfirmation,renderContactNotice,renderManagerMailTest,managerMailRecipients} from '../lib/order-mail-template.mjs';

const recipients=managerMailRecipients(' OWNER@example.com ',[
 {email:'owner@example.com',role:'manager'},
 {email:'manager@example.com',role:'manager'},
 {email:'legacy@example.com'},
 {email:'designer@example.com',role:'designer'},
 {email:'printer@example.com',role:'printer'},
 {email:'bad\naddress@example.com',role:'manager'},
]);
assert.deepEqual(recipients,['owner@example.com','manager@example.com','legacy@example.com']);
assert.deepEqual(managerMailRecipients('invalid',[]),[]);

const order={id:'demo2026-0000',name:'<script>alert("x")</script>',phone:'0500000000',email:'sample@example.com',brief:'<img src=x onerror=alert(1)>\nשורה שנייה',packageName:'חגיגה & מתנה',quantity:4,price:440.50,mode:'order',status:'received',priceStatus:'advertised',package:0,createdAt:'2026-09-22T10:00:00Z',shirts:[{size:'M',color:'white'},{size:'M',color:'white'}],images:[],notes:'INTERNAL_NOTE_MUST_STAY_PRIVATE',eventDate:'2026-10-01',address:'תל אביב'};
const options={origin:'https://partyprint.co.il',adminUrl:'https://partyprint.co.il/admin?order=demo2026&view=all',whatsappUrl:'https://wa.me/972500000000',bundleUrl:'https://partyprint.co.il/api/order-bundle/demo?token=example',bundleDays:7,summary:'סיכום טקסטואלי',statusLabel:'הזמנה התקבלה'};
const {html,text}=renderOrderMail(order,options);
assert.ok(html.includes('lang="he" dir="rtl"'));
assert.ok(html.includes('text-align:right'));
assert.ok(html.includes('width="240"'));
assert.ok(html.includes('חגיגה &amp; מתנה'));
assert.ok(html.includes('&lt;script&gt;'));
assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;<br>'));
assert.ok(!html.includes('<script>'));
assert.ok(!html.includes('<img src=x'));
assert.ok(!html.includes(order.notes));
assert.ok(html.includes('2 × מבוגר M · לבן'));
assert.ok(html.includes('440.5 ₪'));
assert.ok(html.includes('dir="ltr"'));
assert.ok(html.includes('order=demo2026&amp;view=all'));
assert.ok(html.includes('ל־7 ימים'));
assert.ok(html.includes('אינו אישור תשלום'));
assert.ok(text.includes(options.bundleUrl));
assert.ok(text.includes(options.summary));
const lead=renderOrderMail({...order,mode:'lead',shirts:[],brief:''},options);
assert.ok(lead.html.includes('יש רעיון חדש באוויר!'));
assert.ok(lead.html.includes('מידות וצבעים לתיאום'));
assert.ok(lead.html.includes('נפתח את הרעיון יחד בשיחה.'));
const badLinks=renderOrderMail(order,{...options,adminUrl:'javascript:alert(1)',whatsappUrl:'data:text/html,unsafe',bundleUrl:'http://untrusted.example/file'});
assert.ok(!badLinks.html.includes('href="javascript:'));
assert.ok(!badLinks.html.includes('href="data:'));
assert.ok(!badLinks.html.includes('href="http://untrusted'));

const customer=renderCustomerConfirmation({...order,name:'<script>buyer</script>'},{origin:options.origin,url:'https://partyprint.co.il/track/demo#abcdef012345',days:7});
assert.ok(customer.html.includes('data-partyprint-email="v1"'));
assert.ok(customer.html.includes('lang="he" dir="rtl"'));
assert.ok(customer.html.includes('partyprint-logo-email.png'));
assert.ok(customer.html.includes('הרעיון שלכם בפנים ✳'));
assert.ok(customer.html.includes('&lt;script&gt;buyer&lt;/script&gt;'));
assert.ok(!customer.html.includes('<script>buyer</script>'));
assert.ok(customer.html.includes('href="https://partyprint.co.il/track/demo#abcdef012345"'));
assert.ok(customer.html.includes('אין חיוב בשליחת הטופס'));
assert.ok(customer.html.includes('סבב נוסף 100 ₪'));
assert.ok(customer.text.includes('כל 0 התמונות נשמרו.'));
assert.ok(customer.text.includes('קישור פרטי ל־7 יום'));
const contactMail=renderContactNotice({id:'demo2026-0000',updatedAt:'2026-10-05T12:00:00Z',packageName:'חגיגה & מתנה',details:{name:'<b>דנה</b>',phone:'0500000000',email:'dana@example.com',quantity:5,eventDate:'2026-10-10',pricePreview:500}},{origin:options.origin,adminUrl:'https://partyprint.co.il/admin?contact=demo2026',attempt:'initial'});
assert.ok(contactMail.html.includes('data-partyprint-email="v1"'));
assert.ok(contactMail.html.includes('פרטי קשר חדשים ✳'));
assert.ok(contactMail.html.includes('חגיגה &amp; מתנה'));
assert.ok(contactMail.html.includes('&lt;b&gt;דנה&lt;/b&gt;'));
assert.ok(contactMail.html.includes('לא נשלחה ללקוח תזכורת אוטומטית'));
assert.ok(contactMail.html.includes('href="https://partyprint.co.il/admin?contact=demo2026"'));
assert.ok(contactMail.text.includes('מחיר בסיס לפני מבצע: 500 ₪'));
const mailTest=renderManagerMailTest({origin:options.origin});
assert.ok(mailTest.html.includes('data-partyprint-email="v1"'));
assert.ok(mailTest.html.includes('partyprint-logo-email.png'));
assert.ok(mailTest.html.includes('בדיקה קטנה. חיבור גדול ✳'));
assert.ok(mailTest.html.includes('href="https://partyprint.co.il/admin"'));

console.log('Order mail: recipient, RTL, escaping, privacy, amount, lead and link checks passed.');
