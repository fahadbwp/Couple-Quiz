import Link from "next/link";
import {jellooEntryHref} from "@/lib/jelloo/campaign-v2/routes";
import { FriendsArt } from "@/components/quiz-home/Illustrations";
import { GAMES, type Game } from "@/lib/platform/games";
import styles from "./platform.module.css";
export function PlatformHeader({
  compact = false,
  preserveSession = false,
}: {
  compact?: boolean;
  preserveSession?: boolean;
}) {
  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <Link
        target={preserveSession ? "_blank" : undefined}
        rel={preserveSession ? "noopener" : undefined}
        title={
          preserveSession
            ? "Opens in a new tab; your quiz stays here"
            : undefined
        }
        href="/"
        className={styles.brand}
        aria-label="PlayNudge home"
      >
        <span aria-hidden="true" className={styles.mark}>
          p<span>n</span>
        </span>
        PlayNudge<span className={styles.dot}>.</span>
      </Link>
      <nav
        aria-label={
          preserveSession
            ? "PlayNudge navigation (opens in new tabs to keep your quiz)"
            : "PlayNudge navigation"
        }
        className={styles.nav}
      >
        <Link
          target={preserveSession ? "_blank" : undefined}
          rel={preserveSession ? "noopener" : undefined}
          href="/games"
        >
          All Games
        </Link>
        <Link
          target={preserveSession ? "_blank" : undefined}
          rel={preserveSession ? "noopener" : undefined}
          href={jellooEntryHref(process.env.NODE_ENV)}
        >
          Jelloo
        </Link>
        <Link
          target={preserveSession ? "_blank" : undefined}
          rel={preserveSession ? "noopener" : undefined}
          href="/quiz"
        >
          Friendship Quiz
        </Link>
      </nav>
    </header>
  );
}
export function GameArt({ game }: { game: Game }) {
  return (
    <div
      className={`${styles.art} ${game.id === "jelloo" ? styles.meadow : styles.friends}`}
      aria-hidden="true"
    >
      {game.artwork.kind === "bunny-sprite" ? (
        <>
          <span className={styles.orbit} />
          <span
            className={styles.bunny}
            style={{ backgroundImage: `url('${game.artwork.reference}')` }}
          />
          <span className={styles.spark}>✦</span>
        </>
      ) : (
        <FriendsArt />
      )}
      <span className={styles.artLabel}>
        {game.id === "jelloo"
          ? "A little path home"
          : "Made for your group chat"}
      </span>
    </div>
  );
}
export function GameCard({ game }: { game: Game }) {
  return (
    <article className={styles.card} data-game={game.id}>
      <GameArt game={game} />
      <div className={styles.cardBody}>
        <p className={styles.eyebrow}>{game.category}</p>
        <h2>{game.name}</h2>
        <p>{game.description}</p>
        <ul className={styles.tags}>
          {game.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <Link href={game.playUrl} className={styles.button}>
          {game.action}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
export function GameGrid() {
  return (
    <div className={styles.grid}>
      {GAMES.map((g) => (
        <GameCard key={g.id} game={g.id === "jelloo" ? {...g,playUrl:jellooEntryHref(process.env.NODE_ENV)} : g} />
      ))}
    </div>
  );
}
export function PlatformFooter() {

  return (
    <footer className={styles.footer}>
      <div>
        <strong>PlayNudge.</strong>
        <p>A little play goes a long way.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/privacy">Privacy</Link>
        <Link
          href="/games"
        >
          All Games
        </Link>
        <Link
          href="/quiz"
        >
          Friendship Quiz
        </Link>
        <Link
          href={jellooEntryHref(process.env.NODE_ENV)}
        >
          Jelloo
        </Link>
      </nav>
      <small>
        Jelloo adventure progress stays in your browser. Quiz links are shared
        by their creators. Keep your creator PIN and recovery codes private.
      </small>
    </footer>
  );
}
export { styles };
