"use client";
import type { CSSProperties, RefObject, ReactNode } from "react";
import { connectedPaths, ports } from "@/lib/jelloo/engine";
import { collectedStars, scoreRun } from "@/lib/jelloo/scoring";
import type { Journey, JourneyAction } from "@/lib/jelloo/progress";
import { levels } from "@/lib/jelloo/levels";
import CharacterSprite from "./CharacterSprite";
import { pals } from "@/lib/jelloo/pals";
import styles from "./game.module.css";

type Props = {
  powerMode?:boolean; extra?:ReactNode;
  journey:Journey; animate:boolean; preparing:boolean; generationError:string; saveMessage:string; reducedMotion:boolean;
  act:(action:JourneyAction)=>void;
  board:RefObject<HTMLDivElement|null>; resultDialog:RefObject<HTMLDialogElement|null>; winHeading:RefObject<HTMLHeadingElement|null>;
};
const directions=["up","right","down","left"];
export default function GameView({powerMode=false,extra,journey,animate,preparing,generationError,saveMessage,reducedMotion,act,board,resultDialog,winHeading}:Props) {
  const {game,completed,muted,motion,best}=journey;
  const {level,tiles,status,trace,cursor,moves}=game;
  const connected=(status==="running" || status==="won") && trace ? trace.path : connectedPaths(level,tiles).connected, collected=collectedStars(game), score=scoreRun(game);
  const position=trace?.path[cursor] ?? level.start;
  const pal=pals.find(p=>p.id===(level.character ?? "bunny"))!;
  const broken=trace?.states?.[cursor]?.broken ?? [];
  const recentLevels=Array.from({length:Math.min(20,Math.max(0,completed-9))},(_,i)=>completed+1-i).filter(id=>id>10);
  const nextMilestone=(Math.floor(completed/10)+1)*10;
  return <main className={`${styles.page} ${styles.compact}`} data-motion={animate}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <a href={powerMode ? "/jelloo" : "/quiz"} className={styles.back}>← {powerMode ? "Adventure" : "Home"}</a><h1 className={styles.brand}>Jelloo<span>.</span></h1>
        <button className={styles.sound} aria-pressed={muted} onClick={()=>act({type:"mute"})}>Sound: {muted ? "off" : "on"}</button>
      </header>
      <p className={styles.subtitle}>{powerMode ? pal.power : `Tiles ghumao, raasta jodo — ${pal.name} is ready!`}</p>
      {extra}
      {!powerMode ? <a className={styles.palsLink} href="/jelloo/pals"><b>Meet your pals →</b><span>{pals.filter(p=>p.unlock<=completed).length}/5 unlocked · Power challenges</span></a> : null}
      <section className={styles.gamePanel} aria-label="Jelloo puzzle" aria-busy={preparing}>
        <div className={styles.levelBar}><h2>{powerMode ? pal.name : "Level"} {level.id} <small>· {level.difficulty}</small></h2><span><b>{moves}</b> moves {level.moveLimit===undefined ? <small>· Take your time ♡</small> : <small>/ limit {level.moveLimit} · {Math.max(0,level.moveLimit-moves)} left</small>}</span></div>
        {level.intro ? <div className={styles.introWelcome}><span className={styles.introPortrait}><CharacterSprite character={level.character} animate={animate}/></span><b>Hello, {pal.name}! ♡</b><span aria-label="No move limit">∞</span></div> : null}
        {level.fork ? <fieldset className={styles.branchChoice}><legend>Fox: choose your branch before the last move</legend>{level.fork.exits.map(direction=><button key={direction} disabled={status==="running" || status==="won" || status==="lost"} aria-pressed={level.choices?.[level.fork!.tile]===direction} onClick={()=>act({type:"branch",direction})}>{["↑","→","↓","←"][direction]} {directions[direction]}</button>)}</fieldset> : null}
        <div className={styles.boardFrame}>
          <div ref={board} tabIndex={-1} className={styles.board} style={{"--size":level.size} as CSSProperties} role="group" aria-label={`Level ${level.id}, ${level.size} by ${level.size} puzzle board`}>
            {tiles.map((tile,index)=>{
              const pathTile=["straight","corner","tee"].includes(tile.kind);
              const rotatable=pathTile && !tile.locked;
              const label=`Row ${Math.floor(index/level.size)+1}, column ${index%level.size+1}: ${tile.kind} ${tile.terrain ?? ""} path, connects ${ports(tile).map(d=>directions[d]).join(" and ")}. Rotate clockwise${level.collectibles?.includes(index) ? ". Golden star" : ""}`;
              const path=tile.kind === "straight" ? "M0 50H100" : tile.kind === "corner" ? "M50 0V50H100" : tile.kind === "tee" ? "M0 50H100M50 50V0" : "M50 50V0";
              const art=tile.kind!=="blank" ? <svg aria-hidden="true" viewBox="0 0 100 100" className={styles.pipe} style={{transform:`rotate(${(pathTile ? tile.rotation : tile.port ?? 0)*90}deg)`}}><path className={styles.pipeEdge} d={path}/><path className={styles.pipeFill} d={path}/></svg> : null;
              return <div key={`${level.id}-${index}`} className={styles.cell} data-connected={connected.includes(index)} data-empty={tile.kind === "blank"} data-terrain={tile.terrain} data-broken={broken.includes(index)} data-hint={level.intro && rotatable} data-gate={level.gate?.tile===index ? (broken.includes(level.gate.trigger) ? "open" : "closed") : undefined}>
                {rotatable ? <button className={styles.tileButton} aria-label={label} disabled={preparing || status === "running" || status === "won" || status === "lost"} onClick={()=>act({type:"rotate",index})}>{art}</button> : art}
                {level.gate?.tile===index ? <span className={styles.gateIcon} aria-label={broken.includes(level.gate.trigger) ? "Gate opened by Panda" : "Gate waits for Panda’s cracked tile"}>{broken.includes(level.gate.trigger) ? "↗" : "🔒"}</span> : null}
                {level.fork?.tile===index ? <span className={styles.forkIcon} aria-hidden="true">⑂</span> : null}
                {tile.terrain ? <span className={styles.terrainTag}>{tile.terrain}</span> : null}
                {level.collectibles?.includes(index) ? <span className={styles.collectible} data-collected={collected.includes(index)} aria-hidden="true">★</span> : null}
                {tile.kind === "start" ? <span className={styles.startMarker}>START</span> : null}
                {tile.kind === "home" ? <><span className={styles.cottage} aria-hidden="true"/><span className={styles.homeMarker}>HOME</span></> : null}
              </div>;
            })}
            <div className={styles.traveller} data-animate={animate} style={{left:`${(position%level.size+.5)/level.size*100}%`,top:`${(Math.floor(position/level.size)+.9)/level.size*100}%`,width:`${94/level.size}%`}}>
              <span className={styles.shadow}/><CharacterSprite character={level.character} status={status} animate={animate}/>
              {status === "won" ? <span className={styles.heart} aria-hidden="true">♥</span> : null}
            </div>
          </div>
        </div>
        <div className={styles.status} role="status" aria-live="polite">{preparing ? "Preparing your next puzzle…" : generationError || (status === "running" ? `Here comes ${pal.name}…` : status === "won" ? "Yay, ghar pohanch gayi!" : status === "lost" ? "Out of moves! Restart to try again." : "Green paths are connected. Join them to home!")}</div>
        {status === "lost" ? <div className={styles.lossPanel} role="alert"><h3>Out of moves!</h3><p>The path is not complete. Give it another go!</p><button className={styles.go} onClick={()=>act({type:"reset"})}>Try again</button></div> : null}
        <div className={styles.controls}>
          <button className={styles.secondary} disabled={preparing || !game.history.length || status === "running" || status === "won" || status === "lost"} onClick={()=>act({type:"undo"})}>↶ Undo</button>
          <button className={styles.go} disabled={preparing} onClick={()=>act({type:"reset"})}>Restart</button>
          {status === "won" ? <button className={styles.secondary} onClick={()=>resultDialog.current?.showModal()}>Result ★</button> : <span className={styles.starCount} aria-label={`${collected.length} of ${level.collectibles?.length ?? 0} stars collected`}>★ {collected.length}/{level.collectibles?.length ?? 0}</span>}
        </div>
      </section>
      {!powerMode ? <><nav className={styles.levelDots} aria-label="Tutorial levels">{levels.filter(l=>l.id<=completed+1).map(l=><button key={l.id} aria-label={`Level ${l.id}`} aria-current={l.id===level.id ? "step" : undefined} disabled={preparing || status === "running"} onClick={()=>act({type:"visit",id:l.id})}>{l.id}</button>)}</nav>
      <details className={styles.options}>
        <summary>Help, levels & settings</summary>
        <p>Connected paths turn green. Your pal follows the connected route home. Fox follows the branch you choose; Panda opens the marked gate by breaking its cracked tile. For three stars, keep every golden star on that route and finish within the move limit when one is shown. Introductions have no move limit.</p>
        <p>T-junctions open three sides. Undo keeps your move count. When moves run out, an incomplete path loses. A path finished on the last move still wins. Restart gives you a fresh attempt.</p>
        <label htmlFor="tutorial-select">Revisit a puzzle</label>
        <select id="tutorial-select" disabled={preparing || status === "running"} value={level.id} onChange={e=>act({type:"visit",id:Number(e.target.value)})}>
          {levels.filter(l=>l.id<=completed+1).map(l=><option key={l.id} value={l.id}>{l.id}. {l.title}</option>)}
          {level.id>10 && !recentLevels.includes(level.id) ? <option value={level.id}>{level.id}. Replay puzzle</option> : null}
          {recentLevels.map(id=><option key={id} value={id}>{id}. {id===completed+1 ? "Continue adventure" : "Replay puzzle"}</option>)}
        </select>
        {level.id<completed+1 ? <button className={styles.motion} disabled={preparing} onClick={()=>act({type:"visit",id:completed+1})}>Continue level {completed+1} →</button> : null}
        <button className={styles.motion} aria-pressed={motion} onClick={()=>act({type:"motion"})}>Animation: {motion ? "on" : "off"}</button>
        {reducedMotion ? <p>Reduced motion is on.</p> : null}
        <p>{completed} completed · {nextMilestone-completed} to milestone {nextMilestone}{best[level.id] ? ` · Best: ${best[level.id]}/3 ★` : ""}</p>
        <small>{saveMessage} Clearing browser data removes saves.</small><a href="/jelloo/art">Approved art room →</a>
      </details></> : <p className={styles.trialNote}>{level.hint} · Finish before moves run out. The last move can still win. ★★★ = all stars within the move target. {saveMessage}</p>}
      <dialog ref={resultDialog} className={styles.resultDialog} aria-labelledby="win-heading" onClose={()=>board.current?.focus({preventScroll:true})} onKeyDown={event=>{
        if(event.key!=="Tab") return;
        const controls=event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey && (document.activeElement===first || document.activeElement===winHeading.current)) {event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
      }}>
        <button className={styles.closeResult} aria-label="Close result" onClick={()=>resultDialog.current?.close()}>×</button>
        <h3 id="win-heading" ref={winHeading} tabIndex={-1}>Yay, ghar pohanch gayi!</h3>
        <div className={styles.rating} role="img" aria-label={`${score.stars} out of 3 stars`}>{[1,2,3].map(n=><span key={n} data-earned={n<=score.stars} style={{"--delay":`${n*120}ms`} as CSSProperties} aria-hidden="true">★</span>)}</div>
        <p>{moves} moves · {score.collected}/{score.total} golden stars</p><p>{score.stars===3 ? "A perfect little adventure!" : !score.withinLimit ? `Try ${level.moveLimit} moves or fewer for more stars.` : "Keep every star on the route for three!"}</p>
        {!powerMode && pals.some(p=>p.unlock===level.id) ? <p className={styles.unlockNotice}>{pals.find(p=>p.unlock===level.id)!.name} is unlocked! Open “Meet your pals” to try their power.</p> : null}
        <div className={styles.winActions}><button className={styles.secondary} disabled={preparing} onClick={()=>act({type:"reset"})}>Try again</button><button className={styles.go} disabled={preparing} onClick={()=>act({type:"visit",id:level.id+1})}>{preparing ? "Preparing…" : powerMode ? (level.id===3 ? "Back to trial 1 →" : "Next trial →") : "Next Level →"}</button></div>
        {generationError ? <p role="alert">{generationError}</p> : null}
      </dialog>
    </div>
  </main>;
}
