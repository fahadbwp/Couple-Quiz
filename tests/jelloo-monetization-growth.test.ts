import test from "node:test";
import assert from "node:assert/strict";
import {
  ADS_ENABLED,
  JELLOO_BANNER_ENABLED,
  JELLOO_ADSTERRA_300X250,
  mayShowJellooBanner,
} from "../lib/platform/ads";
import {
  PRIMARY_ORIGIN,
  LEGACY_ORIGIN,
  sitePolicy,
} from "../lib/platform/site";
import { getBaseUrl, detectEnvironment, getChallengeUrl } from "../lib/quiz/sharing";
import { getJellooUrl, formatShareCard } from "../lib/jelloo/share";
import { forecast, SCENARIOS } from "../lib/platform/forecast";
import sitemap from "../app/sitemap";
import robots from "../app/robots";

test("Task 1: Adsterra 300x250 Banner - exact owner identity, dimensions and parameters", () => {
  assert.equal(
    JELLOO_ADSTERRA_300X250.key,
    "a4b11b585d5ff9edca2e271d80338cab",
    "Adsterra placement key must strictly match owner-supplied identity"
  );
  assert.equal(
    JELLOO_ADSTERRA_300X250.src,
    "https://bauval.org/22/a4b11b585d5ff9edca2e271d80338cab",
    "Adsterra script source URL must strictly match owner-supplied endpoint"
  );
  assert.equal(JELLOO_ADSTERRA_300X250.width, 300, "Ad width must be 300px");
  assert.equal(JELLOO_ADSTERRA_300X250.height, 250, "Ad height must be 250px");
  assert.equal(JELLOO_ADSTERRA_300X250.format, "iframe", "Ad format must be iframe");
});

test("Task 1: Adsterra Banner release gate strictly disabled by default", () => {
  assert.equal(ADS_ENABLED, false, "Platform ads must be disabled by default");
  assert.equal(JELLOO_BANNER_ENABLED, false, "Jelloo banner must be disabled by default");

  // Default evaluation without overrides MUST return false
  assert.equal(
    mayShowJellooBanner(),
    false,
    "mayShowJellooBanner() must return false without explicit release approval"
  );
  assert.equal(
    mayShowJellooBanner({ phase: "result" }),
    false,
    "mayShowJellooBanner() must return false in result phase without enabled gate"
  );
});

test("Task 1: Adsterra Banner safety gates - phase, internal QA, consent, and family approval", () => {
  const baseApproved = {
    enabled: true,
    consent: true,
    familyApproved: true,
    internal: false,
    phase: "result" as const,
  };

  // Enabled with all conditions satisfied: PASS
  assert.equal(mayShowJellooBanner(baseApproved), true);

  // Idle phase (e.g., bottom of map / landing page): PASS when enabled
  assert.equal(mayShowJellooBanner({ ...baseApproved, phase: "idle" }), true);

  // Prohibited phases: active board solving, PIN entry, submitting
  assert.equal(
    mayShowJellooBanner({ ...baseApproved, phase: "active" }),
    false,
    "Must never display banner during active board manipulation or move counting"
  );
  assert.equal(
    mayShowJellooBanner({ ...baseApproved, phase: "pin" }),
    false,
    "Must never display banner during PIN entry"
  );
  assert.equal(
    mayShowJellooBanner({ ...baseApproved, phase: "submitting" }),
    false,
    "Must never display banner during submission"
  );

  // Internal QA / testing exclusion
  assert.equal(
    mayShowJellooBanner({ ...baseApproved, internal: true }),
    false,
    "Must never display banner in internal QA harness"
  );

  // Privacy / consent denial
  assert.equal(
    mayShowJellooBanner({ ...baseApproved, consent: false }),
    false,
    "Must never display banner when consent is false"
  );

  // Family-safety denial
  assert.equal(
    mayShowJellooBanner({ ...baseApproved, familyApproved: false }),
    false,
    "Must never display banner when family approval is false"
  );
});

test("Task 3: Netlify Primary SEO - Canonical origin defaults to playnudge.netlify.app", () => {
  assert.equal(PRIMARY_ORIGIN, "https://playnudge.netlify.app");
  assert.equal(LEGACY_ORIGIN, "https://friend-quiz-game.vercel.app");

  // Default site policy returns Netlify primary origin
  const policy = sitePolicy({});
  assert.equal(
    policy.origin,
    "https://playnudge.netlify.app",
    "Default site origin must be Netlify primary domain"
  );

  // Base URL helper returns Netlify primary origin
  assert.equal(
    getBaseUrl(),
    "https://playnudge.netlify.app",
    "getBaseUrl() must return Netlify primary domain"
  );
});

test("Task 3: Netlify Primary SEO - Sitemap and Robots coverage", () => {
  const sm = sitemap();
  assert.ok(sm.length >= 5, "Sitemap must contain all public paths");

  // All URLs in sitemap must target playnudge.netlify.app
  for (const entry of sm) {
    assert.ok(
      entry.url.startsWith("https://playnudge.netlify.app"),
      `Sitemap URL must start with Netlify origin: ${entry.url}`
    );
  }

  // Robots verification
  const rb = robots();
  assert.equal(
    rb.sitemap,
    "https://playnudge.netlify.app/sitemap.xml",
    "Robots sitemap directive must point to Netlify origin"
  );

  const rules = rb.rules as { allow: string[]; disallow: string[] }[];
  assert.ok(Array.isArray(rules) && rules.length > 0);
  const rule = rules[0];

  // Must allow public gameplay pages
  assert.ok(rule.allow.includes("/"), "Must allow /");
  assert.ok(rule.allow.includes("/games"), "Must allow /games");
  assert.ok(rule.allow.includes("/jelloo"), "Must allow /jelloo");

  // Must disallow internal QA, art and transfer
  assert.ok(rule.disallow.includes("/jelloo/transfer"), "Must disallow /jelloo/transfer");
  assert.ok(rule.disallow.includes("/jelloo/qa"), "Must disallow /jelloo/qa");
  assert.ok(rule.disallow.includes("/jelloo/art"), "Must disallow /jelloo/art");
});

test("Task 3: Netlify Primary SEO - Jelloo sharing actions point to Netlify origin", () => {
  const jellooUrl = getJellooUrl();
  assert.equal(
    jellooUrl,
    "https://playnudge.netlify.app/jelloo",
    "Jelloo main URL must point to Netlify origin"
  );

  const dailyUrl = getJellooUrl("/jelloo/daily");
  assert.equal(
    dailyUrl,
    "https://playnudge.netlify.app/jelloo/daily",
    "Jelloo daily URL must point to Netlify origin"
  );

  // Formatted share card contains the Netlify URL
  const card = formatShareCard({
    mode: "adventure",
    levelId: 1,
    moves: 4,
    stars: 3,
    collectedStars: 3,
    totalStars: 3,
    character: "bunny",
    world: "meadow",
    size: 4,
    path: [0, 1, 5, 9, 13],
  });

  assert.ok(
    card.url.startsWith("https://playnudge.netlify.app/jelloo"),
    "Share card URL must point to Netlify origin"
  );
  assert.ok(
    card.fullMessage.includes("https://playnudge.netlify.app/jelloo"),
    "Share card full message must contain Netlify URL"
  );
  assert.ok(
    card.whatsappUrl.includes(encodeURIComponent("https://playnudge.netlify.app/jelloo")),
    "WhatsApp share link must encode Netlify URL"
  );
});

test("Task 3: Netlify Primary SEO - Legacy Vercel compatibility preserved without redirects", () => {
  // detectEnvironment recognizes both primary Netlify and legacy Vercel as production
  const netlifyEnv = detectEnvironment("https://playnudge.netlify.app");
  assert.equal(netlifyEnv.isProduction, true);
  assert.equal(netlifyEnv.isPreview, false);

  const vercelEnv = detectEnvironment("https://friend-quiz-game.vercel.app");
  assert.equal(vercelEnv.isProduction, true);
  assert.equal(vercelEnv.isPreview, false);

  // Passing legacy origin to challenge preserves the legacy link
  const legacyChallenge = getChallengeUrl("q_legacy_456", "https://friend-quiz-game.vercel.app");
  assert.equal(
    legacyChallenge,
    "https://friend-quiz-game.vercel.app/quiz/play/q_legacy_456",
    "Legacy quizzes on Vercel domain must not be forcefully altered"
  );
});

test("Task 4: Financial Revenue Model ($1,000 Net) - Invariant and Scenario Verification", () => {
  // Test Conservative scenario
  const cons = forecast(SCENARIOS.Conservative, 1000);
  assert.equal(cons.costs, 30);
  assert.equal(cons.requests, 1000 * 30 * 2); // 60,000 requests
  assert.equal(cons.impressions, 30000); // 50% fill
  assert.equal(cons.gross, 9); // 30k * $0.30 / 1000 = $9
  assert.equal(cons.net, -21); // $9 - $30 = -$21
  assert.ok(cons.neededImpressions! > 0, "Needed impressions must be positive");
  assert.ok(cons.neededDau! > 0, "Needed DAU must be positive");

  // Test Base scenario
  const base = forecast(SCENARIOS.Base, 1000);
  assert.equal(base.costs, 60);
  assert.equal(base.requests, 5000 * 30 * 3); // 450,000 requests
  assert.equal(base.impressions, 315000); // 70% fill
  assert.equal(base.gross, 315); // 315k * $1.00 / 1000 = $315
  assert.equal(base.net, 255); // $315 - $60 = $255

  // To reach $1,000 NET in Base scenario ($1,060 gross needed at $1.00 eCPM):
  // Needed billable impressions = 1,060,000
  assert.equal(base.neededImpressions, 1060000);
  // Needed DAU = 1,060,000 / (30 days * 3 req * 0.70 fill) = 16,825.4 (rounded up 16,826)
  assert.equal(Math.ceil(base.neededDau!), 16826);

  // Test Optimistic scenario
  const opt = forecast(SCENARIOS.Optimistic, 1000);
  assert.equal(opt.costs, 240);
  assert.equal(opt.gross, 4590);
  assert.equal(opt.net, 4350);
  assert.equal(opt.neededImpressions, (1000 + 240) * 1000 / 3.0); // 413,333.3 impressions
});
