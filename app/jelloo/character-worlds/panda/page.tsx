import { Suspense } from "react";
import type { Metadata } from "next";
import { allPandaLevels } from "@/lib/jelloo/campaign-v2/panda-provider";
import PandaCampaign from "../PandaCampaign";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Panda Bamboo Jungle",
  robots: { index: false, follow: false },
};

export default function PandaAdventure() {
  return (
    <Suspense fallback={<p>Opening Bamboo Jungle…</p>}>
      <PandaCampaign levels={allPandaLevels()} />
    </Suspense>
  );
}
