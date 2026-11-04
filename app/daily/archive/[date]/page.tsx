import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sitePolicy, jsonLd } from "@/lib/platform/site";
import DailyArchiveClient from "./DailyArchiveClient";
import {
  getArchivePuzzleNumber,
  isArchiveDateValid,
} from "@/lib/daily/archive";

interface ArchivePageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({
  params,
}: ArchivePageProps): Promise<Metadata> {
  const { date } = await params;

  if (!isArchiveDateValid(date)) {
    return {
      title: { absolute: "Puzzle Not Found | PlayNudge" },
      description: "The requested daily path archive puzzle does not exist.",
      robots: { index: false, follow: false },
    };
  }

  const { origin, indexable } = sitePolicy();
  const puzzleNumber = getArchivePuzzleNumber(date);
  const canonicalUrl = `${origin}/daily/archive/${date}`;
  const title = `Daily Path #${puzzleNumber} — PlayNudge`;
  const description = `Replay Daily Path #${puzzleNumber} (${date}) on PlayNudge. Connect the compass to the goal in par moves. A historical logic puzzle challenge.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: indexable, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "PlayNudge",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `Daily Path #${puzzleNumber} — PlayNudge`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ArchiveDatePage({ params }: ArchivePageProps) {
  const { date } = await params;

  if (!isArchiveDateValid(date)) {
    notFound();
  }

  const { origin } = sitePolicy();
  const puzzleNumber = getArchivePuzzleNumber(date);
  const canonicalUrl = `${origin}/daily/archive/${date}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${canonicalUrl}#game`,
        name: `Daily Path #${puzzleNumber}`,
        alternateName: [`Daily Path ${date}`, `Pathle #${puzzleNumber}`],
        url: canonicalUrl,
        description: `Replay Daily Path #${puzzleNumber} from ${date}. Connect the compass to the goal in par moves on PlayNudge.`,
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
          {
            "@type": "ListItem",
            position: 5,
            name: `Daily Path #${puzzleNumber}`,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Platform Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-10">
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

      {/* Main Replay Content */}
      <main id="main" className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
        <DailyArchiveClient archiveDate={date} />
      </main>

      {/* Platform Footer */}
      <footer className="w-full border-t border-slate-200/60 dark:border-slate-800/60 py-4 px-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center justify-center gap-3 mb-1 font-medium">
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
          <Link href="/daily/archive" className="hover:text-slate-700 dark:hover:text-slate-300">
            Archive Hub
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
