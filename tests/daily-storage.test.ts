/**
 * Daily Path (Pathle) - Offline Persistence & Streaks Unit Tests
 * Milestone 4: Comprehensive test suite for lib/daily/storage.ts
 */

import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  DAILY_PATH_STORAGE_KEY,
  DAILY_PATH_LOCK_NAME,
  createInitialDailyPathStats,
  sanitizeStats,
  withDailyPathLock,
  getDailyPathStats,
  saveDailyCompletion,
  recordArchiveCompletion,
  syncWithSupabase,
  clearDailyPathStats,
} from "../lib/daily/storage";

// ============================================================================
// In-Memory Storage Mock for Controlled Isolation
// ============================================================================

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

// Setup a clean mock localStorage on globalThis for all tests
const mockStorageInstance = new MockStorage();
Object.defineProperty(globalThis, "localStorage", {
  value: mockStorageInstance,
  configurable: true,
  writable: true,
});

beforeEach(async () => {
  mockStorageInstance.clear();
  await clearDailyPathStats();
});

// ============================================================================
// 1. Initialized Default State Tests
// ============================================================================

test("M4-Storage-1.1: getDailyPathStats returns zero-initialized default state when store is empty", async () => {
  const stats = await getDailyPathStats();

  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.maxStreak, 0);
  assert.equal(stats.gamesPlayed, 0);
  assert.equal(stats.gamesWon, 0);
  assert.deepEqual(stats.moveDistribution, {});
  assert.deepEqual(stats.history, {});
  assert.equal(stats.lastPlayedDate, null);
});

test("M4-Storage-1.2: createInitialDailyPathStats returns a pure detached object", () => {
  const s1 = createInitialDailyPathStats();
  const s2 = createInitialDailyPathStats();

  s1.currentStreak = 10;
  s1.moveDistribution[5] = 1;

  assert.equal(s2.currentStreak, 0);
  assert.deepEqual(s2.moveDistribution, {});
});

// ============================================================================
// 2. Daily Completion & Consecutive Day Streaks
// ============================================================================

test("M4-Storage-2.1: First puzzle completion sets streak 1 and records game statistics", async () => {
  const stats = await saveDailyCompletion("2026-11-01", 5, 6);

  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.maxStreak, 1);
  assert.equal(stats.gamesPlayed, 1);
  assert.equal(stats.gamesWon, 1);
  assert.equal(stats.moveDistribution[5], 1);
  assert.equal(stats.lastPlayedDate, "2026-11-01");

  const record = stats.history["2026-11-01"];
  assert.ok(record);
  assert.equal(record.dateStr, "2026-11-01");
  assert.equal(record.moves, 5);
  assert.equal(record.par, 6);
  assert.equal(record.won, true);
  assert.ok(Date.parse(record.completedAt) > 0);
});

test("M4-Storage-2.2: Consecutive calendar days increment current streak and track max streak", async () => {
  // Day 1
  let stats = await saveDailyCompletion("2026-11-01", 5, 6);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.maxStreak, 1);

  // Day 2 (Consecutive)
  stats = await saveDailyCompletion("2026-11-02", 6, 6);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.maxStreak, 2);
  assert.equal(stats.gamesWon, 2);

  // Day 3 (Consecutive)
  stats = await saveDailyCompletion("2026-11-03", 4, 6);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.maxStreak, 3);
  assert.equal(stats.gamesWon, 3);
  assert.equal(stats.lastPlayedDate, "2026-11-03");
});

test("M4-Storage-2.3: Move distribution tracks frequency of different move counts accurately", async () => {
  await saveDailyCompletion("2026-11-01", 5, 6);
  await saveDailyCompletion("2026-11-02", 5, 6);
  const stats = await saveDailyCompletion("2026-11-03", 8, 6);

  assert.equal(stats.moveDistribution[5], 2);
  assert.equal(stats.moveDistribution[8], 1);
});

// ============================================================================
// 3. Replay Protection (Same Day)
// ============================================================================

test("M4-Storage-3.1: Same-day replay protects streak and win count from double counting", async () => {
  let stats = await saveDailyCompletion("2026-11-01", 6, 6);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.gamesWon, 1);
  assert.equal(stats.gamesPlayed, 1);

  // Replaying the same calendar date
  stats = await saveDailyCompletion("2026-11-01", 5, 6);
  assert.equal(stats.currentStreak, 1, "Current streak must NOT increment on same-day replay");
  assert.equal(stats.maxStreak, 1);
  assert.equal(stats.gamesWon, 1, "Games won must NOT double count on same-day replay");
  assert.equal(stats.gamesPlayed, 1, "Games played must NOT double count on same-day replay");
});

test("M4-Storage-3.2: Same-day replay updates move history record with latest result", async () => {
  await saveDailyCompletion("2026-11-01", 6, 6);
  const replayed = await saveDailyCompletion("2026-11-01", 4, 6);

  assert.equal(replayed.history["2026-11-01"].moves, 4);
});

test("M4-Storage-3.3: Multiple rapid replays on same day maintain invariant counts", async () => {
  for (let i = 0; i < 5; i++) {
    await saveDailyCompletion("2026-11-01", 5 + i, 6);
  }
  const stats = await getDailyPathStats();
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.gamesWon, 1);
  assert.equal(stats.gamesPlayed, 1);
});

// ============================================================================
// 4. Streak Reset on Gap (> 1 Day)
// ============================================================================

test("M4-Storage-4.1: Gap of >1 day resets current streak to 1 while preserving peak max streak", async () => {
  await saveDailyCompletion("2026-11-01", 5, 6);
  await saveDailyCompletion("2026-11-02", 5, 6);
  let stats = await saveDailyCompletion("2026-11-03", 5, 6);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.maxStreak, 3);

  // Skip 2026-11-04 and play 2026-11-05
  stats = await saveDailyCompletion("2026-11-05", 6, 6);
  assert.equal(stats.currentStreak, 1, "Current streak should reset to 1 after gap");
  assert.equal(stats.maxStreak, 3, "Max streak should retain all-time peak of 3");
  assert.equal(stats.gamesWon, 4);
  assert.equal(stats.lastPlayedDate, "2026-11-05");
});

test("M4-Storage-4.2: Streak building resumes cleanly after a streak reset", async () => {
  await saveDailyCompletion("2026-11-01", 5, 6);
  await saveDailyCompletion("2026-11-02", 5, 6);
  // Gap to 11-05 (resets to 1)
  await saveDailyCompletion("2026-11-05", 5, 6);
  // Consecutive day 11-06 (increments to 2)
  const stats = await saveDailyCompletion("2026-11-06", 5, 6);

  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.maxStreak, 2);
});

// ============================================================================
// 5. Archive Replay Isolation (Does NOT Mutate Active Streak)
// ============================================================================

test("M4-Storage-5.1: Archive historical replay saves record in history without mutating active streak", async () => {
  // Build a 3-day active streak ending today 2026-11-03
  await saveDailyCompletion("2026-11-01", 5, 6);
  await saveDailyCompletion("2026-11-02", 5, 6);
  let stats = await saveDailyCompletion("2026-11-03", 5, 6);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.maxStreak, 3);
  assert.equal(stats.lastPlayedDate, "2026-11-03");

  // Replay a puzzle from July 2026 via archive
  stats = await recordArchiveCompletion("2026-07-15", 6, 7);

  // Active daily streak invariants
  assert.equal(stats.currentStreak, 3, "Active current streak must remain 3 after archive replay");
  assert.equal(stats.maxStreak, 3, "Max streak must remain 3");
  assert.equal(stats.lastPlayedDate, "2026-11-03", "lastPlayedDate must NOT be overridden by archive date");

  // History contains the archive completion
  const archiveItem = stats.history["2026-07-15"];
  assert.ok(archiveItem);
  assert.equal(archiveItem.dateStr, "2026-07-15");
  assert.equal(archiveItem.moves, 6);
  assert.equal(archiveItem.par, 7);
  assert.equal(archiveItem.won, true);
});

test("M4-Storage-5.2: Live daily play continues consecutively after archive replay", async () => {
  await saveDailyCompletion("2026-11-01", 5, 6);
  await recordArchiveCompletion("2026-05-20", 7, 7);

  // Play next day 2026-11-02
  const stats = await saveDailyCompletion("2026-11-02", 5, 6);
  assert.equal(stats.currentStreak, 2, "Streak should increment to 2 because lastPlayedDate was preserved");
  assert.equal(stats.lastPlayedDate, "2026-11-02");
});

// ============================================================================
// 6. Recovery From Corrupted JSON Payload
// ============================================================================

test("M4-Storage-6.1: Corrupted JSON syntax in localStorage recovers gracefully to initial stats", async () => {
  mockStorageInstance.setItem(DAILY_PATH_STORAGE_KEY, "{ MALFORMED_JSON_BROKEN_SYNTAX: true ");

  const stats = await getDailyPathStats();
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.maxStreak, 0);
  assert.equal(stats.gamesPlayed, 0);
  assert.equal(stats.gamesWon, 0);
  assert.deepEqual(stats.history, {});
});

test("M4-Storage-6.2: Malformed property types are sanitized and clamped safely", () => {
  const malformed = {
    currentStreak: "not_a_number",
    maxStreak: -10,
    gamesPlayed: null,
    gamesWon: "invalid",
    moveDistribution: "not_an_object",
    history: null,
    lastPlayedDate: 12345,
  };

  const sanitized = sanitizeStats(malformed);
  assert.equal(sanitized.currentStreak, 0);
  assert.equal(sanitized.maxStreak, 0);
  assert.equal(sanitized.gamesPlayed, 0);
  assert.equal(sanitized.gamesWon, 0);
  assert.deepEqual(sanitized.moveDistribution, {});
  assert.deepEqual(sanitized.history, {});
  assert.equal(sanitized.lastPlayedDate, null);
});

test("M4-Storage-6.3: Partial stored payload safely defaults missing fields", async () => {
  mockStorageInstance.setItem(DAILY_PATH_STORAGE_KEY, JSON.stringify({ currentStreak: 4 }));

  const stats = await getDailyPathStats();
  assert.equal(stats.currentStreak, 4);
  assert.equal(stats.maxStreak, 4); // maxStreak >= currentStreak invariant
  assert.equal(stats.gamesPlayed, 0);
  assert.deepEqual(stats.moveDistribution, {});
});

test("M4-Storage-6.4: Subsequent save succeeds after recovering from corruption", async () => {
  mockStorageInstance.setItem(DAILY_PATH_STORAGE_KEY, "INVALID_SYNTAX");

  const stats = await saveDailyCompletion("2026-11-01", 5, 6);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.gamesWon, 1);

  // Inspect raw persisted payload to verify it is valid JSON now
  const raw = mockStorageInstance.getItem(DAILY_PATH_STORAGE_KEY);
  assert.ok(raw);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.currentStreak, 1);
});

// ============================================================================
// 7. Web Locks & Fallback Concurrency Safety
// ============================================================================

test("M4-Storage-7.1: withDailyPathLock fallback executes safely when navigator.locks is absent", async () => {
  const originalNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  try {
    // Emulate environment without navigator.locks
    Object.defineProperty(globalThis, "navigator", {
      value: { locks: undefined },
      configurable: true,
      writable: true,
    });

    const result = await withDailyPathLock(async () => {
      return 42;
    });
    assert.equal(result, 42);
  } finally {
    if (originalNav) {
      Object.defineProperty(globalThis, "navigator", originalNav);
    }
  }
});

test("M4-Storage-7.2: Concurrent tasks serialize through mutex fallback queue", async () => {
  const originalNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  try {
    Object.defineProperty(globalThis, "navigator", {
      value: { locks: undefined },
      configurable: true,
      writable: true,
    });

    const executionLog: number[] = [];

    const task = (id: number, delayMs: number) => {
      return withDailyPathLock(async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        executionLog.push(id);
        return id;
      });
    };

    // Launch three tasks concurrently
    const p1 = task(1, 30);
    const p2 = task(2, 10);
    const p3 = task(3, 5);

    await Promise.all([p1, p2, p3]);

    // Despite task 2 and 3 having shorter delays, they must finish in sequential order (1 -> 2 -> 3)
    assert.deepEqual(executionLog, [1, 2, 3]);
  } finally {
    if (originalNav) {
      Object.defineProperty(globalThis, "navigator", originalNav);
    }
  }
});

test("M4-Storage-7.3: Failed task in mutex fallback does not block subsequent tasks", async () => {
  const originalNav = Object.getOwnPropertyDescriptor(globalThis, "navigator");

  try {
    Object.defineProperty(globalThis, "navigator", {
      value: { locks: undefined },
      configurable: true,
      writable: true,
    });

    // Failing task
    await assert.rejects(async () => {
      await withDailyPathLock(async () => {
        throw new Error("Failed task");
      });
    });

    // Subsequent task should still run
    const result = await withDailyPathLock(async () => "success");
    assert.equal(result, "success");
  } finally {
    if (originalNav) {
      Object.defineProperty(globalThis, "navigator", originalNav);
    }
  }
});

// ============================================================================
// 8. Calendar Boundary Invariants (Leap Year & Year Rollover)
// ============================================================================

test("M4-Storage-8.1: Year rollover 2026-12-31 to 2027-01-01 counts as consecutive streak", async () => {
  await saveDailyCompletion("2026-12-31", 5, 6);
  const stats = await saveDailyCompletion("2027-01-01", 5, 6);

  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.maxStreak, 2);
  assert.equal(stats.lastPlayedDate, "2027-01-01");
});

test("M4-Storage-8.2: Leap year sequence 2028-02-28 -> 2028-02-29 -> 2028-03-01 increments streak", async () => {
  await saveDailyCompletion("2028-02-28", 5, 6);
  await saveDailyCompletion("2028-02-29", 5, 6);
  const stats = await saveDailyCompletion("2028-03-01", 5, 6);

  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.maxStreak, 3);
});

// ============================================================================
// 9. Cloud Leaderboard Sync Hook (Supabase Fail-Safe)
// ============================================================================

test("M4-Storage-9.1: syncWithSupabase returns false cleanly when unconfigured", async () => {
  const stats = await getDailyPathStats();
  const res = await syncWithSupabase(stats);
  assert.equal(res, false);
});

test("M4-Storage-9.2: syncWithSupabase does not throw unhandled exceptions in offline mode", async () => {
  const stats = createInitialDailyPathStats();
  await assert.doesNotReject(async () => {
    await syncWithSupabase(stats);
  });
});

test("M4-Storage-9.3: syncWithSupabase handles invalid/unreachable endpoints gracefully", async () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_ANON_KEY;

  try {
    process.env.SUPABASE_URL = "https://invalid-unreachable-domain-12345.supabase.co";
    process.env.SUPABASE_ANON_KEY = "dummy-anon-key";

    const stats = createInitialDailyPathStats();
    const result = await syncWithSupabase(stats);
    assert.equal(result, false);
  } finally {
    if (oldUrl) process.env.SUPABASE_URL = oldUrl;
    else delete process.env.SUPABASE_URL;
    if (oldKey) process.env.SUPABASE_ANON_KEY = oldKey;
    else delete process.env.SUPABASE_ANON_KEY;
  }
});

// ============================================================================
// 10. clearDailyPathStats
// ============================================================================

test("M4-Storage-10.1: clearDailyPathStats wipes persisted records back to zero state", async () => {
  await saveDailyCompletion("2026-11-01", 5, 6);
  let stats = await getDailyPathStats();
  assert.equal(stats.currentStreak, 1);

  await clearDailyPathStats();

  stats = await getDailyPathStats();
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.gamesWon, 0);
  assert.deepEqual(stats.history, {});
});
