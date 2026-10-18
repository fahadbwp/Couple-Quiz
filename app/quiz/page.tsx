import type { Metadata } from "next";
import Homepage from "@/components/quiz-home/Homepage";
export const metadata: Metadata = {
  title: "Free 10-Question Friendship Quiz & BFF Dare",
  description:
    "Make a free 10-question friendship quiz, share your link on WhatsApp, and find out who knows you best on your live scoreboard.",
  alternates: {
    canonical: "/quiz",
  },
  icons: { icon: "/quiz/clique-mark.svg" },
  openGraph: {
    title: "Click & Clique | Free 10-Question Friendship Quiz & BFF Test",
    description:
      "Make a free 10-question friendship quiz, share your link on WhatsApp, and find out who knows you best on your live scoreboard.",
    siteName: "Click & Clique",
    type: "website",
    images: ["/api/og/quiz/default"],
  },
};
export default function QuizLandingPage() {
  return <Homepage />;
}
