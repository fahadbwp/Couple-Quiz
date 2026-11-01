import React from "react";
import { sitePolicy, jsonLd } from "@/lib/platform/site";

export interface JellooFAQItem {
  question: string;
  answer: string;
}

export const JELLOO_FAQS: JellooFAQItem[] = [
  {
    question: "How do I play Jelloo?",
    answer:
      "Tap or click any unlocked path tile to rotate it 90 degrees clockwise. Connect an unbroken path from your Jelly character to its home before your move limit runs out. When a valid route connects, your character moves automatically.",
  },
  {
    question: "What are Character Worlds in Jelloo?",
    answer:
      "Character Worlds are themed 50-level regions, each featuring a unique mascot and puzzle mechanic: Pink Candy Land (Bunny, 4×4 board with gap jumping), Bamboo Jungle (Panda, 5×4 board with cracked tile breaking), and Cozy Rooftops (Cat, 6×4 board with wall-parapet walking and nimble slow tiles).",
  },
  {
    question: "How do I unlock Panda and Cat worlds in Jelloo?",
    answer:
      "Complete all 50 levels of Bunny Candy Land and earn at least 120 stars to unlock Panda Bamboo Jungle. Complete all 50 levels of Bamboo Jungle and earn at least 120 Panda stars to unlock Cat Cozy Rooftops.",
  },
  {
    question: "Do I need to install an app or create an account to play?",
    answer:
      "No. Jelloo is completely free to play directly in your web browser on mobile phones, tablets, or desktop computers with no downloads or account registration required.",
  },
  {
    question: "Does Jelloo save my puzzle progress?",
    answer:
      "Yes. Your completed levels, earned stars, and in-progress puzzle rotations are saved securely in your browser's local storage so you can pick up right where you left off.",
  },
];

export function JellooJsonLd() {
  const { origin } = sitePolicy();

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${origin}/jelloo/map#game`,
        name: "Jelloo — Character Worlds Path Puzzle",
        url: `${origin}/jelloo/map`,
        applicationCategory: "GameApplication",
        operatingSystem: "All",
        browserRequirements: "Requires any modern web browser with JavaScript enabled",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Rotate path tiles, guide your Jelly home, and unlock new character powers across 150 handcrafted puzzles in Jelloo Character Worlds.",
      },
      {
        "@type": "FAQPage",
        "@id": `${origin}/jelloo/map#faq`,
        mainEntity: JELLOO_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${origin}/jelloo/map#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: origin,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Games",
            item: `${origin}/games`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Jelloo",
            item: `${origin}/jelloo/map`,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd(structuredData),
      }}
    />
  );
}
