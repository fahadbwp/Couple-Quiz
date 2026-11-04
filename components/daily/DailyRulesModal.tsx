"use client";

import React, { useEffect } from "react";
import { X, Compass, RotateCw, Flag, Trophy, Clock } from "lucide-react";

interface DailyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyRulesModal({ isOpen, onClose }: DailyRulesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Compass className="w-5 h-5" />
            </span>
            <h2
              id="rules-modal-title"
              className="text-xl font-bold text-slate-900 dark:text-white"
            >
              How to Play
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <RotateCw className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                1. Rotate Tiles
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap or click any pipe to rotate it 90° clockwise. On keyboard, use Tab and Space / Enter.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <Flag className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                2. Connect Start to Goal
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Build an unbroken line from the Start compass 🧭 to the Goal star 🎯. Fixed tiles cannot rotate.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                3. Beat the Par
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each move counts! Strive to solve the board with the fewest rotations to beat Par.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                4. New Daily Challenge
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A fresh global puzzle unlocks every night at 00:00 UTC. Keep your daily streak alive!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          Got It, Let&apos;s Play!
        </button>
      </div>
    </div>
  );
}
export default DailyRulesModal;
