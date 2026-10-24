"use client";
import {useEffect,useState} from "react";
import {decodeJourney,SAVE_KEY,type Journey} from "@/lib/jelloo/progress";
import {activeCosmetics,COSMETICS_KEY,cosmeticEntitlements,decodeCosmetics,defaultCosmetics,type Cosmetic} from "@/lib/jelloo/cosmetics";
export function useCosmetics(progress?:Pick<Journey,"completed"|"best">){
 const [prefs,setPrefs]=useState(defaultCosmetics),[saved,setSaved]=useState<Pick<Journey,"completed"|"best">>({completed:0,best:{}}),[ready,setReady]=useState(false),[writable,setWritable]=useState(true),[motionAllowed,setMotionAllowed]=useState(false);
 useEffect(()=>{
  try{const parsed=decodeCosmetics(localStorage.getItem(COSMETICS_KEY));if(parsed)setPrefs(parsed);else setWritable(false);const raw=localStorage.getItem(SAVE_KEY),journey=raw?decodeJourney(raw):null;if(journey){setSaved({completed:journey.completed,best:journey.best});setMotionAllowed(journey.motion);}}catch{setWritable(false);}setReady(true);
 },[]);
 const actual=progress??saved,earned=cosmeticEntitlements(actual);
 function toggle(id:Cosmetic){
  if(!ready||!writable||!earned[id])return;
  const next={...prefs,[id]:!prefs[id]};
  try{localStorage.setItem(COSMETICS_KEY,JSON.stringify(next));setPrefs(next);}catch{setWritable(false);}
 }
 return {prefs,earned,active:activeCosmetics(prefs,ready?earned:{crown:false,dream:false,legendary:false}),toggle,ready,writable,motionAllowed,progress:actual};
}
