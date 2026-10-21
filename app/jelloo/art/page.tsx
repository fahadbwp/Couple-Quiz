import type { Metadata } from "next";
import styles from "./reference.module.css";
import MeadowPreview from "./MeadowPreview";

export const metadata: Metadata = {
  title: "Jelloo — Art room",
  description: "Jelloo character and environment study using the approved reference.",
  robots: { index: false, follow: false },
};

// Pixel windows into the unmodified 1536 × 1024 approved reference.
// These are reference crops, not transparent production sprites.
function Crop({ box, label, className = "" }: {
  box: [number, number, number, number]; label: string; className?: string;
}) {
  const [x, y, w, h] = box;
  return <div role="img" aria-label={label} className={`${styles.crop} ${className}`} style={{
    aspectRatio: `${w} / ${h}`,
    backgroundSize: `${1536 / w * 100}% ${1024 / h * 100}%`,
    backgroundPosition: `${x / (1536 - w) * 100}% ${y / (1024 - h) * 100}%`,
  }} />;
}

const poses: {name: string; box: [number, number, number, number]}[] = [
  {name: "Idle", box: [24, 395, 83, 118]},
  {name: "Squash", box: [109, 395, 83, 118]},
  {name: "Move 1", box: [196, 395, 83, 118]},
  {name: "Move 2", box: [282, 395, 83, 118]},
  {name: "Move 3", box: [368, 395, 92, 118]},
  {name: "Jump", box: [467, 370, 86, 143]},
  {name: "Land", box: [554, 395, 82, 118]},
];

export default function JellyPalsReference() {
  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}>
        <a href="/jelloo">← Play Jelloo</a>
        <span>JELLOO · ART ROOM</span>
      </header>
      <MeadowPreview />
      <section className={styles.hero} aria-labelledby="bunny-title">
        <div className={styles.intro}>
          <p className={styles.wordmark}>Jelloo.</p>
          <p className={styles.eyebrow}>A LITTLE HOP. A BIG ADVENTURE.</p>
          <h1 id="bunny-title">Meet your first<br/><em>Jelly Pal.</em></h1>
          <p className={styles.description}>Soft, squishy, and always curious. Bunny is ready to find a little path home.</p>
          <div className={styles.tags}><span>Cheerful</span><span>Curious</span><span>One-gap jump</span></div>
          <a className={styles.button} href="#poses">Explore Bunny’s poses ↓</a>
        </div>
        <div className={styles.characterCard}>
          <span className={styles.badge}>YOUR FIRST CHARACTER</span>
          <Crop box={[338, 75, 137, 166]} label="Approved pink jelly Bunny with long ears, rosy cheeks and tiny feet" className={styles.bunny}/>
          <h2>Bunny</h2><p>Small paws. Big bestie energy.</p>
          <div className={styles.motionNote}>Gentle idle motion · respects reduced-motion settings</div>
        </div>
      </section>
      <section id="poses" className={styles.section} aria-labelledby="poses-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>CHARACTER STUDY</p><h2 id="poses-title">Every hop has personality.</h2></div><span>Original reference poses</span></div>
        <div className={styles.poseGrid}>{poses.map(p => <figure key={p.name} className={styles.pose}><Crop box={p.box} label={`Bunny ${p.name} pose from the approved reference`}/><figcaption>{p.name}</figcaption></figure>)}</div>
      </section>
      <section className={styles.worldGrid} aria-label="Meadow environment and starter tiles">
        <article className={styles.world}>
          <p className={styles.eyebrow}>WORLD 01</p><h2>A home in the Meadow.</h2>
          <Crop box={[21, 581, 282, 176]} label="Approved Meadow environment: grassy paths, trees, flowers and a wooden bridge"/>
          <p>Warm greens, soft paths, and a tiny adventure waiting around every corner.</p>
        </article>
        <article className={styles.tiles}>
          <p className={styles.eyebrow}>STARTER ASSET STUDY</p><h2>The path begins here.</h2>
          <div className={styles.tileGrid}>{[
            {name:"Straight", x:660}, {name:"Corner", x:742}, {name:"T-junction", x:822}, {name:"Cross", x:901},
          ].map(t => <figure key={t.name}><Crop box={[t.x, 405, 79, 84]} label={`${t.name} tile from the approved reference`}/><figcaption>{t.name}</figcaption></figure>)}</div>
          <p>Original tile studies, retained for comparison with the playable Jelloo board.</p>
        </article>
      </section>
      <aside className={styles.note}><strong>One approved reference. A growing asset kit.</strong><p>The study gallery uses unchanged windows into your original sheet. The Meadow preview uses a transparent, AI-edited Bunny derivative with open-eye and blink frames. Your original remains here for comparison. Full movement sprite sets remain future work.</p><a href="/jelly-pals/approved-reference.png" target="_blank" rel="noreferrer">Open full approved reference ↗</a></aside>
      <footer className={styles.footer}>Jelloo · Bunny & Meadow art room</footer>
    </div>
  </main>;
}


