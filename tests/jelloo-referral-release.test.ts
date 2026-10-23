import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/jelloo/referrals/route";
import { REFERRALS_RELEASED } from "../lib/jelloo/referrals/release";

test("unapproved referral release rejects every operation without network access", async () => {
  assert.equal(REFERRALS_RELEASED, false);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Network forbidden"); };
  try {
    for (const op of ["register", "status", "renew", "restore", "start", "submit"]) {
      const response = await POST(new Request("https://jelloo.test/api/jelloo/referrals", {
        method: "POST", headers: {"Content-Type":"application/json",origin:"https://jelloo.test"}, body: JSON.stringify({op}),
      }));
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {error:"unavailable"});
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.equal(response.headers.get("Set-Cookie"), null);
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
