"use client";

import React, { useState, useEffect } from "react";
import { DailyTile } from "./DailyTile";
import { DailyVictoryModal } from "./DailyVictoryModal";
import { rotateTileAt, checkWinCondition, getConnectedTiles } from "@/lib/daily/engine";
import { saveDailyCompletion, getDailyPathStats } from "@/lib/daily/storage";
import type { BoardState } from "@/lib/daily/types";

interface DailyBoardProps {
  board: BoardState;
  onBoardChange?: (newBoard: BoardState) => void;
  moves?: number;
  onMove?: (moves: number) => void;
  hasWon?: boolean;
  onWin?: (finalMoves: number) => void;
  streak?: number;
  readOnly?: boolean;
  showVictoryOnWin?: boolean;
}

function triggerWinSoundAndVibrate() {
  if (typeof window !== "undefined") {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
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
      // Audio playback blocked or unsupported
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate([40, 30, 80]);
    } catch {
      // Vibration not supported
    }
  }
}

export function DailyBoard({
  board,
  onBoardChange,
  moves = 0,
  onMove,
  hasWon = false,
  onWin,
  streak = 1,
  readOnly = false,
  showVictoryOnWin = true,
}: DailyBoardProps) {
  const [internalBoard, setInternalBoard] = useState<BoardState>(board);
  const [internalMoves, setInternalMoves] = useState<number>(moves);
  const [internalWon, setInternalWon] = useState<boolean>(hasWon);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [currentStreak, setCurrentStreak] = useState<number>(streak);
  const [maxStreak, setMaxStreak] = useState<number>(streak);

  // Synchronize incoming board props if updated from parent
  useEffect(() => {
    setInternalBoard(board);
  }, [board]);

  useEffect(() => {
    setInternalMoves(moves);
  }, [moves]);

  useEffect(() => {
    setInternalWon(hasWon);
  }, [hasWon]);

  // Load streak stats
  useEffect(() => {
    getDailyPathStats()
      .then((stats) => {
        if (stats.currentStreak > 0) {
          setCurrentStreak(stats.currentStreak);
          setMaxStreak(stats.maxStreak);
        }
      })
      .catch(() => {});
  }, []);

  const activeBoard = onBoardChange ? board : internalBoard;
  const isWon = hasWon || internalWon;
  const currentMoves = onMove ? moves : internalMoves;

  const handleTileClick = async (r: number, c: number) => {
    if (readOnly || isWon) return;

    const tile = activeBoard.tiles[r]?.[c];
    if (!tile || tile.isFixed) return;

    // Rotate tile immutably
    const nextBoard = rotateTileAt(activeBoard, r, c);
    const nextMoves = currentMoves + 1;

    if (onBoardChange) {
      onBoardChange(nextBoard);
    } else {
      setInternalBoard(nextBoard);
    }

    if (onMove) {
      onMove(nextMoves);
    } else {
      setInternalMoves(nextMoves);
    }

    // Check win condition
    const won = checkWinCondition(nextBoard);
    if (won) {
      setInternalWon(true);
      triggerWinSoundAndVibrate();

      // Save to client persistence
      try {
        const stats = await saveDailyCompletion(
          nextBoard.dateStr,
          nextMoves,
          nextBoard.parMoves
        );
        setCurrentStreak(stats.currentStreak);
        setMaxStreak(stats.maxStreak);
      } catch {
        // Fallback gracefully
      }

      if (onWin) {
        onWin(nextMoves);
      }

      if (showVictoryOnWin) {
        // Slight delay before opening victory modal for tactile satisfaction
        setTimeout(() => {
          setShowVictoryModal(true);
        }, 350);
      }
    }
  };

  const connectedIds = getConnectedTiles(activeBoard);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-w-md mx-auto aspect-square select-none"
        role="grid"
        aria-label="Daily Path 4 by 4 board"
      >
        {activeBoard.tiles.map((rowTiles, r) =>
          rowTiles.map((tile, c) => (
            <DailyTile
              key={tile.id}
              tile={tile}
              isConnected={connectedIds.has(tile.id)}
              onClick={() => handleTileClick(r, c)}
              disabled={readOnly || isWon}
            />
          ))
        )}
      </div>

      {/* Embedded Victory Modal */}
      <DailyVictoryModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        puzzleNumber={activeBoard.puzzleNumber}
        moves={currentMoves}
        par={activeBoard.parMoves}
        streak={currentStreak}
        maxStreak={maxStreak}
      />
    </div>
  );
}
export default DailyBoard;
