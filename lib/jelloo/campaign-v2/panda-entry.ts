import { evaluatePandaAccess, restorePandaGame, type PandaSave } from "./panda-save";

export function pandaResume(
  save: PandaSave
): { view: "play"; level: number } | { view: "levels" | "worlds" } {
  const game = restorePandaGame(save);
  if (game && game.status !== "won") return { view: "play", level: game.level.id };
  if (save.completed >= 100) return { view: "worlds" };
  const next = save.completed + 1;
  const access = evaluatePandaAccess(next, save.completed, save.best);
  return access.accessible ? { view: "play", level: next } : { view: "levels" };
}

export function pandaScreen(
  resume: ReturnType<typeof pandaResume> | null,
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
      : 51;
  return {
    view,
    level,
    canonicalize: !!resume && requested === null && !mapSelected && resume.view === "play",
  };
}
