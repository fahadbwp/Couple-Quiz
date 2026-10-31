"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CHARACTER_WORLDS, LOCAL_STAR_GATES, toLocalLevel } from "@/lib/jelloo/campaign";
import { evaluatePandaAccess, type PandaSave } from "@/lib/jelloo/campaign-v2/panda-save";
import { BUNNY_LEVELS_PATH, PANDA_LEVELS_PATH, PANDA_WORLDS_PATH, CAT_LEVELS_PATH, pandaLevelHref } from "@/lib/jelloo/campaign-v2/routes";
import CharacterSprite from "../CharacterSprite";
import { SceneIcon } from "./BunnyMaps";
import s from "./scene.module.css";

function point(index: number) {
  const stops = [
    { x: 62, y: 96 },
    { x: 180, y: 132 },
    { x: 298, y: 96 },
    { x: 298, y: 248 },
    { x: 180, y: 282 },
    { x: 62, y: 248 },
  ];
  const p = stops[index % 6];
  return { ...p, y: p.y + Math.floor(index / 6) * 310 };
}

const points = Array.from({ length: 50 }, (_, i) => point(i));
const path = points
  .map((p, i) => {
    if (!i) return `M${p.x} ${p.y}`;
    const a = points[i - 1],
      mid = (a.x + p.x) / 2;
    return a.x === p.x
      ? `C${a.x + 25} ${a.y + 55} ${p.x + 25} ${p.y - 55} ${p.x} ${p.y}`
      : `C${mid} ${a.y} ${mid} ${p.y} ${p.x} ${p.y}`;
  })
  .join(" ");
const height = Math.ceil(points.length / 6) * 310 + 20;

export function PandaLevelTrail({ save, stars }: { save: PandaSave; stars: number }) {
  const trailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    trailRef.current?.querySelector("[aria-current=step]")?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [save.completed]);

  return (
    <section ref={trailRef} className={s.levelScene} aria-label="Bamboo Jungle levels">
      <div className={s.mapHeading}>
        <Link href={PANDA_WORLDS_PATH} className={s.worldTitle}>
          Bamboo Jungle
        </Link>
        <span className={s.starCounter}>
          ★ {stars}
          <small>/150</small>
        </span>
      </div>
      <div className={s.trail} style={{ aspectRatio: `360 / ${height}` }}>
        <svg className={s.path} viewBox={`0 0 360 ${height}`} aria-hidden="true">
          <defs>
            <linearGradient id="bambooPath" x2="0" y2="1">
              <stop stopColor="#e8f8e0" />
              <stop offset="1" stopColor="#bce6ad" />
            </linearGradient>
          </defs>
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} transform={`translate(0 ${i * 310})`}>
              <path d="M18 72Q180 15 342 65L342 263Q185 320 18 267Z" fill="#78b371" />
              <path
                d="M18 60Q180 3 342 53L342 251Q185 308 18 255Z"
                fill={i % 2 ? "#b4e2ad" : "#a2d999"}
                stroke="#f0faec"
                strokeWidth="4"
              />
              {[25, 333].map((x, j) => (
                <g key={x} transform={`translate(${x} ${j ? 176 : 162})`}>
                  <path d="M0 0v35" stroke="#4d8246" strokeWidth="5" />
                  <circle r="15" fill="#58a84e" stroke="#e8fae4" strokeWidth="4" />
                  <path d="M-8-2Q0-12 7 0T-4 8" stroke="#d5f5ce" strokeWidth="3" fill="none" />
                </g>
              ))}
            </g>
          ))}
          <path d={path} stroke="#46883d55" strokeWidth="23" fill="none" />
          <path d={path} stroke="url(#bambooPath)" strokeWidth="15" fill="none" />
          <path d={path} stroke="#3b7a32" strokeWidth="3" strokeDasharray="1 12" strokeLinecap="round" fill="none" />
        </svg>
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={`bamboo-${i}`}
            className={s.mapSweet}
            style={{ left: `${i % 2 ? 87 : 3}%`, top: `${((i + 0.5) / 22) * 100}%` }}
            aria-hidden="true"
          >
            {i % 3 === 0 ? "🎋" : i % 3 === 1 ? "🍃" : "✦"}
          </span>
        ))}
        {points.map((p, index) => {
          const id = 51 + index;
          const access = evaluatePandaAccess(id, save.completed, save.best);
          const best = save.best[id] ?? 0;
          const current = id === Math.min(save.completed + 1, 100);
          const local = toLocalLevel(id);
          const quota = local ? LOCAL_STAR_GATES[local] : undefined;
          const label = `Level ${id}, ${best} of 3 stars${current ? ", current level" : ""}${
            !access.accessible ? `, locked. ${access.details}` : ""
          }`;
          const contents = (
            <>
              {current && (
                <span className={s.currentPal} aria-hidden="true">
                  <CharacterSprite character="panda" />
                </span>
              )}
              <span className={s.nodeFace}>
                {!access.accessible ? (
                  <span className={s.smallLock}>
                    <SceneIcon name="lock" />
                  </span>
                ) : null}
                <b>{id}</b>
              </span>
              <span className={s.nodeStars} aria-hidden="true">
                {"★".repeat(best)}
                <i>{"★".repeat(3 - best)}</i>
              </span>
              {!access.accessible && quota ? (
                <span className={s.gateCost} aria-hidden="true">
                  {quota} ★
                </span>
              ) : null}
            </>
          );
          const props = {
            className: s.node,
            style: { left: `${(p.x / 360) * 100}%`, top: `${(p.y / height) * 100}%` },
            "aria-label": label,
            "data-complete": best > 0,
            "data-current": current,
          };
          return access.accessible ? (
            <Link {...props} key={id} href={pandaLevelHref(id)} aria-current={current ? "step" : undefined}>
              {contents}
            </Link>
          ) : (
            <button {...props} key={id} disabled>
              {contents}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function IslandGround({ number }: { number: number }) {
  const colors = [
    ["#ffc5df", "#e97daa", "#fff1b6"],
    ["#abdc64", "#5baf64", "#78c6c9"],
    ["#ffd0a0", "#df9b77", "#c6b2f2"],
    ["#7ce6ef", "#438bce", "#d0aeff"],
    ["#ffc76f", "#c17d4e", "#f8e6aa"],
  ][number];
  return (
    <svg viewBox="0 0 400 220" className={s.islandGround} aria-hidden="true">
      <ellipse cx="200" cy="177" rx="172" ry="32" fill="#ffffff88" />
      <path
        d="m28 123 39-59 91-31 109 10 105 57-5 55-65 42-113 13-125-40Z"
        fill={colors[1]}
        stroke="#fff5df"
        strokeWidth="5"
      />
      <path d="m28 117 39-59 91-31 109 10 105 57-72 46-108 17-121-11Z" fill={colors[0]} />
      <path d="M77 113Q140 51 195 101T324 95" fill="none" stroke={colors[2]} strokeWidth="18" strokeLinecap="round" />
      <path
        d="M77 113Q140 51 195 101T324 95"
        fill="none"
        stroke="#fff8d7"
        strokeWidth="3"
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      {[70, 128, 276, 321].map((x, i) => (
        <g key={x} transform={`translate(${x},${i % 2 ? 55 : 96})`}>
          <path d="M0 0v30" stroke="#aa795b" strokeWidth="7" />
          <circle r="16" fill={colors[1]} />
          <circle cx="-10" cy="-6" r="13" fill={number === 0 ? "#ff90c3" : colors[0]} />
          <circle cx="9" cy="-10" r="13" fill={number === 0 ? "#fff1fa" : colors[1]} />
        </g>
      ))}
    </svg>
  );
}

export function PandaWorldAtlas({
  save,
  stars,
  bunnyStars = 120,
}: {
  save?: PandaSave;
  stars: number;
  bunnyStars?: number;
}) {
  return (
    <section className={s.atlas} aria-label="Game Map">
      <h1 className={s.atlasTitle}>Game Map</h1>
      <div className={s.islands}>
        <svg viewBox="0 0 400 1500" className={s.worldPath} preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M120 120C340 200 50 350 270 440S80 670 160 760S350 900 240 1070S120 1220 270 1380"
            stroke="#689d5f"
            strokeWidth="4"
            strokeDasharray="2 12"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {CHARACTER_WORLDS.map((world, i) => {
          const contents = (
            <>
              <IslandGround number={i} />
              <span className={s.islandPal}>
                <CharacterSprite character={world.mascot} />
              </span>
              <span className={s.islandLabel}>{world.name}</span>
              <span className={s.worldRange}>
                {world.startLevel}–{world.endLevel}
              </span>
              {i === 0 ? (
                <span className={s.islandProgress}>★ {bunnyStars}/150</span>
              ) : i === 1 ? (
                <span className={s.islandProgress}>★ {stars}/150</span>
              ) : i === 2 && save && save.completed >= 100 && stars >= 120 ? (
                <span className={s.islandProgress}>Enter</span>
              ) : (
                <span className={s.worldLock}>
                  <SceneIcon name="lock" />
                  <span>{i === 2 ? `${Math.min(save ? save.completed : 0, 100)}/100 · ${Math.min(stars, 120)}/120 ★` : "Soon"}</span>
                </span>
              )}
            </>
          );
          return i === 0 ? (
            <Link
              key={world.id}
              href={BUNNY_LEVELS_PATH}
              className={s.island}
              data-world={i}
              aria-label="Pink Candy Land, Levels 1 to 50"
            >
              {contents}
            </Link>
          ) : i === 1 ? (
            <Link
              key={world.id}
              href={PANDA_LEVELS_PATH}
              className={s.island}
              data-world={i}
              aria-label="Bamboo Jungle, Levels 51 to 100"
            >
              {contents}
            </Link>
          ) : i === 2 && save && save.completed >= 100 && stars >= 120 ? (
            <Link
              key={world.id}
              href={CAT_LEVELS_PATH}
              className={s.island}
              data-world={i}
              aria-label="Cozy Rooftops, Levels 101 to 150"
            >
              {contents}
            </Link>
          ) : (
            <div
              key={world.id}
              className={s.island}
              data-world={i}
              data-locked="true"
              aria-label={`${world.name}, locked, coming later`}
              role="group"
            >
              {contents}
            </div>
          );
        })}
      </div>
    </section>
  );
}
