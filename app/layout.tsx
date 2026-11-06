import type { Metadata } from "next";
import rubikHeroFont from "./assets/static/rubik-900-hebrew.00d230e36d451b8f.woff2?url&no-inline";
import assistantTextFont from "./assets/static/assistant-400-hebrew.b531fd61c8afa524.woff2?url&no-inline";
import "./globals.css";
import "./fonts.css";
import "./seo/seo.css";
import "./policy-overrides.css";
import "./consent.css";
import SiteSeoFooter from "@/components/site-seo-footer";
import LanguageSwitch from "@/components/language-switch";
import {SITE_METADATA} from "@/lib/site-metadata";
import LaunchOffer from "@/components/launch-offer";
import AnalyticsConsent from "@/components/analytics-consent";
import AttributionCapture from "@/components/attribution-capture";
import {BUSINESS_DETAILS} from "@/lib/business-details";

// The site-wide defaults live in lib/site-metadata.ts, so that a translated page can inherit them translated.
export const metadata: Metadata = SITE_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only confirmed facts: the legal name and address join the data once they are configured.
  const known = (value: string) => !value.startsWith('TODO_');
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {"@type": "Organization", "@id": "https://partyprint.co.il/#organization", name: "PARTYPRINT", url: "https://partyprint.co.il/", logo: "https://partyprint.co.il/partyprint-logo.png", description: "סטודיו ישראלי לחולצות ומתנות בעיצוב אישי עם AI, הדפסה ומשלוח עד הבית.", ...(known(BUSINESS_DETAILS.legalName) ? {legalName: BUSINESS_DETAILS.legalName} : {}), ...(known(BUSINESS_DETAILS.address) ? {address: {"@type": "PostalAddress", streetAddress: BUSINESS_DETAILS.address, addressCountry: "IL"}} : {}), areaServed: {"@type": "Country", name: "ישראל"}, knowsLanguage: ["he", "en"], sameAs: ["https://www.instagram.com/partyprint.co.il/", "https://www.facebook.com/1433280146527521"], contactPoint: [{"@type": "ContactPoint", contactType: "customer service", telephone: "+972-55-289-6236", email: BUSINESS_DETAILS.email, availableLanguage: ["he", "en"]}]},
      {"@type": "WebSite", "@id": "https://partyprint.co.il/#website", url: "https://partyprint.co.il/", name: "PARTYPRINT", description: "הדפסה על חולצות והדפסה בעיצוב אישי לימי הולדת, אירועים, משפחות, מסיבות, צוותים ועסקים.", publisher: {"@id": "https://partyprint.co.il/#organization"}, inLanguage: "he-IL"},
      {"@type": "Service", "@id": "https://partyprint.co.il/#service", name: "הדפסה על חולצות בעיצוב אישי", alternateName: ["הדפסה מעוצבת על חולצה", "חולצה מודפסת", "הדפסת לוגו על חולצות"], serviceType: "Personalized shirt design and printing", provider: {"@id": "https://partyprint.co.il/#organization"}, areaServed: {"@type": "Country", name: "ישראל"}, audience: {"@type": "Audience", audienceType: "משפחות, חברים, חוגגים, צוותים ועסקים"}, url: "https://partyprint.co.il/#order", serviceOutput: "חולצות מודפסות בעיצוב אישי עם משלוח עד הבית"},
    ],
  };
  return (
    <html lang="he" dir="rtl">
      <head><link rel="preload" href={rubikHeroFont} as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href={assistantTextFont} as="font" type="font/woff2" crossOrigin="anonymous"/></head>
      <body className="antialiased">{children}<LaunchOffer/><AttributionCapture/><LanguageSwitch/><SiteSeoFooter details={BUSINESS_DETAILS}/><AnalyticsConsent/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData).replace(/</g, "\\u003c")}}/></body>
    </html>
  );
}
