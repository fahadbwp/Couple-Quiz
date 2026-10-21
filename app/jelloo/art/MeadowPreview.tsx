"use client";

import { useState } from "react";
import styles from "./meadow.module.css";

type Pose = "auto" | "open" | "blink";
// A fixed art composition, not a level or pathfinding implementation.
const route: Record<number, { corner?: boolean; turn: number }> = {
  20: { corner: true, turn: 0 }, 15: { turn: 90 },
  10: { corner: true, turn: 90 }, 11: { turn: 0 },
  12: { corner: true, turn: 270 }, 7: { turn: 90 },
  2: { corner: true, turn: 90 }, 3: { turn: 0 }, 4: { turn: 0 },
};

function Bunny({ pose, moving }: { pose: Pose; moving: boolean }) {
  return <div className={styles.bunnyAnchor}>
    <div className={styles.shadow} />
    <div className={styles.bunny} data-pose={pose} data-moving={moving} role="img" aria-label={`Pink jelly Bunny, ${pose === "auto" ? "idle with occasional blinking" : pose === "blink" ? "eyes closed" : "eyes open"}`}>
      <span className={styles.openFrame}/><span className={styles.closedFrame}/>
    </div>
  </div>;
}

export default function MeadowPreview() {
  const [moving, setMoving] = useState(true);
  const [pose, setPose] = useState<Pose>("auto");
  return <section className={styles.preview} aria-labelledby="meadow-title">
    <div className={styles.heading}><div><p>WORLD 01 · MEADOW</p><h2 id="meadow-title">A little path. A little pal.</h2></div><span className={styles.previewBadge}>Visual preview</span></div>
    <div className={styles.layout}>
      <div className={styles.stage}>
        <div className={styles.stageTop}><span>Bunny’s first adventure</span><span aria-label="Three unearned stars">☆ ☆ ☆</span></div>
        <div className={styles.board} role="img" aria-label="Five by five Meadow visual board, Bunny at the bottom left and a cottage at the top right. This board is not playable yet.">
          {Array.from({length:25}, (_, i) => <div key={i} className={styles.cell}>
            {route[i] ? <div className={`${styles.path} ${route[i].corner ? styles.corner : ""}`} style={{transform:`rotate(${route[i].turn}deg)`}}/> : <span className={styles.blank}/>}
            {i === 20 ? <div className={styles.boardBunny}><Bunny pose={pose} moving={moving}/></div> : null}
            {i === 4 ? <><span className={styles.cottage}/><span className={styles.home}>HOME</span></> : null}
          </div>)}
        </div>
        <p className={styles.stageHint}>Bunny is getting ready. The puzzle comes next.</p>
      </div>
      <aside className={styles.inspector} aria-label="Bunny animation preview controls">
        <div className={styles.portrait}><Bunny pose={pose} moving={moving}/></div>
        <h3>Meet Bunny</h3><p>Same pink jelly pal. Now with a clear background and a little blink.</p>
        <fieldset className={styles.poseControls}><legend>Expression</legend>{([['auto','Auto blink'],['open','Eyes open'],['blink','Blink pose']] as const).map(([value,label]) => <label key={value}><input type="radio" name="bunny-pose" value={value} checked={pose === value} onChange={() => setPose(value)}/><span>{label}</span></label>)}</fieldset>
        <button className={styles.motionButton} type="button" aria-pressed={!moving} onClick={() => setMoving(v => !v)}>{moving ? "Pause animation" : "Resume animation"}</button>
        <small>Reduced-motion preference automatically stops idle movement and automatic blinking. A static blink pose can still be selected.</small>
      </aside>
    </div>
    <p className={styles.disclosure}>Bunny, cottage and board tiles are AI-edited derivatives using only your approved sheet as the art reference. The original is preserved below for comparison. This is a layout and animation preview, not a playable level.</p>
  </section>;
}
