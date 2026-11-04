"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy, Flame, Compass, Clock, Sparkles } from "lucide-react";
import { DailyShareButtons } from "./DailyShareButtons";
import { computeEfficiencyEmojis } from "@/lib/daily/share";

interface DailyVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleNumber: number;
  moves: number;
  par: number;
  streak: number;
  maxStreak?: number;
  efficiencyGrid?: string;
  origin?: string;
}

function getTimeUntilMidnightUtc(): { hours: string; minutes: string; seconds: string } {
  const now = new Date();
  const nextUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  const diffMs = Math.max(0, nextUtc.getTime() - now.getTime());
  const h = Math.floor(diffMs / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    hours: h.toString().padStart(2, "0"),
    minutes: m.toString().padStart(2, "0"),
    seconds: s.toString().padStart(2, "0"),
  };
}

export function DailyVictoryModal({
  isOpen,
  onClose,
  puzzleNumber,
  moves,
  par,
  streak,
  maxStreak = streak,
  efficiencyGrid,
  origin,
}: DailyVictoryModalProps) {
  const [countdown, setCountdown] = useState(getTimeUntilMidnightUtc());

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(getTimeUntilMidnightUtc());
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnightUtc());
    }, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const grid = efficiencyGrid || computeEfficiencyEmojis(moves, par);

  const getVictoryTitle = () => {
    if (moves < par) return "Under Par Victory!";
    if (moves === par) return "Flawless Par!";
    return "Path Completed!";
  };

  const getVictorySubtitle = () => {
    if (moves < par) return `Incredible pathfinding — beat par by ${par - moves} ${par - moves === 1 ? "move" : "moves"}!`;
    if (moves === par) return "Solved with exact par efficiency.";
    return `Connected in ${moves} moves (${moves - par} over par).`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close victory screen"
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
            <Compass className="w-3.5 h-3.5" />
            <span>Daily Path #{puzzleNumber}</span>
          </div>
          <h2
            id="victory-modal-title"
            className="text-2xl font-black tracking-tight text-slate-900 dark:text-white"
          >
            {getVictoryTitle()}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px]">
            {getVictorySubtitle()}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Moves
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {moves}
              <span className="text-xs font-normal text-slate-400">/{par}</span>
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-amber-500" />
              Streak
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {streak}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-0.5">
              <Trophy className="w-3 h-3 text-amber-500" />
              Best
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {maxStreak}
            </span>
          </div>
        </div>

        {/* Spoiler-Free Emoji Grid Preview */}
        <div className="py-2.5 px-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 font-mono text-base tracking-widest whitespace-pre select-none">
          {grid}
        </div>

        {/* Share buttons */}
        <DailyShareButtons
          data={{
            puzzleNumber,
            moves,
            par,
            streak,
            efficiencyGrid: grid,
            origin,
          }}
        />

        {/* Next Puzzle Countdown */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5" />
            Next Puzzle
          </span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {countdown.hours}:{countdown.minutes}:{countdown.seconds}
          </span>
        </div>

        {/* Review Board link */}
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
        >
          Review Board →
        </button>
      </div>
    </div>
  );
}
export default DailyVictoryModal;
