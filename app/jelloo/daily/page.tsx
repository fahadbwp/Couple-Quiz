import type { Metadata } from "next";
import DailyGame from "./DailyGame";

export const metadata: Metadata = {
  title: "Jelloo — Daily Puzzle",
  description: "One fresh, deterministic puzzle every 24 hours. Keep your daily streak alive!",
  robots: { index: false, follow: false },
};

export default function DailyPage() {
  return <DailyGame />;
}
