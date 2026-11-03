'use client';
import type {BusinessDetailsData} from '@/lib/business-details';

export default function BusinessDetails({details}:{details:BusinessDetailsData}){
 // A value still at its TODO_ placeholder is not configured yet; never show it to visitors.
 const rows=[['שם העסק',details.businessName],['שם משפטי',details.legalName],['מספר עוסק / חברה',details.businessId],['כתובת העסק',details.address],['טלפון',details.phone]].filter(([,value])=>value&&!value.startsWith('TODO_'));
 return <section className="business-details" aria-labelledby="business-details-title" dir="rtl">
  <div className="business-details-heading"><span className="seo-kicker">BUSINESS DETAILS</span><h2 id="business-details-title">פרטי העסק</h2></div>
  <dl>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{label==='טלפון' ? <a dir="ltr" href={'tel:'+value.replace(/[^+\d]/g,'')}>{value}</a> : <bdi dir={label==='שם העסק' ? 'ltr' : 'auto'}>{value}</bdi>}</dd></div>)}<div><dt>דוא״ל</dt><dd><a dir="ltr" href={'mailto:'+details.email}>{details.email}</a></dd></div></dl>
 </section>;
}
