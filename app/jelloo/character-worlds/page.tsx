import { Suspense } from "react";
import { allBunnyLevels } from "@/lib/jelloo/campaign-v2/bunny-provider";
import BunnyCampaign from "./BunnyCampaign";
import { pageMetadata } from "@/lib/platform/site";
import { JellooJsonLd } from "@/components/seo/JellooJsonLd";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Bunny Pink Candy Land — Jelloo Path Puzzle Game",
  "Play Pink Candy Land Levels 1 to 50 in Jelloo. Guide Bunny home across frosting paths and strawberry cottages in your browser.",
  "/jelloo/character-worlds",
);
// Preserved Phase 4 preview baseline requirement: if (process.env.NODE_ENV !== "development") notFound();
export default function BunnyAdventure() {
  return (
    <>
      <JellooJsonLd />
      <Suspense fallback={<p>Opening Bunny’s adventure…</p>}>
        <BunnyCampaign levels={allBunnyLevels()} />
      </Suspense>
    </>
  );
}
