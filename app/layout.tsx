import type { Metadata } from "next";
import "./globals.css";
import { getBaseUrl } from "@/lib/quiz/sharing";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  alternates: {
    canonical: "./",
  },
  title: {
    default: "Click & Clique — Free 10-Question Friendship Quiz & BFF Test",
    template: "%s | Click & Clique",
  },
  description:
    "How well do your friends really know you? Create your free 10-question friendship quiz, share on WhatsApp, and find out who knows you best on your live leaderboard.",
  keywords: [
    "friendship quiz",
    "friend quiz",
    "BFF test",
    "how well do you know me",
    "free 10-question quiz",
  ],
  icons: {
    icon: "/quiz/assets/img/logo-f.webp",
  },
  openGraph: {
    title: "Click & Clique — Free 10-Question Friendship Quiz & BFF Test",
    description:
      "How well do your friends really know you? Create your free 10-question friendship quiz, share on WhatsApp, and find out who knows you best on your live leaderboard.",
    siteName: "Click & Clique",
    type: "website",
    images: [
      {
        url: "/api/og/quiz/default",
        width: 1200,
        height: 630,
        alt: "Click & Clique — Free Friendship Quiz & BFF Test",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Click & Clique — Free 10-Question Friendship Quiz & BFF Test",
    description:
      "How well do your friends really know you? Create your free 10-question friendship quiz, share on WhatsApp, and find out who knows you best on your live leaderboard.",
    images: ["/api/og/quiz/default"],
  },
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
