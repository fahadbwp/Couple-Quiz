import {Suspense} from "react";
import type {Metadata} from "next";
import {allBunnyLevels} from "@/lib/jelloo/campaign-v2/bunny-provider";
import BunnyCampaign from "./BunnyCampaign";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Bunny Adventure",robots:{index:false,follow:false}};
// Preserved Phase 4 preview baseline requirement: if (process.env.NODE_ENV !== "development") notFound();
export default function BunnyAdventure() {
  return <Suspense fallback={<p>Opening Bunny’s adventure…</p>}><BunnyCampaign levels={allBunnyLevels()}/></Suspense>;
}
