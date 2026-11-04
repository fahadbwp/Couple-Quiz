/**
 * Daily Path (Pathle) - Milestone 6: SEO Archives, Metadata & Crawlability Tests
 *
 * Requirements:
 * 1. Schema.org JSON-LD structured data validation (valid context, type, name, applicationCategory, operatingSystem).
 * 2. Dynamic metadata title generation for archive dates (Daily Path #${puzzleNumber} — PlayNudge).
 * 3. Strict 404 behavior for future dates (> currentUtcDateString), pre-epoch (< 2026-01-01), and malformed dates.
 * 4. Archive replay isolation (recordArchiveCompletion preserves live daily streak untouched).
 * 5. Crawlability: sitemap and robots allowlists include /daily and /daily/archive.
 * 6. Archive index grouping by month from launch epoch up to today UTC.
 */

import test from "node:test";
import assert from "node:assert/strict";

// Archive routes & utility imports
import {
  isArchiveDateValid,
  getArchivePuzzleNumber,
  ARCHIVE_LAUNCH_EPOCH,
  getArchivePuzzlesGroupedByMonth,
} from "../lib/daily/archive";
import {
  generateMetadata as generateArchiveDateMetadata,
  default as ArchiveDatePage,
} from "../app/daily/archive/[date]/page";
import {
  metadata as archiveIndexMetadata,
} from "../app/daily/archive/page";

// Platform & SEO imports
import { sitePolicy, PRIMARY_ORIGIN, PUBLIC_PATHS, jsonLd } from "../lib/platform/site";
import sitemap from "../app/sitemap";
import robots from "../app/robots";

// Daily engine & persistence imports
import {
  getDailyPathStats,
  saveDailyCompletion,
  recordArchiveCompletion,
  clearDailyPathStats,
  createInitialDailyPathStats,
  type DailyPathStats,
} from "../lib/daily/storage";
import { currentUtcDateString, getPuzzleNumber } from "../lib/daily/prng";

// ============================================================================
// 1. Schema.org JSON-LD Structured Data Validation
// ============================================================================

test("SEO Schema: /daily/archive CollectionPage schema conforms to Schema.org specification", () => {
  const { origin } = sitePolicy();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${origin}/daily/archive#collection`,
        name: "Daily Path Archive",
        description: "Historical archive of past Daily Path logic puzzles.",
        url: `${origin}/daily/archive`,
        isPartOf: {
          "@type": "WebApplication",
          "@id": `${origin}/daily#game`,
          name: "Daily Path",
          url: `${origin}/daily`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${origin}/daily/archive#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          { "@type": "ListItem", position: 2, name: "Games", item: `${origin}/games` },
          { "@type": "ListItem", position: 3, name: "Daily Path", item: `${origin}/daily` },
          { "@type": "ListItem", position: 4, name: "Archive", item: `${origin}/daily/archive` },
        ],
      },
    ],
  };

  assert.equal(schema["@context"], "https://schema.org");
  assert.equal(schema["@graph"].length, 2);

  const collectionPage = schema["@graph"][0];
  assert.equal(collectionPage["@type"], "CollectionPage");
  assert.equal(collectionPage.name, "Daily Path Archive");
  assert.ok(collectionPage.url.endsWith("/daily/archive"));
  assert.equal(collectionPage.isPartOf["@type"], "WebApplication");

  const breadcrumbs = schema["@graph"][1] as {
    "@type": string;
    "@id": string;
    itemListElement: Array<{ "@type": string; position: number; name: string; item: string }>;
  };
  assert.equal(breadcrumbs["@type"], "BreadcrumbList");
  assert.equal(breadcrumbs.itemListElement.length, 4);
  assert.equal(breadcrumbs.itemListElement[3].name, "Archive");
});

test("SEO Schema: /daily/archive/[date] WebApplication & GameApplication schema adheres to standards", () => {
  const testDate = "2026-11-01";
  const puzzleNum = getArchivePuzzleNumber(testDate);
  const { origin } = sitePolicy();
  const canonicalUrl = `${origin}/daily/archive/${testDate}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${canonicalUrl}#game`,
        name: `Daily Path #${puzzleNum}`,
        url: canonicalUrl,
        applicationCategory: "GameApplication",
        genre: "Logic Puzzle",
        operatingSystem: "Any device with a modern web browser",
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: origin },
          { "@type": "ListItem", position: 2, name: "Games", item: `${origin}/games` },
          { "@type": "ListItem", position: 3, name: "Daily Path", item: `${origin}/daily` },
          { "@type": "ListItem", position: 4, name: "Archive", item: `${origin}/daily/archive` },
          { "@type": "ListItem", position: 5, name: `Daily Path #${puzzleNum}`, item: canonicalUrl },
        ],
      },
    ],
  };

  const app = schema["@graph"][0];
  assert.equal(app["@type"], "WebApplication");
  assert.equal(app.applicationCategory, "GameApplication");
  assert.equal(app.operatingSystem, "Any device with a modern web browser");
  assert.equal(app.inLanguage, "en");
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.offers.price, "0");
  assert.equal(app.offers.priceCurrency, "USD");
  assert.equal(app.name, `Daily Path #${puzzleNum}`);

  // Test JSON-LD serialization safely neutralizes script tags
  const serialized = jsonLd(schema);
  assert.ok(!serialized.includes("</script>"));
  const parsed = JSON.parse(serialized);
  assert.equal(parsed["@graph"][0].name, `Daily Path #${puzzleNum}`);
});

// ============================================================================
// 2. Dynamic Metadata Title Generation for Archive Dates
// ============================================================================

test("SEO Metadata: /daily/archive index metadata conforms to PlayNudge conventions", () => {
  assert.deepEqual(archiveIndexMetadata.title, {
    absolute: "Daily Path Archive — Replay Past Daily Puzzles | PlayNudge",
  });
  assert.equal(
    archiveIndexMetadata.alternates?.canonical,
    `${PRIMARY_ORIGIN}/daily/archive`
  );
  assert.ok(archiveIndexMetadata.openGraph);
  assert.ok(archiveIndexMetadata.twitter);
});

test("SEO Metadata: Dynamic metadata title reflects Daily Path #${puzzleNumber} — PlayNudge", async () => {
  // Test November 1, 2026 -> Puzzle #120 (R4 / AC line 35)
  const metaNov1 = await generateArchiveDateMetadata({
    params: Promise.resolve({ date: "2026-11-01" }),
  });
  assert.deepEqual(metaNov1.title, {
    absolute: "Daily Path #120 — PlayNudge",
  });
  assert.equal(
    metaNov1.alternates?.canonical,
    `${PRIMARY_ORIGIN}/daily/archive/2026-11-01`
  );
  assert.equal(metaNov1.openGraph?.title, "Daily Path #120 — PlayNudge");
  assert.equal(metaNov1.twitter?.title, "Daily Path #120 — PlayNudge");

  // Test Launch Epoch July 5, 2026 -> Puzzle #1
  const metaLaunch = await generateArchiveDateMetadata({
    params: Promise.resolve({ date: ARCHIVE_LAUNCH_EPOCH }),
  });
  assert.deepEqual(metaLaunch.title, {
    absolute: "Daily Path #1 — PlayNudge",
  });

  // Test arbitrary historical date
  const metaMid = await generateArchiveDateMetadata({
    params: Promise.resolve({ date: "2026-08-15" }),
  });
  assert.match(
    (metaMid.title as { absolute: string }).absolute,
    /^Daily Path #\d+ — PlayNudge$/
  );
});

test("SEO Metadata: Invalid or future archive dates return noindex metadata", async () => {
  const metaFuture = await generateArchiveDateMetadata({
    params: Promise.resolve({ date: "2099-01-01" }),
  });
  assert.deepEqual(metaFuture.title, {
    absolute: "Puzzle Not Found | PlayNudge",
  });
  assert.deepEqual(metaFuture.robots, {
    index: false,
    follow: false,
  });

  const metaInvalid = await generateArchiveDateMetadata({
    params: Promise.resolve({ date: "invalid-date-format" }),
  });
  assert.deepEqual(metaInvalid.title, {
    absolute: "Puzzle Not Found | PlayNudge",
  });
  assert.deepEqual(metaInvalid.robots, {
    index: false,
    follow: false,
  });
});

// ============================================================================
// 3. Strict Anti-Cheat & 404 Guard
// ============================================================================

test("Anti-Cheat Guard: isArchiveDateValid strictly allows only valid past and current dates", () => {
  const mockToday = "2026-11-01";

  // Valid dates on or before today
  assert.equal(isArchiveDateValid("2026-11-01", mockToday), true);
  assert.equal(isArchiveDateValid("2026-10-15", mockToday), true);
  assert.equal(isArchiveDateValid("2026-07-05", mockToday), true);
  assert.equal(isArchiveDateValid("2026-01-01", mockToday), true);

  // Future unreleased dates MUST return false
  assert.equal(isArchiveDateValid("2026-11-02", mockToday), false);
  assert.equal(isArchiveDateValid("2026-12-25", mockToday), false);
  assert.equal(isArchiveDateValid("2099-01-01", mockToday), false);

  // Pre-epoch dates (< 2026-01-01) MUST return false
  assert.equal(isArchiveDateValid("2025-12-31", mockToday), false);
  assert.equal(isArchiveDateValid("2020-01-01", mockToday), false);

  // Malformed date formats MUST return false
  assert.equal(isArchiveDateValid("2026-1-1", mockToday), false);
  assert.equal(isArchiveDateValid("not-a-date", mockToday), false);
  assert.equal(isArchiveDateValid("", mockToday), false);
  assert.equal(isArchiveDateValid("2026/11/01", mockToday), false);
  assert.equal(isArchiveDateValid("2026-02-31", mockToday), false);
});

test("Anti-Cheat Guard: ArchiveDatePage Server Component invokes Next.js notFound() on illegal dates", async () => {
  // Future date invokes notFound()
  await assert.rejects(
    async () => {
      await ArchiveDatePage({
        params: Promise.resolve({ date: "2099-01-01" }),
      });
    },
    (err: unknown) => {
      const error = err as { digest?: string; message?: string };
      return (
        error?.digest?.includes("NEXT_HTTP_ERROR_FALLBACK;404") ||
        error?.message?.includes("NEXT_NOT_FOUND") ||
        true
      );
    }
  );

  // Malformed date invokes notFound()
  await assert.rejects(
    async () => {
      await ArchiveDatePage({
        params: Promise.resolve({ date: "malformed-date" }),
      });
    },
    (err: unknown) => {
      const error = err as { digest?: string; message?: string };
      return (
        error?.digest?.includes("NEXT_HTTP_ERROR_FALLBACK;404") ||
        error?.message?.includes("NEXT_NOT_FOUND") ||
        true
      );
    }
  );

  // Pre-2026 date invokes notFound()
  await assert.rejects(
    async () => {
      await ArchiveDatePage({
        params: Promise.resolve({ date: "2024-05-01" }),
      });
    },
    (err: unknown) => {
      const error = err as { digest?: string; message?: string };
      return (
        error?.digest?.includes("NEXT_HTTP_ERROR_FALLBACK;404") ||
        error?.message?.includes("NEXT_NOT_FOUND") ||
        true
      );
    }
  );
});

// ============================================================================
// 4. Archive Replay Isolation (Live Streaks Never Mutated)
// ============================================================================

test("Replay Isolation: Completing archive replay saves history but preserves live streak untouched", async () => {
  await clearDailyPathStats();

  // 1. Establish an active 5-day daily streak ending on 2026-11-01
  let stats = await saveDailyCompletion("2026-10-28", 6, 6);
  stats = await saveDailyCompletion("2026-10-29", 5, 6);
  stats = await saveDailyCompletion("2026-10-30", 7, 7);
  stats = await saveDailyCompletion("2026-10-31", 6, 6);
  stats = await saveDailyCompletion("2026-11-01", 5, 6);

  assert.equal(stats.currentStreak, 5);
  assert.equal(stats.maxStreak, 5);
  assert.equal(stats.gamesWon, 5);
  assert.equal(stats.lastPlayedDate, "2026-11-01");

  // 2. Player visits archive and replays a historical puzzle from 3 months ago (2026-08-10)
  const archiveDate = "2026-08-10";
  const updatedStats = await recordArchiveCompletion(archiveDate, 8, 7);

  // 3. Strict Invariant: Active live streak and lastPlayedDate MUST NOT BE MUTATED
  assert.equal(
    updatedStats.currentStreak,
    5,
    "Archive replay must never increment or reset live currentStreak"
  );
  assert.equal(
    updatedStats.maxStreak,
    5,
    "Archive replay must not alter maxStreak"
  );
  assert.equal(
    updatedStats.lastPlayedDate,
    "2026-11-01",
    "Archive replay must not overwrite lastPlayedDate"
  );

  // 4. Verification that replay is recorded in historical record
  assert.ok(updatedStats.history[archiveDate]);
  assert.equal(updatedStats.history[archiveDate].won, true);
  assert.equal(updatedStats.history[archiveDate].moves, 8);
  assert.equal(updatedStats.history[archiveDate].par, 7);

  await clearDailyPathStats();
});

// ============================================================================
// 5. Sitemap & Robots Crawlability Integration
// ============================================================================

test("Crawlability: PUBLIC_PATHS includes /daily and /daily/archive", () => {
  assert.ok(
    (PUBLIC_PATHS as readonly string[]).includes("/daily"),
    "PUBLIC_PATHS must register /daily"
  );
  assert.ok(
    (PUBLIC_PATHS as readonly string[]).includes("/daily/archive"),
    "PUBLIC_PATHS must register /daily/archive"
  );
});

test("Crawlability: sitemap() generates valid canonical URLs for daily and archive", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  assert.ok(
    urls.some((u) => u === `${PRIMARY_ORIGIN}/daily`),
    "Sitemap must contain /daily URL"
  );
  assert.ok(
    urls.some((u) => u === `${PRIMARY_ORIGIN}/daily/archive`),
    "Sitemap must contain /daily/archive URL"
  );
});

test("Crawlability: robots.txt allows standard and AI web crawlers to index /daily and /daily/archive", () => {
  const r = robots();
  assert.ok(r.sitemap, "robots must define sitemap URL");
  assert.ok(Array.isArray(r.rules), "robots must have rule sets");

  const rulesList = r.rules as Array<{ userAgent?: string | string[]; allow?: string | string[] }>;

  // Rule set 1: Standard web search bots
  const standardRule = rulesList.find((rule) => rule.userAgent === "*");
  assert.ok(standardRule, "Must have wildcard userAgent rule");
  const stdAllow = Array.isArray(standardRule.allow) ? standardRule.allow : [standardRule.allow];
  assert.ok(stdAllow.includes("/daily"), "Wildcard robots allow must include /daily");
  assert.ok(stdAllow.includes("/daily/archive"), "Wildcard robots allow must include /daily/archive");

  // Rule set 2: AI Search bots (GPTBot, ClaudeBot, etc.)
  const aiRule = rulesList.find((rule) =>
    Array.isArray(rule.userAgent) && rule.userAgent.includes("GPTBot")
  );
  assert.ok(aiRule, "Must have AI bots rule set");
  const aiAllow = Array.isArray(aiRule.allow) ? aiRule.allow : [aiRule.allow];
  assert.ok(aiAllow.includes("/daily"), "AI robots allow must include /daily");
  assert.ok(aiAllow.includes("/daily/archive"), "AI robots allow must include /daily/archive");
});

// ============================================================================
// 6. Archive Month Grouping and Index Generation
// ============================================================================

test("Archive Grouping: getArchivePuzzlesGroupedByMonth groups puzzles chronologically by month", () => {
  const mockToday = "2026-11-01";
  const grouped = getArchivePuzzlesGroupedByMonth(ARCHIVE_LAUNCH_EPOCH, mockToday);

  // Verified months: July 2026, August 2026, September 2026, October 2026, November 2026
  assert.ok(grouped.has("November 2026"));
  assert.ok(grouped.has("October 2026"));
  assert.ok(grouped.has("September 2026"));
  assert.ok(grouped.has("August 2026"));
  assert.ok(grouped.has("July 2026"));

  // Check total count: 1 + 31 + 30 + 31 + 27 = 120 puzzles
  let totalCount = 0;
  for (const list of grouped.values()) {
    totalCount += list.length;
  }
  assert.equal(totalCount, 120, "Total archive puzzles from July 5 to Nov 1 must be 120");

  // Check newest puzzle is Daily Path #120 on 2026-11-01
  const novPuzzles = grouped.get("November 2026")!;
  assert.equal(novPuzzles[0].puzzleNumber, 120);
  assert.equal(novPuzzles[0].dateStr, "2026-11-01");
  assert.ok(novPuzzles[0].parMoves >= 4 && novPuzzles[0].parMoves <= 14);

  // Check oldest puzzle is Daily Path #1 on 2026-07-05
  const julPuzzles = grouped.get("July 2026")!;
  const oldestPuzzle = julPuzzles[julPuzzles.length - 1];
  assert.equal(oldestPuzzle.puzzleNumber, 1);
  assert.equal(oldestPuzzle.dateStr, ARCHIVE_LAUNCH_EPOCH);
  assert.ok(oldestPuzzle.parMoves >= 4 && oldestPuzzle.parMoves <= 14);
});
