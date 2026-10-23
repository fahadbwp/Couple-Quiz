"use client";
import { useEffect, useRef, useState } from "react";
import { codeValid, rewardCatalog, type ReferralStatus } from "@/lib/jelloo/referrals/protocol";
import { referralRequest } from "./client";
import ReferralPlay from "./ReferralPlay";
import styles from "./invite.module.css";

export default function Invite(){
  const [status,setStatus]=useState<ReferralStatus|null>(null),[code,setCode]=useState(""),[recovery,setRecovery]=useState(""),[restore,setRestore]=useState("");
  const [message,setMessage]=useState("Loading referral status…"),[busy,setBusy]=useState(false),[playing,setPlaying]=useState(false),[shareUrl,setShareUrl]=useState("");
  const inFlight=useRef(false);
  useEffect(()=>{
    const value=new URL(window.location.href).searchParams.get("ref") ?? "";
    setCode(value);
    let active=true;
    referralRequest({op:"status"}).then(data=>{if(active){setStatus(data.status);setMessage("");}}).catch(e=>{if(active)setMessage(e.message);});
    return()=>{active=false;};
  },[]);
  useEffect(()=>{if(status)setShareUrl(`${window.location.origin}/jelloo/invite?ref=${status.code}`);},[status]);
  async function run(body:Record<string,unknown>){
    if(inFlight.current)return;
    inFlight.current=true;setBusy(true);setMessage("");
    try {const data=await referralRequest(body);setStatus(data.status);if(data.recovery)setRecovery(data.recovery);if(body.op==="restore"){setRestore("");setRecovery("");}}
    catch(e){setMessage(e instanceof Error?e.message:"Please retry.");}
    finally{inFlight.current=false;setBusy(false);}
  }
  async function copy(text:string){try{await navigator.clipboard.writeText(text);setMessage("Copied.");}catch{setMessage("Copy is unavailable. Select and copy the visible text manually.");}}
  async function share(){try{if(navigator.share)await navigator.share({title:"Play Jelloo with me",text:"Complete the verified Levels 1–10 journey to qualify my invite. Rewards are cosmetic only.",url:shareUrl});else await copy(shareUrl);}catch{setMessage("Sharing cancelled or unavailable. You can copy the link instead.");}}
  if(playing && status?.challenge) return <ReferralPlay key={status.challenge.id+status.challenge.nonce} challenge={status.challenge} onAccepted={s=>{setStatus(s);setPlaying(false);}} onExit={()=>setPlaying(false)}/>;
  return <main className={styles.page}>
    <a href="/jelloo">← Jelloo adventure</a><h1>Invite Friends & Earn</h1>
    <p>Cosmetic rewards only. No cash, faster unlocks or puzzle advantages.</p>
    <p>Friends qualify after the server verifies their original Levels 1–10 journey. Existing local wins alone cannot qualify. Your normal adventure save stays separate.</p>
    <p role="status" aria-live="polite" className={styles.status}>{message}</p>
    {!status && <section className={styles.panel}><h2>Start without an account</h2><p>We use a private browser cookie, not your name or email. Save your recovery code to restore earned rewards later.</p><button disabled={busy} onClick={()=>run({op:"register"})}>Create my invite identity</button></section>}
    {recovery && <section className={styles.panel}><h2>Save your private recovery code</h2><p>Shown only now. Anyone with this code can access your referral identity. Do not put it in an invite link. We cannot recover it for you.</p><label htmlFor="recovery">Recovery code</label><input id="recovery" readOnly value={recovery}/><button onClick={()=>copy(recovery)}>Copy recovery code</button><button onClick={()=>setRecovery("")}>I saved it — hide code</button></section>}
    {code && <section className={styles.panel}><h2>Your friend’s invite</h2><p>{status?.referred==="qualified"?"Qualified — your friend has received credit.":"Pending until your verified Level 10 completion. Sessions last 24 hours; expired sessions restart at Level 1."}</p>
      {!codeValid(code)?<p className={styles.error}>This invite link is malformed.</p>:<button disabled={busy || !status || status.referred==="qualified"} onClick={()=>run({op:"start",code})}>Accept invite / refresh session</button>}
    </section>}
    {status && <>
      {status.challenge && <section className={styles.panel}><h2>Verified journey</h2><p>Next: Level {status.challenge.level} of 10. Server-accepted levels survive refresh; unfinished attempts can be restarted safely.</p><p>Expires {new Date(status.challenge.expires).toLocaleString()}.</p><button disabled={busy || Date.parse(status.challenge.expires)<=Date.now()} onClick={()=>setPlaying(true)}>Play verified Level {status.challenge.level}</button></section>}
      <section className={styles.panel}><h2>Your invite link</h2><label htmlFor="share-url">Share this public link</label><input id="share-url" value={shareUrl} readOnly/><p>Valid until {new Date(status.linkExpires).toLocaleDateString()}. Renewing invalidates old links; accepted invitations keep their attribution.</p><button onClick={()=>copy(shareUrl)}>Copy invite link</button><button onClick={share}>Share invite</button><button disabled={busy} onClick={()=>run({op:"renew"})}>Renew link</button></section>
      <section className={styles.panel}><h2>Your referral progress</h2><p>{status.qualified} qualified · {status.pending} pending</p><progress value={Math.min(5,status.qualified)} max={5} aria-label={`${status.qualified} of 5 qualified friends`}/>
        <ul className={styles.rewards}>{rewardCatalog.map(r=><li key={r.threshold}><strong>{r.threshold} friend{r.threshold>1?"s":""}: {r.name}</strong><p>{!status.rewards.includes(r.threshold)?"Locked — awaiting qualified friends.":r.available?"Earned and available below.":"Earned entitlement — approved cosmetic asset unavailable; not applied to the game."}</p></li>)}</ul>
        {status.rewards.includes(5) && <p className={styles.badge} aria-label="Earned Jelloo Ambassador badge">Jelloo Ambassador</p>}
        <button disabled={busy} onClick={()=>run({op:"status"})}>Refresh progress</button>
      </section>
    </>}
    <section className={styles.panel}><h2>Restore earned rewards</h2><p>Enter the private recovery code from the identity that earned them. Restoring switches this browser to that identity; save your current code first.</p><label htmlFor="restore">Private recovery code</label><input id="restore" type="password" autoComplete="off" spellCheck={false} maxLength={64} value={restore} onChange={e=>setRestore(e.target.value)}/><button disabled={busy || !/^[0-9a-f]{64}$/.test(restore)} onClick={()=>run({op:"restore",recovery:restore})}>Restore identity & rewards</button></section>
    <p>No invasive fingerprinting. Verification proves legal puzzle actions, not that each browser represents a different human. Automated or multi-browser abuse remains possible.</p>
  </main>;
}
