import type { MetadataRoute } from "next";
import { sitePolicy } from "@/lib/platform/site";

export default function robots(): MetadataRoute.Robots {
  const { origin, indexable } = sitePolicy();
  return {
    rules: indexable
      ? [
          {
            userAgent: "*",
            allow: [
              "/",
              "/games",
              "/jelloo",
              "/jelloo/map",
              "/jelloo/character-worlds",
              "/quiz",
              "/quiz/create",
              "/daily",
              "/daily/archive",
              "/api/og/quiz/",
              "/api/og/quiz",
              "/llms.txt",
            ],
            disallow: [
              "/api/",
              "/design-preview/",
              "/jelloo/qa",
              "/jelloo/art",
              "/jelloo/transfer",
            ],
          },
          {
            userAgent: ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot"],
            allow: [
              "/",
              "/games",
              "/jelloo",
              "/jelloo/map",
              "/jelloo/character-worlds",
              "/quiz",
              "/quiz/create",
              "/daily",
              "/daily/archive",
              "/llms.txt",
            ],
            disallow: [
              "/api/",
              "/design-preview/",
              "/jelloo/qa",
              "/jelloo/art",
              "/jelloo/transfer",
            ],
          },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: origin + "/sitemap.xml",
  };
}
