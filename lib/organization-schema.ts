import type {BusinessDetailsData} from './business-details';

export function organizationStructuredData(business: BusinessDetailsData) {
  return {
    '@type':'Organization', '@id':'https://partyprint.co.il/#organization',
    name:business.businessName, alternateName:'PARTYPRINT',
    ...(business.legalName.startsWith('TODO_')?{}:{legalName:business.legalName}),
    ...(business.businessId.startsWith('TODO_')?{}:{taxID:business.businessId}),
    ...(business.address.startsWith('TODO_')?{}:{address:{'@type':'PostalAddress',streetAddress:business.address,addressCountry:'IL'}}),
    url:'https://partyprint.co.il/', logo:'https://partyprint.co.il/partyprint-logo.png',
    description:'סטודיו ישראלי לחולצות ומתנות בעיצוב אישי עם AI, הדפסה ומשלוח עד הבית.',
    contactPoint:[{'@type':'ContactPoint',contactType:'customer service',telephone:'+972-55-289-6236',email:business.email,availableLanguage:['he','en']}],
  };
}
