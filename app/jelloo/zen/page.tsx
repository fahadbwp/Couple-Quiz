import type { Metadata } from "next";
import ZenGame from "./ZenGame";

export const metadata: Metadata = {
  title: "Jelloo — Zen Mode",
  description: "Infinite, stress-free puzzle solving with no move limits and customizable world atmospheres.",
  robots: { index: false, follow: false },
};

export default function ZenPage() {
  return <ZenGame />;
}
