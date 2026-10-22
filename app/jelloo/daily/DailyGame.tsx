"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { gameReducer, initialGame, tracePath, type Direction } from "@/lib/jelloo/engine";
import type { JourneyAction } from "@/lib/jelloo/progress";
import {
  currentUtcDateString,
  generateDailyLevel,
  getDailyMeta,
  calculateNewStreak,
  decodeDailyStore,
  encodeDailyStore,
  newDailyStore,
  DAILY_SAVE_KEY,
  type DailyStore,
} from "@/lib/jelloo/daily";
import { powerStepDuration } from "@/lib/jelloo/pals";
import { feedbackFor, GameAudio } from "@/lib/jelloo/feedback";
import { scoreRun } from "@/lib/jelloo/scoring";
import GameView from "../GameView";
import styles from "../game.module.css";

export default function DailyGame() {
  const [todayUtc] = useState(() => currentUtcDateString());
  const [dailyMeta] = useState(() => getDailyMeta(todayUtc));
  const [dailyLevel] = useState(() => generateDailyLevel(todayUtc));
  const [store, setStore] = useState<DailyStore>(() => newDailyStore(todayUtc));
  const [ready, setReady] = useState(false);
  const [saveAllowed, setSaveAllowed] = useState(true);
  const [saveMessage, setSaveMessage] = useState("Daily streaks save on this browser.");
  const [muted, setMuted] = useState(false);
  const [motion, setMotion] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [game, dispatch] = useReducer(gameReducer, undefined, () => initialGame(dailyLevel));
  const board = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const audio = useRef<GameAudio | null>(null);
  const previous = useRef(game);
  const animate = motion && !reduced;
  const busy = game.status === "running";

  // Load daily store and restore in-progress state if exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DAILY_SAVE_KEY);
      const loaded = decodeDailyStore(raw ?? "", todayUtc);
      setStore(loaded);

      // If there are saved rotations for today, restore them
      if (loaded.activeDate === todayUtc && Array.isArray(loaded.activeRotations) && loaded.activeRotations.length === dailyLevel.tiles.length) {
        const restoredTiles = dailyLevel.tiles.map((t, idx) => ({
          ...t,
          rotation: ["straight", "corner", "tee"].includes(t.kind) ? loaded.activeRotations![idx] : t.rotation,
        }));
        game.tiles = restoredTiles;
        if (typeof loaded.activeMoves === "number") game.moves = loaded.activeMoves;
        if (loaded.activeChoices) game.level.choices = loaded.activeChoices as Record<string, Direction>;
      }
    } catch {
      setSaveAllowed(false);
      setSaveMessage("Saving is unavailable in this environment.");
    }
    setReady(true);
  }, [todayUtc, dailyLevel, game]);

  // Handle accessibility / prefers-reduced-motion & visibility
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    update();
    visibility();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  // Cleanup audio
  useEffect(() => () => { audio.current?.dispose(); }, []);

  // Audio cues
  useEffect(() => {
    if (hidden || muted) audio.current?.stop();
    else feedbackFor(previous.current, game).forEach(c => audio.current?.play(c));
    previous.current = game;
  }, [game, muted, hidden]);

  // Auto start when path connects
  useEffect(() => {
    if (!ready || hidden || game.status !== "editing" || tracePath(game.level, game.tiles).outcome !== "home") return;
    const timer = setTimeout(() => dispatch({ type: "auto", runId: game.runId, moves: game.moves }), 250);
    return () => clearTimeout(timer);
  }, [game, ready, hidden]);

  // Tick execution during movement
  useEffect(() => {
    if (!busy || hidden) return;
    const timer = setTimeout(() => dispatch({ type: "tick", runId: game.runId }), powerStepDuration(game, animate));
    return () => clearTimeout(timer);
  }, [game, busy, hidden, animate]);

  // Handle Victory and Streak update
  useEffect(() => {
    if (game.status !== "won") {
      dialog.current?.close();
      return;
    }

    const { currentStreak } = calculateNewStreak(
      store.currentStreak,
      store.lastCompletedDate,
      todayUtc
    );
    const newMax = Math.max(store.maxStreak, currentStreak);
    const stars = scoreRun(game).stars;

    const updatedStore: DailyStore = {
      ...store,
      currentStreak,
      maxStreak: newMax,
      lastCompletedDate: todayUtc,
      history: {
        ...store.history,
        [todayUtc]: {
          date: todayUtc,
          won: true,
          moves: game.moves,
          stars,
          rotations: game.tiles.map(t => t.rotation % 4),
          choices: game.level.choices,
          completedAt: new Date().toISOString(),
        },
      },
    };

    setStore(updatedStore);

    if (saveAllowed) {
      try {
        localStorage.setItem(DAILY_SAVE_KEY, encodeDailyStore(updatedStore));
      } catch {
        // Safe fallback
      }
    }

    const timer = setTimeout(() => {
      if (!dialog.current?.open) {
        dialog.current?.showModal();
        heading.current?.focus();
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [game.status, game, todayUtc, store, saveAllowed]);

  // Save in-progress rotations
  useEffect(() => {
    if (!ready || !saveAllowed || game.status !== "editing") return;
    try {
      const updatedStore: DailyStore = {
        ...store,
        activeDate: todayUtc,
        activeRotations: game.tiles.map(t => t.rotation % 4),
        activeMoves: game.moves,
        activeChoices: game.level.choices,
      };
      localStorage.setItem(DAILY_SAVE_KEY, encodeDailyStore(updatedStore));
    } catch {
      // Safe fallback
    }
  }, [game.tiles, game.moves, game.status, game.level.choices, ready, saveAllowed, store, todayUtc]);

  function act(action: JourneyAction) {
    if (!audio.current) audio.current = new GameAudio();
    if (!muted || action.type === "mute") audio.current.unlock();
    if (action.type === "mute") { setMuted(!muted); audio.current.stop(); return; }
    if (action.type === "motion") { setMotion(!motion); return; }
    if (action.type === "visit" || action.type === "restore" || action.type === "jump") { return; }
    if (action.type === "reset") {
      audio.current.stop();
      dispatch({ type: "load", level: dailyLevel });
      return;
    }
    if (action.type === "rotate" && !muted && game.status === "editing") audio.current.play("rotate");
    dispatch(action);
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <p role="status" style={{ textAlign: "center", padding: "40px" }}>Loading Daily Puzzle…</p>
      </main>
    );
  }

  const alreadyWonToday = store.history[todayUtc]?.won === true;

  return (
    <GameView
      dailyMode
      streak={store.currentStreak}
      journey={{
        game,
        completed: 100,
        seed: dailyMeta.seed,
        motion,
        muted,
        rules: 4,
        best: {},
      }}
      animate={animate}
      preparing={false}
      generationError=""
      saveMessage={saveMessage}
      reducedMotion={reduced}
      act={act}
      board={board}
      resultDialog={dialog}
      winHeading={heading}
      extra={
        <div style={{
          background: "linear-gradient(135deg, rgba(254, 243, 199, 0.9), rgba(253, 230, 138, 0.9))",
          border: "1px solid #f59e0b",
          borderRadius: "16px",
          padding: "12px 16px",
          margin: "12px 0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#b45309" }}>
              UTC Calendar Challenge · {dailyMeta.weekdayName}
            </div>
            <strong style={{ fontSize: "15px", color: "#78350f" }}>
              {dailyLevel.title}
            </strong>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.8)",
            padding: "6px 12px",
            borderRadius: "12px",
            border: "1px solid #fde68a"
          }}>
            <span style={{ fontSize: "20px" }}>🔥</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "900", color: "#92400e" }}>
                {store.currentStreak} Day{store.currentStreak === 1 ? "" : "s"}
              </div>
              <small style={{ fontSize: "10px", color: "#b45309" }}>
                Best: {store.maxStreak} {alreadyWonToday ? "· Solved! ★" : ""}
              </small>
            </div>
          </div>
        </div>
      }
    />
  );
}
