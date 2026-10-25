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
              "/quiz",
              "/quiz/create",
              "/api/og/quiz/",
              "/api/og/quiz",
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
