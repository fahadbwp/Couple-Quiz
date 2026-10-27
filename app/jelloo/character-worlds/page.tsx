import {notFound} from "next/navigation";
import {Suspense} from "react";
import type {Metadata} from "next";
import {getAllWorld1Levels} from "@/lib/jelloo/campaign-v2/world1-provider";
import CharacterWorlds from "./CharacterWorlds";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {title: "Character Worlds — Local Preview", robots: {index: false, follow: false}};
export default function CharacterWorldsPage() {
  // Explicitly unavailable in production; never changes the existing Adventure entry point.
  if (process.env.NODE_ENV !== "development") notFound();
  return <Suspense fallback={<p>Opening Candy Land…</p>}><CharacterWorlds levels={getAllWorld1Levels()}/></Suspense>;
}
