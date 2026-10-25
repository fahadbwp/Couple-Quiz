import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Banner from "../components/ads/JellooAdsterraBanner";
import { mayShowJellooBanner } from "../lib/platform/ads";

test("banner requires positive consent and family review even when policy enablement is explicit", () => {
  for (const context of [
    { enabled: true },
    { enabled: true, consent: true },
    { enabled: true, familyApproved: true },
    { enabled: true, consent: false, familyApproved: true },
  ]) assert.equal(mayShowJellooBanner(context), false);
  assert.equal(mayShowJellooBanner({ enabled: true, consent: true, familyApproved: true }), true);
});

test("an inherited advertising env flag cannot activate the disabled source release", () => {
  const before = process.env.NEXT_PUBLIC_ADSTERRA_JELLOO_BANNER_ENABLED;
  process.env.NEXT_PUBLIC_ADSTERRA_JELLOO_BANNER_ENABLED = "true";
  try {
    assert.equal(mayShowJellooBanner({ consent: true, familyApproved: true }), false);
    assert.equal(renderToStaticMarkup(React.createElement(Banner, {
      consent: true, familyApproved: true,
    })), "", "Disabled release must emit no iframe, srcdoc, script or resource URL");
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_ADSTERRA_JELLOO_BANNER_ENABLED;
    else process.env.NEXT_PUBLIC_ADSTERRA_JELLOO_BANNER_ENABLED = before;
  }
});

test("third-party srcdoc cannot combine scripts with same-origin, popups or top-navigation privileges", () => {
  const source = readFileSync("components/ads/JellooAdsterraBanner.tsx", "utf8");
  const permissions = [...source.matchAll(/iframe\.sandbox\.add\(([^)]+)\)/g)].map(m => m[1]).join(" ");
  assert.match(permissions, /allow-scripts/);
  assert.doesNotMatch(permissions, /allow-same-origin|allow-popups|allow-top-navigation/);
  assert.doesNotMatch(source, /forceEnabled/);
  assert.match(source, /container\.querySelector\("iframe"\)/, "Rerenders must not initialize a second iframe");
  assert.match(source, /if \(!mounted \|\| !shouldShow\) return/);
});

test("victory controls never share their dialog with a fixed 300px third-party ad", () => {
  const view = readFileSync("app/jelloo/GameView.tsx", "utf8");
  assert.doesNotMatch(view, /JellooAdsterraBanner/);
  assert.match(view, /Next Level/);
  assert.match(view, /Try again/);
  assert.doesNotMatch(readFileSync("app/jelloo/page.tsx", "utf8"), /JellooAdsterraBanner/,
    "The interactive Adventure page must not falsely label active gameplay as idle");
});
