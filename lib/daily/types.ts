/**
 * Daily Path (Pathle) - Type Definitions
 * 3rd Flagship Game on PlayNudge
 */

export type Direction = 0 | 1 | 2 | 3; // 0=North, 1=East, 2=South, 3=West

export type TileType =
  | "start"
  | "goal"
  | "straight"
  | "corner"
  | "tee"
  | "cross"
  | "blank";

export interface Tile {
  id: string; // e.g. "cell-r-c"
  row: number;
  col: number;
  type: TileType;
  rotation: Direction; // 0, 1, 2, 3 (each step is 90 deg clockwise)
  targetRotation: Direction; // optimal solved rotation
  isFixed: boolean; // start and goal are fixed, cannot be rotated
  inSolutionPath: boolean;
  isConnectedToStart: boolean;
}

export interface SponsoredChallenge {
  id: string;
  sponsorName: string;
  badgeText: string;
  accentColor: string;
  mascotEmoji?: string;
  tagline?: string;
}

export interface BoardState {
  dateStr: string; // "YYYY-MM-DD"
  puzzleNumber: number; // e.g. 120
  size: number; // 4 (4x4 grid)
  tiles: Tile[][];
  startPos: [number, number];
  goalPos: [number, number];
  parMoves: number;
  minMoves: number;
  sponsor?: SponsoredChallenge;
}

export interface MoveHistory {
  dateStr: string;
  moves: number;
  par: number;
  won: boolean;
  completedAt: string; // ISO string
}

export interface DailyPathStats {
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  moveDistribution: Record<number, number>; // moves -> count
  history: Record<string, MoveHistory>; // dateStr -> MoveHistory
  lastPlayedDate: string | null;
}

export const DIRECTIONS: readonly Direction[] = [0, 1, 2, 3] as const;

export const DIRECTION_NAMES: Record<Direction, string> = {
  0: "North",
  1: "East",
  2: "South",
  3: "West",
} as const;

export const DIRECTION_VECTORS: Record<Direction, readonly [number, number]> = {
  0: [-1, 0], // North: row - 1
  1: [0, 1],  // East:  col + 1
  2: [1, 0],  // South: row + 1
  3: [0, -1], // West:  col - 1
} as const;

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  0: 2,
  1: 3,
  2: 0,
  3: 1,
} as const;
