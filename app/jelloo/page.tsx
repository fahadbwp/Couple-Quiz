import JellooGame from "./JellooGame";
import { pageMetadata, sitePolicy, jsonLd } from "@/lib/platform/site";
import { GAMES, gameSchema } from "@/lib/platform/games";
import Link from "next/link";
import styles from "@/components/platform/platform.module.css";
export const metadata = pageMetadata(
  "Jelloo — Free Online Path Puzzle Game",
  "Rotate path tiles, guide your Jelly home and unlock new character powers in Jelloo. Play the free puzzle adventure, Daily Puzzle or relaxing Zen Mode.",
  "/jelloo",
);
export default function JellooPage() {
  return (
    <>
      <JellooGame />
      <section className={styles.main} aria-labelledby="about-jelloo">
        <h2 id="about-jelloo" className={styles.sectionTitle}>A little path home</h2>
        <p>Jelloo is a free online path puzzle game. Rotate tiles to connect a route from your Jelly to its home. Each quarter-turn uses one move. Collect golden stars along the way and finish before your moves run out.</p>
        <p>Start with Bunny and discover new pals and worlds as your adventure grows. Your progress stays in this browser. For a different pace, try the <Link href="/jelloo/daily">Daily Puzzle</Link> or relax without a move limit in <Link href="/jelloo/zen">Zen Mode</Link>.</p>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(gameSchema(GAMES[0], sitePolicy().origin)),
        }}
      />
    </>
  );
}
