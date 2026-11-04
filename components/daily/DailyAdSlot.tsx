"use client";

import React from "react";

interface DailyAdSlotProps {
  isPuzzleComplete?: boolean;
  className?: string;
}

/**
 * Zero-CLS non-intrusive container reserved for post-result ad placements.
 * Always maintains min-height 250px and max-width 300px to ensure CLS < 0.05.
 */
export function DailyAdSlot({
  isPuzzleComplete = false,
  className = "",
}: DailyAdSlotProps) {
  if (!isPuzzleComplete) {
    return null;
  }

  return (
    <aside
      aria-label="Advertisement"
      className={`min-h-[250px] w-full max-w-[300px] mx-auto my-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20 flex flex-col items-center justify-center p-4 text-center select-none transition-opacity duration-300 ${className}`}
      style={{ minHeight: "250px" }}
    >
      <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
        <span className="uppercase tracking-widest text-[10px] font-semibold text-slate-400/80 dark:text-slate-500/80">
          Advertisement
        </span>
        <div className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-slate-700/30 flex items-center justify-center">
          <span className="text-base">✨</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[200px]">
          PlayNudge puzzles are 100% free forever thanks to our community &amp; partners.
        </p>
      </div>
    </aside>
  );
}
export default DailyAdSlot;
