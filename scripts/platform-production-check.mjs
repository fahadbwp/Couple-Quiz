// Read-only local production build check. Start an isolated server on port 3016.
import assert from "node:assert/strict";
for (const path of ["/", "/games", "/quiz", "/jelloo"]) {
  const response = await fetch(`http://127.0.0.1:3016${path}`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(!response.headers.get("x-robots-tag"));
  assert.match(html, /<meta name="robots" content="index, follow"/);
  console.log(path, "200 indexable", html.match(/<title>(.*?)<\/title>/)?.[1]);
}
for (const path of ["/quiz/result/q_missing", "/quiz/share/q_missing", "/quiz/play/q_missing", "/quiz/scoreboard/q_missing", "/jelloo/invite"]) {
  const response = await fetch(`http://127.0.0.1:3016${path}`);
  const html = await response.text();
  assert.match(html, /<meta name="robots" content="[^"]*noindex/);
  console.log(path, response.status, "noindex");
}
for (const path of ["/_platform-viewport", "/jelloo/qa"]) {
  const response = await fetch(`http://127.0.0.1:3016${path}`);
  assert.equal(response.status, 404);
  console.log(path, "404");
}
