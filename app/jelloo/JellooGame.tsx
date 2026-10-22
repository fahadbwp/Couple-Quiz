"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { tracePath, type Level } from "@/lib/jelloo/engine";
import { decodeJourney, encodeJourney, journeyReducer, newJourney, SAVE_KEY, type JourneyAction } from "@/lib/jelloo/progress";
import GameView from "./GameView";
import { feedbackFor, GameAudio } from "@/lib/jelloo/feedback";

import { powerStepDuration } from "@/lib/jelloo/pals";
import styles from "./game.module.css";



export default function JellooGame() {
  const [journey, dispatch] = useReducer(journeyReducer, undefined, () => newJourney());
  const { game, motion, completed, muted } = journey;
  const audio = useRef<GameAudio | null>(null);
  const previous = useRef(game);
  const winHeading = useRef<HTMLHeadingElement>(null);
  const resultDialog = useRef<HTMLDialogElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const generator = useRef<Worker | null>(null);
  const request = useRef(0);
  const pending = useRef(false);
  const [preparing,setPreparing] = useState(false);
  const [generationError,setGenerationError] = useState("");
  const [ready, setReady] = useState(false);
  const [saveAllowed, setSaveAllowed] = useState(true);
  const [saveMessage, setSaveMessage] = useState("Loading your adventure…");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { level, tiles, status, cursor, moves } = game;
  const animate = motion && !reducedMotion;

  const act = (action: JourneyAction) => {
    if(pending.current && action.type !== "mute" && action.type !== "motion") return;
    if(action.type !== "mute" && action.type !== "motion") setGenerationError("");
    if(!audio.current) audio.current = new GameAudio();
    if(!muted || action.type === "mute") audio.current.unlock();
    if(action.type === "reset" || action.type === "visit" || action.type === "jump" || action.type === "mute") audio.current.stop();
    if(action.type === "rotate" && !muted && status !== "running" && status !== "won" && status !== "lost") audio.current.play("rotate");
    if(action.type === "visit" && action.id>10 && action.id<=completed+1 && generator.current) {
      pending.current=true;setPreparing(true);setGenerationError("");
      generator.current.postMessage({id:action.id,seed:journey.seed,request:++request.current});
    } else dispatch(action);
  };

  useEffect(() => {
    try {
      const worker = new Worker(new URL("../../lib/jelloo/generation.worker.ts",import.meta.url));
      generator.current=worker;
      worker.onmessage = (event:MessageEvent<{request:number;level?:Level;error?:string}>) => {
        if(event.data.request!==request.current || !pending.current) return;
        pending.current=false;setPreparing(false);
        if(event.data.level) dispatch({type:"visit",id:event.data.level.id,prepared:event.data.level});
        else setGenerationError(event.data.error ?? "Please try this level again.");
      };
      worker.onerror=()=>{pending.current=false;setPreparing(false);setGenerationError("Please try this level again.");worker.terminate();generator.current=null;};
      return ()=>{worker.terminate();generator.current=null;};
    } catch { /* Older browsers use the same bounded generator on the main thread. */ }
  }, []);

  useEffect(() => () => { audio.current?.dispose(); audio.current=null; }, []);
  useEffect(() => {
    const before = previous.current;
    previous.current = game;
    if(hidden || muted) audio.current?.stop();
    else feedbackFor(before,game).forEach(cue=>audio.current?.play(cue));
    if(before.status === "running" && status === "won") winHeading.current?.focus();
    if(before.level.id !== game.level.id || (before.status === "won" && status === "editing")) board.current?.focus({preventScroll:true});
  }, [game, hidden, muted, status]);

  useEffect(() => {
    let restored = newJourney(crypto.getRandomValues(new Uint32Array(1))[0]);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw !== null) {
        const saved = decodeJourney(raw);
        if (saved) restored = saved;
        else {
          setSaveAllowed(false);
          setSaveMessage("This save could not be read. It is preserved; this visit will not be saved.");
        }
      }
    } catch {
      setSaveAllowed(false);
      setSaveMessage("Saving is unavailable in this browser. You can still play this visit.");
    }
    dispatch({type:"restore",journey:restored});
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const jumpId = Number(params.get("jump") ?? params.get("level"));
      if (Number.isSafeInteger(jumpId) && jumpId >= 1) {
        dispatch({type:"jump",id:jumpId});
      }
    }
    setReady(true);
  }, []);

  const snapshot = encodeJourney(journey);
  useEffect(() => {
    if (!ready || !saveAllowed) return;
    try {
      localStorage.setItem(SAVE_KEY,snapshot);
      setSaveMessage("Saved on this browser. You can come back anytime.");
    } catch {
      setSaveAllowed(false);
      setSaveMessage("Progress could not be saved. Keep this tab open to continue this visit.");
    }
  }, [snapshot, ready, saveAllowed]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(query.matches);
    const onVisibility = () => setHidden(document.hidden);
    onMotion(); onVisibility();
    query.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      query.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (status !== "running" || hidden) return;
    const timer = window.setTimeout(() => dispatch({type:"tick",runId:game.runId}), powerStepDuration(game,motion && !reducedMotion));
    return () => window.clearTimeout(timer);
  }, [status, cursor, game, motion, reducedMotion, hidden]);

  useEffect(() => {
    if(!ready || hidden || preparing || status !== "editing") return;
    if(tracePath(level,tiles).outcome !== "home") return;
    const timer=window.setTimeout(()=>dispatch({type:"auto",runId:game.runId,moves}),250);
    return ()=>window.clearTimeout(timer);
  }, [ready,hidden,preparing,status,level,tiles,game.runId,moves]);
  useEffect(() => {
    const dialog=resultDialog.current;
    if(!dialog || !ready) return;
    if(status === "won" && !dialog.open) {
      const timer=window.setTimeout(()=>{if(!dialog.open) dialog.showModal();},900);
      return ()=>window.clearTimeout(timer);
    }
    else if(status !== "won" && dialog.open) dialog.close();
  }, [status,ready]);
  if (!ready) return <main className={styles.page}><p role="status">Loading Jelloo…</p></main>;
  return <GameView journey={journey} animate={animate} preparing={preparing} generationError={generationError} saveMessage={saveMessage} reducedMotion={reducedMotion} act={act} board={board} resultDialog={resultDialog} winHeading={winHeading}/>;
}
