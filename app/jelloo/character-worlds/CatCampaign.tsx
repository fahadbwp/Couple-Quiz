"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHARACTER_WORLDS, getEarnedStarsForWorld } from "@/lib/jelloo/campaign";
import {
  readCatSave,
  initializeCatSave,
  restoreCatGame,
  persistCatAttempt,
  isCatQualified,
  evaluateCatAccess,
  CAT_SAVE_KEY,
  type CatSave,
} from "@/lib/jelloo/campaign-v2/cat-save";
import { readBunnySave } from "@/lib/jelloo/campaign-v2/bunny-save";
import { readPandaSave } from "@/lib/jelloo/campaign-v2/panda-save";
import type { CatLevel } from "@/lib/jelloo/campaign-v2/cat-provider";
import {
  CAT_PATH,
  CAT_LEVELS_PATH,
  CAT_WORLDS_PATH,
  PANDA_LEVELS_PATH,
  catLevelHref,
} from "@/lib/jelloo/campaign-v2/routes";
import type { GameState } from "@/lib/jelloo/engine";
import { CatLevelTrail, CatWorldAtlas } from "./CatMaps";
import { SceneIcon } from "./BunnyMaps";
import { catResume, catScreen } from "@/lib/jelloo/campaign-v2/cat-entry";
import { CandyPuzzle } from "./CharacterWorlds";
import css from "./worlds.module.css";
import scene from "./scene.module.css";

type Snapshot = { save: CatSave; raw: string };
const href = (id: number) => catLevelHref(id);

export default function CatCampaign({ levels }: { levels: CatLevel[] }) {
  const router = useRouter(),
    query = useSearchParams();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const pending = useRef<Promise<boolean>>(Promise.resolve(true));
  const [bunnyStars, setBunnyStars] = useState(0);
  const [pandaStars, setPandaStars] = useState(0);
  const [lockedReason, setLockedReason] = useState("");

  const updateSnapshot = useCallback((value: Snapshot) => {
    snapshotRef.current = value;
    setSnapshot(value);
  }, []);

  const persistAttempt = useCallback(
    (game: GameState) => {
      pending.current = pending.current.then(async previousOkay => {
        if (!previousOkay || !snapshotRef.current) return false;
        try {
          if (!navigator.locks) throw new Error("This browser cannot safely coordinate progress saving.");
          return await navigator.locks.request("jelloo-cat6x4-save", () => {
            const current = snapshotRef.current!;
            const result = persistCatAttempt(localStorage, current.save, current.raw, game);
            if (result.success) {
              updateSnapshot({ save: result.save, raw: result.raw });
              return true;
            }
            setError(result.error);
            return false;
          });
        } catch {
          setError("Your puzzle could not be saved safely. Existing adventures are preserved.");
          return false;
        }
      });
      return pending.current;
    },
    [updateSnapshot]
  );

  const [loaded, setLoaded] = useState(false),
    [error, setError] = useState("");
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    let active = true;

    void (async () => {
      try {
        const gate = isCatQualified(localStorage);
        if (!gate.qualified) {
          if (active) {
            setLockedReason(
              gate.details ??
                "Cat's Cozy Rooftops requires completing Panda Level 100 with at least 120 Panda stars."
            );
            setLoaded(true);
          }
          return;
        }

        const bunnyRead = readBunnySave(localStorage);
        if (bunnyRead.status === "ready") {
          setBunnyStars(getEarnedStarsForWorld(CHARACTER_WORLDS[0], bunnyRead.save.best));
        }

        const pandaRead = readPandaSave(localStorage);
        if (pandaRead.status === "ready") {
          setPandaStars(getEarnedStarsForWorld(CHARACTER_WORLDS[1], pandaRead.save.best));
        }

        const read = readCatSave(localStorage);
        if (read.status === "ready") {
          if (active) updateSnapshot({ save: read.save, raw: read.raw });
        } else if (read.status === "missing") {
          if (!navigator.locks) throw new Error("Safe saving unavailable");
          const result = await navigator.locks.request("jelloo-cat6x4-save", () =>
            initializeCatSave(localStorage)
          );
          if (active) {
            if (result.success) updateSnapshot({ save: result.save, raw: result.raw });
            else setError(result.error);
          }
        } else if (active) {
          setError("Saved Cat progress needs attention. Your data has been preserved.");
        }
      } catch {
        if (active) setError("Progress cannot be saved in this browser.");
      }
      if (active) setLoaded(true);
    })();

    return () => {
      active = false;
      media.removeEventListener("change", update);
    };
  }, [updateSnapshot]);

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (snapshotRef.current && (event.key === CAT_SAVE_KEY || event.key === null)) {
        setError("Progress changed in another tab. Refresh to load it before continuing.");
      }
    };
    addEventListener("storage", changed);
    return () => removeEventListener("storage", changed);
  }, []);

  const requested = query.get("level"),
    selectedView = query.get("view");
  const resume = snapshot ? catResume(snapshot.save) : null;
  const { view, level: id, canonicalize: openingLevel } = catScreen(resume, requested, selectedView);
  const level = levels.find(item => item.id === id);
  const access = snapshot ? evaluateCatAccess(id, snapshot.save.completed, snapshot.save.best) : null;
  const restored = snapshot ? restoreCatGame(snapshot.save) : null;
  const stars = snapshot ? getEarnedStarsForWorld(CHARACTER_WORLDS[2], snapshot.save.best) : 0;

  useEffect(() => {
    if (view !== "levels") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [view, id]);

  const entryLevel = resume?.view === "play" ? resume.level : null;
  useEffect(() => {
    if (loaded && openingLevel && entryLevel !== null) router.replace(href(entryLevel), { scroll: false });
  }, [loaded, openingLevel, entryLevel, router]);

  return (
    <main className={`${css.page} ${scene.scene}`} data-view={view} data-world="cat">
      <header className={scene.hud}>
        <Link href="/games" className={scene.iconButton} aria-label="All games">
          <SceneIcon name="home" />
        </Link>
        <Link href={CAT_PATH} className={scene.brand}>
          Jelloo<span>✦</span>
        </Link>
        <nav aria-label="Adventure navigation">
          <Link
            href={CAT_LEVELS_PATH}
            aria-current={view === "levels" ? "page" : undefined}
            className={scene.iconButton}
            aria-label="Levels"
          >
            <SceneIcon name="levels" />
          </Link>
          <Link
            href={CAT_WORLDS_PATH}
            aria-current={view === "worlds" ? "page" : undefined}
            className={scene.iconButton}
            aria-label="Worlds"
          >
            <SceneIcon name="worlds" />
          </Link>
        </nav>
      </header>

      {error ? (
        <section role="alert" className={css.notice}>
          <h1>Progress needs attention</h1>
          <p>{error}</p>
          <button onClick={() => location.reload()}>Reload</button>
        </section>
      ) : lockedReason ? (
        <section className={scene.locked} role="alert">
          <SceneIcon name="lock" />
          <h1>Cozy Rooftops is Locked</h1>
          <p>{lockedReason}</p>
          <Link href={PANDA_LEVELS_PATH}>Go to Bamboo Jungle →</Link>
        </section>
      ) : !loaded || !snapshot || openingLevel ? (
        <div className={scene.loading} role="status" aria-label="Opening game">
          <span>🐱</span>
        </div>
      ) : view === "levels" ? (
        <CatLevelTrail save={snapshot.save} stars={stars} />
      ) : view === "worlds" ? (
        <CatWorldAtlas save={snapshot.save} stars={stars} bunnyStars={bunnyStars} pandaStars={pandaStars} />
      ) : access?.accessible && level ? (
        <div className={scene.play}>
          <div className={scene.levelBadge}>
            Cat <span>·</span> {id}
            <span className={scene.gold}>★ {stars}</span>
          </div>
          <CandyPuzzle
            key={id}
            level={level}
            snapshot={snapshot}
            reduced={reduced}
            onWin={() => false}
            persistAttempt={persistAttempt}
            modern
            compact
            basePath={CAT_LEVELS_PATH}
            restore={restored?.level.id === id ? restored : undefined}
            next={() => router.push(id < 150 ? href(id + 1) : CAT_WORLDS_PATH)}
          />
        </div>
      ) : (
        <section className={scene.locked}>
          <SceneIcon name="lock" />
          <h1>Level {Number.isFinite(id) ? id : "?"}</h1>
          <p>{access && !access.accessible ? access.details : "Unavailable"}</p>
          <Link href={CAT_LEVELS_PATH}>Levels</Link>
        </section>
      )}
    </main>
  );
}
