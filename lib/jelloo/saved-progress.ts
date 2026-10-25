import { decodeJourney } from "./progress";

type Progress =
  | { status: "ready"; completed: number; best: Record<string, number> }
  | { status: "error"; message: string };

// Read-only by construction: an unreadable save is never replaced with a new one.
export function readAdventureProgress(read: () => string | null): Progress {
  try {
    const raw = read();
    if (raw === null) return { status: "ready", completed: 0, best: {} };
    const journey = decodeJourney(raw);
    if (!journey) return { status: "error", message: "This save could not be read. Your completion and stars cannot be shown safely." };
    return { status: "ready", completed: journey.completed, best: journey.best };
  } catch {
    return { status: "error", message: "Browser storage is unavailable. Your completion and stars cannot be checked." };
  }
}
