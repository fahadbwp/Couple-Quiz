"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { gameReducer, initialGame, tracePath } from "@/lib/jelloo/engine";
import { MAX_ACTIONS, referralBoards, type Challenge, type ProofAction, type ReferralStatus } from "@/lib/jelloo/referrals/protocol";
import { type JourneyAction } from "@/lib/jelloo/progress";
import GameView from "../GameView";
import { referralRequest } from "./client";
import styles from "./invite.module.css";

export default function ReferralPlay({challenge,onAccepted,onExit}:{challenge:Challenge;onAccepted:(s:ReferralStatus)=>void;onExit:()=>void}){
  const [game,dispatch]=useReducer(gameReducer,referralBoards[challenge.level-1],initialGame);
  const actions=useRef<ProofAction[]>([]),current=useRef(game),locked=useRef(false);
  current.current=game;
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[motion,setMotion]=useState(true);
  const board=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{const q=window.matchMedia("(prefers-reduced-motion: reduce)");setMotion(!q.matches);const change=()=>setMotion(!q.matches);q.addEventListener("change",change);return()=>q.removeEventListener("change",change);},[]);
  async function verify(){
    if(locked.current || current.current.status!=="won")return;
    locked.current=true;setBusy(true);setError("");
    try{
      const transcript=[...actions.current,{type:"go"} as const];
      const result=await referralRequest({op:"submit",id:challenge.id,nonce:challenge.nonce,revision:challenge.revision,level:challenge.level,actions:transcript});
      onAccepted(result.status);
    }catch(e){setError(e instanceof Error?e.message:"Please retry verification.");}
    finally{locked.current=false;setBusy(false);}
  }
  function act(a:JourneyAction){
    if(locked.current)return;
    if(a.type==="visit"){void verify();return;}
    if(a.type==="motion"){setMotion(v=>!v);return;}
    if(a.type==="reset"){actions.current=[];setError("");current.current=gameReducer(current.current,a);dispatch(a);return;}
    if(a.type!=="rotate" && a.type!=="undo")return;
    if(actions.current.length>=MAX_ACTIONS-1){setError("Attempt action limit reached. Restart this level.");return;}
    const next=gameReducer(current.current,a);
    if(next===current.current)return;
    actions.current.push(a);current.current=next;dispatch(a);
  }
  useEffect(()=>{
    if(game.status!=="editing" || tracePath(game.level,game.tiles).outcome!=="home")return;
    const timer=setTimeout(()=>dispatch({type:"auto",runId:game.runId,moves:game.moves}),250);return()=>clearTimeout(timer);
  },[game]);
  useEffect(()=>{
    if(game.status!=="running")return;
    const timer=setTimeout(()=>dispatch({type:"tick",runId:game.runId}),motion?300:50);return()=>clearTimeout(timer);
  },[game,motion]);
  useEffect(()=>{if(game.status==="won")dialog.current?.showModal();else dialog.current?.close();},[game.status]);
  return <>
    <section className={styles.playHeader}><h1>Verified invite journey · {challenge.level}/10</h1><p>Original tutorial puzzle. After winning, choose “Verify & continue”. Only server-accepted wins count; your adventure save is unchanged.</p><button disabled={busy} onClick={onExit}>Back to invite status</button>{game.status==="won" && <button disabled={busy} onClick={()=>void verify()}>Verify & continue</button>}<p role="status">{error}</p></section>
    <GameView verificationMode journey={{game,completed:challenge.level-1,seed:0,rules:4,motion,muted:true,best:{}}} animate={motion} reducedMotion={!motion} preparing={busy} generationError={error} saveMessage="Server checkpoints after each verified win. Unfinished attempts restart on refresh." act={act} board={board} resultDialog={dialog} winHeading={heading}/>
  </>;
}
