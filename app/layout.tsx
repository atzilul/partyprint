import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
