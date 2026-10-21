import type { Metadata } from "next";
import JellooGame from "./JellooGame";

export const metadata: Metadata = {
  title: "Jelloo — A little path home",
  description: "Guide Bunny home through ten tutorials and an endless meadow of changing puzzles. Resume your adventure on this browser.",
  alternates: { canonical: "/jelloo" },
  robots: { index: false, follow: false },
  openGraph: { title: "Jelloo — A little path home", description: "Bunny’s endless Meadow adventure.", images: [] },
  twitter: { card: "summary", title: "Jelloo — A little path home", description: "Bunny’s endless Meadow adventure.", images: [] },
};

export default function JellooPage() { return <JellooGame/>; }
