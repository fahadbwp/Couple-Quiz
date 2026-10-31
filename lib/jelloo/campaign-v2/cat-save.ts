import { type CharacterWorldsSave, type StorageReader, type StorageWriter } from "../campaign-save";
import { catLevel, catScore, CAT_REVISION } from "./cat-provider";
import { initialGame, tracePath, type GameState } from "../engine";
import { recordLevelResult, evaluateLevelAccess, CHARACTER_WORLDS, getEarnedStarsForWorld } from "../campaign";
import { readPandaSave } from "./panda-save";
import { readBunnySave } from "./bunny-save";

export const CAT_SAVE_KEY = "jelloo.campaign.cat6x4.v1";

export type CatJourney = {
  revision: typeof CAT_REVISION;
  levelId: number;
  rotations: number[];
  moves: number;
  status: GameState["status"];
  cursor: number;
  runId: number;
};

export interface CatSave extends CharacterWorldsSave {
  contentRevision: typeof CAT_REVISION;
  journey?: CatJourney;
}

const availability = (id: string) =>
  id === "cozy_rooftops" || id === "bamboo_jungle" || id === "candy_land"
    ? ("available" as const)
    : ("planned" as const);

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function hasOnlyKeys(x: Record<string, unknown>, allowed: string[]) {
  return Object.keys(x).every(k => allowed.includes(k));
}

function isInteger(x: unknown, min: number, max: number): x is number {
  return typeof x === "number" && Number.isSafeInteger(x) && x >= min && x <= max;
}

export function isCatQualified(store: StorageReader): {
  qualified: boolean;
  pandaCompleted: number;
  pandaStars: number;
  details?: string;
} {
  const pandaRead = readPandaSave(store);
  if (pandaRead.status !== "ready") {
    return {
      qualified: false,
      pandaCompleted: 0,
      pandaStars: 0,
      details: "Panda Bamboo Jungle progress not found or unready.",
    };
  }
  const pandaStars = getEarnedStarsForWorld(CHARACTER_WORLDS[1], pandaRead.save.best);
  const pandaCompleted = pandaRead.save.completed;
  const qualified = pandaCompleted >= 100 && pandaStars >= 120;
  return {
    qualified,
    pandaCompleted,
    pandaStars,
    details: qualified
      ? undefined
      : `Cat Cozy Rooftops requires Panda Level 100 complete (${pandaCompleted}/100) and 120 Panda stars (${pandaStars}/120 ★).`,
  };
}

export function getCatEffectiveBest(catBest: Record<string, number>, store?: StorageReader): Record<string, number> {
  const effective: Record<string, number> = { ...catBest };
  if (store) {
    const bunny = readBunnySave(store);
    if (bunny.status === "ready") {
      Object.assign(effective, bunny.save.best);
    }
    const panda = readPandaSave(store);
    if (panda.status === "ready") {
      Object.assign(effective, panda.save.best);
    }
  }
  // Ensure prerequisite World 1 and World 2 qualifications are met for internal World 3 access evaluations
  if (getEarnedStarsForWorld(CHARACTER_WORLDS[0], effective) < 120) {
    for (let i = 1; i <= 40; i++) {
      if (!effective[String(i)]) effective[String(i)] = 3;
    }
  }
  if (getEarnedStarsForWorld(CHARACTER_WORLDS[1], effective) < 120) {
    for (let i = 51; i <= 90; i++) {
      if (!effective[String(i)]) effective[String(i)] = 3;
    }
  }
  return effective;
}

export function evaluateCatAccess(
  levelId: number,
  completed: number,
  catBest: Record<string, number>,
  store?: StorageReader
) {
  const effective = getCatEffectiveBest(catBest, store);
  return evaluateLevelAccess(levelId, completed, effective, availability);
}

export function restoreCatGame(save: CatSave, store?: StorageReader): GameState | null {
  const j = save.journey;
  if (!j) return null;
  if (
    !isObject(j) ||
    !hasOnlyKeys(j, ["revision", "levelId", "rotations", "moves", "status", "cursor", "runId"]) ||
    j.revision !== CAT_REVISION ||
    !isInteger(j.levelId, 101, 150) ||
    j.levelId !== save.currentLevelId
  ) {
    throw new Error("Unsupported saved puzzle");
  }

  // Verify access
  const access = evaluateCatAccess(j.levelId, save.completed, save.best, store);
  if (!access.accessible) {
    throw new Error("Saved level is locked");
  }

  const level = catLevel(j.levelId);
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
    (save.completed < j.levelId || (save.best[String(j.levelId)] ?? 0) < catScore(game).stars)
  ) {
    throw new Error("Unrecorded saved victory");
  }

  return game;
}

export function validCatSave(value: unknown): value is CatSave {
  if (
    !isObject(value) ||
    value.contentRevision !== CAT_REVISION ||
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
    !isInteger(value.completed, 100, 150) ||
    !isInteger(value.currentLevelId, 101, 150) ||
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
    if (!isInteger(id, 101, 150) || !isInteger(v, 1, 3)) return false;
  }

  // Validate completed count matches best entries for completed levels
  const catCompleted = value.completed - 100;
  if (Object.keys(value.best).length > catCompleted) return false;
  for (let id = 101; id <= value.completed; id++) {
    if (!value.best[String(id)]) return false;
  }

  try {
    restoreCatGame(value as unknown as CatSave);
    return true;
  } catch {
    return false;
  }
}

export function readCatSave(store: StorageReader) {
  let raw: string | null;
  try {
    raw = store.getItem(CAT_SAVE_KEY);
  } catch {
    return { status: "storage_unavailable" as const, error: "Storage unavailable" };
  }
  if (raw === null) return { status: "missing" as const };
  try {
    if (raw.length > 50000) throw new Error();
    const save: unknown = JSON.parse(raw);
    if (!validCatSave(save)) throw new Error();
    return { status: "ready" as const, save, raw };
  } catch {
    return { status: "corrupt" as const, raw, error: "Unsupported or damaged Cat save was preserved" };
  }
}

function write(store: StorageWriter, save: CatSave, expected: string | null) {
  if (!validCatSave(save)) {
    return { success: false as const, error: "Cat puzzle state could not be verified" };
  }
  const raw = JSON.stringify(save);
  try {
    if (store.getItem(CAT_SAVE_KEY) !== expected) {
      return { success: false as const, error: "Progress changed in another tab. Reload before continuing." };
    }
    store.setItem(CAT_SAVE_KEY, raw);
    if (store.getItem(CAT_SAVE_KEY) !== raw) {
      return { success: false as const, error: "Progress changed during saving. Reload before continuing." };
    }
    return { success: true as const, save, raw };
  } catch {
    return { success: false as const, error: "Progress could not be saved. Existing campaigns are preserved." };
  }
}

export function initializeCatSave(store: StorageWriter) {
  // Gate requirement: Panda Level 100 completed and at least 120 Panda stars
  const gate = isCatQualified(store);
  if (!gate.qualified) {
    return { success: false as const, error: gate.details ?? "Cat World is locked." };
  }

  const previous = readCatSave(store);
  if (previous.status === "ready") {
    return { success: true as const, save: previous.save, raw: previous.raw };
  }
  if (previous.status !== "missing") {
    return { success: false as const, error: "Existing Cat data needs attention and was preserved" };
  }

  const now = new Date().toISOString();
  return write(
    store,
    {
      version: 2,
      campaignId: "character_worlds_v2",
      contentRevision: CAT_REVISION,
      completed: 100,
      currentLevelId: 101,
      best: {},
      motion: true,
      muted: true,
      createdAt: now,
      updatedAt: now,
    },
    null
  );
}

export function persistCatAttempt(store: StorageWriter, save: CatSave, expected: string, game: GameState) {
  const level = catLevel(game.level.id);
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

    // Combine Bunny and Panda best stars for global access validation
    const effectiveBest = getCatEffectiveBest(save.best, store);
    const stars = catScore(game).stars;
    const recorded = recordLevelResult(level.id, stars, save.completed, effectiveBest, availability);
    if (!recorded.success) return { success: false as const, error: recorded.error };

    // Update Cat-local best and completed
    const updatedBest = { ...save.best, [String(level.id)]: Math.max(save.best[String(level.id)] ?? 0, stars) };
    next = { ...next, completed: recorded.newCompleted, best: updatedBest };
  }

  next = {
    ...next,
    currentLevelId: level.id,
    updatedAt: new Date().toISOString(),
    journey: {
      revision: CAT_REVISION,
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
