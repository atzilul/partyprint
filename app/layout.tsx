import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import "./seo/seo.css";
import "./policy-overrides.css";
import SiteSeoFooter from "@/components/site-seo-footer";

export const metadata: Metadata = {
  title: "PARTYPRINT | המתנה שהופכת לחולצה",
  description: "חולצות בעיצוב אישי עם AI לימי הולדת, מסיבות וצוותים. חבילות הכוללות עיצוב, הדפסה ומשלוח עד הבית.",
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
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}<SiteSeoFooter/></body>
    </html>
  );
}
