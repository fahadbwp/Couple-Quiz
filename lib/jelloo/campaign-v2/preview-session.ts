import {evaluateLevelAccess, recordLevelResult, type CharacterWorldId} from "../campaign";
import {writeCampaignV2Save, type CharacterWorldsSave, type StorageWriter} from "../campaign-save";
import {type GameState, tracePath} from "../engine";
import {scoreRun} from "../scoring";
import {resolveWorld1Level} from "./world1-provider";

// This availability override belongs only to the development preview. Public metadata stays planned.
export const previewAvailability = (id: CharacterWorldId) => id === "candy_land" ? "available" as const : "planned" as const;
export function previewAccess(id: number, save: CharacterWorldsSave) {
  return evaluateLevelAccess(id, save.completed, save.best, previewAvailability);
}

/** Persist only engine-confirmed wins; incomplete rotations are intentionally not saved in Phase 4. */
export function persistPreviewWin(store: StorageWriter, save: CharacterWorldsSave, raw: string, game: GameState) {
  if (game.status !== "won") return {success: false as const, error: "Only completed puzzles can be saved."};
  const expected = resolveWorld1Level(game.level.id);
  // Reject mismatched content instead of assigning awards to an arbitrary level definition.
  if (JSON.stringify(game.level) !== JSON.stringify({...expected, choices: game.level.choices ?? {}})) {
    return {success: false as const, error: "Puzzle content differs from the reviewed campaign."};
  }
  const trace = tracePath(expected, game.tiles);
  if (trace.outcome !== "home" || JSON.stringify(trace) !== JSON.stringify(game.trace) || game.cursor !== trace.path.length - 1) {
    return {success: false as const, error: "Puzzle completion could not be verified."};
  }
  const result = recordLevelResult(expected.id, scoreRun(game).stars, save.completed, save.best, previewAvailability);
  if (!result.success) return {success: false as const, error: result.error};
  const next: CharacterWorldsSave = {...save, completed: result.newCompleted, best: result.newBest,
    currentLevelId: expected.id, updatedAt: new Date().toISOString()};
  const written = writeCampaignV2Save(store, next, raw);
  return written.success ? {success: true as const, save: next, raw: written.raw} : {success: false as const, error: written.error};
}
