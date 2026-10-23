import type { MetadataRoute } from "next";
import { sitePolicy, PUBLIC_PATHS } from "@/lib/platform/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const { origin } = sitePolicy();
  return PUBLIC_PATHS.map((path) => ({
    url: origin + (path === "/" ? "" : path),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));
}
