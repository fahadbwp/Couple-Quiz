import type { Character } from "./engine";
import { canPlayPal, pals } from "./pals";

export function trialUrl(pal: Character | null, trial = 1): string {
  if (pal === null) return "/jelloo/pals";
  if (!Number.isInteger(trial) || trial < 1 || trial > 3) throw Error("Invalid trial");
  return `/jelloo/pals?pal=${pal}&trial=${trial}`;
}

export function trialSelection(search: string, completed: number): {pal: Character; trial: number} | null {
  const params = new URLSearchParams(search);
  const pal = pals.find(p => p.id === params.get("pal"))?.id;
  if (!pal || !canPlayPal(pal, completed)) return null;
  const trial = Number(params.get("trial") ?? "1");
  return {pal,trial: Number.isInteger(trial) && trial >= 1 && trial <= 3 ? trial : 1};
}
