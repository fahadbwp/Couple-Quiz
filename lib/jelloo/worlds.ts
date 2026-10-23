export type WorldId = "meadow" | "beach" | "snow" | "candy" | "space";

export interface WorldDefinition {
  id: WorldId;
  name: string;
  tagline: string;
  startLevel: number;
  endLevel: number;
  unlockLevel: number; // completed levels required to unlock
  badge: string;
  icon: string;
  homeEmoji: string;
  rewardAtEnd?: string;
  colors: {
    pageBg: string;
    boardFrame: string;
    boardBorder: string;
    pipeEdge: string;
    pipeFill: string;
    connectedEdge: string;
    connectedFill: string;
    text: string;
    accent: string;
  };
}

export const worlds: readonly WorldDefinition[] = [
  {
    id: "meadow",
    name: "Meadow",
    tagline: "Sunny grass paths and cozy cottages",
    startLevel: 1,
    endLevel: 20,
    unlockLevel: 0,
    badge: "🌿 Meadow World",
    icon: "🌱",
    homeEmoji: "🏡",
    rewardAtEnd: "Beach World Unlocked!",
    colors: {
      pageBg: "#fffaf3",
      boardFrame: "#3b623b",
      boardBorder: "#87ac62",
      pipeEdge: "#a893d9",
      pipeFill: "#d4c4f3",
      connectedEdge: "#4cc790",
      connectedFill: "#a6ecc8",
      text: "#342946",
      accent: "#7652a2",
    },
  },
  {
    id: "beach",
    name: "Beach",
    tagline: "Warm sandy shores and cool tidal streams",
    startLevel: 21,
    endLevel: 40,
    unlockLevel: 20,
    badge: "🏖️ Beach World",
    icon: "🌊",
    homeEmoji: "🛖",
    rewardAtEnd: "Snow World Unlocked!",
    colors: {
      pageBg: "#fdfaf4",
      boardFrame: "#1e5f5f",
      boardBorder: "#3aafa9",
      pipeEdge: "#e27d60",
      pipeFill: "#f4a261",
      connectedEdge: "#2ec4b6",
      connectedFill: "#cbf3f0",
      text: "#264653",
      accent: "#e76f51",
    },
  },
  {
    id: "snow",
    name: "Snow",
    tagline: "Crisp snowy hills and slippery ice paths",
    startLevel: 41,
    endLevel: 60,
    unlockLevel: 40,
    badge: "❄️ Snow World",
    icon: "⛄",
    homeEmoji: "🏔️",
    rewardAtEnd: "Candy Land Unlocked!",
    colors: {
      pageBg: "#f4f9fd",
      boardFrame: "#1f354d",
      boardBorder: "#6482ad",
      pipeEdge: "#7fa1c3",
      pipeFill: "#c0d6df",
      connectedEdge: "#00f5d4",
      connectedFill: "#a7ffeb",
      text: "#1d2d44",
      accent: "#457b9d",
    },
  },
  {
    id: "candy",
    name: "Candy Land",
    tagline: "Sweet pastel frosting and peppermint switches",
    startLevel: 61,
    endLevel: 80,
    unlockLevel: 60,
    badge: "🍭 Candy Land",
    icon: "🍬",
    homeEmoji: "🏰",
    rewardAtEnd: "Space World Unlocked!",
    colors: {
      pageBg: "#fff5f8",
      boardFrame: "#702e52",
      boardBorder: "#f67280",
      pipeEdge: "#ff9a9e",
      pipeFill: "#fecfef",
      connectedEdge: "#48bfe3",
      connectedFill: "#a7dbd8",
      text: "#59253e",
      accent: "#d94f70",
    },
  },
  {
    id: "space",
    name: "Space",
    tagline: "Stardust paths under cosmic constellations",
    startLevel: 81,
    endLevel: 100,
    unlockLevel: 80,
    badge: "🚀 Space World",
    icon: "✨",
    homeEmoji: "🛸",
    rewardAtEnd: "Jelloo Master Crown!",
    colors: {
      pageBg: "#0f0c20",
      boardFrame: "#181236",
      boardBorder: "#7c5cfc",
      pipeEdge: "#9d8df1",
      pipeFill: "#dfe6e9",
      connectedEdge: "#ffd166",
      connectedFill: "#ffeaa7",
      text: "#f1f2f6",
      accent: "#a29bfe",
    },
  },
];

export function worldForLevel(levelId: number): WorldDefinition {
  if (levelId <= 20) return worlds[0];
  if (levelId <= 40) return worlds[1];
  if (levelId <= 60) return worlds[2];
  if (levelId <= 80) return worlds[3];
  if (levelId <= 100) return worlds[4];
  // Endless continuation (101+): cycle through worlds every 20 levels
  const cycle = Math.floor((levelId - 1) / 20) % 5;
  return worlds[cycle];
}

export function isWorldUnlocked(worldId: WorldId, completed: number): boolean {
  const w = worlds.find(item => item.id === worldId);
  return w !== undefined && completed >= w.unlockLevel;
}

export function getUnlockedWorlds(completed: number): WorldDefinition[] {
  return worlds.filter(w => completed >= w.unlockLevel);
}

export function milestoneRewardFor(completedLevel: number): string | null {
  if (completedLevel === 10) return "Panda Unlocked! (Crumbles cracked tiles to open gates)";
  if (completedLevel === 20) return "Beach World & Cat Unlocked! (Walks on walls & zips on slow paths)";
  if (completedLevel === 30) return "Octopus Unlocked! (Swims across water paths)";
  if (completedLevel === 40) return "Snow World & Fox Unlocked! (Picks branching routes)";
  if (completedLevel === 60) return "Candy Land World & Winter Medal Unlocked!";
  if (completedLevel === 70) return "👯 Two-Jelly Mode Unlocked! Coordinate two pals simultaneously!";
  if (completedLevel === 80) return "Space World & Sugar Star Badge Unlocked!";
  if (completedLevel === 90) return "🌟 Three-Jelly Mode Unlocked! Coordinate three pals at once in Space!";
  if (completedLevel === 100) return "👑 Jelloo Grand Master Crown Unlocked! You mastered all 100 levels!";
  return null;
}
