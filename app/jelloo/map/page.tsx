import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adventure Map — Jelloo",
  description: "Character Worlds adventure map.",
  robots: "noindex",
};

export default function MapPage() {
  redirect("/jelloo/character-worlds?view=levels");
}
