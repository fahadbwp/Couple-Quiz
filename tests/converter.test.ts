import { test } from "node:test";
import assert from "node:assert/strict";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

test("Converter Tool: Sitemap and Robots integration", () => {
  // 1. Sitemap check
  const sitemapUrls = sitemap();
  const pdfConverterEntry = sitemapUrls.find((entry) =>
    entry.url.endsWith("/tools/pdf-converter")
  );
  assert.ok(pdfConverterEntry, "Sitemap must include /tools/pdf-converter");
  assert.equal(pdfConverterEntry.priority, 0.8);
  assert.equal(pdfConverterEntry.changeFrequency, "weekly");

  // 2. Robots check
  const robotsConfig = robots();
  const allowRules = robotsConfig.rules;
  const allowList = Array.isArray(allowRules)
    ? (allowRules[0].allow as string[])
    : ((allowRules as { allow: string[] }).allow as string[]);

  assert.ok(
    allowList.includes("/tools/"),
    "robots.txt must explicitly allow /tools/"
  );
});

test("Converter Tool: Conversion modules exports and interface contracts", async () => {
  const { convertDocxToPdf } = await import("@/lib/converter/docxToPdf");
  assert.equal(typeof convertDocxToPdf, "function");

  const { convertPdfToDocx, extractTextFromPdf } = await import(
    "@/lib/converter/pdfToDocx"
  );
  assert.equal(typeof convertPdfToDocx, "function");
  assert.equal(typeof extractTextFromPdf, "function");
});
