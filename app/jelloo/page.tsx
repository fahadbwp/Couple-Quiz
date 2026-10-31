import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jelloo — Free Online Path Puzzle Game",
  description: "Rotate path tiles, guide your Jelly home and unlock new character powers in Jelloo Character Worlds.",
};

export default function JellooPage() {
  redirect("/jelloo/character-worlds");
}
