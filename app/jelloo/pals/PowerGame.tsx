"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { gameReducer, initialGame, tracePath, type Character } from "@/lib/jelloo/engine";
import { canPlayPal, decodePalStars, pals, PAL_SAVE_KEY, powerStepDuration, playablePowerTrial } from "@/lib/jelloo/pals";
import { decodeJourney, SAVE_KEY, type JourneyAction } from "@/lib/jelloo/progress";
import { feedbackFor, GameAudio } from "@/lib/jelloo/feedback";
import { scoreRun } from "@/lib/jelloo/scoring";
import GameView from "../GameView";
import CharacterSprite from "../CharacterSprite";
import styles from "../game.module.css";

export default function PowerGame() {
  const [game,dispatch]=useReducer(gameReducer,undefined,()=>initialGame(playablePowerTrial("bunny",1)));
  const [completed,setCompleted]=useState(0), [ready,setReady]=useState(false);
  const [muted,setMuted]=useState(false),[motion,setMotion]=useState(true),[reduced,setReduced]=useState(false),[hidden,setHidden]=useState(false);
  const [stars,setStars]=useState<Record<string,number>>({}),[saveAllowed,setSaveAllowed]=useState(true),[message,setMessage]=useState("Trial medals save on this browser; adventure progress stays separate.");
  const board=useRef<HTMLDivElement>(null), dialog=useRef<HTMLDialogElement>(null), heading=useRef<HTMLHeadingElement>(null);
  const audio=useRef<GameAudio|null>(null), previous=useRef(game);
  const character=game.level.character!,trial=game.level.id,animate=motion&&!reduced;
  const busy=game.status==="running";

  useEffect(()=>{
    try {
      const raw=localStorage.getItem(SAVE_KEY),saved=raw ? decodeJourney(raw) : null;
      if(saved) {setCompleted(saved.completed);setMuted(saved.muted);setMotion(saved.motion);}
      else if(raw) setMessage("Adventure save could not be read; it is preserved. Only Bunny is available.");
      const medals=decodePalStars(localStorage.getItem(PAL_SAVE_KEY));
      if(medals) setStars(medals);
      else {setSaveAllowed(false);setMessage("Trial save could not be read and has been preserved.");}
    } catch {setSaveAllowed(false);setMessage("Saving is unavailable. You can still play Bunny’s trials.");}
    setReady(true);
  },[]);
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReduced(media.matches), visibility=()=>setHidden(document.hidden);
    update();visibility();media.addEventListener("change",update);document.addEventListener("visibilitychange",visibility);
    return ()=>{media.removeEventListener("change",update);document.removeEventListener("visibilitychange",visibility);};
  },[]);
  useEffect(()=>()=>{audio.current?.dispose();},[]);
  useEffect(()=>{
    if(hidden || muted) audio.current?.stop();
    else feedbackFor(previous.current,game).forEach(c=>audio.current?.play(c));
    previous.current=game;
  },[game,muted,hidden]);
  useEffect(()=>{
    if(!ready || hidden || game.status!=="editing" || tracePath(game.level,game.tiles).outcome!=="home") return;
    const timer=setTimeout(()=>dispatch({type:"auto",runId:game.runId,moves:game.moves}),250);
    return ()=>clearTimeout(timer);
  },[game,ready,hidden]);
  useEffect(()=>{
    if(!busy || hidden) return;
    const timer=setTimeout(()=>dispatch({type:"tick",runId:game.runId}),powerStepDuration(game,animate));
    return ()=>clearTimeout(timer);
  },[game,busy,hidden,animate]);
  useEffect(()=>{
    if(game.status!=="won") {dialog.current?.close();return;}
    const earned=scoreRun(game).stars,key=`${character}-${trial}`;
    setStars(old=>({...old,[key]:Math.max(old[key] ?? 0,earned)}));
    const timer=setTimeout(()=>{if(!dialog.current?.open) {dialog.current?.showModal();heading.current?.focus();}},900);
    return ()=>clearTimeout(timer);
  },[game.status,character,trial,game]);
  useEffect(()=>{
    if(!ready || !saveAllowed) return;
    try {localStorage.setItem(PAL_SAVE_KEY,JSON.stringify({version:1,stars}));}
    catch {setSaveAllowed(false);setMessage("Trial medals could not be saved this visit.");}
  },[ready,saveAllowed,stars]);
  function load(id:Character,number:number) {
    if(busy || !canPlayPal(id,completed)) return;
    audio.current?.stop();dispatch({type:"load",level:playablePowerTrial(id,number)});
    board.current?.focus({preventScroll:true});
  }
  function act(action:JourneyAction) {
    if(!audio.current) audio.current=new GameAudio();
    if(!muted || action.type==="mute") audio.current.unlock();
    if(action.type==="mute") {setMuted(!muted);audio.current.stop();return;}
    if(action.type==="motion") {setMotion(!motion);return;}
    if(action.type==="visit") {load(character,action.id>3 ? 1 : action.id);return;}
    if(action.type==="restore" || action.type==="jump") return;
    if(action.type==="reset") audio.current.stop();
    if(action.type==="rotate" && !muted && game.status==="editing") audio.current.play("rotate");
    dispatch(action);
  }
  if(!ready) return <main className={styles.page}><p role="status">Opening your pals…</p></main>;
  return <GameView powerMode journey={{game,completed,seed:0,motion,muted,rules:3,best:{}}} animate={animate} preparing={false} generationError="" saveMessage={message} reducedMotion={reduced} act={act} board={board} resultDialog={dialog} winHeading={heading} extra={<>
    <section className={styles.collection} aria-label="Character collection">
      <h2>Power Trials — practice with your pals</h2>
      <p>Power Trials are optional practice puzzles that teach each pal’s special ability. Pick a pal to train here. Adventure chooses its own pal for each level; your selection here does not change it.</p>
      <div className={styles.palCards}>{pals.map(p=>{
        const unlocked=canPlayPal(p.id,completed);
        return <button key={p.id} aria-pressed={character===p.id} disabled={!unlocked || busy} onClick={()=>load(p.id,1)} title={p.power}>
          <span className={styles.portrait}><CharacterSprite character={p.id}/></span>
          <b>{p.name}</b><small>{unlocked ? "Play Trials" : `Level ${p.unlock}`}</small>
        </button>;
      })}</div>
      <p className={styles.unlockProgress}>{completed} adventure levels complete · {pals.filter(p=>canPlayPal(p.id,completed)).length}/5 pals unlocked</p>
    </section>
    <p>Now training: <strong>{pals.find(p=>p.id===character)!.name} · Trial {trial} of 3</strong>. Trials save their own stars and are never required to advance in Adventure.</p>
    <nav className={styles.trialTabs} aria-label="Power trials">{[1,2,3].map(n=><button key={n} disabled={busy} aria-current={trial===n ? "step" : undefined} onClick={()=>load(character,n)}>Trial {n}<small>{stars[`${character}-${n}`] ? "★".repeat(stars[`${character}-${n}`]) : "○ ○ ○"}</small></button>)}</nav>
    <button className={styles.motion} aria-pressed={motion} onClick={()=>act({type:"motion"})}>Animation: {motion ? "on" : "off"}</button>
  </>}/>;
}
