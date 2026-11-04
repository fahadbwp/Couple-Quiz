import Link from "next/link";
import {
  PlatformHeader,
  PlatformFooter,
  GameGrid,
  styles,
} from "@/components/platform/Platform";
import { pageMetadata, sitePolicy, jsonLd } from "@/lib/platform/site";
export const metadata = pageMetadata(
  "Free Online Games — Play Puzzle & Friend Games",
  "Play Daily Path's logic challenges, Jelloo's path puzzles, or make a Friendship Quiz to share. Discover free browser games on PlayNudge, with no app download needed.",
  "/",
);
export default function Home() {
  const { origin } = sitePolicy();
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main">
        Skip to games
      </a>
      <PlatformHeader />
      <main id="main" className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Small games. Good times.</p>
          <h1>
            Play free online games.
            <br />
            <span>Find your little escape.</span>
          </h1>
          <p>
            A daily logic puzzle to challenge your mind. An adventure to unwind
            with. A quiz to bring friends together. Pick your kind of fun and
            play right in your browser.
          </p>
          <Link className={styles.button} href="/games">
            Explore games <span aria-hidden="true">↗</span>
          </Link>
        </section>
        <section aria-label="Featured games">
          <p className={styles.sectionTitle}>Three ways to make your day</p>
          <GameGrid />
        </section>
        <section className={styles.explore}>
          <div>
            <h2 className={styles.sectionTitle}>Your next small adventure</h2>
            <p>
              Explore our puzzle and social games. No downloads, just a browser
              and a moment to play.
            </p>
          </div>
          <Link href="/games">Browse all games →</Link>
        </section>
        <section className={styles.about}>
          <p className={styles.eyebrow}>Welcome to PlayNudge</p>
          <h2 className={styles.sectionTitle}>
            A little play goes a long way.
          </h2>
          <p>
            PlayNudge is a home for free browser games. Solve today&apos;s Daily Path
            puzzle, find your way through Jelloo’s adventures, or turn everyday
            things about you into a Friendship Quiz. Three original, handcrafted
            web games designed for your phone, tablet or computer.
          </p>
        </section>
      </main>
      <PlatformFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${origin}/#website`,
                name: "PlayNudge",
                url: origin,
                inLanguage: "en",
                description: "Free browser puzzle and friendship games.",
                publisher: {
                  "@type": "Organization",
                  "@id": `${origin}/#organization`,
                  name: "PlayNudge",
                  url: origin,
                  logo: `${origin}/playnudge.svg`,
                },
              },
              {
                "@type": "Organization",
                "@id": `${origin}/#organization`,
                name: "PlayNudge",
                url: origin,
                logo: `${origin}/playnudge.svg`,
              },
            ],
          }),
        }}
      />
    </div>
  );
}
