export type Game = {
  id: "jelloo" | "friendship-quiz" | "daily-path";
  name: string;
  title?: string;
  tagline?: string;
  badge?: string;
  description: string;
  category: string;
  playUrl: string;
  artwork: {
    kind: "bunny-sprite" | "friends-illustration" | "daily-path-compass";
    reference: string;
  };
  status: "available";
  action: string;
  features: readonly string[];
};
export const GAMES = [
  {
    id: "daily-path",
    name: "Daily Path",
    title: "Daily Path",
    tagline: "Minimalist Daily Path Logic Puzzle",
    description:
      "Connect the compass to the goal with tactile rotating tiles. A fresh, deterministic logic puzzle every day with Wordle-style share cards.",
    category: "Daily Logic Puzzle",
    playUrl: "/daily",
    badge: "Today's Challenge",
    artwork: {
      kind: "daily-path-compass",
      reference: "components/daily-path/DailyPathArt.tsx#DailyPathArt",
    },
    status: "available",
    action: "Play Today's Challenge",
    features: [
      "Daily at midnight UTC",
      "Wordle-style share",
      "Tactile tile rotation",
    ],
  },
  {
    id: "jelloo",
    name: "Jelloo",
    description:
      "Rotate the paths, guide your Jelly home, and discover new pals with their own puzzle powers.",
    category: "Puzzle Adventure",
    playUrl: "/jelloo/character-worlds",
    artwork: {
      kind: "bunny-sprite",
      reference: "/jelly-pals/bunny-blink-reference-v1.png",
    },
    status: "available",
    action: "Play Jelloo",
    features: ["Solo play", "Daily puzzle", "Zen mode"],
  },
  {
    id: "friendship-quiz",
    name: "Friendship Quiz",
    description:
      "Make a quiz about you, share it with your friends, and find out who knows you best.",
    category: "Social Quiz Game",
    playUrl: "/quiz",
    artwork: {
      kind: "friends-illustration",
      reference: "components/quiz-home/Illustrations.tsx#FriendsArt",
    },
    status: "available",
    action: "Play / Create Quiz",
    features: ["10 questions", "Share a link", "Compare scores"],
  },
] as const satisfies readonly Game[];
export function gameSchema(game: Game, origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${origin}${game.playUrl}#game`,
    name: game.name,
    description: game.description,
    url: `${origin}${game.playUrl}`,
    applicationCategory: "GameApplication",
    genre: game.category,
    operatingSystem: "Any device with a modern web browser",
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}
