"use client";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {useCallback, useEffect, useRef, useState} from "react";
import {CHARACTER_WORLDS, getEarnedStarsForWorld, LOCAL_STAR_GATES} from "@/lib/jelloo/campaign";
import {initializeCampaignV2, readCampaignV2Save, type CharacterWorldsSave} from "@/lib/jelloo/campaign-save";
import {previewAccess, persistPreviewWin} from "@/lib/jelloo/campaign-v2/preview-session";
import type {ResolvedWorld1Level} from "@/lib/jelloo/campaign-v2/world1-provider";
import {gameReducer, initialGame, ports, tracePath, type Action, type GameState} from "@/lib/jelloo/engine";
import {BUNNY_PATH,PREVIOUS_WORLD_PATH,worldLevelHref} from "@/lib/jelloo/campaign-v2/routes";
import {dimensions} from "@/lib/jelloo/grid";
import {bunnyScore} from "@/lib/jelloo/campaign-v2/bunny-provider";
import {collectedStars, scoreRun} from "@/lib/jelloo/scoring";
import CharacterSprite from "../CharacterSprite";
import css from "./worlds.module.css";

type Snapshot = {save: CharacterWorldsSave; raw: string};
const href = (id: number) => worldLevelHref(id,true);
export default function CharacterWorlds({levels}: {levels: ResolvedWorld1Level[]}) {
  const router = useRouter(), query = useSearchParams();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  const [canStart, setCanStart] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches); update(); media.addEventListener("change", update);
    try {
      const read = readCampaignV2Save(localStorage);
      if (read.status === "ready") setSnapshot({save: read.save, raw: read.raw});
      else if (read.status === "missing") setCanStart(true);
      else setError("Your Character Worlds save cannot be opened safely. It has been preserved. No progress was reset.");
    } catch { setError("Browser storage is unavailable. Progress cannot be saved safely."); }
    setLoaded(true);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === "jelloo.campaign.v2" || event.key === null) setError("Progress changed in another tab. Refresh to load it before continuing.");
    };
    addEventListener("storage", changed); return () => removeEventListener("storage", changed);
  }, []);
  function start() {
    try {
      const result = initializeCampaignV2(localStorage);
      if (result.success) {setSnapshot({save: result.save, raw: result.raw}); setCanStart(false);}
      else setError(result.error);
    } catch {setError("Browser storage is unavailable. Your existing saves are untouched.");}
  }
  const requested = query.get("level");
  const id = requested && /^[1-9]\d*$/.test(requested) ? Number(requested) : NaN;
  const level = levels.find(item => item.id === id);
  const access = snapshot && requested ? previewAccess(id, snapshot.save) : null;
  const stars = snapshot ? getEarnedStarsForWorld(CHARACTER_WORLDS[0], snapshot.save.best) : 0;
  return <main className={css.page}><div className={css.shell}>
    <header className={css.header}><Link href="/jelloo">← Jelloo</Link><b>Jelloo<span> worlds.</span></b><span className={css.preview}>LOCAL PREVIEW</span></header>
    <p className={css.note}><Link href={BUNNY_PATH}>New 4×4 Bunny adventure →</Link> · Previous progress stays safe.</p>
    {error ? <section role="alert" className={css.notice}><h1>Progress needs attention</h1><p>{error}</p><button onClick={() => location.reload()}>Reload saved progress</button></section> : !loaded ? <p role="status">Opening your adventure…</p> : !snapshot ? <section className={css.welcome}>
      <div className={css.portrait}><CharacterSprite character="bunny" animate={!reduced}/></div>
      <p className={css.eyebrow}>A NEW LITTLE ADVENTURE</p><h1>A sweeter path home.</h1>
      <p>50 Candy Land puzzles, one bouncy Bunny. Collect stars, unlock new paths and find Strawberry Cottage.</p>
      <p className={css.note}>This starts a separate Character Worlds save. Your original Adventure progress stays safe.</p>
      {canStart && <button className={css.primary} onClick={start}>Start Candy Land →</button>}
    </section> : requested ? access?.accessible && level ? <CandyPuzzle key={id} level={level} snapshot={snapshot} reduced={reduced}
      onWin={game => {
        try {
          const result = persistPreviewWin(localStorage, snapshot.save, snapshot.raw, game);
          if (result.success) setSnapshot({save: result.save, raw: result.raw}); else setError(result.error);
          return result.success;
        } catch {setError("Your result could not be saved. Existing progress has been preserved; reload before continuing."); return false;}
      }} basePath={PREVIOUS_WORLD_PATH} next={() => router.push(id < 50 ? href(id + 1) : PREVIOUS_WORLD_PATH)}/>
      : <section className={css.notice}><h1>This path is still locked</h1><p>{access && !access.accessible ? access.details : "Choose a level from 1 to 50."}</p><Link href={PREVIOUS_WORLD_PATH}>Return to Candy Land map →</Link></section>
      : <>
        <section className={css.hero}><div><p className={css.eyebrow}>WORLD 01 · BUNNY’S ADVENTURE</p><h1>Pink Candy Land</h1><p>Follow the frosting paths.<br/>A strawberry-sweet home is waiting.</p>
          <div className={css.stats}><span><b>{Math.min(snapshot.save.completed, 50)}</b> / 50 levels</span><span><b>★ {stars}</b> / 150 stars</span></div>
          {snapshot.save.completed < 50 && previewAccess(snapshot.save.completed + 1, snapshot.save).accessible ? <Link className={css.primary} href={href(snapshot.save.completed + 1)}>Continue · Level {snapshot.save.completed + 1} →</Link> : <p className={css.note}>{snapshot.save.completed >= 50 ? "Candy Land complete! Replay to collect every star." : "Collect more stars by replaying earlier levels to open the next gate."}</p>}
        </div><div className={css.heroArt} aria-hidden="true"><span className={css.candy}>✦</span><div className={css.portrait}><CharacterSprite character="bunny" animate={!reduced}/></div><span className={css.sweet}>♥</span></div></section>
        <section aria-label="Candy Land levels" className={css.map}>
          {Array.from({length: 5}, (_, band) => {
            const end = (band + 1) * 10, required = LOCAL_STAR_GATES[end];
            const earned = Object.entries(snapshot.save.best).reduce((sum, [key, value]) => Number(key) < end ? sum + value : sum, 0);
            return <section key={band} className={css.chapter} aria-labelledby={`chapter-${band}`}><div className={css.chapterHeading}><h2 id={`chapter-${band}`}>{["First sweet steps", "Twisting sugar trails", "Confectionery mazes", "Candy labyrinths", "The cottage is calling"][band]}</h2><span>Gate {end} · {Math.min(earned, required)}/{required} ★</span></div>
              <div className={css.levelGrid}>{levels.slice(band * 10, end).map(item => {
                const state = previewAccess(item.id, snapshot.save), best = snapshot.save.best[String(item.id)] ?? 0, current = item.id === snapshot.save.completed + 1;
                const label = `Level ${item.id}, ${best} of 3 stars${current ? ", current level" : ""}${!state.accessible ? `, locked. ${state.details}` : ""}`;
                const content = <><b>{item.id === 50 ? "⌂ " : ""}{item.id}</b><span aria-hidden="true">{best ? "★".repeat(best) + "☆".repeat(3 - best) : state.accessible ? "☆☆☆" : "Locked"}</span>{current && <small>YOU ARE HERE</small>}</>;
                return state.accessible ? <Link key={item.id} href={href(item.id)} aria-label={label} aria-current={current ? "step" : undefined} className={css.level} data-complete={best > 0}>{content}</Link> : <button key={item.id} className={css.level} disabled aria-label={label}>{content}</button>;
              })}</div></section>;
          })}
        </section>
        <section className={css.nextWorld}><span aria-hidden="true">🎋</span><div><h2>Next stop: Bamboo Jungle</h2><p>Finish Level 50 and earn 120 Candy Land stars to qualify for Panda’s world.</p><strong>{stars >= 120 && snapshot.save.completed >= 50 ? "Qualified · Coming in a later batch" : "Coming in a later batch · 50 new levels"}</strong></div></section>
      </>}
    <footer className={css.footer}>Saved in this browser · Character Worlds local preview<br/>Worlds 2–5 are still in development.</footer>
  </div></main>;
}

export function CandyPuzzle({level, snapshot, reduced, onWin, next, basePath="/jelloo/character-worlds", restore, persistAttempt, modern=false}: {level: Omit<ResolvedWorld1Level,"generatorVersion"> & {generatorVersion:string}; snapshot: Snapshot; reduced: boolean; onWin: (game: GameState) => boolean; next: () => void; basePath?:string;restore?:GameState;persistAttempt?:(game:GameState)=>Promise<boolean>;modern?:boolean}) {
  const [game, setGame] = useState(() => restore ?? initialGame(level));
  const live = useRef(game), heading = useRef<HTMLHeadingElement>(null);
  const resultDialog = useRef<HTMLDialogElement>(null);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [resultSaved, setResultSaved] = useState(restore?.status === "won");
  const publish = useCallback((previous:GameState,result:GameState) => {
    live.current=result;setGame(result);
    if(persistAttempt) {void persistAttempt(result).then(saved=>{if(result.status==="won")setResultSaved(saved)});}
    else if(result.status==="won"&&previous.status!=="won")setResultSaved(onWin(result));
  },[onWin,persistAttempt]);
  function act(action: Action) {
    if (action.type === "reset") {setResultDismissed(false); setResultSaved(false);}
    const previous = live.current, result = gameReducer(previous, action);
    publish(previous,result);
  }
  // Match Adventure: a connected path starts after a short, cancellable pause.
  useEffect(() => {
    if (game.status !== "editing" || tracePath(game.level, game.tiles).outcome !== "home") return;
    const timer = setTimeout(() => {
      const result = gameReducer(live.current, {type: "auto", runId: game.runId, moves: game.moves});
      publish(live.current,result);
    }, 250);
    return () => clearTimeout(timer);
  }, [game,publish]);
  useEffect(() => {
    if (game.status !== "running") return;
    const timer = setTimeout(() => {
      const previous = live.current, result = gameReducer(previous, {type: "tick", runId: game.runId});
      publish(live.current,result);

    }, reduced ? 40 : 340);
    return () => clearTimeout(timer);
  }, [game, reduced, publish]);
  const showResult = !resultDismissed && (game.status === "lost" || (game.status === "won" && resultSaved));
  useEffect(() => {
    const dialog = resultDialog.current;
    if (!dialog) return;
    if (!showResult) {if (dialog.open) dialog.close(); return;}
    if (!dialog.open) dialog.showModal();
    heading.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {document.body.style.overflow = previousOverflow;};
  }, [showResult]);
  const {status, tiles, trace, cursor} = game, score = modern ? bunnyScore(game) : scoreRun(game);
  const grid=dimensions(level);
  const pos = trace?.path[cursor] ?? level.start, collected = collectedStars(game);
  const canEdit = status === "editing" || status === "blocked";
  const nextAccess = level.id < 50 ? previewAccess(level.id + 1, snapshot.save) : null;
  const world = CHARACTER_WORLDS.find(item => item.id === level.characterWorldId);
  const activeCharacter = world?.mascot ?? level.character ?? "bunny";
  return <>
    <nav className={css.gameNav}><Link href={basePath}>← Candy Land map</Link><span>🐰 Bunny · Level {level.id} / 50</span></nav>
    <section className={css.puzzle}><div className={css.puzzleHeading}><div><p className={css.eyebrow}>PINK CANDY LAND</p><h1>{level.title}</h1></div><div className={css.moves}><b>{game.moves} / {level.moveLimit}</b><span>moves</span></div></div>
      <p className={css.hint}>{level.hint}</p>
      <div className={css.garden}><div className={css.board} style={{gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`}} role="group" aria-label={`Level ${level.id} puzzle, ${grid.rows} rows by ${grid.columns} columns`}>
        {tiles.map((tile, index) => {
          const editable = ["straight", "corner", "tee"].includes(tile.kind) && !tile.locked;
          const path = tile.kind === "straight" ? "M0 50H100" : tile.kind === "corner" ? "M50 0V36Q50 50 64 50H100" : tile.kind === "tee" ? "M0 50H100M50 50V0" : "M50 50V0";
          const art = tile.kind !== "blank" && <svg viewBox="0 0 100 100" aria-hidden="true" style={{transform: `rotate(${(editable || tile.locked ? tile.rotation : tile.port ?? 0) * 90}deg)`}}><path className={css.roadRim} d={path}/><path className={css.roadEdge} d={path}/><path d={path}/></svg>;
          return <div key={index} className={css.cell} data-gap={tile.terrain === "gap"} data-visited={trace?.path.slice(0, cursor + 1).includes(index)}>
            {editable ? <button disabled={!canEdit} onClick={() => act({type: "rotate", index})} aria-label={`Row ${Math.floor(index / grid.columns) + 1}, column ${index % grid.columns + 1}, ${tile.kind}, connects ${ports(tile).map(d => ["up", "right", "down", "left"][d]).join(" and ")}. Rotate clockwise${level.collectibles?.includes(index) ? ". Golden star" : ""}`}>{art}</button> : art}
            {tile.terrain !== "gap" && tile.kind !== "home" && tile.kind !== "start" && <span className={css.tileDecor} aria-hidden="true">{index % 3 === 0 ? <svg viewBox="0 0 40 40"><ellipse cx="12" cy="23" rx="6" ry="12" fill="#72ba32" transform="rotate(-35 12 23)"/><ellipse cx="22" cy="16" rx="6" ry="12" fill="#a2d742" transform="rotate(15 22 16)"/><ellipse cx="27" cy="25" rx="6" ry="11" fill="#5da02c" transform="rotate(45 27 25)"/><path d="M18 32L23 11" stroke="#d7ef77" strokeWidth="1.5"/></svg> : <svg viewBox="0 0 40 40"><g fill="#fff9ed" stroke="#f4d3cc" strokeWidth=".6"><ellipse cx="20" cy="11" rx="6" ry="8"/><ellipse cx="29" cy="18" rx="8" ry="6"/><ellipse cx="25" cy="28" rx="6" ry="8" transform="rotate(-30 25 28)"/><ellipse cx="14" cy="28" rx="6" ry="8" transform="rotate(30 14 28)"/><ellipse cx="10" cy="18" rx="8" ry="6"/></g><circle cx="20" cy="20" r="5.5" fill="#ffc64c"/><circle cx="19" cy="18" r="2" fill="#ffe89d"/></svg>}</span>}
            {tile.terrain === "gap" && <span className={css.gap}>GAP</span>}
            {level.collectibles?.includes(index) && <span className={css.star} data-collected={collected.includes(index)} role="img" aria-label={collected.includes(index) ? "Star collected" : "Golden star collectible"}>
              <svg viewBox="0 0 72 80" aria-hidden="true">
                <defs><linearGradient id={`gold-${index}`} x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#fff8bf"/><stop offset=".32" stopColor="#ffe55a"/><stop offset=".67" stopColor="#ffbf25"/><stop offset="1" stopColor="#f38a0b"/></linearGradient><radialGradient id={`aura-${index}`}><stop stopColor="#fff6a9" stopOpacity=".85"/><stop offset="1" stopColor="#ffdc66" stopOpacity="0"/></radialGradient></defs>
                <circle className={css.collectibleAura} cx="36" cy="36" r="35" fill={`url(#aura-${index})`}/>
                <ellipse className={css.collectibleShadow} cx="36" cy="71" rx="17" ry="4"/>
                <g className={css.collectibleGem}>
                  <path className={css.goldDepth} d="M32 9Q36 2 40 9L47 24L63 27Q71 28 65 35L53 47L55 64Q56 72 49 68L36 60L22 68Q15 72 17 64L19 47L7 35Q1 28 9 27L25 24Z" transform="translate(0 4)"/>
                  <path className={css.goldFace} style={{fill:`url(#gold-${index})`}} d="M32 9Q36 2 40 9L47 24L63 27Q71 28 65 35L53 47L55 64Q56 72 49 68L36 60L22 68Q15 72 17 64L19 47L7 35Q1 28 9 27L25 24Z"/>
                  <path className={css.goldFacet} d="M36 10L36 37L12 31L28 29Z"/>
                  <path className={css.goldShine} d="M32 16L28 26M13 32L22 34"/>
                  <path className={css.goldSpark} d="M57 7L59 13L65 15L59 17L57 23L55 17L49 15L55 13Z"/>
                  <path className={css.goldSparkSmall} d="M10 48L11.5 52L16 53.5L11.5 55L10 59L8.5 55L4 53.5L8.5 52Z"/>
                </g>
              </svg>
            </span>}
            {tile.locked && tile.kind !== "start" && tile.kind !== "home" && <span className={css.lock} aria-label="Fixed tile">●</span>}
            {tile.kind === "start" && <span className={css.marker}>START</span>}
            {tile.kind === "home" && <><span className={css.cottage} role="img" aria-label="Strawberry Cottage"></span><span className={css.marker}>HOME</span></>}
          </div>;
        })}
        <div className={css.traveller} data-motion={!reduced} style={{left: `${(pos % grid.columns + .5) / grid.columns * 100}%`, top: `${(Math.floor(pos / grid.columns) + .5) / grid.rows * 100}%`, width: `${78 / grid.columns}%`}}><CharacterSprite character="bunny" status={status} animate={!reduced} powerActive={status === "running" && cursor > 0 && Math.abs((trace?.path[cursor] ?? 0) - (trace?.path[cursor - 1] ?? 0)) > 1 && Math.abs((trace?.path[cursor] ?? 0) - (trace?.path[cursor - 1] ?? 0)) !== grid.columns}/></div>
      </div></div>
      <p role="status" className={css.feedback}>{status === "blocked" ? "A little gap in the path! Rotate a tile and try again." : status === "running" ? "Hop, hop… almost home!" : status === "lost" ? "Out of moves. A fresh start is waiting." : status === "won" ? "Home sweet home!" : "Connect the path — Bunny hops home automatically! Each turn uses one move."}</p>
      {(status === "won" || status === "lost") && resultDismissed && <button className={css.primary} onClick={() => setResultDismissed(false)}>Show result</button>}
      <dialog ref={resultDialog} className={css.resultModal} aria-labelledby="result-title" aria-describedby="result-description" onCancel={() => setResultDismissed(true)}>
        <div className={css.result}>
          <button className={css.closeResult} aria-label="Close result" onClick={() => setResultDismissed(true)}>×</button>
          <div className={css.resultPal}><CharacterSprite character={activeCharacter} status={status === "won" ? "won" : "lost"} animate={!reduced}/></div>
          <p className={css.eyebrow}>{status === "won" ? "HOME SWEET HOME" : "ONE MORE LITTLE ADVENTURE"}</p>
          <h2 ref={heading} tabIndex={-1} id="result-title">{status === "won" ? "Sweet! You made it home." : "Out of moves? Try a fresh path."}</h2>
          {status === "won" ? <><p className={css.resultStars} aria-label={`${score.stars} out of 3 stars`}>{"★".repeat(score.stars)}{"☆".repeat(3 - score.stars)}</p><p id="result-description">{game.moves} moves · {score.collected}/{score.total} golden stars collected</p>{resultSaved && <p>Your best result has been saved.</p>}</> : <p id="result-description">Almost there! Your pal is ready to try again.<br/>{game.moves} / {level.moveLimit} moves used.</p>}
          <div className={css.modalActions}>
            {status === "won" && nextAccess?.accessible ? <button className={css.primary} onClick={next}>Next Level →</button> : <button className={css.primary} onClick={() => act({type: "reset"})}>Try again</button>}
            <div className={css.controls}>{status === "won" && nextAccess?.accessible && <button onClick={() => act({type: "reset"})}>Replay</button>}<Link href={basePath}>Level map</Link></div>
          </div>
          {status === "won" && !nextAccess?.accessible && <p>{level.id === 50 ? "Candy Land complete! Panda’s world is coming in the next batch." : "The next star gate needs more stars. Replay earlier levels from the map."}</p>}
        </div>
      </dialog>
      <p className={css.note}>{modern ? "Your puzzle and stars are saved. You can continue after a refresh." : "Completed levels and stars are saved. Refreshing an unfinished puzzle restarts that board."}</p>
    </section>
  </>;
}
