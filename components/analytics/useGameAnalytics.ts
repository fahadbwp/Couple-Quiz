"use client";
import {useEffect} from "react";
import type {GameState} from "@/lib/jelloo/engine";
import {trackEvent,trackSessionEvent} from "@/lib/analytics/client";
export function useGameAnalytics(game:GameState,mode:"adventure"|"daily"|"zen"|"trial",seed:number,enabled:boolean){
 const {id,character,dailyDate}=game.level;
 const status=game.status;
 useEffect(()=>{
  if(!enabled)return;
  const properties={game:"jelloo" as const,mode,level:id,...(character?{pal:character}:{})};
  const key=`${mode}:${seed}:${id}:${character??"bunny"}:${dailyDate??""}`;
  trackSessionEvent("game_start",{game:"jelloo",mode},mode);
  const start=mode==="adventure"?"adventure_level_start":mode==="daily"?"daily_start":mode==="zen"?"zen_start":"power_trial_start";
  trackSessionEvent(start,properties,key);
  if(status==="won"&&mode!=="zen")trackEvent(mode==="adventure"?"adventure_level_complete":mode==="daily"?"daily_complete":"power_trial_complete",{...properties,outcome:"won"},key);
 },[enabled,mode,seed,id,character,dailyDate,status]);
}
