import type { Metadata } from "next";
import "./globals.css";
import { sitePolicy } from "@/lib/platform/site";
export const metadata: Metadata = {
  metadataBase: new URL(sitePolicy().origin),
  title: {
    default: "PlayNudge — Free Browser Games",
    template: "%s | PlayNudge",
  },
  description:
    "Play free puzzle and friendship games in your browser on PlayNudge.",
  robots: { index: sitePolicy().indexable, follow: true },
  icons: { icon: "/playnudge.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
