# Project: Daily Path (Pathle) — 3rd Flagship Game on PlayNudge

## Architecture
- **Framework**: Next.js 15.5.28 (App Router), React 19, TypeScript 5.8.2, Tailwind CSS 3.4.17.
- **Game Engine & Math** (`lib/daily/*`):
  - Deterministic FNV-1a + 32-bit LCG PRNG seeded by UTC date string (`YYYY-MM-DD`).
  - Solvable-by-construction path generator on 4x4 grid of rotatable tiles (straight, corner, tee, cross, start, goal).
  - Fast Dijkstra / A* minimal-move solver to guarantee 100% solvability and calculate optimal Par moves.
  - Rollover watcher (`watchUtcDay`) for reload-free midnight board refresh.
- **Client Persistence & Streaks** (`lib/daily/storage.ts`):
  - Zero-cost offline `localStorage` (`playnudge.daily_path.v1`) with Web Locks concurrency guard & sync fallback.
  - Daily streak engine (current streak, max streak, win rate, move distributions, replay protection).
  - Optional fail-safe Supabase synchronization hook.
- **Viral Sharing Engine** (`lib/daily/share.ts`):
  - Wordle-style spoiler-free emoji scorecard (`Daily Path #42 🧭`, `5/6 Moves • Streak: 🔥 7`, emoji grid, URL).
  - Multi-channel sharing: Web Share API, Clipboard copy with toast, WhatsApp intent, Twitter/X intent.
  - Regex spoiler-free invariant verification (zero leakage of coordinates, rotations, or path routes).
- **Monetization & Sponsored Challenge Engine** (`lib/daily/sponsor.ts` & `components/daily/DailyAdSlot.tsx`):
  - Placement `daily-after-result` in `lib/platform/ads.ts` with reserved dimensions (CLS < 0.05).
  - Deterministic sponsor theme engine (accent themes, badges, mascot cameos) without altering puzzle logic.
- **UI & Components** (`app/daily/*`, `components/daily/*`):
  - Modern Wordle/Connections-inspired minimalist aesthetic, Tailwind CSS, dark/light mode, tactile tile rotation (CSS transform + `touch-action: manipulation`).
  - Mobile-first responsive layout (320px to 4K desktop).
- **SEO & Archives** (`app/daily/archive/*`, `app/robots.ts`, `lib/platform/site.ts`, `app/sitemap.ts`):
  - Replay archive at `/daily/archive` and `/daily/archive/[date]` with Next.js 15 async params and strict future date 404 anti-cheat.
  - Dynamic OpenGraph previews (`Daily Path #120 — PlayNudge`).
  - Schema.org JSON-LD structured data (`GameApplication` / `WebApplication` + `BreadcrumbList`).
  - Whitelisted in robots policy (web + AI crawlers).
- **Platform Registration** (`lib/platform/games.ts`, `components/platform/Platform.tsx`, `app/page.tsx`, `app/games/page.tsx`, `tests/platform.test.ts`):
  - Registered as 3rd game (`"daily-path"`) in platform games registry, global header, homepage grid, and `/games` portal.

---

## Feature Inventory
Every feature from user request R1–R6 and Acceptance Criteria is assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Deterministic PRNG & Board Generator | Seeded by UTC `YYYY-MM-DD`, self-avoiding path generation, guaranteed 100% solvable | M1 | R1, AC1 |
| F2 | Dijkstra / A* Solver & Par Calculation | Computes minimal rotations to connect start to goal, computes Par moves (<0.1ms per board) | M1 | R1, AC1 |
| F3 | Automated 365-Day Solvability Test | Automated test verifying all 365 consecutive calendar days produce solvable puzzles within Par | M1 | R1, AC1 |
| F4 | Minimalist Path Logic UI & Rotation | Tactile tile rotation, dark/light mode, mobile responsive (320px-4K), CLS < 0.05, win detection | M2 | R1, AC3 |
| F5 | UTC Midnight Rollover Watcher | Auto-detects midnight rollover via interval + visibilitychange, updates board without hard reload | M2 | R1, AC1 |
| F6 | Spoiler-Free Wordle Share Card | Generates iconic scorecard (`Daily Path #42 🧭`, par, streak, emoji grid, URL) with regex spoiler check | M3 | R2, AC2 |
| F7 | Social Share & Clipboard Intents | Web Share API, Clipboard copy with visual toast, WhatsApp share intent, Twitter/X intent | M3 | R2, AC2 |
| F8 | Offline Storage & Streak Persistence | Client-side `localStorage` with Web Locks wrapper & fallback, streaks, win rate, move distributions | M4 | R6, AC3 |
| F9 | Optional Supabase Sync Hook | Clean hook for optional cloud sync and leaderboard, fail-safe when unconfigured | M4 | R6, AC3 |
| F10 | Platform Navigation & Games Registry | Register `"daily-path"` in `lib/platform/games.ts`, update `PlatformHeader`, `GameGrid`, `PlatformFooter` | M5 | R3, AC3 |
| F11 | Homepage & Games Portal Update | Update `app/page.tsx`, `app/games/page.tsx`, badges ("Daily Puzzle", "Today's Challenge"), 3-game grid | M5 | R3, AC3 |
| F12 | Monetization & Sponsored Engine | `daily-after-result` ad placement (CLS < 0.05), sponsored challenge theme & mascot cameo engine | M5 | R5, AC3 |
| F13 | Daily SEO Archives & Replay | `/daily/archive` index and `/daily/archive/[date]` replay with Next.js 15 async params & 404 anti-cheat | M6 | R4, AC3 |
| F14 | SEO Metadata, OG & Schema.org JSON-LD | Dynamic OG cards (`Daily Path #120`), Schema.org `GameApplication` / `WebApplication` + `BreadcrumbList` | M6 | R4, AC4 |
| F15 | Sitemap & Robots Crawlability | Add `/daily` and `/daily/archive` to `PUBLIC_PATHS` (`app/sitemap.ts`) and `app/robots.ts` allowlists | M6 | R4, AC4 |
| F16 | E2E Test Suite (Tiers 1-4) | Comprehensive opaque-box test suite verifying all features across Tiers 1-4 | E2E | AC1-AC4 |
| F17 | Adversarial Hardening (Tier 5) | White-box stress-testing, edge cases, mutation testing, coverage audit | M7 | AC1-AC4 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Test Track | Comprehensive opaque-box test runner & Tiers 1-4 test suite (`tests/daily-e2e.test.ts`), `TEST_INFRA.md`, `TEST_READY.md` | none (Parallel) | DONE |
| M1 | Core Path Engine & Solver | PRNG (`lib/daily/prng.ts`), Board generator & tiles (`lib/daily/engine.ts`), Dijkstra solver & par (`lib/daily/solver.ts`), 365-day automated solvability test (`tests/daily-solvability.test.ts`) | none | DONE |
| M2 | Game UI & Interaction | Board UI (`components/daily/DailyBoard.tsx`, `DailyTile.tsx`), animations, Tailwind dark/light theme, midnight rollover (`lib/daily/rollover.ts`), win detection, `/daily` page (`app/daily/page.tsx`) | M1 | DONE |
| M3 | Viral Share Card & Intents | Scorecard generator (`lib/daily/share.ts`), regex anti-spoiler tests (`tests/daily-share.test.ts`), toast notifications, Web Share, Clipboard, WhatsApp & Twitter intents | M1, M2 | DONE |
| M4 | Offline Persistence & Streaks | `lib/daily/storage.ts` with Web Locks wrapper, streak calculation, move distribution, Supabase hook, unit tests (`tests/daily-storage.test.ts`) | M1, M2 | DONE |
| M5 | Platform Integration & Ads | `lib/platform/games.ts`, `components/platform/Platform.tsx`, `platform.module.css`, `app/page.tsx`, `app/games/page.tsx`, `lib/platform/ads.ts`, `lib/daily/sponsor.ts`, update `tests/platform.test.ts` | M2 | DONE |
| M6 | SEO Archives, Metadata & Crawlability | `/daily/archive/page.tsx`, `/daily/archive/[date]/page.tsx`, Schema.org JSON-LD, OpenGraph preview, `app/robots.ts`, `lib/platform/site.ts`, `app/sitemap.ts`, tests (`tests/daily-seo.test.ts`) | M1, M2, M4 | DONE |
| M7 | Final Milestone: 100% E2E Pass + Tier 5 Hardening | Phase 1: 100% pass of E2E test suite (Tiers 1-4). Phase 2: Tier 5 Adversarial Coverage Hardening. Full typecheck, build, lint, and Forensic Integrity Audit. | M1-M6, E2E | IN_PROGRESS |

---

## Interface Contracts

### 1. `lib/daily/types.ts`
```ts
export type Direction = 0 | 1 | 2 | 3; // 0=North, 1=East, 2=South, 3=West
export type TileType = "start" | "goal" | "straight" | "corner" | "tee" | "cross" | "blank";

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
```

### 2. `lib/daily/engine.ts` ↔ `components/daily/DailyBoard.tsx`
```ts
export function generateDailyBoard(dateStr: string): BoardState;
export function rotateTileAt(board: BoardState, row: number, col: number): BoardState;
export function checkWinCondition(board: BoardState): boolean;
export function getConnectedTiles(board: BoardState): Set<string>;
```

### 3. `lib/daily/share.ts`
```ts
export interface ShareCardData {
  puzzleNumber: number;
  moves: number;
  par: number;
  streak: number;
  efficiencyGrid: string; // 4x2 emoji grid (e.g. 🟩🟨⬜🟩\n🟩🟩🟩🟩)
  origin?: string;
}

export function generateShareText(data: ShareCardData): string;
export function computeEfficiencyEmojis(moves: number, par: number, efficiencyScore: number): string;
export function isSpoilerFree(text: string): boolean; // regex invariant check
```

### 4. `lib/daily/storage.ts`
```ts
export interface DailyPathStats {
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  moveDistribution: Record<number, number>; // moves -> count
  history: Record<string, MoveHistory>; // dateStr -> MoveHistory
  lastPlayedDate: string | null;
}

export function getDailyPathStats(): Promise<DailyPathStats>;
export function saveDailyCompletion(dateStr: string, moves: number, par: number): Promise<DailyPathStats>;
export function syncWithSupabase(stats: DailyPathStats): Promise<boolean>;
```

---

## Code Layout
- `lib/daily/`:
  - `types.ts`: Core data structures and interfaces.
  - `prng.ts`: FNV-1a hasher, 32-bit LCG random generator, date-to-seed math.
  - `engine.ts`: 4x4 tile path topology, connectivity, rotation, win detection.
  - `solver.ts`: Minimal-move Dijkstra solver, par calculator, solvability validator.
  - `rollover.ts`: UTC midnight watcher with interval and visibilitychange.
  - `share.ts`: Wordle-style spoiler-free scorecard, emoji efficiency grid, share intents.
  - `storage.ts`: `localStorage` persistence, Web Locks concurrency, streak tracking.
  - `sponsor.ts`: Sponsored challenge theme engine, partner accent palettes.
- `components/daily/`:
  - `DailyBoard.tsx`: Responsive interactive 4x4 board, touch manipulation, animations.
  - `DailyTile.tsx`: Tactile SVG pipe/path tile, 90-degree smooth CSS rotation, start/goal compass pins.
  - `DailyHeader.tsx`: Title, puzzle number, date, move counter, par badge, help/rules modal toggle.
  - `DailyVictoryModal.tsx`: Win screen, moves vs par, streak display, share card generator, next puzzle countdown.
  - `DailyShareButtons.tsx`: 1-tap WhatsApp, Twitter/X, Native Web Share, Clipboard copy with toast.
  - `DailyAdSlot.tsx`: Zero-CLS ad placement with reserved container.
  - `DailyRulesModal.tsx`: How to play visual guide.
- `components/daily-path/`:
  - `DailyPathArt.tsx`: Platform artwork card component for `GameGrid` and `GameCard`.
- `app/daily/`:
  - `page.tsx`: Main Daily Path game page with SSR metadata & Schema.org JSON-LD.
  - `archive/page.tsx`: Calendar/month archive index page.
  - `archive/[date]/page.tsx`: Historical puzzle replay page with 404 future date anti-cheat.
- `tests/`:
  - `daily-solvability.test.ts`: Automated 365-day solvability and par verification.
  - `daily-engine.test.ts`: Tile rotation, graph connectivity, win detection.
  - `daily-share.test.ts`: Share card formatting, spoiler regex invariants.
  - `daily-storage.test.ts`: Offline persistence, streak calculation, replay protection.
  - `daily-seo.test.ts`: Schema.org JSON-LD validation, OpenGraph metadata, robots/sitemap.
  - `daily-e2e.test.ts`: Comprehensive E2E test suite (Tiers 1-4).
