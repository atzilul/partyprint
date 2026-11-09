import type {Metadata} from 'next';
import {Check,Clock3,HeartHandshake,Palette,ShieldCheck,Truck} from 'lucide-react';
import {PolicyFAQ,PolicyFlow,PolicyHero,PolicyLayout,PolicyRibbon,PolicySection} from '@/app/policies/policy-ui';
import {BUSINESS_DETAILS,PAYMENT_DISCLOSURE,TERMS_REVIEW,TERMS_REVIEW_COMPLETE} from '@/lib/business-details';
import {currentPricing} from '@/lib/current-pricing';
import {revisionFeeText} from '@/lib/pricing';
import {withFees} from '@/lib/fee-text';
import '../policies/policies.css';

// Rendered per request: the revision fee is the one in the admin price list.
export const dynamic='force-dynamic';

export const metadata:Metadata={
 title:'תקנון ותנאי שימוש | PARTYPRINT',
 description:'התקנון ותנאי השימוש של PARTYPRINT: בקשת הזמנה, הצעת מחיר, אישור העיצוב לפני ההדפסה, תשלום, הדפסה ומשלוח של חולצות בעיצוב אישי.',
 alternates:{canonical:'/terms'}
};
const faqSource=[
 {question:'האם שליחת הטופס מחייבת אותי להזמין?',answer:'לא. הטופס שולח בקשה ללא חיוב. ההזמנה מתקדמת לאחר הצעת מחיר ואישור מפורש שלכם.'},
 {question:'מה קורה אם צריך עוד תיקונים?',answer:'סבב תיקונים אחד כלול. כל סבב נוסף מתומחר ב־{revisionFee} ₪ ונעשה לאחר תיאום ואישור מראש.'},
 {question:'האם אפשר לבטל מוצר בעיצוב אישי?',answer:'זכויות הביטול תלויות בסוג ההזמנה, במאפייני המוצר ובשלב הייצור. נבדוק כל מקרה לפי הדין; אישור עיצוב כשלעצמו אינו ויתור על זכות שאי אפשר לוותר עליה.'}
];
const schemaFor=(faq:typeof faqSource)=>({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))});
export default async function TermsPage(){
 const pricing=await currentPricing(),faq=withFees(faqSource,pricing),schema=schemaFor(faq);
 return <PolicyLayout>
  <PolicyHero eyebrow="CLEAR TERMS. GOOD VIBES." title="תקנון" highlight="PARTYPRINT." intro="כאן מסבירים בפשטות מה קורה מהרגע ששולחים רעיון ועד שהחולצות מגיעות. הצעת המחיר והתנאים שאושרו להזמנה הספציפית הם חלק מתנאי ההתקשרות." icon={ShieldCheck}/>
  <div className="policy-content">
   {/* Shown once a lawyer's review is recorded (PARTYPRINT_TERMS_LAWYER, PARTYPRINT_TERMS_REVIEW_DATE); never as a placeholder. */}{TERMS_REVIEW_COMPLETE&&<aside className="terms-review-box" aria-label="פרטי בדיקת עורך דין"><ShieldCheck size={28}/><div><strong>התקנון נבדק על ידי עו״ד</strong><p>{TERMS_REVIEW.lawyerName} · {TERMS_REVIEW.reviewDate}</p></div></aside>}
   <PolicyFlow steps={[
    {icon:Palette,title:'שולחים בקשה',text:'הרעיון, הכמות והפרטים עוזרים לנו להבין מה תרצו ליצור.'},
    {icon:Clock3,title:'מקבלים הצעת מחיר',text:'מסכמים מחיר, פרטי הזמנה ומועד אספקה לפני שמתקדמים.'},
    {icon:Check,title:'רואים ומאשרים עיצוב',text:'מקבלים עיצוב לאישור ומדייקים אותו יחד לפני הייצור.'},
    {icon:ShieldCheck,title:'מאשרים תשלום',text:'תנאי התשלום מוצגים ומאושרים מראש, לפני ההדפסה.'},
    {icon:Truck,title:'מדפיסים ושולחים',text:'אחרי האישור והשלמת התנאים שסוכמו, מכינים ושולחים עד הבית.'}
   ]}/>
   <PolicyRibbon icon={HeartHandshake} title="מתחילים בלי חיוב" text="שליחת טופס באתר היא בקשת הזמנה או התייעצות בלבד. היא אינה כוללת תשלום או התחייבות לרכישה."/>
   <div className="policy-copy">
    <PolicySection number="01" title="על PARTYPRINT ועל התקנון">
     <p>PARTYPRINT הוא השם המסחרי של העסק שמפעיל את האתר partyprint.co.il ומספק שירותי עיצוב, הדפסה ומשלוח של חולצות ומתנות בעיצוב אישי. פרטי העסק ודרכי הקשר מופיעים בתחתית העמוד ובפוטר האתר.</p>
     <p>השימוש באתר ושליחת בקשת הזמנה כפופים לתנאים אלה ולדין החל בישראל. אם הצעת מחיר או אישור הזמנה כוללים תנאים מסוימים נוספים, הם יחולו על אותה הזמנה ככל שאושרו על ידכם. הוראות דין שאין להתנות עליהן גוברות על התקנון.</p>
    </PolicySection>
    <PolicySection number="02" title="איך מתקדמים מהרעיון להדפסה?">
     <ol><li><strong>בקשה:</strong> ממלאים את פרטי ההזמנה, הרעיון, הכמות ותאריך האירוע אם ידוע. השליחה אינה מחייבת ואינה גובה תשלום.</li><li><strong>הצעת מחיר:</strong> אנחנו בודקים את הבקשה ומתאמים את הפרטים, את המחיר ואת מועד האספקה האפשרי.</li><li><strong>אישור עיצוב:</strong> מכינים עיצוב ומעבירים אותו לעיונכם. ההדפסה לא מתחילה לפני אישורכם.</li><li><strong>תשלום והדפסה:</strong> לאחר אישור הצעת המחיר, העיצוב ותנאי התשלום שסוכמו, ההזמנה עוברת להכנה ולהדפסה.</li></ol>
     <p>הזמנה נחשבת מאושרת לאחר שהצעת המחיר והפרטים אושרו במפורש. נשלח לכם אישור עם הפרטים שסוכמו.</p>
    </PolicySection>
    <PolicySection number="03" title="מחיר ותנאי תשלום">
     <p>המחיר הסופי, הכמות, פרטי העיצוב והמשלוח יופיעו בהצעת המחיר שתישלח אליכם. באתר ובטופס מצוין כי משלוח עד הבית כלול במחיר המוצג; כל שינוי או תוספת יתואמו מראש.</p>
     <p>{PAYMENT_DISCLOSURE}</p>
     <p>אין חיוב בעת שליחת הטופס. לא נבקש מכם פרטי אשראי בתוך הטופס. ההזמנה תעבור להדפסה רק בהתאם לאישור ההזמנה ולהסדר התשלום שסוכם.</p>
    </PolicySection>
    <PolicySection number="04" title="עיצוב ותיקונים">
     <p>המחיר כולל עיצוב אישי משותף אחד לחבילה וסבב תיקונים אחד. סבב תיקונים נוסף עולה {revisionFeeText(pricing)} ₪. לפני ביצוע סבב נוסף נעדכן אתכם ונקבל את אישורכם.</p>
     <p>האחריות לבדוק את העיצוב, הכיתוב, השמות, הפרטים והתמונות היא על המזמין לפני אישור ההדפסה. נתחיל להדפיס רק לאחר קבלת האישור.</p>
    </PolicySection>
    <PolicySection number="05" title="ביטול, שינוי ומוצר בעיצוב אישי">
     <p>אפשר לבקש לבטל או לשנות את הבקשה ללא חיוב לפני שהתחלנו לעבוד על העיצוב. פנו אלינו בהקדם כדי שנוכל לעצור את הטיפול.</p>
     <p>לאחר שהעיצוב התחיל, או לאחר שההזמנה אושרה, נבדוק בקשת שינוי או ביטול לפי שלב העבודה, התנאים שסוכמו והוראות הדין. לא ייגבה תשלום שלא הוסכם מראש, בכפוף להוראות שחובה לקיימן.</p>
     <p>במוצרים שיוצרו במיוחד עבור הצרכן לפי מידות או דרישות מיוחדות עשוי לחול חריג לזכות הביטול, בהתאם לתנאים ולהיקף הקבועים בדין ולנסיבות הייצור. העובדה שהמוצר אינו במלאי או שאישור עיצוב ניתן, כשלעצמם, אינה מוצגת כאן כוויתור גורף על זכויות ביטול. כל זכות שלא ניתן להתנות עליה נשמרת.</p>
     <p>לפרטים נוספים על אופן פנייה בנושא ביטול או מוצר פגום, ראו את <a href="/policies/returns">מדיניות הביטולים וההחזרות</a>.</p>
    </PolicySection>
    <PolicySection number="06" title="ייצור, משלוח וזמני אספקה">
     <p>זמן האספקה הרגיל הוא עד 5 ימי עסקים לאחר אישור העיצוב וההזמנה והשלמת התשלום שסוכם. באילת, בערבה, מעבר לקו הירוק וברמת הגולן האספקה עשויה להתארך עד 7 ימי עסקים. זמן העבודה על העיצוב והתיקונים אינו נכלל בזמנים אלה.</p>
     <p>מועד אספקה צפוי יאושר בהצעת המחיר לפי הכתובת, הכמות והזמינות. לפרטים על מסירה, עיכובים ואזורים חריגים, ראו את <a href="/policies/shipping">מדיניות המשלוחים</a>.</p>
    </PolicySection>
    <PolicySection number="07" title="פגם בהדפסה או אי־התאמה">
     <p>אם קיבלתם חולצה פגומה או שאינה תואמת את ההזמנה או העיצוב שאושר, פנו אלינו בהקדם עם מספר הפנייה ותמונות ברורות של המוצר והאריזה. נבדוק את פרטי ההזמנה ונפעל לפתרון מתאים בהתאם לנסיבות ולהוראות הדין.</p>
     <p>אין בתקנון כדי לצמצם זכויות שמגיעות לכם על פי דין במקרה של פגם, אי־התאמה או הפרת התחייבות.</p>
    </PolicySection>
    <PolicySection number="08" title="תמונות, סימנים מסחריים וזכויות יוצרים">
     <p>המזמין אחראי לוודא שיש לו הרשאה למסור לנו תמונות, איורים, לוגואים, שמות, סימנים מסחריים וכל חומר אחר שביקש לשלב בעיצוב. אין לשלוח חומר המפר זכות של אדם אחר או חומר שאין לכם רשות להשתמש בו.</p>
     <p>לצורך הטיפול בהזמנה, המזמין נותן ל־PARTYPRINT הרשאה מוגבלת להשתמש בחומרים שנמסרו כדי להכין את העיצוב, להדפיס ולספק את ההזמנה. שימוש בתמונה או בעיצוב לצורכי פרסום או תיק עבודות דורש הסכמה נפרדת.</p>
    </PolicySection>
    <PolicySection number="09" title="פרטיות ושמירת מידע">
     <p>פרטי קשר, רעיונות, תמונות ומידע אחר מטופלים לצורך מענה לבקשה, הכנת עיצוב, ביצוע הזמנה ומתן שירות. לפרטים על סוגי המידע, ספקי השירות, מדידה, שמירה ובקשות לעיון או מחיקה, קראו את <a href="/privacy-policy">מדיניות הפרטיות</a>.</p>
    </PolicySection>
    <PolicySection number="10" title="דין ופניות">
     <p>על ההתקשרות יחולו דיני מדינת ישראל. סמכות השיפוט תהיה בהתאם לדין החל.</p>
     <p>לשאלות או לבקשות ניתן לפנות בדוא״ל <a href={'mailto:'+BUSINESS_DETAILS.email}>{BUSINESS_DETAILS.email}</a> או בטלפון <a href="https://wa.me/972552896236" target="_blank" rel="noopener noreferrer" dir="ltr">{BUSINESS_DETAILS.phone}</a>.</p>
     <p className="policy-small-note">התקנון מסביר את תהליך השירות. בכל מקרה תחולנה הוראות הדין והצעת המחיר שאושרה להזמנה הספציפית.</p>
    </PolicySection>
   </div>
   <PolicyFAQ items={faq}/>
  </div>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>
 </PolicyLayout>;
}
