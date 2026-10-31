import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { allCatLevels } from "@/lib/jelloo/campaign-v2/cat-provider";
import CatCampaign from "../CatCampaign";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Cat Cozy Rooftops — Local Preview",
  robots: { index: false, follow: false },
};

export default function CatAdventure() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <Suspense fallback={<p>Opening Cozy Rooftops…</p>}>
      <CatCampaign levels={allCatLevels()} />
    </Suspense>
  );
}
