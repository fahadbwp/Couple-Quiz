import { Suspense } from "react";
import { allBunnyLevels } from "@/lib/jelloo/campaign-v2/bunny-provider";
import BunnyCampaign from "../character-worlds/BunnyCampaign";
import { pageMetadata } from "@/lib/platform/site";
import { JellooJsonLd } from "@/components/seo/JellooJsonLd";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Jelloo Game Map — Path Puzzle Adventure Worlds",
  "Explore all 150 Jelloo levels across Bunny Candy Land, Panda Bamboo Jungle, and Cat Cozy Rooftops on the interactive Game Map.",
  "/jelloo/map",
);

export default function MapPage() {
  return (
    <>
      <JellooJsonLd />
      <Suspense fallback={<p>Opening Game Map…</p>}>
        <BunnyCampaign levels={allBunnyLevels()} defaultView="worlds" />
      </Suspense>
    </>
  );
}
