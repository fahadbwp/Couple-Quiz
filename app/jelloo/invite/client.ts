import { validStatus, type ReferralStatus } from "@/lib/jelloo/referrals/protocol";
const messages:Record<string,string>={
  unavailable:"Referrals are temporarily unavailable. Your game progress is safe. Please retry later.",
  unauthorized:"Create an invite identity or restore with your recovery code.",
  invalid_link:"This invite is invalid or expired. Ask your friend for a fresh link.",
  self_referral:"You cannot qualify your own invite.",already_attributed:"This identity already belongs to another invite.",
  expired:"This verification session expired. Restart the verified journey from your invite link.",
  revision:"This session uses an unsupported puzzle revision. Restart the verified journey.",
  replay:"This submission is stale or already replaced. Refresh your referral status to continue.",
  invalid_proof:"Verification rejected these actions. No referral was awarded. Restart this level and try again.",
  rate_limited:"Too many requests. Wait a minute before retrying.",invalid_session:"This session is not available. Refresh your referral status.",
};
export async function referralRequest(body:Record<string,unknown>):Promise<{status:ReferralStatus;recovery?:string}> {
  let res:Response;
  try {res=await fetch("/api/jelloo/referrals",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});}
  catch {throw new Error("Network unavailable. Keep this page open and retry. No reward is assumed until the server confirms it.");}
  const data=await res.json().catch(()=>null);
  if(!res.ok) throw new Error(messages[data?.error] ?? "Request could not be accepted. Refresh your status and retry.");
  if(!validStatus(data?.status) || data.recovery!==undefined && (typeof data.recovery!=="string" || !/^[0-9a-f]{64}$/.test(data.recovery))) throw new Error("Invalid server response. No reward was assumed.");
  return data;
}
