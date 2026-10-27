import {notFound} from "next/navigation";
import {Suspense} from "react";
import type {Metadata} from "next";
import {allBunnyLevels} from "@/lib/jelloo/campaign-v2/bunny-provider";
import BunnyCampaign from "../BunnyCampaign";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Bunny Adventure — Local Preview",robots:{index:false,follow:false}};
export default function BunnyAdventure(){if(process.env.NODE_ENV!=="development")notFound();return <Suspense fallback={<p>Opening Bunny’s adventure…</p>}><BunnyCampaign levels={allBunnyLevels()}/></Suspense>}
