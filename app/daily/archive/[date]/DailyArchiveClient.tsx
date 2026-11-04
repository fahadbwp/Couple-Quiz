"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DailyTile } from "@/components/daily/DailyTile";
import { DailyRulesModal } from "@/components/daily/DailyRulesModal";
import { DailyVictoryModal } from "@/components/daily/DailyVictoryModal";
import { DailyAdSlot } from "@/components/daily/DailyAdSlot";
import {
  generateDailyBoard,
  rotateTileAt,
  checkWinCondition,
  getConnectedTiles,
} from "@/lib/daily/engine";
import { solveBoard } from "@/lib/daily/solver";
import {
  getDailyPathStats,
  recordArchiveCompletion,
  createInitialDailyPathStats,
  type DailyPathStats,
} from "@/lib/daily/storage";
import type { BoardState } from "@/lib/daily/types";
import { RotateCcw, HelpCircle, Trophy, Calendar, ArrowLeft, Sparkles } from "lucide-react";
import {
  ARCHIVE_LAUNCH_EPOCH,
  getArchivePuzzleNumber,
} from "@/lib/daily/archive";

export { ARCHIVE_LAUNCH_EPOCH, getArchivePuzzleNumber };

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

function triggerWinSoundAndVibrate() {
  if (typeof window !== "undefined") {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.09 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.09);
          osc.stop(ctx.currentTime + idx * 0.09 + 0.25);
        });
      }
    } catch {
      // Audio unsupported or blocked
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([40, 30, 80]);
    } catch {
      // Vibration unsupported
    }
  }
}

export interface DailyArchiveClientProps {
  archiveDate: string;
}

export function DailyArchiveClient({ archiveDate }: DailyArchiveClientProps) {
  const [board, setBoard] = useState<BoardState>(() => generateDailyBoard(archiveDate));
  const [initialScramble] = useState<BoardState>(() => board);
  const [moves, setMoves] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(() => checkWinCondition(board));
  const [stats, setStats] = useState<DailyPathStats>(createInitialDailyPathStats());
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  const puzzleNumber = getArchivePuzzleNumber(archiveDate);
  const formattedDate = formatDisplayDate(archiveDate);

  // Load stats and inspect history for archive date
  useEffect(() => {
    getDailyPathStats()
      .then((persistedStats) => {
        setStats(persistedStats);
        const record = persistedStats.history[archiveDate];
        if (record?.won) {
          setHasWon(true);
          setMoves(record.moves);

          // Restore solved board state for review
          setBoard((prev) => {
            const solution = solveBoard(prev);
            if (!solution.targetRotations) return prev;
            const solvedTiles = prev.tiles.map((row) =>
              row.map((tile) => {
                const targetRot = solution.targetRotations?.[tile.id];
                if (targetRot !== undefined) {
                  return {
                    ...tile,
                    rotation: targetRot,
                    isConnectedToStart: true,
                  };
                }
                return { ...tile };
              })
            );
            return {
              ...prev,
              tiles: solvedTiles,
            };
          });
        }
      })
      .catch(() => {});
  }, [archiveDate]);

  const handleReset = useCallback(() => {
    if (hasWon) return;
    setBoard(initialScramble);
    setMoves(0);
  }, [hasWon, initialScramble]);

  const handleTileClick = async (r: number, c: number) => {
    if (hasWon) return;

    const tile = board.tiles[r]?.[c];
    if (!tile || tile.isFixed) return;

    const nextBoard = rotateTileAt(board, r, c);
    const nextMoves = moves + 1;

    setBoard(nextBoard);
    setMoves(nextMoves);

    if (checkWinCondition(nextBoard)) {
      setHasWon(true);
      triggerWinSoundAndVibrate();

      try {
        // Record replay completion in archive history without touching live daily streak
        const updatedStats = await recordArchiveCompletion(
          archiveDate,
          nextMoves,
          nextBoard.parMoves
        );
        setStats(updatedStats);
      } catch {
        // Ignore storage fallback error
      }

      setTimeout(() => {
        setShowVictoryModal(true);
      }, 350);
    }
  };

  const connectedIds = getConnectedTiles(board);
  const isOverPar = moves > board.parMoves;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6">
      {/* Archive Navigation & Replay Badge Bar */}
      <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
        <Link
          href="/daily/archive"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Archives</span>
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300 border border-amber-500/30 shadow-xs"
            role="status"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            Archive Replay
          </span>
          <Link
            href="/daily"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold transition border border-emerald-500/20"
          >
            Today&apos;s Challenge →
          </Link>
        </div>
      </div>

      {/* Replay Header */}
      <div className="w-full flex flex-col items-center text-center gap-2">
        <div className="flex items-center justify-between w-full">
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Daily Path #{puzzleNumber}</span>
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowRulesModal(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="How to play Daily Path"
              title="How to play"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {hasWon && (
              <button
                onClick={() => setShowVictoryModal(true)}
                className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                aria-label="View scorecard"
                title="View scorecard"
              >
                <Trophy className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Moves & Par Counter Bar */}
        <div className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Moves:</span>
            <span
              className={`text-base font-black ${
                isOverPar
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {moves}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Par Target:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-black">
              {board.parMoves}
            </span>
          </div>

          {moves > 0 && !hasWon && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition"
              title="Reset board scramble"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Game Board */}
      <main className="w-full flex flex-col items-center">
        <div className="w-full max-w-md mx-auto">
          <div
            className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-w-md mx-auto aspect-square select-none"
            role="grid"
            aria-label={`Daily Path #${puzzleNumber} 4 by 4 board`}
          >
            {board.tiles.map((rowTiles, r) =>
              rowTiles.map((tile, c) => (
                <DailyTile
                  key={tile.id}
                  tile={tile}
                  isConnected={connectedIds.has(tile.id)}
                  onClick={() => handleTileClick(r, c)}
                  disabled={hasWon}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Historical Notice Card */}
      <div className="w-full max-w-md p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold">Historical Archive Challenge</p>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5">
            Solving past archive puzzles logs completion in your history without altering your live consecutive streak. Ready for today?{" "}
            <Link href="/daily" className="text-emerald-600 dark:text-emerald-400 font-bold underline hover:opacity-80">
              Play Today&apos;s Challenge
            </Link>
          </p>
        </div>
      </div>

      {/* Zero-CLS Post-Game Ad Slot */}
      <DailyAdSlot isPuzzleComplete={hasWon} />

      {/* Rules Modal */}
      <DailyRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Victory Modal */}
      <DailyVictoryModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        puzzleNumber={puzzleNumber}
        moves={moves}
        par={board.parMoves}
        streak={stats.currentStreak}
        maxStreak={stats.maxStreak}
      />
    </div>
  );
}

export { DailyArchiveClient as DailyGameClient };
export default DailyArchiveClient;
