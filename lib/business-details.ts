function setting(name:string,fallback:string):string {
 const value=typeof process!=='undefined'?process.env[name]?.trim():'';
 return value||fallback;
}
export type BusinessDetailsData={businessName:string;legalName:string;businessId:string;address:string;phone:string;email:string};
export const BUSINESS_DETAILS:BusinessDetailsData={
 businessName:'partyprint.co.il',
 // The official business name, confirmed by the owner on 2026-11-07.
 legalName:setting('PARTYPRINT_LEGAL_NAME','פארטי פרינט'),
 businessId:setting('PARTYPRINT_BUSINESS_ID','TODO_BUSINESS_ID'),
 address:setting('PARTYPRINT_BUSINESS_ADDRESS','TODO_ADDRESS'),
 phone:setting('PARTYPRINT_PUBLIC_PHONE','055 289 6236'),
 email:'hello@partyprint.co.il'
};
export const TERMS_REVIEW={
 lawyerName:setting('PARTYPRINT_TERMS_LAWYER','TODO_LAWYER_NAME'),
 reviewDate:setting('PARTYPRINT_TERMS_REVIEW_DATE','TODO_LAWYER_REVIEW_DATE')
};
export const PAYMENT_TERMS=setting('PARTYPRINT_PAYMENT_TERMS','TODO_PAYMENT_TERMS');
export const TERMS_REVIEW_COMPLETE=!TERMS_REVIEW.lawyerName.startsWith('TODO_')&&!TERMS_REVIEW.reviewDate.startsWith('TODO_');
export const PAYMENT_DISCLOSURE=PAYMENT_TERMS==='TODO_PAYMENT_TERMS'
 ?'אמצעי התשלום ומועד התשלום יפורטו בהצעת המחיר ויאושרו מראש, לפני תחילת ההדפסה.'
 :PAYMENT_TERMS;
