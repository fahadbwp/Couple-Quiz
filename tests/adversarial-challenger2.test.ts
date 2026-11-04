/**
 * Challenger 2: Adversarial Coverage Hardening Test Suite
 *
 * Systematic stress-testing, chaos monkey, fuzzing, and boundary verification
 * across Daily Path (Pathle) subsystems:
 *
 * 1. Storage Concurrency & Chaos Testing
 * 2. Share Card Adversarial Fuzzing & Anti-Leak Validation
 * 3. Midnight Rollover & Archive Anti-Cheat Boundary Hardening
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  withDailyPathLock,
  getDailyPathStats,
  saveDailyCompletion,
  recordArchiveCompletion,
  clearDailyPathStats,
  sanitizeStats,
  createInitialDailyPathStats,
  DAILY_PATH_STORAGE_KEY,
  DAILY_PATH_LOCK_NAME,
} from "../lib/daily/storage";

import {
  isSpoilerFree,
  generateShareText,
  computeEfficiencyEmojis,
  SPOILER_FREE_REGEX,
  SPOILER_FREE_GENERAL_REGEX,
} from "../lib/daily/share";

import { watchUtcDay } from "../lib/daily/rollover";
import { isArchiveDateValid } from "../lib/daily/archive";

describe("Challenger 2 - Adversarial Coverage Hardening Suite", () => {
  beforeEach(async () => {
    await clearDailyPathStats();
  });

  afterEach(async () => {
    await clearDailyPathStats();
  });

  // =========================================================================
  // FOCUS 1: Storage Concurrency & Chaos Testing
  // =========================================================================
  describe("1. Storage Concurrency & Chaos Testing", () => {
    it("simulates 50 concurrent async multi-tab mutations without data race or loss", async () => {
      let counter = 0;
      const tasks = Array.from({ length: 50 }, (_, i) => {
        return withDailyPathLock(async () => {
          const current = counter;
          // Inject jitter to provoke race conditions
          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5) + 1));
          counter = current + 1;
          return counter;
        });
      });

      const results = await Promise.all(tasks);
      assert.strictEqual(counter, 50, "Counter should reflect exactly 50 serialized increments");
      assert.strictEqual(results.length, 50);
    });

    it("ensures lock queue releases cleanly when an async operation throws an error", async () => {
      let executedAfterError = false;

      // Launch an operation that fails
      const failingOp = withDailyPathLock(async () => {
        await new Promise((r) => setTimeout(r, 5));
        throw new Error("Adversarial simulated error inside lock");
      });

      // Launch subsequent operations queued behind the failing operation
      const subsequentOp = withDailyPathLock(async () => {
        executedAfterError = true;
        return "recovered";
      });

      await assert.rejects(failingOp, {
        message: "Adversarial simulated error inside lock",
      });

      const result = await subsequentOp;
      assert.strictEqual(result, "recovered");
      assert.strictEqual(executedAfterError, true, "Subsequent operation must execute without deadlock");
    });

    it("verifies mock navigator.locks Web Locks API simulation executes and serializes", async () => {
      // In Node 22, navigator is a getter on globalThis. Define 'locks' property on navigator instead.
      let lockExecutionCount = 0;
      const originalLocksDesc = Object.getOwnPropertyDescriptor(navigator, "locks");

      Object.defineProperty(navigator, "locks", {
        value: {
          request: async (name: string, callback: () => Promise<unknown>) => {
            assert.strictEqual(name, DAILY_PATH_LOCK_NAME);
            lockExecutionCount++;
            return await callback();
          },
        },
        configurable: true,
        writable: true,
      });

      try {
        const val = await withDailyPathLock(async () => {
          return 42;
        });
        assert.strictEqual(val, 42);
        assert.strictEqual(lockExecutionCount, 1);
      } finally {
        if (originalLocksDesc) {
          Object.defineProperty(navigator, "locks", originalLocksDesc);
        } else {
          // @ts-expect-error cleanup mock property
          delete navigator.locks;
        }
      }
    });

    it("recovers gracefully from heavily corrupted JSON and malformed payloads in localStorage", async () => {
      const corruptPayloads = [
        "not-valid-json{",
        "",
        "   ",
        "undefined",
        "null",
        "12345",
        "true",
        "false",
        "[]",
        '{"currentStreak": "invalid", "maxStreak": null}',
        '{"currentStreak": -100, "maxStreak": -50, "gamesPlayed": -1, "gamesWon": -2}',
        '{"currentStreak": NaN, "maxStreak": Infinity, "gamesPlayed": null}',
        '{"moveDistribution": "corrupt_string"}',
        '{"moveDistribution": [1, 2, 3]}',
        '{"history": "invalid_history"}',
        '{"history": [null, 123]}',
      ];

      for (const payload of corruptPayloads) {
        if (typeof localStorage !== "undefined" && localStorage) {
          localStorage.setItem(DAILY_PATH_STORAGE_KEY, payload);
        }
        const stats = await getDailyPathStats();
        assert.ok(stats, "Stats must not be null/undefined");
        assert.ok(typeof stats.currentStreak === "number" && !isNaN(stats.currentStreak) && stats.currentStreak >= 0);
        assert.ok(typeof stats.maxStreak === "number" && !isNaN(stats.maxStreak) && stats.maxStreak >= 0);
        assert.ok(typeof stats.gamesPlayed === "number" && stats.gamesPlayed >= stats.gamesWon);
        assert.ok(typeof stats.gamesWon === "number" && stats.gamesWon >= 0);
        assert.ok(typeof stats.moveDistribution === "object" && stats.moveDistribution !== null);
        assert.ok(typeof stats.history === "object" && stats.history !== null);
      }
    });

    it("immunizes against Prototype Pollution attempts in stored JSON", () => {
      const maliciousPayload = JSON.parse(`{
        "__proto__": { "polluted": "yes" },
        "constructor": { "prototype": { "polluted2": "yes" } },
        "currentStreak": 3,
        "maxStreak": 5,
        "history": {
          "__proto__": { "pollutedHistory": "yes" },
          "2026-11-01": { "won": true, "moves": 4, "par": 5 }
        },
        "moveDistribution": {
          "__proto__": 999,
          "4": 1
        }
      }`);

      const sanitized = sanitizeStats(maliciousPayload);
      assert.strictEqual(sanitized.currentStreak, 3);
      assert.strictEqual(sanitized.maxStreak, 5);

      // Verify Object.prototype was NOT polluted
      const cleanObj: Record<string, unknown> = {};
      assert.strictEqual(cleanObj["polluted"], undefined, "Object prototype must not be polluted");
      assert.strictEqual(cleanObj["polluted2"], undefined, "Object prototype must not be polluted via constructor");
      assert.strictEqual(cleanObj["pollutedHistory"], undefined, "Object prototype must not be polluted via history");
    });

    it("verifies streak logic under same-day replay and gap detection (>1 day resets to 1, maxStreak preserved)", async () => {
      // Day 1
      const s1 = await saveDailyCompletion("2026-11-01", 5, 5);
      assert.strictEqual(s1.currentStreak, 1);
      assert.strictEqual(s1.maxStreak, 1);
      assert.strictEqual(s1.gamesPlayed, 1);
      assert.strictEqual(s1.gamesWon, 1);

      // Same day replay with different moves (replaying today does NOT increment streak or gamesPlayed)
      const s1Replay = await saveDailyCompletion("2026-11-01", 4, 5);
      assert.strictEqual(s1Replay.currentStreak, 1);
      assert.strictEqual(s1Replay.maxStreak, 1);
      assert.strictEqual(s1Replay.gamesPlayed, 1);
      assert.strictEqual(s1Replay.gamesWon, 1);
      assert.strictEqual(s1Replay.history["2026-11-01"].moves, 4);

      // Consecutive Day 2
      const s2 = await saveDailyCompletion("2026-11-02", 6, 6);
      assert.strictEqual(s2.currentStreak, 2);
      assert.strictEqual(s2.maxStreak, 2);
      assert.strictEqual(s2.gamesPlayed, 2);

      // Consecutive Day 3
      const s3 = await saveDailyCompletion("2026-11-03", 5, 5);
      assert.strictEqual(s3.currentStreak, 3);
      assert.strictEqual(s3.maxStreak, 3);

      // Gap of 3 days: skip to 2026-11-07 (>1 day gap resets currentStreak to 1, preserves maxStreak)
      const s4 = await saveDailyCompletion("2026-11-07", 5, 5);
      assert.strictEqual(s4.currentStreak, 1, "Gap >1 day must reset current streak to 1");
      assert.strictEqual(s4.maxStreak, 3, "Max streak must be preserved at peak (3)");
      assert.strictEqual(s4.gamesPlayed, 4);

      // Consecutive Day 8
      const s5 = await saveDailyCompletion("2026-11-08", 4, 5);
      assert.strictEqual(s5.currentStreak, 2);
      assert.strictEqual(s5.maxStreak, 3);
    });

    it("verifies archive replay isolation: recordArchiveCompletion MUST NOT mutate currentStreak or lastPlayedDate", async () => {
      // Establish active live streak on 2026-11-01
      await saveDailyCompletion("2026-11-01", 5, 5);
      const liveStats = await getDailyPathStats();
      assert.strictEqual(liveStats.currentStreak, 1);
      assert.strictEqual(liveStats.maxStreak, 1);
      assert.strictEqual(liveStats.lastPlayedDate, "2026-11-01");
      assert.strictEqual(liveStats.gamesWon, 1);

      // Replay historical archive date
      const archiveResult = await recordArchiveCompletion("2026-08-15", 7, 6);
      assert.strictEqual(archiveResult.currentStreak, 1, "Archive replay MUST NOT alter currentStreak");
      assert.strictEqual(archiveResult.maxStreak, 1, "Archive replay MUST NOT alter maxStreak");
      assert.strictEqual(archiveResult.lastPlayedDate, "2026-11-01", "Archive replay MUST NOT alter lastPlayedDate");
      assert.strictEqual(archiveResult.history["2026-08-15"]?.won, true, "Archive date should be recorded in history");
      assert.strictEqual(archiveResult.history["2026-08-15"]?.moves, 7);
    });
  });

  // =========================================================================
  // FOCUS 2: Share Card Adversarial Fuzzing
  // =========================================================================
  describe("2. Share Card Adversarial Fuzzing", () => {
    it("rejects adversarial payloads attempting to leak coordinates: (r1c2), r0c3, (2,3), etc.", () => {
      const validCard = generateShareText({
        puzzleNumber: 42,
        moves: 5,
        par: 6,
        streak: 7,
      });
      assert.strictEqual(isSpoilerFree(validCard), true);

      // Injected coordinate leaks
      const leakVariations = [
        validCard + "\n(r1c2)",
        validCard.replace("Daily Path #42 🧭", "Daily Path #42 🧭 (r1c2)"),
        validCard.replace("5/6 Moves", "5/6 Moves r0c3"),
        validCard.replace("🔥 7", "🔥 7 [1, 2]"),
        validCard + "\ncoord 0,1",
        validCard + "\ncell-0-1",
        validCard + "\nrow 1 col 2",
      ];

      for (const poisoned of leakVariations) {
        assert.strictEqual(
          isSpoilerFree(poisoned),
          false,
          `Card with leak must be rejected: ${JSON.stringify(poisoned)}`
        );
      }
    });

    it("rejects adversarial payloads attempting to leak rotation angles: 90°, 180deg, 270 degrees, rot: 1", () => {
      const validCard = generateShareText({
        puzzleNumber: 42,
        moves: 5,
        par: 6,
        streak: 7,
      });

      const rotationLeaks = [
        validCard + "\n90°",
        validCard + "\n180deg",
        validCard + "\n270 degrees",
        validCard.replace("5/6 Moves", "5/6 Moves rot 1"),
        validCard.replace("Daily Path #42 🧭", "Daily Path #42 🧭 rotation 2"),
        validCard + "\ndeg 90",
      ];

      for (const poisoned of rotationLeaks) {
        assert.strictEqual(
          isSpoilerFree(poisoned),
          false,
          `Card with rotation leak must be rejected: ${JSON.stringify(poisoned)}`
        );
      }
    });

    it("rejects adversarial payloads attempting to leak tile names: tee, corner, cross, straight, start, goal", () => {
      const validCard = generateShareText({
        puzzleNumber: 42,
        moves: 5,
        par: 6,
        streak: 7,
      });

      const tileLeaks = [
        validCard + "\ntee",
        validCard + "\ncorner",
        validCard + "\ncross",
        validCard + "\nstraight",
        validCard + "\nstart",
        validCard + "\ngoal",
      ];

      for (const poisoned of tileLeaks) {
        assert.strictEqual(
          isSpoilerFree(poisoned),
          false,
          `Card with tile leak must be rejected: ${JSON.stringify(poisoned)}`
        );
      }
    });

    it("ensures legitimate puzzle numbers (Day #90, Day #180, Day #270, Day #365) are NOT falsely flagged as spoilers", () => {
      const testCases = [
        { puzzleNumber: 90, moves: 5, par: 6, streak: 3 },
        { puzzleNumber: 180, moves: 7, par: 6, streak: 12 },
        { puzzleNumber: 270, moves: 6, par: 6, streak: 1 },
        { puzzleNumber: 360, moves: 4, par: 5, streak: 0 },
        { puzzleNumber: 1, moves: 5, par: 5, streak: 1 },
        { puzzleNumber: 365, moves: 8, par: 8, streak: 365 },
        { puzzleNumber: 1000, moves: 10, par: 8, streak: 50 },
      ];

      for (const tc of testCases) {
        const card = generateShareText(tc);
        assert.strictEqual(
          isSpoilerFree(card),
          true,
          `Legitimate Day #${tc.puzzleNumber} scorecard must NEVER be falsely flagged as spoiler!`
        );
        assert.match(card, SPOILER_FREE_GENERAL_REGEX);
      }
    });

    it("validates efficiency emojis block invariants under extreme ratios", () => {
      // Moves much less than par (super optimal)
      const underPar = computeEfficiencyEmojis(1, 10);
      const underParChars = underPar.replace("\n", "");
      assert.strictEqual(Array.from(underParChars).length, 8);
      assert.ok(underParChars.includes("⬜"), "Under par should have white buffer blocks");

      // Moves exactly par
      const exactPar = computeEfficiencyEmojis(6, 6);
      const exactParChars = exactPar.replace("\n", "");
      assert.strictEqual(Array.from(exactParChars).length, 8);
      assert.strictEqual(exactParChars, "🟩🟩🟩🟩🟩🟩🟩🟩", "Exact par should be all green");

      // Moves much greater than par
      const overPar = computeEfficiencyEmojis(50, 5);
      const overParChars = overPar.replace("\n", "");
      assert.strictEqual(Array.from(overParChars).length, 8);
      assert.ok(overParChars.includes("🟨"), "Over par should contain yellow adjustment blocks");
    });
  });

  // =========================================================================
  // FOCUS 3: Midnight Rollover & Archive Anti-Cheat Boundaries
  // =========================================================================
  describe("3. Midnight Rollover & Archive Anti-Cheat Boundaries", () => {
    it("verifies watchUtcDay triggers callback when date advances and stops after unsubscribe", () => {
      let mockCurrentDate = "2026-11-01";
      const triggeredDates: string[] = [];

      const unsubscribe = watchUtcDay(
        (newDate) => {
          triggeredDates.push(newDate);
        },
        () => mockCurrentDate,
        50 // 50ms check
      );

      // Advance date
      mockCurrentDate = "2026-11-02";

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          assert.deepStrictEqual(triggeredDates, ["2026-11-02"]);

          // Advance again
          mockCurrentDate = "2026-11-03";

          setTimeout(() => {
            assert.deepStrictEqual(triggeredDates, ["2026-11-02", "2026-11-03"]);

            // Unsubscribe and verify no further triggers
            unsubscribe();
            mockCurrentDate = "2026-11-04";

            setTimeout(() => {
              assert.deepStrictEqual(triggeredDates, ["2026-11-02", "2026-11-03"]);
              resolve();
            }, 80);
          }, 80);
        }, 80);
      });
    });

    it("verifies isArchiveDateValid anti-cheat blocks future dates", () => {
      const today = "2026-11-01";

      assert.strictEqual(isArchiveDateValid("2026-11-01", today), true, "Today should be valid");
      assert.strictEqual(isArchiveDateValid("2026-10-31", today), true, "Yesterday should be valid");
      assert.strictEqual(isArchiveDateValid("2026-11-02", today), false, "Tomorrow MUST be blocked by anti-cheat");
      assert.strictEqual(isArchiveDateValid("2026-12-01", today), false, "Next month MUST be blocked");
      assert.strictEqual(isArchiveDateValid("2027-01-01", today), false, "Next year MUST be blocked");
      assert.strictEqual(isArchiveDateValid("2099-12-31", today), false, "Far future MUST be blocked");
    });

    it("verifies isArchiveDateValid rejects non-leap year rollover date 2026-02-29 and invalid calendar dates", () => {
      // 2026 is NOT a leap year (2026 % 4 != 0)
      assert.strictEqual(
        isArchiveDateValid("2026-02-29", "2026-12-31"),
        false,
        "2026-02-29 is invalid calendar date (2026 is not leap year) and must return false"
      );
      assert.strictEqual(isArchiveDateValid("2026-02-30", "2026-12-31"), false);
      assert.strictEqual(isArchiveDateValid("2026-02-31", "2026-12-31"), false);
      assert.strictEqual(isArchiveDateValid("2026-04-31", "2026-12-31"), false, "April has only 30 days");
      assert.strictEqual(isArchiveDateValid("2026-06-31", "2026-12-31"), false, "June has only 30 days");
      assert.strictEqual(isArchiveDateValid("2026-09-31", "2026-12-31"), false, "September has only 30 days");
      assert.strictEqual(isArchiveDateValid("2026-11-31", "2026-12-31"), false, "November has only 30 days");
      assert.strictEqual(isArchiveDateValid("2026-13-01", "2026-12-31"), false, "Month 13 is invalid");
      assert.strictEqual(isArchiveDateValid("2026-00-15", "2026-12-31"), false, "Month 0 is invalid");
      assert.strictEqual(isArchiveDateValid("2026-05-00", "2026-12-31"), false, "Day 0 is invalid");
      assert.strictEqual(isArchiveDateValid("2026-05-32", "2026-12-31"), false, "Day 32 is invalid");

      // In a real leap year (2028-02-29), if today is in 2028, it should be valid
      assert.strictEqual(isArchiveDateValid("2028-02-29", "2028-03-01"), true);
    });

    it("verifies isArchiveDateValid blocks pre-epoch dates before 2026-01-01", () => {
      assert.strictEqual(isArchiveDateValid("2025-12-31", "2026-11-01"), false, "Pre-epoch 2025 must be blocked");
      assert.strictEqual(isArchiveDateValid("2024-02-29", "2026-11-01"), false, "Pre-epoch 2024 must be blocked");
      assert.strictEqual(isArchiveDateValid("1970-01-01", "2026-11-01"), false, "Unix epoch 1970 must be blocked");
      assert.strictEqual(isArchiveDateValid("0000-00-00", "2026-11-01"), false, "Zero epoch must be blocked");
      assert.strictEqual(isArchiveDateValid("2026-01-01", "2026-11-01"), true, "Platform epoch boundary must be valid");
    });

    it("verifies isArchiveDateValid strictly neutralizes SQL/XSS injection attempts and malformed inputs", () => {
      const injectionAttacks = [
        "' OR '1'='1",
        "2026-01-01'; DROP TABLE users;--",
        "<script>alert('xss')</script>",
        "2026-01-01<svg onload=alert(1)>",
        "../../../../etc/passwd",
        "2026-05-01/../2026-05-02",
        "2026/05/01",
        "01-05-2026",
        " 2026-05-01 ",
        "2026-5-1",
        "2026-05-01\n",
        "2026-05-01\0",
        "__proto__",
        "constructor",
      ];

      for (const injection of injectionAttacks) {
        assert.strictEqual(
          isArchiveDateValid(injection as string, "2026-11-01"),
          false,
          `Injection string must return false: ${JSON.stringify(injection)}`
        );
      }

      // Non-string types
      const invalidTypes = [null, undefined, 12345, {}, [], NaN, true, false, Symbol("date")];
      for (const badType of invalidTypes) {
        assert.strictEqual(
          isArchiveDateValid(badType as unknown as string, "2026-11-01"),
          false,
          `Non-string input must return false: ${String(badType)}`
        );
      }
    });
  });
});
