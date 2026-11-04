"use client";

import React from "react";
import type { Tile } from "@/lib/daily/types";

interface DailyTileProps {
  tile: Tile;
  onClick: () => void;
  isConnected?: boolean;
  disabled?: boolean;
}

export function DailyTile({
  tile,
  onClick,
  isConnected = false,
  disabled = false,
}: DailyTileProps) {
  const { row, col, type, rotation, isFixed } = tile;
  const connected = isConnected || tile.isConnectedToStart;
  const isInteractive = !isFixed && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isInteractive) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  const renderPathSegments = () => {
    // Colors depending on active flow
    const pipeColor = connected
      ? "stroke-emerald-500 dark:stroke-emerald-400"
      : "stroke-slate-400 dark:stroke-slate-500";
    const pipeGlowColor = connected
      ? "stroke-emerald-400/40 dark:stroke-emerald-400/30"
      : "stroke-slate-200/50 dark:stroke-slate-800/40";
    const highlightColor = connected
      ? "stroke-emerald-100 dark:stroke-white/90"
      : "stroke-white/40 dark:stroke-slate-400/20";

    switch (type) {
      case "straight":
        // Base ports [1, 3]: East-West line
        return (
          <g>
            {/* Outer glow track */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            {/* Main pipe */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            {/* Inner highlight */}
            <line
              x1="6"
              y1="50"
              x2="94"
              y2="50"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />
          </g>
        );

      case "corner":
        // Base ports [0, 1]: North to East arc (center at 100,0)
        return (
          <g>
            {/* Outer glow track */}
            <path
              d="M 50 0 A 50 50 0 0 1 100 50"
              fill="none"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            {/* Main pipe */}
            <path
              d="M 50 0 A 50 50 0 0 1 100 50"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            {/* Inner highlight */}
            <path
              d="M 50 6 A 44 44 0 0 1 94 50"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />
          </g>
        );

      case "tee":
        // Base ports [0, 1, 3]: North, East, West
        return (
          <g>
            {/* Outer glow track */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="50"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            {/* Main pipe */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="50"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            {/* Inner highlight */}
            <line
              x1="6"
              y1="50"
              x2="94"
              y2="50"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />
            <line
              x1="50"
              y1="6"
              x2="50"
              y2="50"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />
          </g>
        );

      case "cross":
        // Base ports [0, 1, 2, 3]: All four directions
        return (
          <g>
            {/* Outer glow track */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            {/* Main pipe */}
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            {/* Inner highlight */}
            <line
              x1="6"
              y1="50"
              x2="94"
              y2="50"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />
            <line
              x1="50"
              y1="6"
              x2="50"
              y2="94"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />
          </g>
        );

      case "start":
        // Base port [1]: Center to East
        return (
          <g>
            {/* Exit pipe to East */}
            <line
              x1="50"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            <line
              x1="50"
              y1="50"
              x2="100"
              y2="50"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            <line
              x1="50"
              y1="50"
              x2="94"
              y2="50"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />

            {/* Compass / Start Node */}
            <circle
              cx="50"
              cy="50"
              r="22"
              className="fill-emerald-500/20 stroke-emerald-500 dark:stroke-emerald-400"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="14"
              className="fill-emerald-500 dark:fill-emerald-400"
            />
            {/* Compass directional pointer heading East (rotation 0) */}
            <polygon
              points="62,50 44,43 47,50 44,57"
              className="fill-white"
            />
          </g>
        );

      case "goal":
        // Base port [3]: West to Center
        return (
          <g>
            {/* Entrance pipe from West */}
            <line
              x1="0"
              y1="50"
              x2="50"
              y2="50"
              strokeWidth="20"
              strokeLinecap="round"
              className={pipeGlowColor}
            />
            <line
              x1="0"
              y1="50"
              x2="50"
              y2="50"
              strokeWidth="12"
              strokeLinecap="round"
              className={pipeColor}
            />
            <line
              x1="6"
              y1="50"
              x2="50"
              y2="50"
              strokeWidth="3"
              strokeLinecap="round"
              className={highlightColor}
            />

            {/* Goal Portal / Target Pin */}
            <circle
              cx="50"
              cy="50"
              r="22"
              className={
                connected
                  ? "fill-amber-500/20 stroke-amber-500 dark:stroke-amber-400"
                  : "fill-slate-500/10 stroke-slate-400 dark:stroke-slate-500"
              }
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="14"
              className={
                connected
                  ? "fill-amber-500 dark:fill-amber-400"
                  : "fill-slate-400 dark:fill-slate-500"
              }
            />
            {/* Star icon inside goal node */}
            <path
              d="M 50 41 L 52.5 47 L 58.5 47.5 L 54 51.5 L 55.5 57.5 L 50 54 L 44.5 57.5 L 46 51.5 L 41.5 47.5 L 47.5 47 Z"
              className="fill-white"
            />
          </g>
        );

      case "blank":
      default:
        return (
          <g>
            <circle
              cx="50"
              cy="50"
              r="4"
              className="fill-slate-300 dark:fill-slate-700"
            />
          </g>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      disabled={isFixed}
      aria-label={`Tile ${row},${col}: ${type}, rotation ${rotation * 90} degrees`}
      aria-disabled={isFixed}
      tabIndex={isInteractive ? 0 : -1}
      style={{
        touchAction: "manipulation",
      }}
      className={`group relative aspect-square w-full rounded-xl sm:rounded-2xl transition-all duration-150 select-none overflow-hidden
        ${
          isFixed
            ? "cursor-default bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700"
            : "cursor-pointer bg-slate-50 hover:bg-slate-100/90 active:scale-95 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow"
        }
        ${
          connected && !isFixed
            ? "ring-1 ring-emerald-400/40 bg-emerald-500/5 dark:bg-emerald-500/10"
            : ""
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400
      `}
    >
      {/* SVG Canvas with tactile 90-degree CSS transform */}
      <div
        className="w-full h-full flex items-center justify-center p-1.5 sm:p-2 pointer-events-none"
        style={{
          transform: `rotate(${rotation * 90}deg)`,
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm overflow-visible"
        >
          {renderPathSegments()}
        </svg>
      </div>

      {/* Start indicator badge */}
      {type === "start" && (
        <span
          className="absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-tight bg-emerald-500 text-white shadow-xs pointer-events-none"
        >
          START
        </span>
      )}

      {/* Goal indicator badge */}
      {type === "goal" && (
        <span
          className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-tight shadow-xs pointer-events-none ${
            connected
              ? "bg-amber-500 text-white"
              : "bg-slate-400 text-white dark:bg-slate-600"
          }`}
        >
          GOAL
        </span>
      )}
    </button>
  );
}
export default DailyTile;
