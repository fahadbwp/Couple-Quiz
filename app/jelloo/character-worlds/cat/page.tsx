import { Suspense } from "react";
import { allCatLevels } from "@/lib/jelloo/campaign-v2/cat-provider";
import CatCampaign from "../CatCampaign";
import { pageMetadata } from "@/lib/platform/site";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Cat Cozy Rooftops (Levels 101–150) — Jelloo",
  "Play Cat Cozy Rooftops Levels 101 to 150 in Jelloo. Prowl wall-edge routes, dash across slow tiles, and guide Cat home on 6x4 boards.",
  "/jelloo/character-worlds/cat",
);

export default function CatAdventure() {
  return (
    <Suspense fallback={<p>Opening Cozy Rooftops…</p>}>
      <CatCampaign levels={allCatLevels()} />
    </Suspense>
  );
}
