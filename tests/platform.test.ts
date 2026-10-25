import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { GAMES, gameSchema } from "../lib/platform/games";
import {
  sitePolicy,
  pageMetadata,
  PUBLIC_PATHS,
  jsonLd,
  PRIMARY_ORIGIN,
  LEGACY_ORIGIN,
} from "../lib/platform/site";
import {
  getBaseUrl,
  buildQuizPlayMetadata,
  getChallengeUrl,
} from "../lib/quiz/sharing";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
test("platform registry has two unique available games with existing routes and approved art", () => {
  assert.equal(GAMES.length, 2);
  assert.equal(new Set(GAMES.map((g) => g.id)).size, 2);
  for (const game of GAMES) {
    assert.equal(game.status, "available");
    assert.ok(existsSync(`app${game.playUrl}/page.tsx`));
    assert.ok(game.description);
    assert.ok(game.features.length);
    assert.ok(
      existsSync(
        game.artwork.reference.startsWith("/")
          ? `public${game.artwork.reference}`
          : game.artwork.reference.split("#")[0],
      ),
    );
  }
});
test("home and library share equal card markup without invented inventory", () => {
  for (const page of ["app/page.tsx", "app/games/page.tsx"]) {
    const s = readFileSync(page, "utf8");
    assert.match(s, /<GameGrid\s*\/>/);
    assert.doesNotMatch(s, /Coming Soon|aggregateRating|ratingCount/);
  }
  const c = readFileSync("components/platform/Platform.tsx", "utf8");
  assert.match(c, /GAMES.map/);
  assert.match(c, /href=\{game.playUrl\}/);
});
test("canonical configuration prioritizes Netlify primary domain, preserves legacy and rejects unsafe origins", () => {
  assert.equal(sitePolicy({}).origin, PRIMARY_ORIGIN);
  for (const v of [
    "javascript:alert(1)",
    "https://bad.test/path",
    "https://a:b@bad.test",
    "https://bad.test/?token=secret",
    "http://localhost:3014",
  ]) {
    assert.equal(
      sitePolicy({ SITE_CANONICAL_ORIGIN: v }).origin,
      PRIMARY_ORIGIN,
    );
  }
  assert.equal(
    sitePolicy({
      SITE_CANONICAL_ORIGIN: "https://approved.example/",
      NEXT_PUBLIC_APP_URL: "https://old.example",
    }).origin,
    "https://approved.example",
  );
  assert.equal(
    sitePolicy({
      URL: "https://playnudge.netlify.app",
      DEPLOY_PRIME_URL: "https://preview.netlify.app",
    }).origin,
    PRIMARY_ORIGIN,
  );
  assert.equal(
    sitePolicy({ VERCEL_ENV: "preview", VERCEL_URL: "preview.vercel.app" })
      .origin,
    PRIMARY_ORIGIN,
  );
  assert.equal(
    sitePolicy({ SITE_CANONICAL_ORIGIN: LEGACY_ORIGIN }).origin,
    LEGACY_ORIGIN,
  );
});
test("known staging and preview deployments stay noindex even with production origin", () => {
  for (const env of [
    { VERCEL_ENV: "preview" },
    { CONTEXT: "deploy-preview" },
    { CONTEXT: "branch-deploy" },
    { SITE_ENV: "staging" },
    { NODE_ENV: "development" },
  ])
    assert.equal(
      sitePolicy({ ...env, SITE_CANONICAL_ORIGIN: "https://approved.example" })
        .indexable,
      false,
    );
  for (const env of [{ VERCEL_ENV: "production" }, { CONTEXT: "production" }])
    assert.equal(sitePolicy(env).indexable, true);
});
test("metadata has unique absolute canonical and complete social tags; private remains noindex", () => {
  const m = pageMetadata("Game", "Description", "/games");
  assert.equal(m.alternates?.canonical, `${getBaseUrl()}/games`);
  assert.deepEqual(m.title, { absolute: "Game | PlayNudge" });
  assert.ok(m.openGraph);
  assert.ok(m.twitter);
  assert.deepEqual(
    pageMetadata("Private", "Description", "/quiz/result/id", true).robots,
    { index: false, follow: true },
  );
  assert.deepEqual(buildQuizPlayMetadata(null, "q_old").robots, {
    index: false,
    follow: false,
  });
  assert.equal(
    getChallengeUrl("q_old", "http://localhost:3014"),
    "http://localhost:3014/quiz/play/q_old",
  );
});
test("sitemap contains public games but never player results, invite or test routes", () => {
  const paths = sitemap().map((e) => new URL(e.url).pathname);
  assert.deepEqual(paths, [...PUBLIC_PATHS]);
  for (const p of paths)
    assert.doesNotMatch(
      p,
      /\/play\/|\/share\/|\/result\/|\/scoreboard\/|\/invite|\/qa|\/art/,
    );
  const r = robots();
  assert.ok(r.sitemap);
  assert.ok(r.rules);
});
test("structured data is truthful parseable and escapes script termination", () => {
  for (const g of GAMES) {
    const s = gameSchema(g, PRIMARY_ORIGIN);
    assert.equal(s.name, g.name);
    assert.equal(s.url, PRIMARY_ORIGIN + g.playUrl);
    assert.equal(s.applicationCategory, "GameApplication");
    assert.equal(s.offers.price, "0");
    assert.equal(Object.hasOwn(s, "aggregateRating"), false);
    assert.equal(Object.hasOwn(s, "reviewCount"), false);
    assert.deepEqual(JSON.parse(jsonLd(s)), s);
  }
  const payload = { name: "</script><script>alert(1)</script>" };
  assert.ok(!jsonLd(payload).includes("<"));
  assert.deepEqual(JSON.parse(jsonLd(payload)), payload);
});
test("existing quiz and Jelloo routes remain; platform does not write game storage", () => {
  for (const route of [
    "quiz/create",
    "quiz/share/[id]",
    "quiz/play/[id]",
    "quiz/result/[id]",
    "quiz/scoreboard/[id]",
    "jelloo",
    "jelloo/daily",
    "jelloo/zen",
    "jelloo/invite",
    "jelloo/pals",
  ]) {
    assert.ok(existsSync(`app/${route}/page.tsx`), route);
  }
  for (const file of [
    "components/platform/Platform.tsx",
    "app/jelloo/layout.tsx",
    "app/quiz/layout.tsx",
  ]) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /localStorage|sessionStorage|journeyReducer/,
    );
  }
  assert.match(readFileSync("app/quiz/layout.tsx", "utf8"), /preserveSession/);
});
