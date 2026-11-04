/**
 * Daily Path (Pathle) - Midnight Rollover Watcher
 * Milestone 2: Reload-free UTC midnight board transition
 */

import { currentUtcDateString } from "./prng";

/**
 * Watches for UTC midnight calendar day rollover without requiring a hard page reload.
 * Checks on visibilitychange (when document becomes visible) and on a periodic interval (default 10s).
 *
 * @param onChange Callback triggered with the new YYYY-MM-DD date string when day changes.
 * @param getCurrentDate Optional getter for current date string (defaults to currentUtcDateString).
 * @param intervalMs Optional interval check in milliseconds (defaults to 10000ms / 10s).
 * @returns An unsubscribe function to clean up interval and event listeners.
 */
export function watchUtcDay(
  onChange: (newDateStr: string) => void,
  getCurrentDate: () => string = () => currentUtcDateString(),
  intervalMs: number = 10000
): () => void {
  let currentDate = getCurrentDate();

  const check = () => {
    const freshDate = getCurrentDate();
    if (freshDate && freshDate !== currentDate) {
      currentDate = freshDate;
      onChange(freshDate);
    }
  };

  // Periodic check (10 seconds by default)
  const intervalId = setInterval(check, intervalMs);

  // Also check immediately when the player switches tabs back to the game
  const handleVisibilityChange = () => {
    if (typeof document === "undefined" || document.visibilityState === "visible") {
      check();
    }
  };

  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  return () => {
    clearInterval(intervalId);
    if (typeof document !== "undefined" && typeof document.removeEventListener === "function") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
}
