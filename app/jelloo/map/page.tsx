import { Suspense } from "react";
import type { Metadata } from "next";
import { allBunnyLevels } from "@/lib/jelloo/campaign-v2/bunny-provider";
import BunnyCampaign from "../character-worlds/BunnyCampaign";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Game Map — Jelloo",
  description: "Jelloo Game Map: explore all character worlds.",
  robots: { index: false, follow: false },
};

export default function MapPage() {
  return (
    <Suspense fallback={<p>Opening Game Map…</p>}>
      <BunnyCampaign levels={allBunnyLevels()} defaultView="worlds" />
    </Suspense>
  );
}
