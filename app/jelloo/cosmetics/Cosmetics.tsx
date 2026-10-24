"use client";
import Link from "next/link";
import {useState} from "react";
import {useCosmetics} from "@/components/jelloo/useCosmetics";
import {CrownedPal,LegendaryCelebration} from "@/components/jelloo/PremiumEffects";
import {COSMETICS} from "@/lib/jelloo/cosmetics";
import CharacterSprite from "../CharacterSprite";
import type {Character} from "@/lib/jelloo/engine";
import styles from "./cosmetics.module.css";
export default function Cosmetics(){
 const {prefs,earned,toggle,ready,writable,motionAllowed,progress}=useCosmetics();
 const [pal,setPal]=useState<Character>("bunny"),[preview,setPreview]=useState(false);
 return <main className={styles.page}><Link href="/jelloo/map">← Adventure Map</Link><h1>Your little luxuries</h1><p>Earn cosmetic extras through Adventure achievements. Your pals keep their own powers, and every puzzle follows the same rules.</p><p>Referrals are not available yet. No friends required to earn these extras.</p><p>{progress.completed} Adventure levels completed</p>{!ready?<p role="status">Opening your collection…</p>:null}{!writable?<p role="alert">Cosmetic settings could not be read or saved. Existing data is preserved.</p>:null}
 <div className={styles.cards}>{COSMETICS.map(c=><section key={c.id} className={styles.card}><h2>{c.name}</h2><p>{c.levels} Adventure levels{c.stars?` and ${c.stars} stars across Levels 1–100`:""} · or {c.referrals} qualified friend{c.referrals>1?"s":""} when referrals launch.</p>
 {c.id==="crown"?<><div className={styles.portrait}><CrownedPal active><CharacterSprite character={pal}/></CrownedPal></div><label>Preview pal<select value={pal} onChange={e=>setPal(e.target.value as Character)}>{["bunny","panda","cat","octopus","fox"].map(p=><option key={p}>{p}</option>)}</select></label><small>Preview only. Equipping applies to eligible in-game pals, including your Favourite.</small></>:c.id==="dream"?<div className={styles.palette} aria-label="Dream palette preview: lavender, cloud blue and mint"><span/><span/><span/></div>:<><button onClick={()=>setPreview(!preview)}>Preview celebration</button><LegendaryCelebration active={preview} animate={motionAllowed} preview/></>}
 <p>{earned[c.id]?"Earned through Adventure":"Keep exploring to unlock"}</p><button disabled={!ready||!writable||!earned[c.id]} aria-pressed={prefs[c.id]&&earned[c.id]} onClick={()=>toggle(c.id)}>{prefs[c.id]&&earned[c.id]?`Unequip ${c.name}`:`Equip ${c.name}`}</button></section>)}</div>
 <p>Cosmetics and Adventure progress save in this browser. Client-only achievement cosmetics can be edited or lost with browser storage; they do not prove any server referral qualification.</p></main>;
}
