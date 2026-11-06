import type {Metadata} from "next";

/** The metadata every page inherits unless it sets its own. Used by app/layout.tsx as it is, and translated for translated pages (i18n/server.ts). */
export const SITE_METADATA: Metadata = {
  title: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי",
  description: "הדפסה על חולצות והדפסה בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים. עיצוב, הדפסה ומשלוח עד הבית — עם אישור לפני ההדפסה.",
  keywords: ["הדפסה על חולצה", "הדפסה מעוצבת על חולצה", "הדפסה על חולצות", "הדפסה בעיצוב אישי", "הדפסה איכותית על חולצות", "חולצה לימי הולדת", "חולצה מעוצבת לימי הולדת", "חולצה למסיבת רווקים", "חולצה למסיבת רווקות", "חולצה לצוות", "חולצה ממותגת", "חולצה לעסק", "חולצות לאירועים", "הדפסת לוגו על חולצות", "הדפסה על חולצות צבא"],
  applicationName: "PARTYPRINT",
  creator: "PARTYPRINT",
  publisher: "PARTYPRINT",
  category: "personalized gifts",
  metadataBase: new URL("https://partyprint.co.il"),
  alternates: {canonical: "/"},
  verification: {google: "hgqOb0P2OSgVF-G8T5KAZ-9donk31AdF4cPSCS1Z7h0", other: {"facebook-domain-verification": "f61nihz3ebqsn0ez0xlz5yeavn1zvy"}},
  robots: {index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1},
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://partyprint.co.il/",
    siteName: "PARTYPRINT",
    title: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי",
    description: "הדפסה על חולצות בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים.",
    images: [{url: "/og-default.jpg", width: 1200, height: 630, alt: "משפחה בחולצות יום הולדת בעיצוב אישי של PARTYPRINT"}],
  },
  twitter: {card: "summary_large_image", title: "PARTYPRINT | הדפסה על חולצות בעיצוב אישי", description: "הדפסה על חולצות בעיצוב אישי לימי הולדת, מסיבות, צוותים ועסקים.", images: [{url: "/og-default.jpg", alt: "משפחה בחולצות יום הולדת בעיצוב אישי של PARTYPRINT"}]},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};
