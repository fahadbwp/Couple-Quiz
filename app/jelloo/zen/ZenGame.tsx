"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { gameReducer, initialGame, tracePath } from "@/lib/jelloo/engine";
import {
  generateZenLevel,
  decodeZenStore,
  encodeZenStore,
  newZenStore,
  ZEN_SAVE_KEY,
  type ZenSize,
  type ZenStore,
} from "@/lib/jelloo/zen";
import { worlds, isWorldUnlocked, type WorldId } from "@/lib/jelloo/worlds";
import { decodeJourney, SAVE_KEY, type JourneyAction } from "@/lib/jelloo/progress";
import { powerStepDuration } from "@/lib/jelloo/pals";
import { feedbackFor, GameAudio } from "@/lib/jelloo/feedback";
import GameView from "../GameView";
import styles from "../game.module.css";

export default function ZenGame() {
  const [completed, setCompleted] = useState<number>(0);
  const [store, setStore] = useState<ZenStore>(() => newZenStore());
  const [ready, setReady] = useState(false);
  const [saveAllowed, setSaveAllowed] = useState(true);
  const [saveMessage, setSaveMessage] = useState("Zen progress saves on this browser.");
  const [muted, setMuted] = useState(false);
  const [motion, setMotion] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [currentLevel, setCurrentLevel] = useState(() => generateZenLevel(store.size, store.seed, store.world));
  const [game, dispatch] = useReducer(gameReducer, undefined, () => initialGame(currentLevel));

  const board = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const audio = useRef<GameAudio | null>(null);
  const previous = useRef(game);
  const animate = motion && !reduced;
  const busy = game.status === "running";

  // Initial load: read adventure progress to check unlocked worlds, then load zen store
  useEffect(() => {
    let advCompleted = 0;
    try {
      const advRaw = localStorage.getItem(SAVE_KEY);
      if (advRaw) {
        const adv = decodeJourney(advRaw);
        if (adv) {
          advCompleted = adv.completed;
          setCompleted(advCompleted);
        }
      }
      const raw = localStorage.getItem(ZEN_SAVE_KEY);
      const loaded = decodeZenStore(raw ?? "", advCompleted);
      setStore(loaded);

      const lvl = generateZenLevel(loaded.size, loaded.seed, loaded.world);
      setCurrentLevel(lvl);
      dispatch({ type: "load", level: lvl });

      // Restore in-progress rotations if valid
      if (Array.isArray(loaded.activeRotations) && loaded.activeRotations.length === lvl.tiles.length) {
        const restoredTiles = lvl.tiles.map((t, idx) => ({
          ...t,
          rotation: ["straight", "corner", "tee"].includes(t.kind) ? loaded.activeRotations![idx] : t.rotation,
        }));
        game.tiles = restoredTiles;
        if (typeof loaded.activeMoves === "number") game.moves = loaded.activeMoves;
      }
    } catch {
      setSaveAllowed(false);
      setSaveMessage("Saving is unavailable in this environment.");
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Motion & visibility
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

  useEffect(() => () => { audio.current?.dispose(); }, []);

  useEffect(() => {
    if (hidden || muted) audio.current?.stop();
    else feedbackFor(previous.current, game).forEach(c => audio.current?.play(c));
    previous.current = game;
  }, [game, muted, hidden]);

  // Auto start when connected
  useEffect(() => {
    if (!ready || hidden || game.status !== "editing" || tracePath(game.level, game.tiles).outcome !== "home") return;
    const timer = setTimeout(() => dispatch({ type: "auto", runId: game.runId, moves: game.moves }), 250);
    return () => clearTimeout(timer);
  }, [game, ready, hidden]);

  useEffect(() => {
    if (!busy || hidden) return;
    const timer = setTimeout(() => dispatch({ type: "tick", runId: game.runId }), powerStepDuration(game, animate));
    return () => clearTimeout(timer);
  }, [game, busy, hidden, animate]);

  // Handle Victory in Zen Mode
  useEffect(() => {
    if (game.status !== "won") {
      dialog.current?.close();
      return;
    }

    setStore(prev => {
      const nextSeed = (Math.imul(prev.seed, 1664525) + 1013904223) >>> 0;
      const updatedStore: ZenStore = {
        ...prev,
        solvedCount: prev.solvedCount + 1,
        seed: nextSeed,
        activeRotations: undefined,
        activeMoves: undefined,
      };

      if (saveAllowed) {
        try {
          localStorage.setItem(ZEN_SAVE_KEY, encodeZenStore(updatedStore));
        } catch {
          // Safe fallback
        }
      }

      return updatedStore;
    });

    const timer = setTimeout(() => {
      if (!dialog.current?.open) {
        dialog.current?.showModal();
        heading.current?.focus();
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [game.status, saveAllowed]);

  // Save in-progress rotations
  useEffect(() => {
    if (!ready || !saveAllowed || game.status !== "editing") return;
    try {
      const updatedStore: ZenStore = {
        ...store,
        activeRotations: game.tiles.map(t => t.rotation % 4),
        activeMoves: game.moves,
      };
      localStorage.setItem(ZEN_SAVE_KEY, encodeZenStore(updatedStore));
    } catch {
      // Safe fallback
    }
  }, [game.tiles, game.moves, game.status, ready, saveAllowed, store]);

  function switchSize(newSize: ZenSize) {
    if (busy || newSize === store.size) return;
    audio.current?.stop();
    const updatedStore: ZenStore = {
      ...store,
      size: newSize,
      activeRotations: undefined,
      activeMoves: undefined,
    };
    setStore(updatedStore);
    if (saveAllowed) {
      try { localStorage.setItem(ZEN_SAVE_KEY, encodeZenStore(updatedStore)); } catch {}
    }
    const lvl = generateZenLevel(newSize, updatedStore.seed, updatedStore.world);
    setCurrentLevel(lvl);
    dispatch({ type: "load", level: lvl });
  }

  function switchWorld(newWorld: WorldId) {
    if (busy || newWorld === store.world || !isWorldUnlocked(newWorld, completed)) return;
    audio.current?.stop();
    const updatedStore: ZenStore = {
      ...store,
      world: newWorld,
      activeRotations: undefined,
      activeMoves: undefined,
    };
    setStore(updatedStore);
    if (saveAllowed) {
      try { localStorage.setItem(ZEN_SAVE_KEY, encodeZenStore(updatedStore)); } catch {}
    }
    const lvl = generateZenLevel(store.size, updatedStore.seed, newWorld);
    setCurrentLevel(lvl);
    dispatch({ type: "load", level: lvl });
  }

  function nextZenPuzzle() {
    dialog.current?.close();
    audio.current?.stop();
    const lvl = generateZenLevel(store.size, store.seed, store.world);
    setCurrentLevel(lvl);
    dispatch({ type: "load", level: lvl });
  }

  function act(action: JourneyAction) {
    if (!audio.current) audio.current = new GameAudio();
    if (!muted || action.type === "mute") audio.current.unlock();
    if (action.type === "mute") { setMuted(!muted); audio.current.stop(); return; }
    if (action.type === "motion") { setMotion(!motion); return; }
    if (action.type === "visit") {
      nextZenPuzzle();
      return;
    }
    if (action.type === "reset") {
      audio.current.stop();
      dispatch({ type: "load", level: currentLevel });
      return;
    }
    if (action.type === "restore" || action.type === "jump") return;
    if (action.type === "rotate" && !muted && game.status === "editing") audio.current.play("rotate");
    dispatch(action);
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <p role="status" style={{ textAlign: "center", padding: "40px" }}>Opening Zen Garden…</p>
      </main>
    );
  }

  return (
    <GameView
      zenMode
      journey={{
        game,
        completed: 100,
        seed: store.seed,
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
          background: "linear-gradient(135deg, rgba(237, 242, 247, 0.9), rgba(226, 232, 240, 0.9))",
          border: "1px solid #cbd5e1",
          borderRadius: "16px",
          padding: "12px 14px",
          margin: "10px 0 14px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#475569" }}>
              🌸 Zen Garden · Infinite Relaxed Play
            </span>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#334155" }}>
              Relaxed: {store.solvedCount} Solved
            </span>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}>
              Board Size
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              {([4, 5, 6] as ZenSize[]).map(s => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => switchSize(s)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: store.size === s ? "900" : "600",
                    background: store.size === s ? "#475569" : "white",
                    color: store.size === s ? "white" : "#475569",
                    border: "1px solid #94a3b8",
                    cursor: "pointer",
                  }}
                >
                  {s === 4 ? "4×4 Cozy" : s === 5 ? "5×5 Classic" : "6×6 Spacious"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", color: "#64748b", marginBottom: "4px" }}>
              World Atmosphere
            </label>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {worlds.map(w => {
                const unlocked = isWorldUnlocked(w.id, completed);
                const active = store.world === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    disabled={!unlocked || busy}
                    onClick={() => switchWorld(w.id)}
                    title={unlocked ? w.name : `Unlocks at Adventure Level ${w.unlockLevel}`}
                    style={{
                      padding: "5px 9px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: active ? "900" : "600",
                      background: active ? "#334155" : unlocked ? "white" : "#f1f5f9",
                      color: active ? "white" : unlocked ? "#334155" : "#94a3b8",
                      border: "1px solid #cbd5e1",
                      cursor: unlocked ? "pointer" : "not-allowed",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <span>{w.icon}</span>
                    <span>{w.name}</span>
                    {!unlocked ? <span style={{ fontSize: "9px" }}>🔒</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      }
    />
  );
}
