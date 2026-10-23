import { configuration, handleReferral } from "@/lib/jelloo/referrals/server";
import { REFERRALS_RELEASED } from "@/lib/jelloo/referrals/release";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=15;
export async function POST(req:Request) {
  if (!REFERRALS_RELEASED) return Response.json({error:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
  try {
    const {config,rpc}=configuration();
    return await handleReferral(req,config,rpc);
  } catch {
    return Response.json({error:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
