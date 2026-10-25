export const ADS_ENABLED: boolean = false;
export const JELLOO_BANNER_ENABLED: boolean = false;

export const PLACEMENTS = {
  "home-after-discovery": { game: "platform", phase: "idle" },
  "games-after-list": { game: "platform", phase: "idle" },
  "quiz-after-result": { game: "quiz", phase: "result" },
  "jelloo-after-result": { game: "jelloo", phase: "result" },
} as const;

export type AdPlacement = keyof typeof PLACEMENTS;

export const JELLOO_ADSTERRA_300X250 = {
  key: "a4b11b585d5ff9edca2e271d80338cab",
  src: "https://bauval.org/22/a4b11b585d5ff9edca2e271d80338cab",
  width: 300,
  height: 250,
  format: "iframe" as const,
} as const;

export function mayShowAd(
  slot: AdPlacement,
  context: {
    consent: boolean;
    familyApproved: boolean;
    internal: boolean;
    phase: "idle" | "active" | "pin" | "submitting" | "result";
    enabled?: boolean;
  }
) {
  return (
    (context.enabled ?? ADS_ENABLED) &&
    context.consent &&
    context.familyApproved &&
    !context.internal &&
    Object.hasOwn(PLACEMENTS, slot) &&
    context.phase === PLACEMENTS[slot].phase
  );
}

export function mayShowJellooBanner(context?: {
  enabled?: boolean;
  consent?: boolean;
  familyApproved?: boolean;
  internal?: boolean;
  phase?: "idle" | "active" | "pin" | "submitting" | "result";
}): boolean {
  // Explicit overrides support pure policy tests; the component also enforces
  // the source release gate. Environment variables cannot activate this release.
  const enabled = context?.enabled ?? JELLOO_BANNER_ENABLED;
  if (!enabled) return false;

  // Must not show in internal QA / dev harnesses
  if (context?.internal) return false;
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/jelloo/qa")
  ) {
    return false;
  }

  // Must not show during active gameplay or PIN input
  const phase = context?.phase ?? "result";
  if (phase !== "result" && phase !== "idle") return false;

  // Explicit consent & family approval required
  if (context?.consent !== true || context?.familyApproved !== true) {
    return false;
  }

  return true;
}
