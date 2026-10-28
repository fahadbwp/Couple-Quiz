"use client";
import {usePathname} from "next/navigation";
import {PlatformHeader} from "@/components/platform/Platform";
import {usesBunnyShell} from "@/lib/jelloo/campaign-v2/routes";
export default function JellooHeader(){return usesBunnyShell(usePathname())?null:<PlatformHeader compact/>}
