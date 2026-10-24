"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { worlds, worldForLevel } from "@/lib/jelloo/worlds";
import { decodeJourney, SAVE_KEY } from "@/lib/jelloo/progress";
import styles from "./map.module.css";

type LevelStatus = "completed" | "current" | "locked";

interface LevelInfo {
  id: number;
  status: LevelStatus;
  stars: number; // 0-3
}

function readProgress(): { completed: number; best: Record<string, number> } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(SAVE_KEY) : null;
    if (!raw) return { completed: 0, best: {} };
    const journey = decodeJourney(raw);
    if (!journey) return { completed: 0, best: {} };
    return { completed: journey.completed, best: journey.best };
  } catch {
    return { completed: 0, best: {} };
  }
}

function levelStatus(id: number, completed: number): LevelStatus {
  if (id <= completed) return "completed";
  if (id === completed + 1) return "current";
  return "locked";
}

export default function LevelMap() {
  const [completed, setCompleted] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = readProgress();
    setCompleted(p.completed);
    setBest(p.best);
    setReady(true);
  }, []);

  // Build all 100 adventure levels
  const levelsByWorld = worlds.map((world) => {
    const levels: LevelInfo[] = [];
    for (let id = world.startLevel; id <= world.endLevel; id++) {
      levels.push({
        id,
        status: ready ? levelStatus(id, completed) : "locked",
        stars: best[String(id)] ?? 0,
      });
    }
    return { world, levels };
  });

  // Endless continuation info
  const endlessUnlocked = ready && completed >= 100;
  const endlessNext = Math.max(101, completed + 1);

  function navigateToLevel(id: number, status: LevelStatus) {
    if (status === "locked") return;
    // Navigate to main jelloo page with a level param.
    // JellooGame reads ?level=N on mount and dispatches visit (or jump in dev).
    window.location.href = `/jelloo?level=${id}`;
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <a href="/jelloo" className={styles.back}>← Adventure</a>
          <h1 className={styles.brand}>Jelloo<span>.</span></h1>
          <Link href="/" className={styles.homeLink}>PlayNudge Home</Link>
        </header>

        <div className={styles.titleRow}>
          <h2 className={styles.title}>🗺️ Adventure Map</h2>
          {ready && (
            <span className={styles.progress}>
              {completed}/100 completed
            </span>
          )}
        </div>

        {!ready && (
          <p className={styles.loading} role="status">Loading your progress…</p>
        )}

        {ready && levelsByWorld.map(({ world, levels }) => {
          const worldUnlocked = completed >= world.unlockLevel;
          const worldCompleted = levels.filter(l => l.status === "completed").length;
          return (
            <section
              key={world.id}
              className={styles.worldSection}
              data-world={world.id}
              aria-label={`${world.name} World`}
            >
              <div className={styles.worldHeader}>
                <span className={styles.worldIcon}>{world.icon}</span>
                <div className={styles.worldMeta}>
                  <h3 className={styles.worldName}>{world.name}</h3>
                  <span className={styles.worldRange}>
                    Levels {world.startLevel}–{world.endLevel}
                    {worldUnlocked
                      ? ` · ${worldCompleted}/20 done`
                      : ` · Locked (complete Level ${world.unlockLevel} to unlock)`}
                  </span>
                </div>
                {world.rewardAtEnd && worldCompleted === 20 && (
                  <span className={styles.worldComplete} aria-label="World completed">🏆</span>
                )}
              </div>

              <div
                className={styles.levelGrid}
                aria-label={`${world.name} levels`}
                role="list"
              >
                {levels.map((lv) => (
                  <LevelCell
                    key={lv.id}
                    lv={lv}
                    worldUnlocked={worldUnlocked}
                    onClick={() => navigateToLevel(lv.id, lv.status)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Endless section */}
        {ready && (
          <section className={styles.worldSection} aria-label="Endless Mode">
            <div className={styles.worldHeader}>
              <span className={styles.worldIcon}>♾️</span>
              <div className={styles.worldMeta}>
                <h3 className={styles.worldName}>Endless</h3>
                <span className={styles.worldRange}>
                  Level 101+ · {endlessUnlocked ? `Your next: Level ${endlessNext}` : "Complete all 100 Adventure levels to unlock"}
                </span>
              </div>
            </div>
            {endlessUnlocked && (
              <div className={styles.endlessRow}>
                <button
                  className={styles.endlessButton}
                  onClick={() => { window.location.href = `/jelloo?level=${endlessNext}`; }}
                >
                  Continue from Level {endlessNext} →
                </button>
              </div>
            )}
          </section>
        )}

        <nav className={styles.modeNav} aria-label="Other modes">
          <a href="/jelloo/daily" className={styles.modeLink}>📅 Daily Puzzle</a>
          <a href="/jelloo/zen" className={styles.modeLink}>🌸 Zen Garden</a>
          <a href="/jelloo/pals" className={styles.modeLink}>🐾 Meet Pals</a>
        </nav>
      </div>
    </main>
  );
}

function LevelCell({
  lv,
  worldUnlocked,
  onClick,
}: {
  lv: LevelInfo;
  worldUnlocked: boolean;
  onClick: () => void;
}) {
  const isPlayable = lv.status !== "locked" && worldUnlocked;
  const world = worldForLevel(lv.id);

  if (!isPlayable) {
    return (
      <div
        role="listitem"
        className={styles.cell}
        data-status="locked"
        aria-label={`Level ${lv.id} — locked`}
        title={worldUnlocked ? `Complete Level ${lv.id - 1} to unlock` : `Unlock ${world.name} world first`}
      >
        <span className={styles.levelNum}>{lv.id}</span>
        <span className={styles.lockIcon} aria-hidden="true">🔒</span>
      </div>
    );
  }

  return (
    <button
      role="listitem"
      className={styles.cell}
      data-status={lv.status}
      aria-label={`Level ${lv.id}${lv.status === "completed" ? `, ${lv.stars} star${lv.stars !== 1 ? "s" : ""}` : lv.status === "current" ? " — your current level" : ""}`}
      aria-current={lv.status === "current" ? "step" : undefined}
      onClick={onClick}
    >
      <span className={styles.levelNum}>{lv.id}</span>
      {lv.status === "completed" && (
        <span className={styles.stars} aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} data-earned={n <= lv.stars}>★</span>
          ))}
        </span>
      )}
      {lv.status === "current" && (
        <span className={styles.currentBadge} aria-hidden="true">▶</span>
      )}
    </button>
  );
}
