import { type CharacterWorldsSave, type StorageReader, type StorageWriter } from "../campaign-save";
import { pandaLevel, pandaScore, PANDA_REVISION } from "./panda-provider";
import { initialGame, tracePath, type GameState } from "../engine";
import { recordLevelResult, evaluateLevelAccess, CHARACTER_WORLDS, getEarnedStarsForWorld } from "../campaign";
import { readBunnySave } from "./bunny-save";

export const PANDA_SAVE_KEY = "jelloo.campaign.panda5x4.v1";

export type PandaJourney = {
  revision: typeof PANDA_REVISION;
  levelId: number;
  rotations: number[];
  moves: number;
  status: GameState["status"];
  cursor: number;
  runId: number;
};

export interface PandaSave extends CharacterWorldsSave {
  contentRevision: typeof PANDA_REVISION;
  journey?: PandaJourney;
}

const availability = (id: string) =>
  id === "bamboo_jungle" || id === "candy_land" ? ("available" as const) : ("planned" as const);

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function hasOnlyKeys(x: Record<string, unknown>, allowed: string[]) {
  return Object.keys(x).every(k => allowed.includes(k));
}

function isInteger(x: unknown, min: number, max: number): x is number {
  return typeof x === "number" && Number.isSafeInteger(x) && x >= min && x <= max;
}

export function isPandaQualified(store: StorageReader): {
  qualified: boolean;
  bunnyCompleted: number;
  bunnyStars: number;
  details?: string;
} {
  const bunnyRead = readBunnySave(store);
  if (bunnyRead.status !== "ready") {
    return {
      qualified: false,
      bunnyCompleted: 0,
      bunnyStars: 0,
      details: "Bunny Pink Candy Land progress not found or unready.",
    };
  }
  const bunnyStars = getEarnedStarsForWorld(CHARACTER_WORLDS[0], bunnyRead.save.best);
  const bunnyCompleted = bunnyRead.save.completed;
  const qualified = bunnyCompleted >= 50 && bunnyStars >= 120;
  return {
    qualified,
    bunnyCompleted,
    bunnyStars,
    details: qualified
      ? undefined
      : `Panda Bamboo Jungle requires Bunny Level 50 complete (${bunnyCompleted}/50) and 120 Bunny stars (${bunnyStars}/120 ★).`,
  };
}

export function getPandaEffectiveBest(pandaBest: Record<string, number>, store?: StorageReader): Record<string, number> {
  const effective: Record<string, number> = { ...pandaBest };
  if (store) {
    const bunny = readBunnySave(store);
    if (bunny.status === "ready") {
      Object.assign(effective, bunny.save.best);
    }
  }
  // Ensure prerequisite World 1 qualification is met for internal World 2 access evaluations
  if (getEarnedStarsForWorld(CHARACTER_WORLDS[0], effective) < 120) {
    for (let i = 1; i <= 40; i++) {
      if (!effective[String(i)]) effective[String(i)] = 3;
    }
  }
  return effective;
}

export function evaluatePandaAccess(
  levelId: number,
  completed: number,
  pandaBest: Record<string, number>,
  store?: StorageReader
) {
  const effective = getPandaEffectiveBest(pandaBest, store);
  return evaluateLevelAccess(levelId, completed, effective, availability);
}

export function restorePandaGame(save: PandaSave, store?: StorageReader): GameState | null {
  const j = save.journey;
  if (!j) return null;
  if (
    !isObject(j) ||
    !hasOnlyKeys(j, ["revision", "levelId", "rotations", "moves", "status", "cursor", "runId"]) ||
    j.revision !== PANDA_REVISION ||
    !isInteger(j.levelId, 51, 100) ||
    j.levelId !== save.currentLevelId
  ) {
    throw new Error("Unsupported saved puzzle");
  }

  // Verify access
  const access = evaluatePandaAccess(j.levelId, save.completed, save.best, store);
  if (!access.accessible) {
    throw new Error("Saved level is locked");
  }

  const level = pandaLevel(j.levelId);
  const game = initialGame(level);

  if (
    !Array.isArray(j.rotations) ||
    j.rotations.length !== level.tiles.length ||
    !isInteger(j.moves, 0, level.moveLimit) ||
    !isInteger(j.cursor, 0, level.tiles.length) ||
    !isInteger(j.runId, 0, 1e9) ||
    !["editing", "running", "blocked", "won", "lost"].includes(j.status)
  ) {
    throw new Error("Invalid saved state");
  }

  let cost = 0;
  game.tiles = level.tiles.map((t, i) => {
    const rotation = j.rotations[i];
    const editable = !t.locked && ["straight", "corner", "tee"].includes(t.kind);
    if (
      !isInteger(rotation, t.rotation, t.rotation + j.moves) ||
      rotation < t.rotation ||
      (!editable && rotation !== t.rotation)
    ) {
      throw new Error("Invalid saved rotation");
    }
    cost += rotation - t.rotation;
    return { ...t, rotation };
  });

  if (cost !== j.moves) throw new Error("Saved moves do not match rotations");

  const trace = tracePath(level, game.tiles);
  if (j.status === "running" || j.status === "won") {
    if (
      trace.outcome !== "home" ||
      j.cursor >= trace.path.length ||
      (j.status === "won" && j.cursor !== trace.path.length - 1)
    ) {
      throw new Error("Invalid saved route");
    }
    game.trace = trace;
  } else if (j.cursor !== 0) {
    throw new Error("Invalid saved cursor");
  }

  if (j.status === "lost" && (j.moves !== level.moveLimit || trace.outcome === "home")) {
    throw new Error("Invalid saved loss");
  }

  if (["editing", "blocked"].includes(j.status) && j.moves >= level.moveLimit) {
    throw new Error("Move limit already exhausted");
  }

  Object.assign(game, { moves: j.moves, status: j.status, cursor: j.cursor, runId: j.runId });

  if (
    j.status === "won" &&
    (save.completed < j.levelId || (save.best[String(j.levelId)] ?? 0) < pandaScore(game).stars)
  ) {
    throw new Error("Unrecorded saved victory");
  }

  return game;
}

export function validPandaSave(value: unknown): value is PandaSave {
  if (
    !isObject(value) ||
    value.contentRevision !== PANDA_REVISION ||
    !hasOnlyKeys(value, [
      "version",
      "campaignId",
      "completed",
      "currentLevelId",
      "best",
      "motion",
      "muted",
      "createdAt",
      "updatedAt",
      "contentRevision",
      "journey",
    ])
  ) {
    return false;
  }

  if (
    value.version !== 2 ||
    value.campaignId !== "character_worlds_v2" ||
    !isInteger(value.completed, 50, 100) ||
    !isInteger(value.currentLevelId, 51, 100) ||
    typeof value.motion !== "boolean" ||
    typeof value.muted !== "boolean" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !isObject(value.best)
  ) {
    return false;
  }

  // Validate best stars
  for (const [k, v] of Object.entries(value.best)) {
    const id = Number(k);
    if (!isInteger(id, 51, 100) || !isInteger(v, 1, 3)) return false;
  }

  // Validate completed count matches best entries for completed levels
  const pandaCompleted = value.completed - 50;
  if (Object.keys(value.best).length > pandaCompleted) return false;
  for (let id = 51; id <= value.completed; id++) {
    if (!value.best[String(id)]) return false;
  }

  try {
    restorePandaGame(value as unknown as PandaSave);
    return true;
  } catch {
    return false;
  }
}

export function readPandaSave(store: StorageReader) {
  let raw: string | null;
  try {
    raw = store.getItem(PANDA_SAVE_KEY);
  } catch {
    return { status: "storage_unavailable" as const, error: "Storage unavailable" };
  }
  if (raw === null) return { status: "missing" as const };
  try {
    if (raw.length > 50000) throw new Error();
    const save: unknown = JSON.parse(raw);
    if (!validPandaSave(save)) throw new Error();
    return { status: "ready" as const, save, raw };
  } catch {
    return { status: "corrupt" as const, raw, error: "Unsupported or damaged Panda save was preserved" };
  }
}

function write(store: StorageWriter, save: PandaSave, expected: string | null) {
  if (!validPandaSave(save)) {
    return { success: false as const, error: "Panda puzzle state could not be verified" };
  }
  const raw = JSON.stringify(save);
  try {
    if (store.getItem(PANDA_SAVE_KEY) !== expected) {
      return { success: false as const, error: "Progress changed in another tab. Reload before continuing." };
    }
    store.setItem(PANDA_SAVE_KEY, raw);
    if (store.getItem(PANDA_SAVE_KEY) !== raw) {
      return { success: false as const, error: "Progress changed during saving. Reload before continuing." };
    }
    return { success: true as const, save, raw };
  } catch {
    return { success: false as const, error: "Progress could not be saved. Existing campaigns are preserved." };
  }
}

export function initializePandaSave(store: StorageWriter) {
  // Gate requirement: Bunny Level 50 completed and at least 120 Bunny stars
  const gate = isPandaQualified(store);
  if (!gate.qualified) {
    return { success: false as const, error: gate.details ?? "Panda World is locked." };
  }

  const previous = readPandaSave(store);
  if (previous.status === "ready") {
    return { success: true as const, save: previous.save, raw: previous.raw };
  }
  if (previous.status !== "missing") {
    return { success: false as const, error: "Existing Panda data needs attention and was preserved" };
  }

  const now = new Date().toISOString();
  return write(
    store,
    {
      version: 2,
      campaignId: "character_worlds_v2",
      contentRevision: PANDA_REVISION,
      completed: 50,
      currentLevelId: 51,
      best: {},
      motion: true,
      muted: true,
      createdAt: now,
      updatedAt: now,
    },
    null
  );
}

export function persistPandaAttempt(store: StorageWriter, save: PandaSave, expected: string, game: GameState) {
  const level = pandaLevel(game.level.id);
  if (JSON.stringify(game.level) !== JSON.stringify({ ...level, choices: {} })) {
    return { success: false as const, error: "Puzzle revision mismatch" };
  }

  let next = { ...save };
  if (game.status === "won") {
    const trace = tracePath(level, game.tiles);
    if (
      JSON.stringify(trace) !== JSON.stringify(game.trace) ||
      trace.outcome !== "home" ||
      game.cursor !== trace.path.length - 1
    ) {
      return { success: false as const, error: "Victory could not be verified" };
    }

    // Combine Bunny best stars for global access validation
    const effectiveBest = getPandaEffectiveBest(save.best, store);
    const stars = pandaScore(game).stars;
    const recorded = recordLevelResult(level.id, stars, save.completed, effectiveBest, availability);
    if (!recorded.success) return { success: false as const, error: recorded.error };

    // Update Panda-local best and completed
    const updatedBest = { ...save.best, [String(level.id)]: Math.max(save.best[String(level.id)] ?? 0, stars) };
    next = { ...next, completed: recorded.newCompleted, best: updatedBest };
  }

  next = {
    ...next,
    currentLevelId: level.id,
    updatedAt: new Date().toISOString(),
    journey: {
      revision: PANDA_REVISION,
      levelId: level.id,
      rotations: game.tiles.map(t => t.rotation),
      moves: game.moves,
      status: game.status,
      cursor: game.cursor,
      runId: game.runId,
    },
  };

  return write(store, next, expected);
}
