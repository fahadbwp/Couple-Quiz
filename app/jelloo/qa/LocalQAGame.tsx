"use client";
import {useEffect,useReducer,useRef} from "react";
import {gameReducer,initialGame,tracePath,type Level} from "@/lib/jelloo/engine";
import type {JourneyAction} from "@/lib/jelloo/progress";
import GameView from "../GameView";
// Isolated reducer: deliberately no journeyReducer, storage, unlock or jump code.
export default function LocalQAGame({level}:{level:Level}){
 const [game,dispatch]=useReducer(gameReducer,level,initialGame);
 const board=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  if(game.status==="running"){const id=setTimeout(()=>dispatch({type:"tick",runId:game.runId}),250);return()=>clearTimeout(id);}
  if(game.status==="editing" && tracePath(game.level,game.tiles).outcome==="home"){const id=setTimeout(()=>dispatch({type:"auto",runId:game.runId,moves:game.moves}),250);return()=>clearTimeout(id);}
 },[game]);
 useEffect(()=>{if(game.status==="won")dialog.current?.showModal();else dialog.current?.close();},[game.status]);
 const act=(a:JourneyAction)=>{if(a.type==="rotate" || a.type==="undo" || a.type==="reset" || a.type==="branch")dispatch(a);};
 return <GameView verificationMode journey={{game,completed:0,seed:42,rules:4,best:{},muted:true,motion:true}} animate preparing={false} generationError="" saveMessage="Disposable QA. Nothing is saved." reducedMotion={false} act={act} board={board} resultDialog={dialog} winHeading={heading}/>;
}
