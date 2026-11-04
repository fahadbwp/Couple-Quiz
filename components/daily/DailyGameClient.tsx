"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DailyHeader } from "./DailyHeader";
import { DailyBoard } from "./DailyBoard";
import { DailyRulesModal } from "./DailyRulesModal";
import { DailyVictoryModal } from "./DailyVictoryModal";
import { DailyAdSlot } from "./DailyAdSlot";
import { generateDailyBoard, checkWinCondition } from "@/lib/daily/engine";
import { currentUtcDateString } from "@/lib/daily/prng";
import { watchUtcDay } from "@/lib/daily/rollover";
import {
  getDailyPathStats,
  createInitialDailyPathStats,
  type DailyPathStats,
} from "@/lib/daily/storage";
import { solveBoard } from "@/lib/daily/solver";
import type { BoardState } from "@/lib/daily/types";

interface DailyGameClientProps {
  initialDateStr?: string;
}

export function DailyGameClient({ initialDateStr }: DailyGameClientProps) {
  const [dateStr, setDateStr] = useState<string>(
    initialDateStr || currentUtcDateString()
  );
  const [board, setBoard] = useState<BoardState>(() => generateDailyBoard(dateStr));
  const [initialScramble, setInitialScramble] = useState<BoardState>(() => board);
  const [moves, setMoves] = useState<number>(0);
  const [hasWon, setHasWon] = useState<boolean>(() => checkWinCondition(board));
  const [stats, setStats] = useState<DailyPathStats>(createInitialDailyPathStats());
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  // Load persistence stats on mount
  useEffect(() => {
    getDailyPathStats()
      .then((persistedStats) => {
        setStats(persistedStats);

        // Check if today's puzzle was already completed in storage
        const historyRecord = persistedStats.history[dateStr];
        if (historyRecord?.won) {
          setHasWon(true);
          setMoves(historyRecord.moves);

          // Restore solved board state for review
          setBoard((prevBoard) => {
            const solution = solveBoard(prevBoard);
            if (!solution.targetRotations) return prevBoard;
            const solvedTiles = prevBoard.tiles.map((rowTiles) =>
              rowTiles.map((tile) => {
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
              ...prevBoard,
              tiles: solvedTiles,
            };
          });
        }
      })
      .catch(() => {});
  }, [dateStr]);

  // Wire up UTC midnight day rollover watcher
  useEffect(() => {
    const unsubscribe = watchUtcDay((newDateStr) => {
      if (newDateStr && newDateStr !== dateStr) {
        const freshBoard = generateDailyBoard(newDateStr);
        setDateStr(newDateStr);
        setBoard(freshBoard);
        setInitialScramble(freshBoard);
        setMoves(0);
        setHasWon(false);
        setShowVictoryModal(false);

        getDailyPathStats()
          .then((s) => setStats(s))
          .catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dateStr]);

  // Handle board reset to original scramble
  const handleReset = useCallback(() => {
    if (hasWon) return;
    setBoard(initialScramble);
    setMoves(0);
  }, [hasWon, initialScramble]);

  const handleWin = useCallback((finalMoves: number) => {
    setHasWon(true);
    setMoves(finalMoves);
    getDailyPathStats()
      .then((s) => {
        setStats(s);
        setShowVictoryModal(true);
      })
      .catch(() => {
        setShowVictoryModal(true);
      });
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6">
      {/* Game Header */}
      <DailyHeader
        puzzleNumber={board.puzzleNumber}
        dateStr={dateStr}
        moves={moves}
        par={board.parMoves}
        streak={stats.currentStreak}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenVictory={() => setShowVictoryModal(true)}
        hasWon={hasWon}
        onReset={moves > 0 && !hasWon ? handleReset : undefined}
      />

      {/* Main Game Board */}
      <main className="w-full flex flex-col items-center">
        <DailyBoard
          board={board}
          onBoardChange={setBoard}
          moves={moves}
          onMove={setMoves}
          hasWon={hasWon}
          onWin={handleWin}
          streak={stats.currentStreak}
          showVictoryOnWin={false} // Victory modal controlled by client
        />
      </main>

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
        puzzleNumber={board.puzzleNumber}
        moves={moves}
        par={board.parMoves}
        streak={stats.currentStreak}
        maxStreak={stats.maxStreak}
      />
    </div>
  );
}
export default DailyGameClient;
