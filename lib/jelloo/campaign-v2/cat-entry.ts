import { evaluateCatAccess, restoreCatGame, type CatSave } from "./cat-save";

export function catResume(
  save: CatSave
): { view: "play"; level: number } | { view: "levels" | "worlds" } {
  const game = restoreCatGame(save);
  if (game && game.status !== "won") return { view: "play", level: game.level.id };
  if (save.completed >= 150) return { view: "worlds" };
  const next = save.completed + 1;
  const access = evaluateCatAccess(next, save.completed, save.best);
  return access.accessible ? { view: "play", level: next } : { view: "levels" };
}

export function catScreen(
  resume: ReturnType<typeof catResume> | null,
  requested: string | null,
  selectedView: string | null
) {
  const mapSelected = selectedView === "levels" || selectedView === "worlds";
  const view = mapSelected ? selectedView : requested !== null ? "play" : resume?.view ?? "play";
  const level =
    requested !== null
      ? /^[1-9]\d*$/.test(requested)
        ? Number(requested)
        : NaN
      : resume?.view === "play"
      ? resume.level
      : 101;
  return {
    view,
    level,
    canonicalize: !!resume && requested === null && !mapSelected && resume.view === "play",
  };
}
