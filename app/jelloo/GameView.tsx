"use client";
import Link from "next/link";
import type { MultiJellyTrace } from "@/lib/jelloo/multi-jelly";
import type { CSSProperties, RefObject, ReactNode } from "react";
import { connectedPaths, ports } from "@/lib/jelloo/engine";
import { collectedStars, scoreRun } from "@/lib/jelloo/scoring";
import type { Journey, JourneyAction } from "@/lib/jelloo/progress";
import { levels } from "@/lib/jelloo/levels";
import CharacterSprite from "./CharacterSprite";
import { pals } from "@/lib/jelloo/pals";
import { worldForLevel, worlds, milestoneRewardFor } from "@/lib/jelloo/worlds";
import ShareCardView from "./ShareCardView";
import styles from "./game.module.css";

type Props = {
  verificationMode?:boolean; powerMode?:boolean; dailyMode?:boolean; zenMode?:boolean; streak?:number; extra?:ReactNode;
  journey:Journey; animate:boolean; preparing:boolean; generationError:string; saveMessage:string; reducedMotion:boolean;
  act:(action:JourneyAction)=>void;
  board:RefObject<HTMLDivElement|null>; resultDialog:RefObject<HTMLDialogElement|null>; outOfMovesDialog?:RefObject<HTMLDialogElement|null>; winHeading:RefObject<HTMLHeadingElement|null>;
};
const directions=["up","right","down","left"];
export default function GameView({verificationMode=false,powerMode=false,dailyMode=false,zenMode=false,streak,extra,journey,animate,preparing,generationError,saveMessage,reducedMotion,act,board,resultDialog,outOfMovesDialog,winHeading}:Props) {
  const {game,completed,muted,motion,best}=journey;
  const {level,tiles,status,trace,cursor,moves}=game;
  const connected=(status==="running" || status==="won") && trace ? trace.path : connectedPaths(level,tiles).connected, collected=collectedStars(game), score=scoreRun(game);
  const position=trace?.path[cursor] ?? level.start;
  const pal=pals.find(p=>p.id===(level.character ?? "bunny"))!;
  const broken=trace?.states?.[cursor]?.broken ?? [];
  const switches=trace?.states?.[cursor]?.switches ?? [];
  const currentWorld=worldForLevel(level.id);
  const worldId=level.world ?? currentWorld.id;
  const milestoneReward=milestoneRewardFor(level.id);
  const isMulti = Boolean(level.jellies && level.jellies.length > 1);
  const recentLevels=Array.from({length:Math.min(20,Math.max(0,completed-9))},(_,i)=>completed+1-i).filter(id=>id>10);
  const nextMilestone=(Math.floor(completed/10)+1)*10;

  return <main className={`${styles.page} ${styles.compact}`} data-motion={animate} data-world={worldId}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link
          href={verificationMode ? "/jelloo/invite" : powerMode ? "/jelloo/pals" : "/jelloo/map"}
          className={styles.back}
          aria-label={powerMode ? "Return to Meet Your Pals" : dailyMode ? "Return to Level Map from Daily" : zenMode ? "Return to Level Map from Zen" : "Back to Level Map"}
        >
          ← {powerMode ? "Meet Your Pals" : "Level Map"}
        </Link><h1 className={styles.brand}>Jelloo<span>.</span></h1>
        {verificationMode ? <span>Sound off</span> : <button className={styles.sound} aria-pressed={muted} onClick={()=>act({type:"mute"})}>Sound: {muted ? "off" : "on"}</button>}
      </header>
      <p className={styles.subtitle}>{isMulti ? `${level.jellies!.length} Pals Coordinate — Guide them home simultaneously!` : zenMode ? "No move limits, no rush — enjoy your peaceful journey home. ♡" : dailyMode ? `Rotate the tiles, connect the path — ${pal.name} in today's ${currentWorld.name} Daily!` : powerMode ? pal.power : `Rotate the tiles, connect the path — ${pal.name} in ${currentWorld.name}!`}</p>
      {extra}
      {!powerMode && !dailyMode && !zenMode && !verificationMode ? (
        <div className={styles.modeLinks}>
          <a className={styles.palsLink} href="/jelloo/pals"><b>Meet your pals →</b><span>{pals.filter(p=>p.unlock<=completed).length}/5 unlocked</span></a>
          <a className={styles.dailyLink} href="/jelloo/daily"><b>📅 Daily Puzzle →</b><span>Streak challenge</span></a>
          <a className={styles.zenLink} href="/jelloo/zen"><b>🌸 Zen Garden →</b><span>Relaxed play</span></a>
        </div>
      ) : null}
      <section className={styles.gamePanel} aria-label="Jelloo puzzle" aria-busy={preparing}>
        <div className={styles.levelBar}>
          <h2>
            <span className={styles.worldPill} title={currentWorld.tagline}>{currentWorld.badge}</span>
            {zenMode ? (level.title || "Zen Mode") : dailyMode ? (level.title || "Daily Puzzle") : powerMode ? pal.name : `Level ${level.id}`} <small>· {level.difficulty}</small>
          </h2>
          <span><b>{moves}</b> moves {level.moveLimit===undefined ? <small>· Take your time ♡</small> : <small>/ limit {level.moveLimit} · {Math.max(0,level.moveLimit-moves)} left</small>}</span>
        </div>
        {level.intro ? <div className={styles.introWelcome}><span className={styles.introPortrait}><CharacterSprite character={level.character} animate={animate}/></span><b>Hello, {pal.name}! ♡</b><span aria-label="No move limit">∞</span></div> : null}
        {level.fork ? <fieldset className={styles.branchChoice}><legend>Fox: choose your branch before the last move</legend>{level.fork.exits.map(direction=><button key={direction} disabled={status==="running" || status==="won" || status==="lost"} aria-pressed={level.choices?.[level.fork!.tile]===direction} onClick={()=>act({type:"branch",direction})}>{["↑","→","↓","←"][direction]} {directions[direction]}</button>)}</fieldset> : null}
        {level.door ? <p role="status">Pressure plate A opens door A. Door A: {switches.includes(level.door.switch) ? "open" : "locked — visit the plate first"}.</p> : null}
        <div className={styles.boardFrame}>
          <div ref={board} tabIndex={-1} className={styles.board} style={{"--size":level.size} as CSSProperties} role="group" aria-label={`Level ${level.id}, ${level.size} by ${level.size} puzzle board in ${currentWorld.name}`}>
            {tiles.map((tile,index)=>{
              const pathTile=["straight","corner","tee"].includes(tile.kind);
              const rotatable=pathTile && !tile.locked;
              const label=`Row ${Math.floor(index/level.size)+1}, column ${index%level.size+1}: ${tile.kind} ${tile.terrain ?? ""} path, connects ${ports(tile).map(d=>directions[d]).join(" and ")}. Rotate clockwise${level.collectibles?.includes(index) ? ". Golden star" : ""}`;
              const path=tile.kind === "straight" ? "M0 50H100" : tile.kind === "corner" ? "M50 0V50H100" : tile.kind === "tee" ? "M0 50H100M50 50V0" : "M50 50V0";
              const art=tile.kind!=="blank" ? <svg aria-hidden="true" viewBox="0 0 100 100" className={styles.pipe} style={{transform:`rotate(${(pathTile ? tile.rotation : tile.port ?? 0)*90}deg)`}}><path className={styles.pipeEdge} d={path}/><path className={styles.pipeFill} d={path}/></svg> : null;
              const isGate = level.gate?.tile === index;
              const isDoor = level.door?.tile === index;
              const isGateOpen = isGate
                ? (tiles[level.gate!.trigger]?.terrain === "switch"
                    ? switches.includes(level.gate!.trigger)
                    : broken.includes(level.gate!.trigger))
                : false;
              const isDoorOpen = isDoor ? switches.includes(level.door!.switch) : false;
              const barrierOpen = (isGate && isGateOpen) || (isDoor && isDoorOpen);
              return <div key={`${level.id}-${index}`} className={styles.cell} data-connected={connected.includes(index)} data-empty={tile.kind === "blank"} data-terrain={tile.terrain} data-switch-active={tile.terrain === "switch" ? switches.includes(index) : undefined} data-broken={broken.includes(index)} data-hint={level.intro && rotatable} data-gate={isGate || isDoor ? (barrierOpen ? "open" : "closed") : undefined}>
                {rotatable ? <button className={styles.tileButton} aria-label={label} disabled={preparing || status === "running" || status === "won" || status === "lost"} onClick={()=>act({type:"rotate",index})}>{art}</button> : art}
                {isGate ? <span className={styles.gateIcon} aria-label={isGateOpen ? "Gate opened" : "Gate locked"}>{isGateOpen ? "🔓" : "🔒"}</span> : null}
                {isDoor ? <span className={styles.gateIcon} aria-label={isDoorOpen ? "Door opened by switch" : "Door locked by switch"}>{isDoorOpen ? "🚪" : "🚪🔒"}</span> : null}
                {tile.terrain === "switch" ? <span className={styles.switchIcon} data-active={switches.includes(index)} aria-label={switches.includes(index) ? "Pressure plate pressed" : "Pressure plate"}>🔘</span> : null}
                {level.fork?.tile===index ? <span className={styles.forkIcon} aria-hidden="true">⑂</span> : null}
                {tile.terrain ? <span className={styles.terrainTag}>{tile.terrain}</span> : null}
                {level.collectibles?.includes(index) ? <span className={styles.collectible} data-collected={collected.includes(index)} aria-hidden="true">★</span> : null}
                {tile.kind === "start" ? <span className={styles.startMarker}>{level.jellies?.find(j=>j.start===index)?.character.toUpperCase() ?? "START"}</span> : null}
                {tile.kind === "home" ? <><span className={styles.cottage} aria-hidden="true"/><span className={styles.homeEmoji} aria-hidden="true">{currentWorld.homeEmoji}</span><span className={styles.homeMarker}>{level.jellies?.find(j=>j.home===index) ? `${level.jellies.find(j=>j.home===index)!.character.toUpperCase()} HOME` : "HOME"}</span></> : null}
              </div>;
            })}
            {isMulti ? (
              level.jellies!.map((jelly, jIdx) => {
                const multiTrace = trace as MultiJellyTrace;
                const jPath = multiTrace?.jellies?.[jIdx]?.path;
                const pos = jPath ? jPath[Math.min(cursor, jPath.length - 1)] : jelly.start;
                const reached = jPath ? cursor >= jPath.length - 1 && multiTrace?.multiOutcome === "home" : false;
                const collided = multiTrace && (multiTrace.multiOutcome === "collision" || multiTrace.multiOutcome === "swap") && cursor >= (multiTrace.steps || 0);
                const isCollecting = Boolean(level.collectibles?.includes(pos) && (status === "running" || status === "won"));
                const curTile = tiles[pos];
                const isPower = status === "running" && Boolean(
                  (jelly.character === "bunny" && curTile?.terrain === "gap") ||
                  (jelly.character === "panda" && curTile?.terrain === "cracked") ||
                  (jelly.character === "cat" && curTile?.terrain === "wall") ||
                  (jelly.character === "octopus" && curTile?.terrain === "water")
                );
                const jStatus = collided ? "lost" : reached ? "won" : isCollecting ? "collecting" : status;
                const defaultColors = ["pink", "green", "blue", "purple", "amber"];
                const jellyColor = jelly.color || defaultColors[jIdx % defaultColors.length];

                return (
                  <div
                    key={`${jIdx}-${jelly.character}`}
                    className={styles.traveller}
                    data-animate={animate}
                    style={{
                      left: `${(pos % level.size + 0.5) / level.size * 100}%`,
                      top: `${(Math.floor(pos / level.size) + 0.9) / level.size * 100}%`,
                      width: `${94 / level.size}%`,
                      zIndex: 10 + jIdx,
                    }}
                  >
                    <span className={styles.shadow} />
                    <span className={styles.jellyTag} data-color={jellyColor}>{jelly.character}</span>
                    <CharacterSprite character={jelly.character} status={jStatus} animate={animate} powerActive={isPower} />
                    {reached ? <span className={styles.heart} aria-hidden="true">♥</span> : null}
                    {collided ? <span className={styles.collisionMarker} aria-hidden="true">💥</span> : null}
                  </div>
                );
              })
            ) : (
              (() => {
                const isCollecting = Boolean(level.collectibles?.includes(position) && (status === "running" || status === "won"));
                const curTile = tiles[position];
                const isPower = status === "running" && Boolean(
                  (level.character === "bunny" && curTile?.terrain === "gap") ||
                  (level.character === "panda" && curTile?.terrain === "cracked") ||
                  (level.character === "cat" && curTile?.terrain === "wall") ||
                  (level.character === "octopus" && curTile?.terrain === "water")
                );
                const activeStatus = isCollecting && status !== "won" && status !== "lost" ? "collecting" : status;
                return (
                  <div className={styles.traveller} data-animate={animate} style={{left:`${(position%level.size+.5)/level.size*100}%`,top:`${(Math.floor(position/level.size)+.9)/level.size*100}%`,width:`${94/level.size}%`}}>
                    <span className={styles.shadow}/>
                    <CharacterSprite character={level.character} status={activeStatus} animate={animate} powerActive={isPower}/>
                    {status === "won" ? <span className={styles.heart} aria-hidden="true">♥</span> : null}
                    {status === "lost" ? <span className={styles.collisionMarker} aria-hidden="true">❌</span> : null}
                  </div>
                );
              })()
            )}
          </div>
        </div>
        <div className={styles.status} role="status" aria-live="polite">
          {preparing
            ? "Preparing your next puzzle…"
            : generationError ||
              (status === "running"
                ? (isMulti ? "Here come the pals! Watch out for collisions…" : `Here comes ${pal.name}…`)
                : status === "won"
                ? (isMulti ? "All pals arrived safely at home!" : "Yay, you made it home!")
                : status === "lost"
                ? "Out of moves! Restart to try again."
                : status === "blocked"
                ? (trace && (trace as MultiJellyTrace).multiOutcome === "swap" ? "Oops! Pals collided head-on!" : trace && (trace as MultiJellyTrace).multiOutcome === "collision" ? "Oops! Pals collided in the same cell!" : "Path blocked! Restart or undo to fix it.")
                : "Green paths are connected. Join them to home!")}
        </div>
        {status === "lost" ? <div className={styles.lossPanel} role="alert"><h3>Out of moves!</h3><p>The path is not complete. Give it another go!</p><div className={styles.lossActions}><button className={styles.go} onClick={()=>act({type:"reset"})}>Try again</button><Link href="/jelloo/map" className={styles.secondary}>Level Map</Link></div></div> : null}
        <div className={styles.controls}>
          <button className={styles.secondary} disabled={preparing || !game.history.length || status === "running" || status === "won" || status === "lost"} onClick={()=>act({type:"undo"})}>↶ Undo</button>
          <button className={styles.go} disabled={preparing} onClick={()=>act({type:"reset"})}>Restart</button>
          {status === "won" ? <button className={styles.secondary} onClick={()=>resultDialog.current?.showModal()}>Result ★</button> : <span className={styles.starCount} aria-label={`${collected.length} of ${level.collectibles?.length ?? 0} stars collected`}>★ {collected.length}/{level.collectibles?.length ?? 0}</span>}
        </div>
      </section>
      {!powerMode && !dailyMode && !zenMode && !verificationMode ? <>
      <div className={styles.mapBanner}>
        <Link href="/jelloo/map" className={styles.mapBannerLink}>
          <b>🗺️ View Full Adventure Map</b>
          <span>All 100 levels · {completed}/100 completed</span>
        </Link>
      </div>
      <details className={styles.options}>
        <summary>Help, levels & settings</summary>
        <div className={styles.worldSection}>
          <label>Worlds & Progression (Levels 1–100)</label>
          <div className={styles.worldGrid}>
            {worlds.map(w => {
              const unlocked = completed >= w.unlockLevel;
              const isCurrent = w.id === worldId;
              return (
                <button
                  key={w.id}
                  type="button"
                  disabled={!unlocked || preparing || status === "running"}
                  className={styles.worldCard}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => act({ type: "visit", id: Math.min(completed + 1, Math.max(w.startLevel, w.unlockLevel + 1)) })}
                >
                  <span className={styles.worldCardIcon}>{w.icon}</span>
                  <div className={styles.worldCardInfo}>
                    <b>{w.name}</b>
                    <small>{unlocked ? `L${w.startLevel}–${w.endLevel}` : `Locked (L${w.unlockLevel})`}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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
        {process.env.NODE_ENV !== "production" ? (
          <fieldset style={{ margin: "0.75rem 0", padding: "0.5rem 0.75rem", border: "1px dashed #d97706", borderRadius: "8px", background: "rgba(254, 243, 199, 0.5)" }}>
            <legend style={{ fontWeight: "bold", fontSize: "0.8rem", color: "#92400e" }}>Dev Level Jump (local only)</legend>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" className={styles.secondary} onClick={() => act({ type: "jump", id: 1 })}>L1 Meadow</button>
              <button type="button" className={styles.secondary} onClick={() => act({ type: "jump", id: 21 })}>L21 Beach</button>
              <button type="button" className={styles.secondary} onClick={() => act({ type: "jump", id: 41 })}>L41 Snow</button>
              <button type="button" className={styles.secondary} onClick={() => act({ type: "jump", id: 61 })}>L61 Candy</button>
              <button type="button" className={styles.secondary} onClick={() => act({ type: "jump", id: 81 })}>L81 Space</button>
              <button type="button" className={styles.secondary} onClick={() => act({ type: "jump", id: 101 })}>L101 Endless</button>
              <input
                type="number"
                min="1"
                placeholder="Jump #"
                style={{ width: "65px", padding: "0.2rem 0.4rem", borderRadius: "4px", border: "1px solid #ccc" }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const val = Number((e.target as HTMLInputElement).value);
                    if (val >= 1) act({ type: "jump", id: val });
                  }
                }}
              />
            </div>
            <small style={{ display: "block", marginTop: "0.25rem", color: "#78350f" }}>Tip: You can also open <code>?jump=41</code> in the URL.</small>
          </fieldset>
        ) : null}
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
        <h3 id="win-heading" ref={winHeading} tabIndex={-1}>{zenMode ? "🌸 Zen Puzzle Solved!" : dailyMode ? "🎉 Daily Puzzle Solved!" : "Yay, you made it home!"}</h3>
        <div className={styles.rating} role="img" aria-label={`${score.stars} out of 3 stars`}>{[1,2,3].map(n=><span key={n} data-earned={n<=score.stars} style={{"--delay":`${n*120}ms`} as CSSProperties} aria-hidden="true">★</span>)}</div>
        <p>{moves} moves · {score.collected}/{score.total} golden stars</p><p>{zenMode ? "A peaceful moment. Take a deep breath." : score.stars===3 ? "A perfect little adventure!" : !score.withinLimit ? `Try ${level.moveLimit} moves or fewer for more stars.` : "Keep every star on the route for three!"}</p>
        {status === "won" && !zenMode && !verificationMode ? (
          <ShareCardView
            input={{
              mode: dailyMode ? "daily" : "adventure",
              levelId: level.id,
              dailyDate: level.dailyDate || (dailyMode ? new Date().toISOString().slice(0, 10) : undefined),
              moves,
              moveLimit: level.moveLimit,
              stars: score.stars,
              collectedStars: score.collected,
              totalStars: score.total,
              character: level.character ?? "bunny",
              jellies: isMulti
                ? level.jellies!.map((j, idx) => ({
                    character: j.character,
                    color: j.color,
                    path: (trace as MultiJellyTrace)?.jellies?.[idx]?.path,
                  }))
                : undefined,
              world: worldId,
              streak: dailyMode ? streak : undefined,
              size: level.size,
              path: connected,
            }}
          />
        ) : null}
        {verificationMode ? <p>No referral is awarded until server verification succeeds.</p> : null}
        {milestoneReward && !dailyMode && !zenMode && !verificationMode ? <div className={styles.milestoneNotice} role="status"><span className={styles.milestoneIcon}>🏆</span><div><strong>Milestone Unlocked!</strong><p>{milestoneReward}</p></div></div> : null}
        {!powerMode && !dailyMode && !zenMode && !verificationMode && pals.some(p=>p.unlock===level.id) ? <p className={styles.unlockNotice}>{pals.find(p=>p.unlock===level.id)!.name} is unlocked! Open “Meet your pals” to try their power.</p> : null}
        <div className={styles.winActions}>
          <button className={styles.secondary} disabled={preparing} onClick={()=>act({type:"reset"})}>Try again</button>
          {!dailyMode && !zenMode && !powerMode && !verificationMode ? (
            <Link href="/jelloo/map" className={styles.secondary} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>Level Map</Link>
          ) : null}
          {zenMode ? (
            <button className={styles.go} disabled={preparing} onClick={()=>act({type:"visit",id:0})}>Next Zen Puzzle →</button>
          ) : dailyMode ? (
            <Link href="/jelloo/map" className={styles.go} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>Level Map →</Link>
          ) : (
            <button className={styles.go} disabled={preparing} onClick={()=>act({type:"visit",id:level.id+1})}>{preparing ? "Preparing…" : powerMode ? (level.id===3 ? "Back to trial 1 →" : "Next trial →") : verificationMode ? "Verify & continue →" : "Next Level →"}</button>
          )}
        </div>
        {generationError ? <p role="alert">{generationError}</p> : null}
      </dialog>
      {outOfMovesDialog ? (
        <dialog
          ref={outOfMovesDialog}
          className={styles.resultDialog}
          aria-labelledby="oom-heading"
          onClose={()=>board.current?.focus({preventScroll:true})}
        >
          <h3 id="oom-heading" style={{ color: "#a83232" }}>Out of Moves!</h3>
          <p>You&apos;ve used all your moves. Try a different path!</p>
          <div className={styles.winActions} style={{ marginTop: "20px" }}>
            <button
              className={styles.go}
              onClick={() => {
                outOfMovesDialog.current?.close();
                act({ type: "reset" });
              }}
            >
              Try Again
            </button>
            <Link
              href="/jelloo/map"
              className={styles.secondary}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              Level Map
            </Link>
          </div>
        </dialog>
      ) : null}
    </div>
  </main>;
}
