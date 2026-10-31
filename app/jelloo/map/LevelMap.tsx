"use client";

import JellooAdsterraBanner from "@/components/ads/JellooAdsterraBanner";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { worlds, worldForLevel } from "@/lib/jelloo/worlds";
import { SAVE_KEY } from "@/lib/jelloo/progress";
import { readAdventureProgress } from "@/lib/jelloo/saved-progress";
import { pals } from "@/lib/jelloo/pals";
import styles from "./map.module.css";

type LevelStatus = "completed" | "current" | "locked";

interface LevelInfo {
  id: number;
  status: LevelStatus;
  stars: number; // 0-3
}

function levelStatus(id: number, completed: number): LevelStatus {
  if (id <= completed) return "completed";
  if (id === completed + 1) return "current";
  return "locked";
}

export default function LevelMap() {
  const router = useRouter();
  const [completed, setCompleted] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  const [error, setError] = useState<string | null>(null);
  function refreshProgress() {
    const p = readAdventureProgress(() => localStorage.getItem(SAVE_KEY));
    setError(p.status === "ready" ? null : p.message);
    setReady(p.status === "ready");
    if (p.status === "ready") { setCompleted(p.completed); setBest(p.best); }
  }
  useEffect(() => { refreshProgress(); }, []);

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

  // Current level info
  const currentLevelId = Math.min(100, completed + 1);
  const currentWorld = worldForLevel(currentLevelId);

  function navigateToLevel(id: number, status: LevelStatus) {
    if (status === "locked") return;
    router.push(`/jelloo?level=${id}`);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/games" className={styles.back}>
            ← All Games
          </Link>
          <h1 className={styles.brand}>Jelloo<span>.</span></h1>
          <Link href="/" className={styles.homeLink}>
            PlayNudge Home
          </Link>
        </header>

        <div style={{
          background: "linear-gradient(135deg, #ff758c 0%, #ff7eb3 50%, #7028e4 100%)",
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          margin: "1rem 0 1.5rem",
          color: "white",
          boxShadow: "0 10px 25px rgba(255, 117, 140, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: "99px" }}>
              ✨ NEW CAMPAIGN LIVE
            </span>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0.4rem 0 0.2rem", color: "#ffffff" }}>
              Character Worlds (Bunny, Panda & Cat)
            </h3>
            <p style={{ margin: 0, opacity: 0.95, fontSize: "0.9rem", color: "#ffffff" }}>
              150 all-new puzzles across Pink Candy Land, Bamboo Jungle &amp; Cozy Rooftops!
            </p>
          </div>
          <Link
            href="/jelloo/character-worlds"
            style={{
              background: "#ffffff",
              color: "#d94f70",
              fontWeight: 800,
              padding: "0.75rem 1.4rem",
              borderRadius: "999px",
              textDecoration: "none",
              fontSize: "0.95rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            Play New Worlds →
          </Link>
        </div>

        <div className={styles.titleRow}>
          <div>
            <h2 className={styles.title}>🗺️ Adventure Map</h2>
            <p className={styles.subtitle}>
              Choose any unlocked level to play or replay.
            </p>
          </div>
          {ready && (
            <div className={styles.progressBadge}>
              <strong>{completed}/100</strong>
              <span>completed</span>
            </div>
          )}
        </div>

        {ready && (
          <div className={styles.continueCard}>
            <div className={styles.continueMeta}>
              <span className={styles.continueWorld}>{currentWorld.badge} {currentWorld.name}</span>
              <strong className={styles.continueTitle}>
                {completed >= 100 ? "Adventure Completed!" : `Level ${currentLevelId}`}
              </strong>
              <span className={styles.continueSub}>
                {completed >= 100
                  ? "Explore Endless mode or replay any past level for 3 stars."
                  : `Your next unsolved puzzle · ${currentWorld.tagline}`}
              </span>
            </div>
            <button
              type="button"
              className={styles.continueButton}
              onClick={() => navigateToLevel(completed >= 100 ? 100 : currentLevelId, "current")}
            >
              {completed >= 100 ? "Replay Level 100 →" : `Continue Level ${currentLevelId} →`}
            </button>
          </div>
        )}

        <nav className={styles.modeNav} aria-label="Other game modes">
          <Link href="/jelloo/daily" className={styles.modeLink} data-mode="daily">
            <span className={styles.modeIcon}>📅</span>
            <div className={styles.modeInfo}>
              <b>Daily Puzzle →</b>
              <span>Daily challenge</span>
            </div>
          </Link>
          <Link href="/jelloo/zen" className={styles.modeLink} data-mode="zen">
            <span className={styles.modeIcon}>🌸</span>
            <div className={styles.modeInfo}>
              <b>Zen Garden →</b>
              <span>Relaxed play</span>
            </div>
          </Link>
          <Link href="/jelloo/pals" className={styles.modeLink} data-mode="pals">
            <span className={styles.modeIcon}>🐾</span>
            <div className={styles.modeInfo}>
              <b>Meet Pals →</b>
              <span>{ready ? `${pals.filter(p => p.unlock <= completed).length}/5 unlocked` : "Pal powers"}</span>
            </div>
          </Link>
        </nav>

        {error && (
          <section className={styles.continueCard} role="alert">
            <div><h3>Progress unavailable</h3><p>{error}</p>
              <p>Your saved data has not been changed. Check again after restoring a valid save or allowing browser storage.</p>
              <button type="button" className={styles.continueButton} onClick={refreshProgress}>Check again</button>
            </div>
          </section>
        )}
        {!ready && !error && (
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
                role="group"
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
                  type="button"
                  className={styles.endlessButton}
                  onClick={() => router.push(`/jelloo?level=${endlessNext}`)}
                >
                  Continue from Level {endlessNext} →
                </button>
              </div>
            )}
          </section>
        )}

      </div>
      <JellooAdsterraBanner placement="jelloo-after-result" phase="idle" />
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
        role="group"
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
      type="button"
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
