/**
 * Daily Path (Pathle) — Archive Utilities & Anti-Cheat Validation
 *
 * Centralizes archive date math, launch epoch, validation guards,
 * and chronological puzzle grouping for /daily/archive and /daily/archive/[date].
 */

import { generateDailyBoard } from "./engine";
import { currentUtcDateString, getPuzzleNumber } from "./prng";

/**
 * Platform launch epoch for Daily Path archives.
 */
export const ARCHIVE_LAUNCH_EPOCH = "2026-07-05";

/**
 * Computes the 1-based puzzle number for an archive date.
 */
export function getArchivePuzzleNumber(dateStr: string): number {
  if (dateStr >= ARCHIVE_LAUNCH_EPOCH) {
    return getPuzzleNumber(dateStr, ARCHIVE_LAUNCH_EPOCH);
  }
  return getPuzzleNumber(dateStr, "2026-01-01");
}

/**
 * Validates whether an archive date string is valid, non-future, and within the 2026 epoch.
 * Returns false if:
 * - Empty or non-string
 * - Does not match YYYY-MM-DD format
 * - Invalid calendar date (e.g. 2026-02-31)
 * - Before minimum platform epoch (date < "2026-01-01")
 * - In the future (date > currentUtcDateString())
 */
export function isArchiveDateValid(
  dateStr: string,
  todayUtc: string = currentUtcDateString()
): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return false;
  // Ensure calendar day did not roll over (e.g. 2026-02-31 rolling into March)
  if (d.toISOString().slice(0, 10) !== dateStr) return false;

  // Strict anti-cheat: block historical requests before platform launch year
  if (dateStr < "2026-01-01") return false;

  // Strict anti-cheat: block future unreleased puzzles
  if (dateStr > todayUtc) return false;

  return true;
}

export interface ArchivePuzzleItem {
  dateStr: string;
  puzzleNumber: number;
  parMoves: number;
  minMoves: number;
  formattedDate: string;
  monthKey: string;
}

/**
 * Generates historical daily puzzles grouped by calendar month from launch epoch up to today UTC.
 */
export function getArchivePuzzlesGroupedByMonth(
  startEpoch: string = ARCHIVE_LAUNCH_EPOCH,
  endUtc: string = currentUtcDateString()
): Map<string, ArchivePuzzleItem[]> {
  const tStart = Date.parse(startEpoch + "T00:00:00Z");
  const tEnd = Date.parse(endUtc + "T00:00:00Z");
  const monthsMap = new Map<string, ArchivePuzzleItem[]>();

  const effectiveEnd = isNaN(tEnd) || tEnd < tStart ? tStart : tEnd;
  let cur = effectiveEnd;

  while (cur >= tStart) {
    const curDateStr = new Date(cur).toISOString().slice(0, 10);
    const puzzleNumber = getArchivePuzzleNumber(curDateStr);
    const board = generateDailyBoard(curDateStr);

    const d = new Date(curDateStr + "T00:00:00Z");
    const monthKey = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const formattedDate = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

    const item: ArchivePuzzleItem = {
      dateStr: curDateStr,
      puzzleNumber,
      parMoves: board.parMoves,
      minMoves: board.minMoves,
      formattedDate,
      monthKey,
    };

    const existing = monthsMap.get(monthKey);
    if (existing) {
      existing.push(item);
    } else {
      monthsMap.set(monthKey, [item]);
    }

    cur -= 86400 * 1000;
  }

  return monthsMap;
}
