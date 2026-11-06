import type {Metadata} from 'next';
import ContactPage from '@/components/contact-page';
import {BUSINESS_DETAILS} from '@/lib/business-details';
import {RESPONSE_PROMISE} from '@/lib/response-promise';

/**
 * Contact page: WhatsApp first, then a short form (components/contact-page.tsx). The form
 * saves a ticket and emails the managers (app/api/contact/route.ts).
 */
const origin='https://partyprint.co.il',url=origin+'/contact',ogImage='/og-default.jpg';
const title='יצירת קשר: מדברים עם הסטודיו ב־WhatsApp | PARTYPRINT';
const description='רוצים להתייעץ על חולצות בעיצוב אישי, לשנות הזמנה או לשאול על מחיר? כתבו לנו ב־WhatsApp או השאירו הודעה בטופס קצר. עונים אנשים מהסטודיו, '+RESPONSE_PROMISE.hoursLabel+'.';
export const metadata:Metadata={
 title,
 description,
 keywords:['יצירת קשר PARTYPRINT','הדפסה על חולצות וואטסאפ','התייעצות על חולצות בעיצוב אישי','שירות לקוחות PARTYPRINT'],
 alternates:{canonical:'/contact'},
 openGraph:{type:'website',locale:'he_IL',url,siteName:'PARTYPRINT',title,description,images:[{url:ogImage,width:1200,height:630,alt:'משפחה בחולצות יום הולדת בעיצוב אישי של PARTYPRINT'}]},
 twitter:{card:'summary_large_image',title,description,images:[ogImage]},
};
export default function Contact(){
 const phone='+972'+BUSINESS_DETAILS.phone.replace(/\D/g,'').replace(/^0/,'');
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'PARTYPRINT',item:origin+'/'},{'@type':'ListItem',position:2,name:'יצירת קשר',item:url}]},
  {'@type':'ContactPage','@id':url+'#webpage',url,name:title,description,inLanguage:'he-IL',isPartOf:{'@id':origin+'/#website'},about:{'@id':origin+'/#organization'},
   mainEntity:{'@type':'Organization','@id':origin+'/#organization',name:'PARTYPRINT',url:origin+'/',email:BUSINESS_DETAILS.email,
    contactPoint:[{'@type':'ContactPoint',contactType:'customer service',telephone:phone,email:BUSINESS_DETAILS.email,availableLanguage:['he','en'],areaServed:'IL',url:'https://wa.me/'+phone.slice(1),hoursAvailable:{'@type':'OpeningHoursSpecification',dayOfWeek:['Sunday','Monday','Tuesday','Wednesday','Thursday'],opens:String(RESPONSE_PROMISE.openHour).padStart(2,'0')+':00',closes:String(RESPONSE_PROMISE.closeHour).padStart(2,'0')+':00'}}]}},
 ]};
 return <><ContactPage businessEmail={BUSINESS_DETAILS.email} businessPhone={BUSINESS_DETAILS.phone}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></>;
}
