"use client";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {useCallback,useEffect,useRef,useState} from "react";
import {CHARACTER_WORLDS,getEarnedStarsForWorld,LOCAL_STAR_GATES} from "@/lib/jelloo/campaign";
import {previewAccess} from "@/lib/jelloo/campaign-v2/preview-session";
import {readBunnySave,initializeBunnySave,restoreBunnyGame,persistBunnyAttempt,BUNNY_SAVE_KEY,type BunnySave} from "@/lib/jelloo/campaign-v2/bunny-save";
import type {BunnyLevel} from "@/lib/jelloo/campaign-v2/bunny-provider";
import type {GameState} from "@/lib/jelloo/engine";
import CharacterSprite from "../CharacterSprite";
import {CandyPuzzle} from "./CharacterWorlds";
import css from "./worlds.module.css";
type Snapshot = {save: BunnySave; raw: string};
const basePath="/jelloo/character-worlds/bunny";
const href = (id: number) => `${basePath}?level=${id}`;
export default function BunnyCampaign({levels}: {levels: BunnyLevel[]}) {
  const router = useRouter(), query = useSearchParams();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const snapshotRef=useRef<Snapshot|null>(null);
  const pending=useRef<Promise<boolean>>(Promise.resolve(true));
  const updateSnapshot=useCallback((value:Snapshot)=>{snapshotRef.current=value;setSnapshot(value)},[]);
  const persistAttempt=useCallback((game:GameState)=>{
    pending.current=pending.current.then(async previousOkay=>{
      if(!previousOkay||!snapshotRef.current)return false;
      try {
        if(!navigator.locks)throw new Error("This browser cannot safely coordinate progress saving.");
        return await navigator.locks.request("jelloo-bunny4-save",()=>{
          const current=snapshotRef.current!;
          const result=persistBunnyAttempt(localStorage,current.save,current.raw,game);
          if(result.success){updateSnapshot({save:result.save,raw:result.raw});return true}
          setError(result.error);return false;
        });
      }catch {setError("Your puzzle could not be saved safely. Existing adventures are preserved.");return false;}
    });
    return pending.current;
  },[updateSnapshot]);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  const [canStart, setCanStart] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches); update(); media.addEventListener("change", update);
    try {
      const read = readBunnySave(localStorage);
      if (read.status === "ready") updateSnapshot({save: read.save, raw: read.raw});
      else if (read.status === "missing") setCanStart(true);
      else setError("Your Character Worlds save cannot be opened safely. It has been preserved. No progress was reset.");
    } catch { setError("Browser storage is unavailable. Progress cannot be saved safely."); }
    setLoaded(true);
    return () => media.removeEventListener("change", update);
  }, [updateSnapshot]);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === BUNNY_SAVE_KEY || event.key === null) setError("Progress changed in another tab. Refresh to load it before continuing.");
    };
    addEventListener("storage", changed); return () => removeEventListener("storage", changed);
  }, []);
  async function start() {
    try {
      if(!navigator.locks)throw new Error("Safe saving requires Web Locks");
      const result=await navigator.locks.request("jelloo-bunny4-save",()=>initializeBunnySave(localStorage));
      if(result.success){updateSnapshot({save:result.save,raw:result.raw});setCanStart(false)}else setError(result.error);
    }catch{setError("This browser cannot start a safely saved adventure. Existing progress is preserved.")}
  }
  const requested = query.get("level");
  const id = requested && /^[1-9]\d*$/.test(requested) ? Number(requested) : NaN;
  const level = levels.find(item => item.id === id);
  const access = snapshot && requested ? previewAccess(id, snapshot.save) : null;
  const restored=snapshot?restoreBunnyGame(snapshot.save):null;
  const continueId=restored&&restored.status!=="won"?restored.level.id:(snapshot?.save.completed??0)+1;
  const stars = snapshot ? getEarnedStarsForWorld(CHARACTER_WORLDS[0], snapshot.save.best) : 0;
  return <main className={css.page}><div className={css.shell}>
    <header className={css.header}><Link href="/jelloo">← Jelloo</Link><b>Jelloo<span> worlds.</span></b><span className={css.preview}>LOCAL PREVIEW</span></header>
    {error ? <section role="alert" className={css.notice}><h1>Progress needs attention</h1><p>{error}</p><button onClick={() => location.reload()}>Reload saved progress</button></section> : !loaded ? <p role="status">Opening your adventure…</p> : !snapshot ? <section className={css.welcome}>
      <div className={css.portrait}><CharacterSprite character="bunny" animate={!reduced}/></div>
      <p className={css.eyebrow}>A NEW LITTLE ADVENTURE</p><h1>A sweeter path home.</h1>
      <p>50 Candy Land puzzles, one bouncy Bunny. Earn one star for getting home and up to two more from golden pickups.</p>
      <p className={css.note}>This starts the new 4×4 Bunny journey. Your previous adventures and earned stars stay safe.</p>
      {canStart && <button className={css.primary} onClick={start}>Start new Bunny adventure →</button>}
    </section> : requested ? access?.accessible && level ? <CandyPuzzle key={id} level={level} snapshot={snapshot} reduced={reduced}
      onWin={()=>false} persistAttempt={persistAttempt} modern basePath={basePath} restore={restored?.level.id===id?restored:undefined} next={() => router.push(id < 50 ? href(id + 1) : basePath)}/>

      : <section className={css.notice}><h1>This path is still locked</h1><p>{access && !access.accessible ? access.details : "Choose a level from 1 to 50."}</p><Link href={basePath}>Return to Candy Land map →</Link></section>
      : <>
        <section className={css.hero}><div><p className={css.eyebrow}>WORLD 01 · BUNNY’S ADVENTURE</p><h1>Pink Candy Land</h1><p>Follow the frosting paths.<br/>A strawberry-sweet home is waiting.</p>
          <div className={css.stats}><span><b>{Math.min(snapshot.save.completed, 50)}</b> / 50 levels</span><span><b>★ {stars}</b> / 150 stars</span></div>
          {snapshot.save.completed < 50 && previewAccess(continueId, snapshot.save).accessible ? <Link className={css.primary} href={href(continueId)}>Continue · Level {continueId} →</Link> : <p className={css.note}>{snapshot.save.completed >= 50 ? "Candy Land complete! Replay to collect every star." : "Collect more stars by replaying earlier levels to open the next gate."}</p>}
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
    <p className={css.note}><Link href="/jelloo/character-worlds">Previous adventure and saved stars →</Link></p>
    <footer className={css.footer}>Saved in this browser · New Bunny Adventure · 4×4<br/>Worlds 2–5 are still in development.</footer>
  </div></main>;
}

