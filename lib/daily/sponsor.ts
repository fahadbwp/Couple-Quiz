/**
 * Daily Path (Pathle) - Sponsored Challenge Theme Engine
 * Milestone 5: Monetization Hooks & Sponsored Challenge Engine
 *
 * Allows featured partners or brands to sponsor a daily challenge
 * (e.g. custom accent color, sponsor badge, mascot cameo) on specific dates.
 *
 * Purity Invariant:
 * Purely cosmetic: MUST NOT alter board layout, tile rotations, or determinism math.
 */

import type { SponsoredChallenge, BoardState } from "./types";

export type { SponsoredChallenge };

/**
 * Curated calendar of sponsored challenges for brand partnerships and special events.
 * Note: Unregistered dates safely return null and fall back to default theme.
 */
export const SPONSORED_CHALLENGES: Record<string, SponsoredChallenge> = {
  // Earth Day special edition
  "2026-04-22": {
    id: "earth-day-2026",
    sponsorName: "Earth Network",
    badgeText: "Earth Day Challenge",
    accentColor: "#059669",
    mascotEmoji: "🌍",
    tagline: "Connecting paths to a greener planet.",
  },
  // World Environment Day edition
  "2026-06-05": {
    id: "world-environment-day",
    sponsorName: "EcoForest",
    badgeText: "Environment Day Edition",
    accentColor: "#10B981",
    mascotEmoji: "🌱",
    tagline: "Rotate the paths, grow the canopy.",
  },
  // Winter Holiday edition
  "2026-12-25": {
    id: "holiday-edition-2026",
    sponsorName: "PlayNudge Community",
    badgeText: "Holiday Edition",
    accentColor: "#38BDF8",
    mascotEmoji: "❄️",
    tagline: "Chilling out with winter paths.",
  },
};

/**
 * Retrieves cosmetic sponsored challenge configuration for a given UTC date string.
 * Returns null if the date has no sponsor.
 */
export function getSponsoredChallenge(dateStr: string): SponsoredChallenge | null {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }
  return SPONSORED_CHALLENGES[dateStr] ?? null;
}

/**
 * Attaches cosmetic sponsor data to a board without modifying any gameplay math,
 * tiles, par moves, or solution geometry.
 */
export function attachSponsorship(board: BoardState, sponsor: SponsoredChallenge | null): BoardState {
  if (!sponsor) {
    return board;
  }
  return {
    ...board,
    sponsor,
  };
}

/**
 * Resolves active accent color from sponsor or falls back to PlayNudge default.
 */
export function getSponsorAccent(sponsor: SponsoredChallenge | null | undefined): string {
  return sponsor?.accentColor || "#10B981"; // Emerald default
}
