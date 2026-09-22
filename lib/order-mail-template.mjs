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
 * @param {{origin:string,adminUrl:string,whatsappUrl:string,bundleUrl:string,bundleDays:number,summary:string,statusLabel:string}} options
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
    const label = shirt.size + ' · ' + (colors[shirt.color] || shirt.color);
    shirts.set(label, (shirts.get(label) || 0) + 1);
  }
  const shirtText = [...shirts].map(([label,count]) => count+' × '+label).join(' | ') || 'מידות וצבעים לתיאום עם הלקוח';
  const logo = safeLink(options.origin + '/partyprint-logo-header.png');
  const text = title + '\n\n' + options.summary + '\n\nניהול ההזמנה: ' + options.adminUrl +
    '\nהמשך טיפול בוואטסאפ: ' + options.whatsappUrl + '\nהורדת פרטי ההזמנה והתמונות (קישור ל־' + options.bundleDays + ' ימים): ' + options.bundleUrl;
  const html = '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>PARTYPRINT · '+e(title)+'</title></head>'+
    '<body dir="rtl" style="margin:0;padding:0;background:#F5F4EF;color:#161616;font-family:Arial,Helvetica,sans-serif;text-align:right;">'+
    '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">הפרטים בפנים. פותחים את ההזמנה ונותנים לרעיון חיים.</div>'+
    '<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" dir="rtl" bgcolor="#F5F4EF"><tr><td align="center" style="padding:24px 12px;">'+
    '<table role="presentation" width="620" border="0" cellspacing="0" cellpadding="0" dir="rtl" style="width:100%;max-width:620px;background:#ffffff;border:2px solid #161616;border-radius:20px;overflow:hidden;">'+
    '<tr><td dir="rtl" align="right" bgcolor="#EFFF5C" style="padding:24px;text-align:right;border-bottom:2px solid #161616;">'+
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
    row('שם',order.name)+row('טלפון',order.phone,true)+row('מייל',order.email,true)+row('סטטוס',options.statusLabel)+
    (order.eventDate?row('תאריך האירוע המבוקש',order.eventDate,true):'')+
    (order.address?row('כתובת למשלוח',order.address):'')+
    (order.couponCode?row('קוד מבצע',order.couponCode,true):'')+
    '</table>'+
    '<h2 style="margin:26px 0 10px;font-size:20px;">הרעיון שלהם</h2>'+
    '<div dir="rtl" style="padding:18px;background:#FBC2DE;border-radius:12px;font-size:16px;line-height:1.8;text-align:right;overflow-wrap:anywhere;word-break:break-word;">'+e(order.brief || 'נפתח את הרעיון יחד בשיחה.').replace(/\r?\n/g,'<br>')+'</div>'+
    '<p style="margin:18px 0 4px;font-size:14px;line-height:1.8;"><strong>מידות וצבעים:</strong> '+e(shirtText)+'</p>'+
    '<p style="margin:0 0 24px;font-size:14px;line-height:1.8;"><strong>תמונות רפרנס:</strong> '+e(order.images.length)+'</p>'+
    button(options.adminUrl,'יאללה, נותנים לרעיון חיים ↗','#EFFF5C')+
    '<div style="height:12px;line-height:12px;">&nbsp;</div>'+button(options.whatsappUrl,'מדברים עם הלקוח בוואטסאפ ↗','#FBC2DE')+
    '<div style="height:12px;line-height:12px;">&nbsp;</div>'+button(options.bundleUrl,'כל הפרטים והתמונות · הורדת ZIP ↓','#D2C5FF')+
    '<p style="margin:14px 0 0;color:#666;font-size:12px;line-height:1.7;">קישור הקבצים פרטי ותקף ל־'+e(options.bundleDays)+' ימים. הוא מאפשר גישה לכל מי שמחזיק בו ומציג את פרטי ההזמנה העדכניים. פתיחת מערכת הניהול דורשת התחברות.</p>'+
    '</td></tr><tr><td dir="rtl" align="right" bgcolor="#161616" style="padding:20px 24px;color:#ffffff;text-align:right;font-size:13px;line-height:1.8;">'+
    '<strong dir="ltr" style="display:inline-block;color:#EFFF5C;font-size:18px;">PARTYPRINT ✳</strong><br>ההתראה נשלחה לבעל האתר ולמנהלים המוגדרים בצוות.<br>אפשר להשיב למייל כדי ליצור קשר עם הלקוח.</td></tr>'+
    '</table></td></tr></table></body></html>';
  return {html,text};
}
