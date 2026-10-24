"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { gameReducer, initialGame, tracePath, type Character } from "@/lib/jelloo/engine";
import {
  canPlayPal,
  decodePalStars,
  pals,
  PAL_SAVE_KEY,
  powerStepDuration,
  playablePowerTrial,
  getFavouritePal,
  setFavouritePal,
} from "@/lib/jelloo/pals";
import { decodeJourney, SAVE_KEY, type JourneyAction } from "@/lib/jelloo/progress";
import { feedbackFor, GameAudio } from "@/lib/jelloo/feedback";
import { scoreRun } from "@/lib/jelloo/scoring";
import GameView from "../GameView";
import { trialSelection, trialUrl } from "@/lib/jelloo/trial-navigation";
import CharacterSprite from "../CharacterSprite";
import styles from "../game.module.css";

export default function PowerGame() {
  const [activePal, setActivePal] = useState<Character | null>(null);
  const [game, dispatch] = useReducer(gameReducer, undefined, () =>
    initialGame(playablePowerTrial("bunny", 1))
  );
  const [completed, setCompleted] = useState(0);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [motion, setMotion] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [stars, setStars] = useState<Record<string, number>>({});
  const [saveAllowed, setSaveAllowed] = useState(true);
  const [message, setMessage] = useState(
    "Trial medals save on this browser; adventure progress stays separate."
  );
  const [favourite, setFavourite] = useState<Character | null>(null);

  const board = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const audio = useRef<GameAudio | null>(null);
  const previous = useRef(game);

  const character = game.level.character!;
  const trial = game.level.id;
  const animate = motion && !reduced;
  const busy = game.status === "running";

  useEffect(() => {
    let comp = 0;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const saved = raw ? decodeJourney(raw) : null;
      if (saved) {
        setCompleted(saved.completed);
        comp = saved.completed;
        setMuted(saved.muted);
        setMotion(saved.motion);
      } else if (raw) {
        setMessage("Adventure save could not be read; it is preserved. Only Bunny is available.");
      }
      const medals = decodePalStars(localStorage.getItem(PAL_SAVE_KEY));
      if (medals) {
        setStars(medals);
      } else {
        setSaveAllowed(false);
        setMessage("Trial save could not be read and has been preserved.");
      }
      setFavourite(getFavouritePal());

      // Parse query params for active pal and trial
      if (typeof window !== "undefined") {
        const selection = trialSelection(window.location.search, comp);
        if (selection) {
          setActivePal(selection.pal);
          dispatch({ type: "load", level: playablePowerTrial(selection.pal, selection.trial) });
        }
      }
    } catch {
      setSaveAllowed(false);
      setMessage("Saving is unavailable. You can still play Bunny’s trials.");
    }
    setReady(true);
  }, []);

  // Listen to popstate for browser Back / Forward between Selection Screen and Trial Mode
  useEffect(() => {
    const onPopState = () => {
      if (typeof window === "undefined") return;
      const selection = trialSelection(window.location.search, completed);
      if (selection) {
        setActivePal(selection.pal);
        audio.current?.stop();
        dispatch({ type: "load", level: playablePowerTrial(selection.pal, selection.trial) });
      } else {
        audio.current?.stop();
        setActivePal(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [completed]);

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
    if (hidden || muted) {
      audio.current?.stop();
    } else {
      feedbackFor(previous.current, game).forEach((c) => audio.current?.play(c));
    }
    previous.current = game;
  }, [game, muted, hidden]);

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

  useEffect(() => {
    if (game.status !== "won") {
      dialog.current?.close();
      return;
    }
    const earned = scoreRun(game).stars;
    const key = `${character}-${trial}`;
    setStars((old) => ({ ...old, [key]: Math.max(old[key] ?? 0, earned) }));
    const timer = setTimeout(() => {
      if (!dialog.current?.open) {
        dialog.current?.showModal();
        heading.current?.focus();
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [game.status, character, trial, game]);

  useEffect(() => {
    if (!ready || !saveAllowed) return;
    try {
      localStorage.setItem(PAL_SAVE_KEY, JSON.stringify({ version: 1, stars }));
    } catch {
      setSaveAllowed(false);
      setMessage("Trial medals could not be saved this visit.");
    }
  }, [ready, saveAllowed, stars]);

  function load(id: Character, number: number) {
    if (busy || !canPlayPal(id, completed)) return;
    audio.current?.stop();
    dispatch({ type: "load", level: playablePowerTrial(id, number) });
    window.history.replaceState({ pal: id, trial: number }, "", trialUrl(id, number));
    board.current?.focus({ preventScroll: true });
  }

  function startTrial(id: Character, number: number = 1) {
    if (busy || !canPlayPal(id, completed)) return;
    audio.current?.stop();
    setActivePal(id);
    dispatch({ type: "load", level: playablePowerTrial(id, number) });
    if (typeof window !== "undefined") {
      window.history.pushState({ pal: id, trial: number }, "", trialUrl(id, number));
    }
    board.current?.focus({ preventScroll: true });
  }

  function returnToSelection() {
    audio.current?.stop();
    setActivePal(null);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", trialUrl(null));
    }
  }

  function toggleFavourite(id: Character) {
    if (!canPlayPal(id, completed)) return;
    const next = favourite === id ? null : id;
    setFavouritePal(next);
    setFavourite(next);
  }

  function act(action: JourneyAction) {
    if (!audio.current) audio.current = new GameAudio();
    if (!muted || action.type === "mute") audio.current.unlock();
    if (action.type === "mute") {
      setMuted(!muted);
      audio.current.stop();
      return;
    }
    if (action.type === "motion") {
      setMotion(!motion);
      return;
    }
    if (action.type === "visit") {
      load(character, action.id > 3 ? 1 : action.id);
      return;
    }
    if (action.type === "restore" || action.type === "jump") return;
    if (action.type === "reset") audio.current.stop();
    if (action.type === "rotate" && !muted && game.status === "editing") audio.current.play("rotate");
    dispatch(action);
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <p role="status">Opening your pals…</p>
      </main>
    );
  }

  // Render Dedicated Character Selection Screen when no active trial is selected
  if (activePal === null) {
    return (
      <main className={`${styles.page} ${styles.compact}`}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <Link href="/jelloo/map" className={styles.back} aria-label="Return to Level Map">
              ← Level Map
            </Link>
            <h1 className={styles.brand}>
              Jelloo<span>.</span>
            </h1>
            <button
              type="button"
              className={styles.sound}
              aria-pressed={muted}
              onClick={() => setMuted(!muted)}
            >
              Sound: {muted ? "off" : "on"}
            </button>
          </header>

          <section className={styles.collection} aria-label="Character collection" style={{ margin: "18px 0" }}>
            <h2 style={{ fontSize: "22px", margin: "4px 0 8px", color: "#543e77" }}>🐾 Meet Your Pals</h2>
            <p style={{ margin: "0 0 16px", color: "#6b5883", fontSize: "13px" }}>
              Each pal brings a unique power. Practice in Power Trials, or equip your Favourite to accompany you in compatible Adventure puzzles!
            </p>

            <div
              className={styles.unlockProgress}
              style={{
                background: "#f8f0fc",
                padding: "10px 14px",
                borderRadius: "14px",
                marginBottom: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontWeight: "700", color: "#6b21a8" }}>
                {completed}/100 Adventure complete · {pals.filter((p) => canPlayPal(p.id, completed)).length}/5 pals unlocked
              </span>
              {favourite ? (
                <span className={styles.cosmeticBadge} style={{ margin: 0 }}>
                  Equipped: {pals.find((p) => p.id === favourite)?.name} ★
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: "#8b7596" }}>No Favourite equipped (Bunny default)</span>
              )}
            </div>

            <div className={styles.palSelectionGrid}>
              {pals.map((p) => {
                const unlocked = canPlayPal(p.id, completed);
                const isFav = favourite === p.id;
                return (
                  <div key={p.id} className={styles.palSelectionCard} data-unlocked={unlocked}>
                    <div className={styles.palCardHeader}>
                      <span className={styles.palCardPortrait}>
                        <CharacterSprite character={p.id} animate={animate} />
                      </span>
                      <div className={styles.palCardMeta}>
                        <strong className={styles.palCardName}>{p.name}</strong>
                        <span className={styles.palCardUnlock}>
                          {unlocked ? "✓ Unlocked" : `🔒 Unlocks at Level ${p.unlock}`}
                        </span>
                      </div>
                    </div>
                    <p className={styles.palCardPower}>{p.power}</p>
                    <div className={styles.palCardTrials}>
                      <span className={styles.palTrialsLabel}>Trial Medals:</span>
                      <div className={styles.palTrialBadges}>
                        {[1, 2, 3].map((t) => (
                          <span key={t} className={styles.palTrialBadge}>
                            T{t} {stars[`${p.id}-${t}`] ? "★".repeat(stars[`${p.id}-${t}`]) : "○"}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.palCardActions}>
                      <button
                        type="button"
                        className={styles.playTrialsBtn}
                        disabled={!unlocked}
                        onClick={() => startTrial(p.id, 1)}
                        aria-label={`Play ${p.name} Trials`}
                      >
                        {unlocked ? "Play Trials →" : `Locked (Lv ${p.unlock})`}
                      </button>
                      {unlocked && (
                        <button
                          type="button"
                          className={styles.favouriteBtn}
                          aria-pressed={isFav}
                          aria-label={isFav ? `Unequip ${p.name} as favourite` : `Equip ${p.name} as favourite`}
                          onClick={() => toggleFavourite(p.id)}
                        >
                          {isFav ? "★ Favourite" : "Equip"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <footer style={{ textAlign: "center", margin: "20px 0 28px" }}>
            <Link
              href="/jelloo/map"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                background: "#f4e8f2",
                color: "#6a4c84",
                borderRadius: "14px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              ← Return to Adventure Map
            </Link>
          </footer>
        </div>
      </main>
    );
  }

  // Active Trial Gameplay Mode
  return (
    <GameView
      powerMode
      onBack={returnToSelection}
      journey={{ game, completed, seed: 0, motion, muted, rules: 3, best: {} }}
      animate={animate}
      preparing={false}
      generationError=""
      saveMessage={message}
      reducedMotion={reduced}
      act={act}
      board={board}
      resultDialog={dialog}
      winHeading={heading}
      extra={
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 6px" }}>
            <button
              type="button"
              onClick={returnToSelection}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                background: "#fdf4ff",
                border: "1px solid #e879f9",
                color: "#86198f",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ← Meet Your Pals
            </button>
            <span style={{ fontSize: "11px", color: "#86198f", fontWeight: "600" }}>
              {completed}/100 Adventure
            </span>
          </div>
          <p>
            Now training: <strong>{pals.find((p) => p.id === character)!.name} · Trial {trial} of 3</strong>. Trials save their own stars and are never required to advance in Adventure.
          </p>
          <nav className={styles.trialTabs} aria-label="Power trials">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                disabled={busy}
                aria-current={trial === n ? "step" : undefined}
                onClick={() => load(character, n)}
              >
                Trial {n}
                <small>{stars[`${character}-${n}`] ? "★".repeat(stars[`${character}-${n}`]) : "○ ○ ○"}</small>
              </button>
            ))}
          </nav>
          <button className={styles.motion} aria-pressed={motion} onClick={() => act({ type: "motion" })}>
            Animation: {motion ? "on" : "off"}
          </button>
        </>
      }
    />
  );
}
