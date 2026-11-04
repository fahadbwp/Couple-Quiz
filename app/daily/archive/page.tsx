import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, sitePolicy, jsonLd } from "@/lib/platform/site";
import { currentUtcDateString } from "@/lib/daily/prng";
import { Calendar, Play, ArrowRight, Compass, Trophy } from "lucide-react";
import {
  ARCHIVE_LAUNCH_EPOCH,
  getArchivePuzzlesGroupedByMonth,
} from "@/lib/daily/archive";

export const metadata: Metadata = pageMetadata(
  "Daily Path Archive — Replay Past Daily Puzzles",
  "Browse and replay past Daily Path logic puzzles. Test your skills on historical daily challenges from the archive with par move targets.",
  "/daily/archive"
);

export default function ArchiveIndexPage() {
  const { origin } = sitePolicy();
  const todayUtc = currentUtcDateString();
  const groupedMonths = getArchivePuzzlesGroupedByMonth(ARCHIVE_LAUNCH_EPOCH, todayUtc);

  let totalPuzzlesCount = 0;
  for (const list of groupedMonths.values()) {
    totalPuzzlesCount += list.length;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${origin}/daily/archive#collection`,
        name: "Daily Path Archive",
        description:
          "Browse and replay past Daily Path logic puzzles. Test your skills on historical daily challenges from the archive with par move targets.",
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
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: origin,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Games",
            item: `${origin}/games`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Daily Path",
            item: `${origin}/daily`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Archive",
            item: `${origin}/daily/archive`,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Platform Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-10 sticky top-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-black tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition"
          aria-label="PlayNudge home"
        >
          <span className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black shadow-xs">
            p
          </span>
          PlayNudge<span className="text-emerald-500">.</span>
        </Link>
        <nav
          aria-label="Platform navigation"
          className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400"
        >
          <Link href="/games" className="hover:text-slate-900 dark:hover:text-white transition">
            All Games
          </Link>
          <Link href="/daily" className="hover:text-slate-900 dark:hover:text-white transition">
            Today&apos;s Challenge
          </Link>
          <Link
            href="/daily/archive"
            className="text-emerald-600 dark:text-emerald-400 font-bold"
            aria-current="page"
          >
            Archive
          </Link>
        </nav>
      </header>

      {/* Main Content Hub */}
      <main id="main" className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-3 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            <span>Puzzle Archive Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Daily Path Archive
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
            Missed a day? Replay past daily puzzles from the launch archive. All {totalPuzzlesCount} historical challenges are verified 100% solvable within par limits.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <Link
              href="/daily"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition transform active:scale-95"
            >
              <span>Play Today&apos;s Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Grouped Month Sections */}
        <div className="space-y-10 sm:space-y-12">
          {Array.from(groupedMonths.entries()).map(([monthName, puzzles]) => (
            <section key={monthName} aria-labelledby={`month-${monthName.replace(/\s+/g, "-")}`}>
              <div className="flex items-center gap-3 mb-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <h2
                  id={`month-${monthName.replace(/\s+/g, "-")}`}
                  className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white"
                >
                  {monthName}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {puzzles.length} {puzzles.length === 1 ? "puzzle" : "puzzles"}
                </span>
              </div>

              {/* Puzzle Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {puzzles.map((puzzle) => {
                  const isToday = puzzle.dateStr === todayUtc;
                  return (
                    <article
                      key={puzzle.dateStr}
                      className="group relative flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            Daily Path #{puzzle.puzzleNumber}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {puzzle.formattedDate}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                            <Trophy className="w-3 h-3 text-amber-500" />
                            Par: {puzzle.parMoves} moves
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/daily/archive/${puzzle.dateStr}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 hover:text-white dark:text-slate-200 dark:hover:text-white font-bold text-xs transition shadow-xs"
                        aria-label={`Play Daily Path #${puzzle.puzzleNumber} from ${puzzle.formattedDate}`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play</span>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Platform Footer */}
      <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500 mt-12">
        <div className="flex items-center justify-center gap-3 mb-2 font-medium">
          <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">
            PlayNudge Home
          </Link>
          <span>•</span>
          <Link href="/games" className="hover:text-slate-700 dark:hover:text-slate-300">
            Games
          </Link>
          <span>•</span>
          <Link href="/daily" className="hover:text-slate-700 dark:hover:text-slate-300">
            Daily Path
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300">
            Privacy
          </Link>
        </div>
        <p>A little play goes a long way. Daily Path challenges refresh every midnight UTC.</p>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(structuredData),
        }}
      />
    </div>
  );
}
