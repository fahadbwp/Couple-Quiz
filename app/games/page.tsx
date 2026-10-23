import {
  PlatformHeader,
  PlatformFooter,
  GameGrid,
  styles,
} from "@/components/platform/Platform";
import { GAMES, gameSchema } from "@/lib/platform/games";
import { pageMetadata, sitePolicy, jsonLd } from "@/lib/platform/site";
export const metadata = pageMetadata(
  "Free Browser Games — Play Online",
  "Explore PlayNudge's free browser games: Jelloo Puzzle Adventure and Friendship Quiz. Pick a game and start playing on mobile or desktop.",
  "/games",
);
export default function Games() {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main">
        Skip to games
      </a>
      <PlatformHeader />
      <main id="main" className={styles.main}>
        <div className={styles.libraryIntro}>
          <p className={styles.eyebrow}>The games library</p>
          <h1>What will you play today?</h1>
          <p>
            Unwind with a path puzzle or challenge your friends. Both games are
            free to play in your browser.
          </p>
        </div>
        <GameGrid />
      </main>
      <PlatformFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: GAMES.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: gameSchema(g, sitePolicy().origin),
            })),
          }),
        }}
      />
    </div>
  );
}
