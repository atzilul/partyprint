import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import "./seo/seo.css";
import "./policy-overrides.css";
import SiteSeoFooter from "@/components/site-seo-footer";

export const metadata: Metadata = {
  title: "PARTYPRINT | המתנה שהופכת לחולצה",
  description: "חולצות בעיצוב אישי עם AI לימי הולדת, מסיבות וצוותים. חבילות הכוללות עיצוב, הדפסה ומשלוח עד הבית.",
  metadataBase: new URL("https://partyprint.co.il"),
  alternates: {canonical: "/"},
  robots: {index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1},
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://partyprint.co.il/",
    siteName: "PARTYPRINT",
    title: "PARTYPRINT | המתנה שהופכת לחולצה",
    description: "חולצות בעיצוב אישי עם AI לימי הולדת, מסיבות וצוותים.",
    images: [{url: "/partyprint-logo.png", width: 2048, height: 682, alt: "PARTYPRINT"}],
  },
  twitter: {card: "summary_large_image", title: "PARTYPRINT | המתנה שהופכת לחולצה", description: "חולצות בעיצוב אישי עם AI לימי הולדת, מסיבות וצוותים.", images: ["/partyprint-logo.png"]},
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
      {"@type": "Organization", "@id": "https://partyprint.co.il/#organization", name: "PARTYPRINT", url: "https://partyprint.co.il/", logo: "https://partyprint.co.il/partyprint-logo.png", contactPoint: [{"@type": "ContactPoint", contactType: "customer service", telephone: "+972-55-289-6236", availableLanguage: ["he", "en"]}]},
      {"@type": "WebSite", "@id": "https://partyprint.co.il/#website", url: "https://partyprint.co.il/", name: "PARTYPRINT", publisher: {"@id": "https://partyprint.co.il/#organization"}, inLanguage: "he-IL"},
    ],
  };
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}<SiteSeoFooter/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData).replace(/</g, "\\u003c")}}/></body>
    </html>
  );
}
