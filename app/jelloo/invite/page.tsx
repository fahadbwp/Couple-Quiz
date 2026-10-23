import Invite from "./Invite";
import { REFERRALS_RELEASED } from "@/lib/jelloo/referrals/release";
import { pageMetadata } from "@/lib/platform/site";
export const metadata = {
  ...pageMetadata(
    "Jelloo — Invite Friends & Earn",
    "Invite a friend to complete the verified Jelloo journey and earn cosmetic entitlements.",
    "/jelloo/invite",
    true,
  ),
  referrer: "no-referrer" as const,
};
export default function InvitePage() {
  if (!REFERRALS_RELEASED) return <main style={{maxWidth:640,margin:"3rem auto",padding:"1.5rem"}}><h1>Invite Friends &amp; Earn</h1><p>Invites and rewards are not available yet. Your existing Jelloo progress is unchanged.</p><a href="/jelloo">Back to Jelloo</a></main>;
  return <Invite />;
}
