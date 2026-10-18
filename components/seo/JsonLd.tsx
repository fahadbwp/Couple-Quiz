import React from "react";
import { getBaseUrl } from "@/lib/quiz/sharing";

export interface FAQItem {
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQS: FAQItem[] = [
  {
    question: "How does the 10-question friendship quiz work?",
    answer:
      "Enter your name, answer 10 fun visual questions about your personality, favorites, and habits, and get a unique challenge link to share with friends.",
  },
  {
    question: "Is this BFF test completely free to create and play?",
    answer:
      "Yes, Click & Clique is 100% free with no fees, subscriptions, or app installations required.",
  },
  {
    question: "How do I share my quiz link with friends on WhatsApp?",
    answer:
      "After creating your quiz, tap the Share on WhatsApp button to instantly send your personalized challenge link to any friend or group chat.",
  },
  {
    question: "Can I see who answered my questions and their scores?",
    answer:
      "Yes, as the quiz creator you can view your live scoreboard with friend rankings, match scores, and completion times using your secret PIN.",
  },
  {
    question: "What kind of questions are in the friend quiz?",
    answer:
      "The quiz features 10 curated questions with photographic cards covering morning alarms, study habits, pizza crusts, texting styles, and dream vacation spots.",
  },
  {
    question: "Do my friends need an account or sign-up to play?",
    answer:
      "No. Friends simply open your link in any mobile or desktop browser, enter their name or nickname, and start playing immediately.",
  },
  {
    question: "Can returning players view their results or play again?",
    answer:
      "Yes. Returning players are automatically remembered and can view their previous score, check the live leaderboard, or retake the challenge.",
  },
];

/**
 * Safely stringifies JSON-LD schema, escaping `<` characters to prevent script tag injection.
 */
function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function HomepageJsonLd() {
  const baseUrl = getBaseUrl();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "Click & Clique",
        description:
          "Free 10-question friendship quiz, BFF test, and how well do you know me dare.",
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${baseUrl}/#webapp`,
        name: "Click & Clique Friendship Quiz",
        url: baseUrl,
        applicationCategory: "GameApplication",
        operatingSystem: "All",
        browserRequirements: "Requires any modern web browser with JavaScript enabled",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        mainEntity: HOMEPAGE_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(structuredData) }}
    />
  );
}
