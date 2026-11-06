/**
 * Email-safe PartyPrint templates: table layout, inline CSS and explicit RTL.
 * No customer-supplied HTML is rendered.
 */
/** @param {unknown} value */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/** @param {string} owner @param {{email:string,role?:string}[]} members */
export function managerMailRecipients(owner, members) {
  return [...new Set([owner, ...members.filter(m => (m.role || 'manager') === 'manager').map(m => m.email)]
    .map(email => email.trim().toLowerCase())
    .filter(email => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)))];
}

/** @param {string} value */
function safeLink(value) {
  // Generated links use ASCII HTTPS origins; also allow loopback development.
  if (/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(value) ||
      /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:[/?#][^\s]*)?$/i.test(value)) return escapeHtml(value);
  return '';
}

/** @param {string} url @param {string} label @param {string} color */
function button(url, label, color) {
  const href = safeLink(url);
  return href ? '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" dir="rtl"><tr><td align="right" bgcolor="'+color+'" style="background:'+color+';border:2px solid #161616;border-radius:12px;text-align:right;"><a href="'+href+'" style="display:block;padding:16px 20px;color:#161616;font-family:Arial,sans-serif;font-size:17px;line-height:24px;font-weight:bold;text-decoration:none;text-align:right;">'+escapeHtml(label)+'</a></td></tr></table>' : '';
}

/** @param {string} label @param {unknown} value @param {boolean} [ltr] */
function row(label, value, ltr = false) {
  return '<tr><td dir="rtl" align="right" valign="top" style="width:34%;padding:10px 0 10px 12px;border-bottom:1px solid #e5e4df;color:#666;text-align:right;">'+escapeHtml(label)+'</td><td dir="rtl" align="right" style="padding:10px 0;border-bottom:1px solid #e5e4df;text-align:right;overflow-wrap:anywhere;word-break:break-word;"><span'+(ltr?' dir="ltr" style="display:inline-block;direction:ltr;"':'')+'>'+escapeHtml(value)+'</span></td></tr>';
}

/**
 * @param {import('./orders').Order} order
 * @param {{origin:string,adminUrl:string,whatsappUrl:string,bundleUrl:string,bundleDays:number,summary:string,statusLabel:string,sourceLine?:string}} options
 */
export function renderOrderMail(order, options) {
  const e = escapeHtml;
  const reference = order.id.slice(0,8).toUpperCase();
  const isLead = order.mode === 'lead';
  const title = isLead ? 'יש רעיון חדש באוויר!' : 'יש הזמנה חדשה. איזה כיף!';
  const subtitle = isLead ? 'עוד רעיון בדרך להפוך למתנה שכולם לובשים.' : 'עוד מתנה בדרך להפוך לרגע שכולם זוכרים.';
  const amount = new Intl.NumberFormat('he-IL', {maximumFractionDigits:2}).format(order.price) + ' ₪';
  const colors = {white:'לבן',black:'שחור',gray:'אפור'};
  const shirts = new Map();
  for (const shirt of order.shirts) {
    const sizeLabel = shirt.sizeType === 'child' ? 'ילד, גיל ' + shirt.size : 'מבוגר ' + shirt.size;
    const label = sizeLabel + ' · ' + (colors[shirt.color] || shirt.color);
    shirts.set(label, (shirts.get(label) || 0) + 1);
  }
  const shirtText = [...shirts].map(([label,count]) => count+' × '+label).join(' | ') || 'מידות וצבעים לתיאום עם הלקוח';
  const logo = safeLink(options.origin + '/partyprint-logo-email.png');
  const text = title + '\n\n' + options.summary + '\n\nניהול ההזמנה: ' + options.adminUrl +
    '\nהמשך טיפול בוואטסאפ: ' + options.whatsappUrl + '\nהורדת פרטי ההזמנה והתמונות (קישור ל־' + options.bundleDays + ' ימים): ' + options.bundleUrl;
  const html = '<!doctype html><html lang="he" dir="rtl" data-partyprint-email="v1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>PARTYPRINT · '+e(title)+'</title></head>'+
    '<body dir="rtl" style="margin:0;padding:0;background:#F5F4EF;color:#161616;font-family:Arial,Helvetica,sans-serif;text-align:right;">'+
    '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">הפרטים בפנים. פותחים את ההזמנה ונותנים לרעיון חיים.</div>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" bgcolor="#F5F4EF"><tr><td align="center" style="padding:24px 12px;">'+
    '<table role="presentation" width="620" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="width:100%;max-width:620px;background:#ffffff;border:2px solid #161616;border-radius:20px;overflow:hidden;">'+
    '<tr><td dir="rtl" align="right" bgcolor="#EFFF5C" style="padding:24px;text-align:right;background:#EFFF5C;border-bottom:2px solid #161616;">'+
    (logo?'<img src="'+logo+'" width="240" alt="PARTYPRINT" style="display:block;width:240px;max-width:100%;height:auto;border:0;">':'<strong dir="ltr" style="font-size:32px;">PARTYPRINT</strong>')+
    '<p style="margin:14px 0 0;font-size:14px;font-weight:bold;line-height:22px;">מהרעיון שלכם. למתנה שכולם לובשים.</p></td></tr>'+
    '<tr><td dir="rtl" align="right" style="padding:28px 24px 20px;text-align:right;">'+
    '<p style="margin:0 0 12px;font-size:13px;font-weight:bold;letter-spacing:1px;">✳ '+(isLead?'פנייה חדשה':'בקשת הזמנה חדשה')+' · <span dir="ltr" style="display:inline-block;">'+e(reference)+'</span></p>'+
    '<h1 style="margin:0 0 12px;font-size:32px;line-height:1.2;font-weight:900;text-align:right;">'+title+'</h1>'+
    '<p style="margin:0 0 22px;font-size:17px;line-height:1.7;">'+subtitle+'</p>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl"><tr><td align="right" bgcolor="#D2C5FF" style="padding:20px;border:2px solid #161616;border-radius:12px;text-align:right;">'+
    '<p style="margin:0 0 6px;font-size:14px;">החבילה שנבחרה</p><p style="margin:0 0 8px;font-size:24px;line-height:1.3;font-weight:bold;">'+e(order.packageName)+'</p>'+
    '<p style="margin:0;font-size:18px;line-height:1.6;">'+e(order.quantity)+' חולצות · <span dir="ltr" style="display:inline-block;">'+e(amount)+'</span></p>'+
    '<p style="margin:8px 0 0;font-size:12px;line-height:1.6;">סכום הבקשה השמור במערכת. אינו אישור תשלום.</p></td></tr></table>'+
    '<h2 style="margin:26px 0 6px;font-size:20px;">מי חוגגים איתנו?</h2>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="font-size:15px;line-height:1.7;">'+
    row('שם',order.name)+row('טלפון',order.phone,true)+row('מייל',order.email||'לא נמסר',true)+row('סטטוס',options.statusLabel)+
    (order.eventDate?row('תאריך האירוע המבוקש',order.eventDate,true):'')+
    (order.address?row('כתובת למשלוח',order.address):'')+
    (order.couponCode?row('קוד מבצע',order.couponCode,true):'')+
    (options.sourceLine?row('מקור הפנייה',options.sourceLine,true):'')+
    '</table>'+
    '<h2 style="margin:26px 0 10px;font-size:20px;">הרעיון שלהם</h2>'+
    '<div dir="rtl" style="padding:18px;background:#FBC2DE;border-radius:12px;font-size:16px;line-height:1.8;text-align:right;overflow-wrap:anywhere;word-break:break-word;">'+e(order.brief || 'נפתח את הרעיון יחד בשיחה.').replace(/\r?\n/g,'<br>')+'</div>'+
    '<p style="margin:18px 0 4px;font-size:14px;line-height:1.8;"><strong>מידות וצבעים:</strong> '+e(shirtText)+'</p>'+
    '<p style="margin:0 0 24px;font-size:14px;line-height:1.8;"><strong>תמונות רפרנס:</strong> '+e(order.images.length)+'</p>'+
    button(options.adminUrl,'לפרטי ההזמנה בפאנל ↗','#EFFF5C')+
    '<div style="height:12px;line-height:12px;">&nbsp;</div>'+button(options.whatsappUrl,'מדברים עם הלקוח בוואטסאפ ↗','#FBC2DE')+
    '<div style="height:12px;line-height:12px;">&nbsp;</div>'+button(options.bundleUrl,'כל הפרטים והתמונות · הורדת ZIP ↓','#D2C5FF')+
    '<p style="margin:14px 0 0;color:#666;font-size:12px;line-height:1.7;">קישור הקבצים פרטי ותקף ל־'+e(options.bundleDays)+' ימים. הוא מאפשר גישה לכל מי שמחזיק בו ומציג את פרטי ההזמנה העדכניים. פתיחת מערכת הניהול דורשת התחברות.</p>'+
    '</td></tr><tr><td dir="rtl" align="right" bgcolor="#161616" style="padding:20px 24px;color:#ffffff;text-align:right;font-size:13px;line-height:1.8;">'+
    '<strong dir="ltr" style="display:inline-block;color:#EFFF5C;font-size:18px;">PARTYPRINT ✳</strong><br>ההתראה נשלחה לבעל האתר ולמנהלים המוגדרים בצוות.<br>כפתור WhatsApp מאפשר ליצור קשר עם הלקוח. אם נמסר מייל, אפשר גם להשיב למייל.</td></tr>'+
    '</table></td></tr></table></body></html>';
  return {html,text};
}


/** @param {{origin:string,preheader:string,kicker:string,title:string,subtitle:string,content:string,buttons?:Array<{url:string,label:string,color?:string}>,text:string}} options */
function renderBrandedEmail(options) {
  const e = escapeHtml;
  const logo = safeLink(options.origin + '/partyprint-logo-email.png');
  const ctas = (options.buttons || []).map(item => button(item.url,item.label,item.color || '#EFFF5C'))
    .filter(Boolean).join('<div style="height:12px;line-height:12px;">&nbsp;</div>');
  const html = '<!doctype html><html lang="he" dir="rtl" data-partyprint-email="v1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>PARTYPRINT · '+e(options.title)+'</title></head>'+
    '<body dir="rtl" style="margin:0;padding:0;background:#F5F4EF;color:#161616;font-family:Arial,Helvetica,sans-serif;text-align:right;">'+
    '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">'+e(options.preheader)+'</div>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" bgcolor="#F5F4EF"><tr><td align="center" style="padding:24px 12px;">'+
    '<table role="presentation" width="620" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="width:100%;max-width:620px;background:#ffffff;border:2px solid #161616;border-radius:20px;overflow:hidden;">'+
    '<tr><td dir="rtl" align="right" bgcolor="#EFFF5C" style="padding:24px;text-align:right;background:#EFFF5C;border-bottom:2px solid #161616;">'+
    (logo?'<img src="'+logo+'" width="240" alt="PARTYPRINT" style="display:block;width:240px;max-width:100%;height:auto;border:0;">':'<strong dir="ltr" style="font-size:32px;">PARTYPRINT</strong>')+
    '<p style="margin:14px 0 0;font-size:14px;font-weight:bold;line-height:22px;">מהרעיון שלכם. למתנה שכולם לובשים.</p></td></tr>'+
    '<tr><td dir="rtl" align="right" style="padding:28px 24px 24px;text-align:right;">'+
    '<p style="margin:0 0 10px;font-size:13px;font-weight:bold;letter-spacing:1px;">✳ '+e(options.kicker)+'</p>'+
    '<h1 style="margin:0 0 12px;font-size:30px;line-height:1.25;font-weight:900;text-align:right;">'+e(options.title)+'</h1>'+
    '<p style="margin:0 0 24px;font-size:16px;line-height:1.8;color:#353535;">'+e(options.subtitle)+'</p>'+
    options.content+ctas+
    '</td></tr><tr><td dir="rtl" align="right" bgcolor="#161616" style="padding:20px 24px;color:#ffffff;text-align:right;font-size:13px;line-height:1.8;">'+
    '<strong dir="ltr" style="display:inline-block;color:#EFFF5C;font-size:18px;">PARTYPRINT ✳</strong><br>מהרעיון שלכם. למתנה שכולם לובשים.</td></tr>'+
    '</table></td></tr></table></body></html>';
  return {html,text:options.text};
}

/** @param {import('./orders').Order} order @param {{origin:string,url:string,days:number,promise?:string}} options */
export function renderCustomerConfirmation(order, options) {
  const e = escapeHtml;
  const reference = order.id.slice(0,8).toUpperCase();
  const amount = new Intl.NumberFormat('he-IL', {maximumFractionDigits:2}).format(order.price) + ' ₪';
  const whatsappUrl = 'https://wa.me/972552896236';
  // The fee that was in force when the request was sent; older orders were all quoted 100.
  const revision = new Intl.NumberFormat('he-IL', {maximumFractionDigits:2}).format(order.revisionPrice ?? 100);
  const includes = order.designMode==='individual'?'כולל עיצוב אישי לכל חולצה וסבב תיקונים אחד; סבב נוסף '+revision+' ₪.':'כולל עיצוב משותף וסבב תיקונים אחד; סבב נוסף '+revision+' ₪.';
  const text = 'היי '+order.name+', בקשת ההזמנה '+reference+' נשמרה ב־PARTYPRINT.\n'+
    order.quantity+' חולצות · '+order.price+' ₪\n'+
    'כל '+order.images.length+' התמונות נשמרו.\n'+
    'מעקב אחר ההזמנה (קישור פרטי ל־'+options.days+' יום): '+options.url+'\n'+
    (options.promise?options.promise+'\n':'')+
    'אין חיוב בשליחת הטופס. מועד האספקה ייקבע איתכם לפני העבודה.\n'+
    includes+'\n'+
    'שאלה? '+whatsappUrl;
  const content = '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl"><tr><td align="right" bgcolor="#D2C5FF" style="padding:20px;border:2px solid #161616;border-radius:12px;text-align:right;">'+
    '<p style="margin:0 0 8px;font-size:17px;line-height:1.8;">היי '+e(order.name)+', בקשת ההזמנה <span dir="ltr" style="display:inline-block;">'+e(reference)+'</span> נשמרה ב־PARTYPRINT.</p>'+
    '<p style="margin:0;font-size:18px;line-height:1.7;font-weight:bold;">'+e(order.quantity)+' חולצות · <span dir="ltr" style="display:inline-block;">'+e(amount)+'</span></p>'+
    '<p style="margin:8px 0 0;font-size:14px;line-height:1.7;">כל '+e(order.images.length)+' התמונות נשמרו.</p></td></tr></table>'+
    '<h2 style="margin:24px 0 8px;font-size:20px;">ומה עכשיו?</h2>'+
    (options.promise?'<p dir="rtl" style="margin:0 0 8px;font-size:15px;line-height:1.8;font-weight:bold;">'+e(options.promise)+'</p>':'')+
    '<p dir="rtl" style="margin:0 0 8px;font-size:15px;line-height:1.8;">אין חיוב בשליחת הטופס. מועד האספקה ייקבע איתכם לפני העבודה.</p>'+
    '<p dir="rtl" style="margin:0 0 22px;font-size:15px;line-height:1.8;">'+e(includes)+'</p>';
  return renderBrandedEmail({
    origin:options.origin,
    preheader:'קיבלנו את הרעיון שלכם ואת פרטי הבקשה.',
    kicker:'הבקשה נשמרה · '+reference,
    title:'הרעיון שלכם בפנים ✳',
    subtitle:'קיבלנו את הפרטים. אפשר לעקוב אחר ההזמנה ולדבר איתנו בכל שאלה.',
    content,
    buttons:[
      {url:options.url,label:'למעקב אחר ההזמנה ↗',color:'#EFFF5C'},
      {url:whatsappUrl,label:'יש שאלה? דברו איתנו ב־WhatsApp ↗',color:'#FBC2DE'},
    ],
    text,
  });
}

/** @param {{id:string;updatedAt:string;packageName:string;details:{name:string;phone:string;email:string;quantity:number;eventDate:string;pricePreview:number}}} contact @param {{origin:string,adminUrl:string,attempt:string,sourceLine?:string,whatsappUrl?:string,promise?:string}} options */
export function renderContactNotice(contact, options) {
  const e = escapeHtml;
  const d = contact.details;
  const reference = contact.id.slice(0,8).toUpperCase();
  const verb = options.attempt === 'initial' ? 'חדשים' : 'עודכנו';
  const text = [
    'פרטי קשר נשמרו ב־PARTYPRINT',
    'מספר פנייה: '+reference,
    'שם: '+d.name,
    'טלפון: '+d.phone,
    'מייל: '+d.email,
    'אירוע: '+contact.packageName,
    'כמות חולצות: '+d.quantity,
    'תאריך האירוע: '+(d.eventDate||'לא נמסר'),
    'מחיר בסיס לפני מבצע: '+d.pricePreview+' ₪ (ללא חיוב)',
    'מקור: '+(options.sourceLine||'direct'),
    'עודכן: '+contact.updatedAt,
    '',
    'הלקוח עבר לשלב הרעיון. ייתכן שהוא עדיין ממלא את הטופס; בדקו את המצב במערכת לפני חזרה ידנית.',
    'לא נשלחה ללקוח תזכורת אוטומטית.',
    'לפרטים ולמצב המילוי: '+options.adminUrl,
    ...(options.whatsappUrl?['הודעת WhatsApp ראשונה מוכנה ללקוח: '+options.whatsappUrl]:[]),
    ...(options.promise?['מה הובטח ללקוח: '+options.promise]:[]),
  ].join('\n');
  const content = '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl"><tr><td align="right" bgcolor="#D2C5FF" style="padding:16px 20px;border:2px solid #161616;border-radius:12px;text-align:right;">'+
    '<p style="margin:0;font-size:15px;line-height:1.8;">נשמרו פרטי קשר של פנייה חדשה. אפשר להמשיך מהשלב שבו הלקוח נמצא.</p></td></tr></table>'+
    '<h2 style="margin:24px 0 8px;font-size:20px;">פרטי הפנייה</h2>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="font-size:15px;line-height:1.7;">'+
    row('מספר פנייה',reference,true)+row('שם',d.name)+row('טלפון',d.phone,true)+row('מייל',d.email,true)+
    row('אירוע',contact.packageName)+row('כמות חולצות',d.quantity)+row('תאריך האירוע',d.eventDate||'לא נמסר',true)+
    row('מחיר בסיס לפני מבצע',d.pricePreview+' ₪ (ללא חיוב)',true)+row('מקור הפנייה',options.sourceLine||'direct',true)+row('עודכן',contact.updatedAt,true)+
    '</table>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="margin-top:20px;"><tr><td align="right" bgcolor="#FBC2DE" style="padding:16px 20px;border-radius:12px;text-align:right;font-size:14px;line-height:1.8;">'+
    '<strong>הלקוח עבר לשלב הרעיון.</strong> ייתכן שהוא עדיין ממלא את הטופס; בדקו את המצב במערכת לפני חזרה ידנית.<br>לא נשלחה ללקוח תזכורת אוטומטית.</td></tr></table>'+
    (options.promise?'<p dir="rtl" style="margin:16px 0 0;font-size:14px;line-height:1.8;"><strong>מה הובטח ללקוח:</strong> '+e(options.promise)+'</p>':'');
  return renderBrandedEmail({
    origin:options.origin,
    preheader:'פנייה '+reference+' · פרטי קשר '+verb,
    kicker:'עדכון פנייה · '+reference,
    title:'פרטי קשר '+verb+' ✳',
    subtitle:'הפרטים שמולאו נשמרו במערכת PARTYPRINT.',
    content,
    buttons:[{url:options.adminUrl,label:'לפרטים ולמצב המילוי ↗',color:'#EFFF5C'},...(options.whatsappUrl?[{url:options.whatsappUrl,label:'הודעה ראשונה ללקוח ב־WhatsApp ↗',color:'#FBC2DE'}]:[])],
    text,
  });
}

/** @param {{id:string,name:string,phone:string,email:string,topic:string,topicLabel:string,body:string,createdAt:string}} message @param {{origin:string,adminUrl:string,whatsappUrl?:string}} options */
export function renderContactMessage(message, options) {
  const e = escapeHtml;
  const reference = message.id.slice(0,8).toUpperCase();
  const text = [
    'הודעה חדשה מעמוד יצירת הקשר',
    'מספר פנייה: '+reference,
    'נושא: '+message.topicLabel,
    'שם: '+message.name,
    'טלפון: '+message.phone,
    'מייל: '+message.email,
    'התקבלה: '+message.createdAt,
    '',
    message.body,
    '',
    'ההודעה נשמרה כפנייה פתוחה במערכת: '+options.adminUrl,
    ...(options.whatsappUrl?['מענה ב־WhatsApp: '+options.whatsappUrl]:[]),
    'לא נשלחה ללקוח תשובה אוטומטית.',
  ].join('\n');
  const content = '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl"><tr><td align="right" bgcolor="#D2C5FF" style="padding:16px 20px;border:2px solid #161616;border-radius:12px;text-align:right;">'+
    '<p style="margin:0;font-size:16px;line-height:1.8;white-space:pre-wrap;">'+e(message.body).replace(/\n/g,'<br>')+'</p></td></tr></table>'+
    '<h2 style="margin:24px 0 8px;font-size:20px;">מי כתב</h2>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="font-size:15px;line-height:1.7;">'+
    row('מספר פנייה',reference,true)+row('נושא',message.topicLabel)+row('שם',message.name)+row('טלפון',message.phone,true)+row('מייל',message.email,true)+row('התקבלה',message.createdAt,true)+
    '</table>'+
    '<p dir="rtl" style="margin:16px 0 22px;font-size:14px;line-height:1.8;">ההודעה נשמרה כפנייה פתוחה במערכת. לא נשלחה ללקוח תשובה אוטומטית.</p>';
  return renderBrandedEmail({
    origin:options.origin,
    preheader:'הודעה חדשה מ'+message.name+' · '+message.topicLabel,
    kicker:'יצירת קשר · '+reference,
    title:'הודעה חדשה מהאתר ✳',
    subtitle:message.topicLabel,
    content,
    buttons:[...(options.whatsappUrl?[{url:options.whatsappUrl,label:'מענה ב־WhatsApp ↗',color:'#EFFF5C'}]:[]),{url:options.adminUrl,label:'לפנייה במערכת ↗',color:'#FBC2DE'}],
    text,
  });
}

/** @param {{origin:string}} options */
export function renderManagerMailTest(options) {
  const text='בדיקת מייל למנהלי PARTYPRINT. אם המייל הגיע, החיבור מהשרת ל־Resend עובד עבור התיבה שלכם. זו בדיקה בלבד, ולא נוצרה הזמנה חדשה.\nלפאנל הניהול: '+options.origin+'/admin';
  const content = '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl"><tr><td align="right" bgcolor="#D2C5FF" style="padding:18px 20px;border:2px solid #161616;border-radius:12px;text-align:right;font-size:16px;line-height:1.8;">'+
    'הבדיקה נשלחה לכתובות בעל האתר והמנהלים כפי שהן מוגדרות בפאנל.</td></tr></table>';
  return renderBrandedEmail({
    origin:options.origin,
    preheader:'בדיקה בלבד. לא נוצרה הזמנה חדשה.',
    kicker:'בדיקת מערכת',
    title:'בדיקה קטנה. חיבור גדול ✳',
    subtitle:'בדיקת מייל למנהלי PARTYPRINT. אם המייל הגיע, החיבור מהשרת ל־Resend עובד עבור התיבה שלכם. זו בדיקה בלבד, ולא נוצרה הזמנה חדשה.',
    content,
    buttons:[{url:options.origin+'/admin',label:'בחזרה לפאנל ↗',color:'#EFFF5C'}],
    text,
  });
}
