import boards from "@/data/jelloo/referrals/tutorials-v1.json";
import type { Level } from "../engine";

// Frozen original tutorial boards: subsequent game-generator edits cannot
// reinterpret a referral transcript. New boards require a new protocol revision.
export const referralBoards = boards as Level[];
export const MAX_ACTIONS = 256;
export type ProofAction = { type: "rotate"; index: number } | { type: "undo" | "reset" | "go" };
export type Challenge = { id: string; nonce: string; revision: string; level: number; expires: string };
export type ReferralStatus = {
  code: string; linkExpires: string; qualified: number; pending: number;
  rewards: number[]; referred: "none" | "pending" | "qualified";
  challenge: Challenge | null;
};
export const rewardCatalog = [
  { threshold: 1, name: "Golden Clover", available: false },
  { threshold: 3, name: "Rainbow Trail", available: false },
  { threshold: 5, name: "Ambassador badge", available: true },
] as const;
export const opaque = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
export const codeValid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{32}$/.test(v);
export const uuidValid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v);
export function validChallenge(v: unknown): v is Challenge {
  if (!v || typeof v !== "object") return false;
  if(Object.keys(v).sort().join()!=="expires,id,level,nonce,revision") return false;
  const c=v as Challenge;
  return uuidValid(c.id) && uuidValid(c.nonce) && opaque(c.revision) && Number.isInteger(c.level) && c.level>=1 && c.level<=10 && typeof c.expires==="string" && Number.isFinite(Date.parse(c.expires));
}
export function validStatus(v: unknown): v is ReferralStatus {
  if (!v || typeof v!=="object") return false;
  if(Object.keys(v).sort().join()!=="challenge,code,linkExpires,pending,qualified,referred,rewards") return false;
  const s=v as ReferralStatus;
  return codeValid(s.code) && typeof s.linkExpires==="string" && Number.isFinite(Date.parse(s.linkExpires)) &&
    Number.isSafeInteger(s.qualified) && s.qualified>=0 && Number.isSafeInteger(s.pending) && s.pending>=0 &&
    Array.isArray(s.rewards) && s.rewards.every(n=>[1,3,5].includes(n) && s.qualified>=n) && new Set(s.rewards).size===s.rewards.length && s.rewards.length===[1,3,5].filter(n=>n<=s.qualified).length &&
    ["none","pending","qualified"].includes(s.referred) && (s.referred==="pending" ? validChallenge(s.challenge) : s.challenge===null);
}
