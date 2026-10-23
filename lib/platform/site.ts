import type { Metadata } from "next";
type SiteEnv = Record<string, string | undefined>;
export const LEGACY_ORIGIN = "https://friend-quiz-game.vercel.app";
function publicOrigin(value: string | undefined): string | undefined {
  if (!value) return;
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.pathname !== "/" ||
      u.search ||
      u.hash ||
      /^(localhost|127\.|0\.)/.test(u.hostname)
    )
      return;
    return u.origin;
  } catch {
    return;
  }
}
/** Never use request Host, preview URL or Netlify URL as a canonical. */
export function sitePolicy(env: SiteEnv = process.env) {
  const origin =
    publicOrigin(env.SITE_CANONICAL_ORIGIN) ??
    publicOrigin(env.NEXT_PUBLIC_APP_URL) ??
    publicOrigin(
      env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
    ) ??
    publicOrigin(
      env.VERCEL_ENV === "production" && env.VERCEL_URL
        ? `https://${env.VERCEL_URL}`
        : undefined,
    ) ??
    LEGACY_ORIGIN;
  const preview =
    (env.VERCEL_ENV !== undefined && env.VERCEL_ENV !== "production") ||
    (env.CONTEXT !== undefined && env.CONTEXT !== "production") ||
    env.SITE_ENV === "staging" ||
    env.SITE_ENV === "preview" ||
    env.NODE_ENV === "development";
  return { origin, indexable: !preview };
}
export function pageMetadata(
  title: string,
  description: string,
  path: string,
  privatePage = false,
): Metadata {
  const { origin, indexable } = sitePolicy();
  return {
    title: { absolute: `${title} | PlayNudge` },
    description,
    alternates: { canonical: `${origin}${path}` },
    robots: { index: indexable && !privatePage, follow: true },
    openGraph: {
      title: `${title} | PlayNudge`,
      description,
      url: `${origin}${path}`,
      siteName: "PlayNudge",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "PlayNudge — Jelloo and Friendship Quiz",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PlayNudge`,
      description,
      images: ["/opengraph-image"],
    },
  };
}
export const PUBLIC_PATHS = [
  "/",
  "/games",
  "/quiz",
  "/quiz/create",
  "/jelloo",
] as const;
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
