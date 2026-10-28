import {notFound,redirect} from "next/navigation";
import {bunnyAliasDestination} from "@/lib/jelloo/campaign-v2/routes";
export const dynamic="force-dynamic";
export default async function BunnyAlias({searchParams}:{searchParams:Promise<{level?:string|string[]}>}) {
 if(process.env.NODE_ENV!=="development")notFound();
 const {level}=await searchParams;
 redirect(bunnyAliasDestination(level));
}
