import type { Character, GameState } from "@/lib/jelloo/engine";
import styles from "./game.module.css";

export default function CharacterSprite({character="bunny",status="editing",animate=false}:{character?:Character;status?:GameState["status"];animate?:boolean}) {
  const name=character[0].toUpperCase()+character.slice(1);
  return character==="bunny"
    ? <div className={styles.bunny} data-state={status==="lost" ? "blocked" : status} data-animate={animate} role="img" aria-label={status==="won" ? "Bunny celebrates at home" : "Bunny"}><span className={styles.openEyes}/><span className={styles.closedEyes}/><span className={styles.earLayer}/></div>
    : <div className={styles.palSprite} data-character={character} data-state={status==="lost" ? "blocked" : status} data-animate={animate} role="img" aria-label={status==="won" ? `${name} celebrates at home` : name}/>;
}
