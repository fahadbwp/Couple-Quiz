import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/quiz/sharing";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/quiz",
          "/quiz/create",
          "/quiz/play/",
          "/quiz/scoreboard/",
          "/api/og/quiz/",
          "/api/og/quiz",
        ],
        disallow: [
          "/api/",
          "/design-preview/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
