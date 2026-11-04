"use client";

import React from "react";
import { HelpCircle, Trophy, RotateCcw, Flame } from "lucide-react";

interface DailyHeaderProps {
  puzzleNumber: number;
  dateStr: string;
  moves: number;
  par: number;
  streak: number;
  onOpenRules: () => void;
  onOpenVictory?: () => void;
  hasWon?: boolean;
  onReset?: () => void;
}

export function DailyHeader({
  puzzleNumber,
  dateStr,
  moves,
  par,
  streak,
  onOpenRules,
  onOpenVictory,
  hasWon = false,
  onReset,
}: DailyHeaderProps) {
  const isUnderPar = moves < par;
  const isPar = moves === par;

  return (
    <header className="w-full max-w-md mx-auto space-y-3 px-2 sm:px-0">
      {/* Top Bar: Title & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xl" role="img" aria-label="Compass">
              🧭
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Daily Path
            </h1>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
            #{puzzleNumber}
          </span>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1.5">
          {hasWon && onOpenVictory && (
            <button
              type="button"
              onClick={onOpenVictory}
              aria-label="View scorecard & stats"
              title="View scorecard"
              className="p-2 rounded-xl text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
            >
              <Trophy className="w-5 h-5" />
            </button>
          )}

          {onReset && !hasWon && (
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset puzzle to initial scramble"
              title="Reset puzzle"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenRules}
            aria-label="How to play rules"
            title="How to play"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metrics Row: Moves, Par, Streak, Date */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Moves counter */}
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
          <span className="text-slate-400 dark:text-slate-500 font-normal">Moves:</span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">
            {moves}
          </span>
        </div>

        {/* Par badge */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 dark:text-slate-500 font-normal">Par:</span>
          <span
            className={`px-1.5 py-0.5 rounded-md font-bold tabular-nums text-xs ${
              moves > 0 && (isUnderPar || isPar)
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {par}
          </span>
        </div>

        {/* Streak indicator */}
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {streak}
          </span>
        </div>

        {/* Date string */}
        <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
          {dateStr}
        </div>
      </div>
    </header>
  );
}
export default DailyHeader;
