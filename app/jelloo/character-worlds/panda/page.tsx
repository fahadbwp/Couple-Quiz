import { Suspense } from "react";
import { allPandaLevels } from "@/lib/jelloo/campaign-v2/panda-provider";
import PandaCampaign from "../PandaCampaign";
import { pageMetadata } from "@/lib/platform/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Panda Bamboo Jungle (Levels 51–100) — Jelloo",
  "Play Panda Bamboo Jungle Levels 51 to 100 in Jelloo. Guide Panda across 5x4 boards, smash cracked stone tiles, and connect paths home.",
  "/jelloo/character-worlds/panda",
);

export default function PandaAdventure() {
  return (
    <Suspense fallback={<p>Opening Bamboo Jungle…</p>}>
      <PandaCampaign levels={allPandaLevels()} />
    </Suspense>
  );
}
