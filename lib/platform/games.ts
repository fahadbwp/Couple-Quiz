export type Game = {
  id: "jelloo" | "friendship-quiz";
  name: string;
  description: string;
  category: string;
  playUrl: string;
  artwork: {
    kind: "bunny-sprite" | "friends-illustration";
    reference: string;
  };
  status: "available";
  action: string;
  features: readonly string[];
};
export const GAMES = [
  {
    id: "jelloo",
    name: "Jelloo",
    description:
      "Rotate the paths, guide your Jelly home, and discover new pals with their own puzzle powers.",
    category: "Puzzle Adventure",
    playUrl: "/jelloo",
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
