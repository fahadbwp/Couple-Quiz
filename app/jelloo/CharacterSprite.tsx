import type { Character, GameState } from "@/lib/jelloo/engine";
import styles from "./game.module.css";

export type AnimationState = GameState["status"] | "blocked" | "collecting" | "power";

export interface CharacterSpriteProps {
  character?: Character;
  status?: AnimationState;
  animate?: boolean;
  powerActive?: boolean;
}

export default function CharacterSprite({
  character = "bunny",
  status = "editing",
  animate = false,
  powerActive = false,
}: CharacterSpriteProps) {
  const name = character[0].toUpperCase() + character.slice(1);
  const resolvedState = powerActive
    ? "power"
    : status === "lost"
    ? "blocked"
    : status;

  if (character === "bunny") {
    return (
      <div
        className={styles.bunny}
        data-state={resolvedState}
        data-animate={animate}
        data-power={powerActive ? "true" : undefined}
        role="img"
        aria-label={
          status === "won"
            ? "Bunny celebrates at home"
            : powerActive
            ? "Bunny leap power active"
            : status === "lost" || status === "blocked"
            ? "Bunny path blocked"
            : "Bunny"
        }
      >
        <span className={styles.openEyes} />
        <span className={styles.closedEyes} />
        <span className={styles.earLayer} />
        {powerActive ? <span className={styles.powerHalo} aria-hidden="true" /> : null}
      </div>
    );
  }

  return (
    <div
      className={styles.palSprite}
      data-character={character}
      data-state={resolvedState}
      data-animate={animate}
      data-power={powerActive ? "true" : undefined}
      role="img"
      aria-label={
        status === "won"
          ? `${name} celebrates at home`
          : powerActive
          ? `${name} power active`
          : status === "lost" || status === "blocked"
          ? `${name} path blocked`
          : name
      }
    >
      {powerActive ? <span className={styles.powerHalo} aria-hidden="true" /> : null}
    </div>
  );
}
