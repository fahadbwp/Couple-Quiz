"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {pageName} from "@/lib/analytics/schema";
import {trackEvent,trackSessionEvent} from "@/lib/analytics/client";
export default function AnalyticsBridge(){
 const pathname=usePathname();
 useEffect(()=>{
  const page=pageName(pathname);if(!page)return;
  trackSessionEvent("page_view",{page},page);
  if(page==="map")trackSessionEvent("level_map_open",{game:"jelloo"},"map");
 },[pathname]);
 useEffect(()=>{
  const click=(e:MouseEvent)=>{
   const link=e.target instanceof Element?e.target.closest("article[data-game] a"):null;
   const game=link?.closest("[data-game]")?.getAttribute("data-game");
   if(game==="jelloo"||game==="friendship-quiz")trackEvent("game_card_click",{game},`card:${Date.now()}`);
  };
  document.addEventListener("click",click);return()=>document.removeEventListener("click",click);
 },[]);
 return null;
}
