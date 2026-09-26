import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import "./seo/seo.css";
import "./policy-overrides.css";
import SiteSeoFooter from "@/components/site-seo-footer";
import LaunchOffer from "@/components/launch-offer";

export const metadata: Metadata = {
  title: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי",
  description: "הדפסה על חולצות והדפסה בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים. עיצוב, הדפסה ומשלוח עד הבית — עם אישור לפני ההדפסה.",
  keywords: ["הדפסה על חולצה", "הדפסה מעוצבת על חולצה", "הדפסה על חולצות", "הדפסה בעיצוב אישי", "הדפסה איכותית על חולצות", "חולצה לימי הולדת", "חולצה מעוצבת לימי הולדת", "חולצה למסיבת רווקים", "חולצה למסיבת רווקות", "חולצה לצוות", "חולצה ממותגת", "חולצה לעסק", "חולצות לאירועים", "הדפסת לוגו על חולצות", "הדפסה על חולצות צבא"],
  applicationName: "PARTYPRINT",
  creator: "PARTYPRINT",
  publisher: "PARTYPRINT",
  category: "personalized gifts",
  metadataBase: new URL("https://partyprint.co.il"),
  alternates: {canonical: "/"},
  verification: {google: "hgqOb0P2OSgVF-G8T5KAZ-9donk31AdF4cPSCS1Z7h0"},
  robots: {index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1},
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://partyprint.co.il/",
    siteName: "PARTYPRINT",
    title: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי",
    description: "הדפסה על חולצות בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים.",
    images: [{url: "/partyprint-logo.png", width: 2048, height: 682, alt: "PARTYPRINT"}],
  },
  twitter: {card: "summary_large_image", title: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי", description: "הדפסה על חולצות בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים.", images: ["/partyprint-logo.png"]},
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {"@type": "Organization", "@id": "https://partyprint.co.il/#organization", name: "PARTYPRINT", url: "https://partyprint.co.il/", logo: "https://partyprint.co.il/partyprint-logo.png", description: "סטודיו ישראלי לחולצות ומתנות בעיצוב אישי עם AI, הדפסה ומשלוח עד הבית.", contactPoint: [{"@type": "ContactPoint", contactType: "customer service", telephone: "+972-55-289-6236", email: "atzilul@gmail.com", availableLanguage: ["he", "en"]}]},
      {"@type": "WebSite", "@id": "https://partyprint.co.il/#website", url: "https://partyprint.co.il/", name: "PARTYPRINT", description: "הדפסה על חולצות והדפסה בעיצוב אישי לימי הולדת, אירועים, משפחות, מסיבות, צוותים ועסקים.", publisher: {"@id": "https://partyprint.co.il/#organization"}, inLanguage: "he-IL"},
      {"@type": "WebPage", "@id": "https://partyprint.co.il/#webpage", url: "https://partyprint.co.il/", name: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי", description: "הדפסה על חולצות בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים.", isPartOf: {"@id": "https://partyprint.co.il/#website"}, about: {"@id": "https://partyprint.co.il/#organization"}, inLanguage: "he-IL"},
      {"@type": "Service", "@id": "https://partyprint.co.il/#service", name: "הדפסה על חולצות בעיצוב אישי", alternateName: ["הדפסה מעוצבת על חולצה", "חולצה מודפסת", "הדפסת לוגו על חולצות"], serviceType: "Personalized shirt design and printing", provider: {"@id": "https://partyprint.co.il/#organization"}, areaServed: {"@type": "Country", name: "ישראל"}, audience: {"@type": "Audience", audienceType: "משפחות, חברים, חוגגים, צוותים ועסקים"}, url: "https://partyprint.co.il/#order", serviceOutput: "חולצות מודפסות בעיצוב אישי עם משלוח עד הבית"},
    ],
  };
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}<LaunchOffer/><SiteSeoFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData).replace(/</g, "\\u003c")}}/></body>
    </html>
  );
}
