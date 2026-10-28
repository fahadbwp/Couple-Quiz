"use client";
import {useEffect,useRef} from "react";
import Link from "next/link";
import {CHARACTER_WORLDS,LOCAL_STAR_GATES} from "@/lib/jelloo/campaign";
import {previewAccess} from "@/lib/jelloo/campaign-v2/preview-session";
import {BUNNY_LEVELS_PATH,BUNNY_WORLDS_PATH,worldLevelHref} from "@/lib/jelloo/campaign-v2/routes";
import type {BunnySave} from "@/lib/jelloo/campaign-v2/bunny-save";
import CharacterSprite from "../CharacterSprite";
import s from "./scene.module.css";
export function SceneIcon({name}:{name:"home"|"levels"|"worlds"|"lock"}) {
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name==="home"?<><path d="m4 15 12-10 12 10M8 13v14h16V13M13 27v-9h6v9"/></>:name==="levels"?<><path d="M8 25C28 25 4 7 24 7" strokeDasharray="2 4"/><circle cx="8" cy="25" r="4" fill="#ffcc75"/><circle cx="24" cy="7" r="4" fill="#ffa2cb"/></>:name==="worlds"?<><path d="m3 8 8-3 10 4 8-3v21l-8 3-10-4-8 3ZM11 5v21M21 9v21"/></>:<><rect x="7" y="14" width="18" height="15" rx="5" fill="#f8e1ef"/><path d="M11 14V9a5 5 0 0 1 10 0v5M16 20v3"/></>}</svg>;
}
function point(index:number){
 const stops=[{x:62,y:96},{x:180,y:132},{x:298,y:96},{x:298,y:248},{x:180,y:282},{x:62,y:248}];
 const p=stops[index%6];return {...p,y:p.y+Math.floor(index/6)*310};
}
const points=Array.from({length:50},(_,i)=>point(i));
const path=points.map((p,i)=>{if(!i)return `M${p.x} ${p.y}`;const a=points[i-1],mid=(a.x+p.x)/2;return a.x===p.x?`C${a.x+25} ${a.y+55} ${p.x+25} ${p.y-55} ${p.x} ${p.y}`:`C${mid} ${a.y} ${mid} ${p.y} ${p.x} ${p.y}`}).join(" ");
const height=Math.ceil(points.length/6)*310+20;
export function BunnyLevelTrail({save,stars}:{save:BunnySave;stars:number}) {
 const trailRef=useRef<HTMLElement>(null);
 useEffect(()=>{trailRef.current?.querySelector("[aria-current=step]")?.scrollIntoView({block:"center",behavior:"instant"})},[save.completed]);
 return <section ref={trailRef} className={s.levelScene} aria-label="Pink Candy Land levels">
  <div className={s.mapHeading}><Link href={BUNNY_WORLDS_PATH} className={s.worldTitle}>Pink Candy Land</Link><span className={s.starCounter}>★ {stars}<small>/150</small></span></div>
  <div className={s.trail} style={{aspectRatio:`360 / ${height}`}}>
   <svg className={s.path} viewBox={`0 0 360 ${height}`} aria-hidden="true"><defs><linearGradient id="candyPath" x2="0" y2="1"><stop stopColor="#fff7dc"/><stop offset="1" stopColor="#ffdcad"/></linearGradient></defs>{Array.from({length:9},(_,i)=><g key={i} transform={`translate(0 ${i*310})`}><path d="M18 72Q180 15 342 65L342 263Q185 320 18 267Z" fill="#dc96b7"/><path d="M18 60Q180 3 342 53L342 251Q185 308 18 255Z" fill={i%2?"#f8d7e6":"#f5c9df"} stroke="#fff1f8" strokeWidth="4"/>{[25,333].map((x,j)=><g key={x} transform={`translate(${x} ${j?176:162})`}><path d="M0 0v35" stroke="#d994af" strokeWidth="5"/><circle r="15" fill="#ff9fc8" stroke="#fff2fa" strokeWidth="4"/><path d="M-8-2Q0-12 7 0T-4 8" stroke="#fff3f9" strokeWidth="3" fill="none"/></g>)}</g>)}<path d={path} stroke="#d677aa55" strokeWidth="23" fill="none"/><path d={path} stroke="url(#candyPath)" strokeWidth="15" fill="none"/><path d={path} stroke="#eab477" strokeWidth="3" strokeDasharray="1 12" strokeLinecap="round" fill="none"/></svg>
   {Array.from({length:22},(_,i)=><span key={`sweet-${i}`} className={s.mapSweet} style={{left:`${i%2?87:3}%`,top:`${(i+.5)/22*100}%`}} aria-hidden="true">{i%3===0?"✿":i%3===1?"♡":"✦"}</span>)}
   {points.map((p,index)=>{
    const id=index+1,access=previewAccess(id,save),best=save.best[id]??0,current=id===Math.min(save.completed+1,50),quota=LOCAL_STAR_GATES[id];
    const label=`Level ${id}, ${best} of 3 stars${current?", current level":""}${!access.accessible?`, locked. ${access.details}`:""}`;
    const contents=<>{current&&<span className={s.currentPal} aria-hidden="true"><CharacterSprite character="bunny"/></span>}<span className={s.nodeFace}>{!access.accessible?<span className={s.smallLock}><SceneIcon name="lock"/></span>:null}<b>{id}</b></span><span className={s.nodeStars} aria-hidden="true">{"★".repeat(best)}<i>{"★".repeat(3-best)}</i></span>{!access.accessible&&quota?<span className={s.gateCost} aria-hidden="true">{quota} ★</span>:null}</>;
    const props={className:s.node,style:{left:`${p.x/360*100}%`,top:`${p.y/height*100}%`},"aria-label":label,"data-complete":best>0,"data-current":current};
    return access.accessible?<Link {...props} key={id} href={worldLevelHref(id)} aria-current={current?"step":undefined}>{contents}</Link>:<button {...props} key={id} disabled>{contents}</button>;
   })}
  </div>
 </section>;
}
function IslandGround({number}:{number:number}) {
 const colors=[["#ffc5df","#e97daa","#fff1b6"],["#abdc64","#5baf64","#78c6c9"],["#ffd0a0","#df9b77","#c6b2f2"],["#7ce6ef","#438bce","#d0aeff"],["#ffc76f","#c17d4e","#f8e6aa"]][number];
 return <svg viewBox="0 0 400 220" className={s.islandGround} aria-hidden="true"><ellipse cx="200" cy="177" rx="172" ry="32" fill="#ffffff88"/><path d="m28 123 39-59 91-31 109 10 105 57-5 55-65 42-113 13-125-40Z" fill={colors[1]} stroke="#fff5df" strokeWidth="5"/><path d="m28 117 39-59 91-31 109 10 105 57-72 46-108 17-121-11Z" fill={colors[0]}/><path d="M77 113Q140 51 195 101T324 95" fill="none" stroke={colors[2]} strokeWidth="18" strokeLinecap="round"/><path d="M77 113Q140 51 195 101T324 95" fill="none" stroke="#fff8d7" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round"/>{[70,128,276,321].map((x,i)=><g key={x} transform={`translate(${x},${i%2?55:96})`}><path d="M0 0v30" stroke="#aa795b" strokeWidth="7"/><circle r="16" fill={colors[1]}/><circle cx="-10" cy="-6" r="13" fill={number===0?"#ff90c3":colors[0]}/><circle cx="9" cy="-10" r="13" fill={number===0?"#fff1fa":colors[1]}/></g>)}</svg>;
}
export function BunnyWorldAtlas({save,stars}:{save:BunnySave;stars:number}) {
 const qualified=save.completed===50&&stars>=120;
 return <section className={s.atlas} aria-label="Worlds"><h1 className={s.atlasTitle}>Worlds</h1><div className={s.islands}>
  <svg viewBox="0 0 400 1500" className={s.worldPath} preserveAspectRatio="none" aria-hidden="true"><path d="M120 120C340 200 50 350 270 440S80 670 160 760S350 900 240 1070S120 1220 270 1380" stroke="#bb77ab" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" fill="none"/></svg>
  {CHARACTER_WORLDS.map((world,i)=>{const contents=<><IslandGround number={i}/><span className={s.islandPal}><CharacterSprite character={world.mascot}/></span><span className={s.islandLabel}>{world.name}</span><span className={s.worldRange}>{world.startLevel}–{world.endLevel}</span>{i===0?<span className={s.islandProgress}>★ {stars}/150</span>:<span className={s.worldLock}><SceneIcon name="lock"/><span>{i===1&&!qualified?`${Math.min(save.completed,50)}/50 · ${Math.min(stars,120)}/120 ★`:"Soon"}</span></span>}</>;
   return i===0?<Link key={world.id} href={BUNNY_LEVELS_PATH} className={s.island} data-world={i} aria-label="Pink Candy Land, Levels 1 to 50">{contents}</Link>:<div key={world.id} className={s.island} data-world={i} data-locked="true" aria-label={`${world.name}, locked, ${i===1&&!qualified?"complete 50 Bunny levels and earn 120 stars; content coming later":"coming later"}`} role="group">{contents}</div>;
  })}
 </div></section>;
}
