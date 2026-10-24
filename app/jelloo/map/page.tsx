import type { Metadata } from "next";
import LevelMap from "./LevelMap";

export const metadata: Metadata = {
  title: "Adventure Map — Jelloo",
  description: "All 100 Jelloo Adventure levels. See your progress, replay completed levels and pick up where you left off.",
  robots: "noindex",
};

export default function MapPage() {
  return <LevelMap />;
}
