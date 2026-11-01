import { redirect } from "next/navigation";
import { pageMetadata } from "@/lib/platform/site";

export const metadata = pageMetadata(
  "Jelloo — Free Online Path Puzzle Game",
  "Rotate path tiles, guide your Jelly home and unlock new character powers in Jelloo Character Worlds.",
  "/jelloo",
);

export default function JellooPage() {
  redirect("/jelloo/character-worlds");
}
