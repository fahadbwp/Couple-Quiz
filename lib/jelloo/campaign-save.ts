/**
 * Jelloo Character Worlds Campaign Save & Storage Isolation Foundation
 *
 * Mandatory Boundaries:
 * - Preserves `jelloo.progress.v1` and its original bytes untouched.
 * - Preserves legacy generator revisions 0–3, completions, and earned stars.
 * - Never copies legacy achievements onto different new puzzles.
 * - Never automatically archives, replaces, or restarts an existing campaign on load.
 * - Stores Campaign v2 progress under a dedicated namespace: `jelloo.campaign.v2`.
 * - Starting the new campaign must be an explicit player action.
 * - Corrupted data and storage failures remain visible, preserved, and unoverwritten.
 * - Updates require an explicit expected previous raw snapshot to prevent conflicts.
 * - No destructive force-reset behavior: destination cannot be overwritten if occupied.
 * - Future export/import retains BOTH campaigns.
 *
 * Concurrency & Multi-Tab Isolation Limits:
 * - In-process storage updates enforce optimistic concurrency via `expectedPreviousRaw`
 *   and read-back persistence verification.
 * - Note on multi-tab concurrency: `localStorage` in web browsers does not provide cross-tab
 *   atomic primitives. Full multi-tab locking requires future integration with the Web Locks API
 *   (`navigator.locks`) or BroadcastChannel storage coordination.
 *
 * Future In-Progress Board Validation Contract:
 * - In-progress board validation is reserved for Phase 3 when the procedural board
 *   generator and solver are implemented.
 * - The authoritative validation contract will verify:
 *   1. Campaign ID matches "character_worlds_v2".
 *   2. Generator version and seed match the level definition.
 *   3. Board dimensions and terrain match deterministic level geometry.
 *   4. Tile count matches level.size^2.
 *   5. All tile kinds and rotations represent legal states reachable from initial scramble.
 *   6. Level ID strictly equals `currentLevelId`.
 * - Until Phase 3, saves containing an `inProgressBoard` are safely held in an
 *   `unsupported_in_progress_board` state with raw bytes preserved, preventing arbitrary
 *   unvalidated boards from entering gameplay.
 */

export const CAMPAIGN_V2_SAVE_KEY = "jelloo.campaign.v2";
export const LEGACY_SAVE_KEY = "jelloo.progress.v1";
export const MAX_SAVE_PAYLOAD_BYTES = 32768; // 32 KB

export interface CharacterWorldsSave {
  version: 2;
  campaignId: "character_worlds_v2";
  completed: number; // 0 to 250
  currentLevelId: number; // 1 to 250
  best: Record<string, number>; // levelId string -> stars (1..3)
  motion: boolean;
  muted: boolean;
  createdAt: string;
  updatedAt: string;
  inProgressBoard?: {
    levelId: number;
    moves: number;
    rotations: number[];
  };
}

export type StorageReader = Pick<Storage, "getItem">;
export type StorageWriter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type SaveReadResult =
  | { status: "missing" }
  | { status: "ready"; save: CharacterWorldsSave; raw: string }
  | {
      status: "unsupported_in_progress_board";
      save: CharacterWorldsSave;
      raw: string;
      error: string;
    }
  | { status: "corrupt"; raw: string; error: string }
  | { status: "storage_unavailable"; error: string };

const ALLOWED_SAVE_KEYS = new Set([
  "version",
  "campaignId",
  "completed",
  "currentLevelId",
  "best",
  "motion",
  "muted",
  "createdAt",
  "updatedAt",
  "inProgressBoard",
]);

const ALLOWED_BOARD_KEYS = new Set(["levelId", "moves", "rotations"]);

/**
 * Validates that a string is a strictly compliant ISO 8601 calendar timestamp.
 *
 * Rules:
 * - Must match ISO 8601 UTC or timezone offset format (e.g. YYYY-MM-DDTHH:mm:ss.sssZ).
 * - Enforces real calendar bounds: checks month 1..12, correct days per month including leap years.
 * - Enforces time bounds: hours 0..23, minutes 0..59, seconds 0..59.
 * - Rejects arbitrary date strings accepted by Date.parse (e.g. "October 27, 2026", "2026/10/27").
 * - Rejects impossible calendar dates (e.g. "2026-02-29T12:00:00.000Z", "2026-04-31T00:00:00.000Z").
 * - Does not throw on malformed or invalid inputs.
 */
export function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;

  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(
      value
    );
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);

  if (month < 1 || month > 12) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;

  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month]) return false;

  if (match[8] !== undefined) {
    const tzHour = parseInt(match[9], 10);
    const tzMin = parseInt(match[10], 10);
    if (tzHour > 23 || tzMin > 59) return false;
  }

  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Validates the schema of a CharacterWorldsSave object.
 *
 * Invariants:
 * - Rejects unknown/extraneous fields.
 * - Rejects timestamps that are not valid ISO date strings.
 * - Rejects achievements for levels above `completed` (no forward awards).
 * - Rejects invalid, non-safe, or out-of-bounds numbers and star counts.
 * - Rejects in-progress board states where board.levelId does not match currentLevelId.
 */
export function validateCampaignV2Schema(obj: unknown): obj is CharacterWorldsSave {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  const s = obj as Record<string, unknown>;

  // Reject unknown fields
  for (const k of Object.keys(s)) {
    if (!ALLOWED_SAVE_KEYS.has(k)) return false;
  }

  if (s.version !== 2) return false;
  if (s.campaignId !== "character_worlds_v2") return false;

  if (
    typeof s.completed !== "number" ||
    !Number.isSafeInteger(s.completed) ||
    s.completed < 0 ||
    s.completed > 250
  ) {
    return false;
  }
  if (
    typeof s.currentLevelId !== "number" ||
    !Number.isSafeInteger(s.currentLevelId) ||
    s.currentLevelId < 1 ||
    s.currentLevelId > 250
  ) {
    return false;
  }
  // currentLevelId cannot be ahead of completed + 1
  if (s.currentLevelId > s.completed + 1) {
    return false;
  }

  if (typeof s.motion !== "boolean" || typeof s.muted !== "boolean") return false;

  // Timestamps must be valid ISO calendar strings
  if (!isValidIsoTimestamp(s.createdAt)) return false;
  if (!isValidIsoTimestamp(s.updatedAt)) return false;

  // Best stars validation
  if (!s.best || typeof s.best !== "object" || Array.isArray(s.best)) return false;
  const bestEntries = Object.entries(s.best as Record<string, unknown>);
  if (bestEntries.length > s.completed) return false;

  for (const [idStr, starVal] of bestEntries) {
    if (!/^[1-9]\d*$/.test(idStr)) return false;
    const id = Number(idStr);
    if (id < 1 || id > 250) return false;
    // INVARIANT: Reject awards for levels above completed!
    if (id > s.completed) return false;
    if (
      typeof starVal !== "number" ||
      !Number.isSafeInteger(starVal) ||
      starVal < 1 ||
      starVal > 3
    ) {
      return false;
    }
  }

  // In-progress board validation
  if (s.inProgressBoard !== undefined) {
    if (
      !s.inProgressBoard ||
      typeof s.inProgressBoard !== "object" ||
      Array.isArray(s.inProgressBoard)
    ) {
      return false;
    }
    const b = s.inProgressBoard as Record<string, unknown>;
    for (const k of Object.keys(b)) {
      if (!ALLOWED_BOARD_KEYS.has(k)) return false;
    }
    if (
      typeof b.levelId !== "number" ||
      !Number.isSafeInteger(b.levelId) ||
      b.levelId < 1 ||
      b.levelId > 250
    ) {
      return false;
    }
    // Board levelId MUST correspond to currentLevelId!
    if (b.levelId !== s.currentLevelId) return false;
    if (typeof b.moves !== "number" || !Number.isSafeInteger(b.moves) || b.moves < 0) {
      return false;
    }
    if (
      !Array.isArray(b.rotations) ||
      b.rotations.some(
        r => typeof r !== "number" || !Number.isSafeInteger(r) || r < 0 || r > 3
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Reads and validates Campaign v2 save data from storage.
 *
 * Invariants:
 * - Never modifies or deletes raw storage on parse failure.
 * - Distinguishes between absent key (`null`) and empty string (`""`).
 * - Holds board-bearing saves in `unsupported_in_progress_board` state while preserving bytes.
 */
export function readCampaignV2Save(store: StorageReader): SaveReadResult {
  let raw: string | null = null;
  try {
    raw = store.getItem(CAMPAIGN_V2_SAVE_KEY);
  } catch (err) {
    return {
      status: "storage_unavailable",
      error: err instanceof Error ? err.message : "Storage access denied",
    };
  }

  if (raw === null) {
    return { status: "missing" };
  }

  if (raw === "") {
    return {
      status: "corrupt",
      raw: "",
      error: "Destination key contains an empty string, which is not valid JSON.",
    };
  }

  if (raw.length > MAX_SAVE_PAYLOAD_BYTES) {
    return {
      status: "corrupt",
      raw,
      error: `Save payload exceeds maximum size limit (${MAX_SAVE_PAYLOAD_BYTES} bytes).`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!validateCampaignV2Schema(parsed)) {
      return {
        status: "corrupt",
        raw,
        error: "Invalid Campaign v2 save schema, inconsistent achievements, or malformed data.",
      };
    }

    // In-progress board safety isolation:
    // Until a real Campaign v2 generator/resolver exists, do NOT return a board-bearing
    // save as fully ready/playable. Return unsupported_in_progress_board while preserving raw bytes.
    if (parsed.inProgressBoard !== undefined) {
      return {
        status: "unsupported_in_progress_board",
        save: parsed,
        raw,
        error:
          "Save contains in-progress board state. Board validation requires the Phase 3 generator; board bytes are preserved and not discarded.",
      };
    }

    return { status: "ready", save: parsed, raw };
  } catch (err) {
    return {
      status: "corrupt",
      raw,
      error: err instanceof Error ? err.message : "JSON parsing failed",
    };
  }
}

/**
 * Safely reads the legacy Campaign v1 save without touching its bytes.
 * Distinguishes between absent key (`null`) and empty string (`""`).
 */
export function readLegacySaveBytes(store: StorageReader): {
  status: "missing" | "present" | "storage_unavailable";
  raw?: string;
  error?: string;
} {
  try {
    const raw = store.getItem(LEGACY_SAVE_KEY);
    if (raw === null) return { status: "missing" };
    return { status: "present", raw };
  } catch (err) {
    return {
      status: "storage_unavailable",
      error: err instanceof Error ? err.message : "Storage access denied",
    };
  }
}

export type WriteResult =
  | { success: true; raw: string }
  | {
      success: false;
      reason:
        | "validation_failed"
        | "conflict_detected"
        | "destination_missing"
        | "destination_corrupt"
        | "destination_unsupported"
        | "payload_too_large"
        | "storage_error"
        | "verification_failed";
      error: string;
      currentRaw?: string | null;
    };

/**
 * Writes Campaign v2 save data transactionally.
 *
 * Invariants:
 * - Snapshot equality is necessary but NOT sufficient.
 * - Validates/classifies existing destination: only a supported, ready destination may be updated.
 * - Rejects absent, corrupt, empty, and unsupported board destinations without overwriting them.
 * - Detects stale-snapshot conflicts (`dest.raw !== expectedPreviousRaw`).
 * - Validates save schema and payload size before writing.
 * - Verifies stored data via read-back before reporting success.
 * - Zero force-reset or implicit recovery behavior.
 */
export function writeCampaignV2Save(
  store: StorageWriter,
  save: CharacterWorldsSave,
  expectedPreviousRaw: string
): WriteResult {
  // 1. Validate incoming save schema before anything else
  if (!validateCampaignV2Schema(save)) {
    return {
      success: false,
      reason: "validation_failed",
      error: "Cannot write invalid Campaign v2 save schema or inconsistent achievements.",
    };
  }

  // 2. Read and classify the current destination in storage.
  // Invariant: Snapshot equality is necessary but NOT sufficient.
  // Only a supported, ready destination may receive a normal update.
  const dest = readCampaignV2Save(store);

  if (dest.status === "storage_unavailable") {
    return {
      success: false,
      reason: "storage_error",
      error: dest.error ?? "Storage access denied",
    };
  }

  if (dest.status === "missing") {
    return {
      success: false,
      reason: "destination_missing",
      error:
        "Destination save does not exist. Normal updates require an existing ready save; use initializeCampaignV2 for absent keys.",
      currentRaw: null,
    };
  }

  if (dest.status === "corrupt") {
    return {
      success: false,
      reason: "destination_corrupt",
      error:
        "Destination save is corrupted. Normal updates are rejected to protect corrupt data from unapproved destruction.",
      currentRaw: dest.raw,
    };
  }

  if (dest.status === "unsupported_in_progress_board") {
    return {
      success: false,
      reason: "destination_unsupported",
      error:
        "Destination save contains an unsupported in-progress board. Normal updates are rejected to protect unvalidated board state from destruction.",
      currentRaw: dest.raw,
    };
  }

  // 3. Current destination is ready and supported. Now enforce snapshot equality to prevent stale overwrite conflicts.
  if (dest.raw !== expectedPreviousRaw) {
    return {
      success: false,
      reason: "conflict_detected",
      error:
        "conflict detected: destination save changed or differed from expected snapshot. Update rejected to prevent data loss.",
      currentRaw: dest.raw,
    };
  }

  // 4. Check serialized payload size
  const payload = JSON.stringify(save);
  if (payload.length > MAX_SAVE_PAYLOAD_BYTES) {
    return {
      success: false,
      reason: "payload_too_large",
      error: `Serialized save payload exceeds ${MAX_SAVE_PAYLOAD_BYTES} bytes limit.`,
    };
  }

  // 5. Perform write
  try {
    store.setItem(CAMPAIGN_V2_SAVE_KEY, payload);

    // 6. Read-back verification before reporting persistence success!
    const verified = store.getItem(CAMPAIGN_V2_SAVE_KEY);
    if (verified !== payload) {
      return {
        success: false,
        reason: "verification_failed",
        error: "Persistence verification failed: read-back payload did not match written data.",
      };
    }
  } catch (err) {
    return {
      success: false,
      reason: "storage_error",
      error: err instanceof Error ? err.message : "Storage quota exceeded or write failed",
    };
  }

  return { success: true, raw: payload };
}

export type InitializeResult =
  | { success: true; save: CharacterWorldsSave; raw: string }
  | {
      success: false;
      reason:
        | "destination_occupied"
        | "validation_failed"
        | "storage_unavailable"
        | "verification_failed"
        | "payload_too_large";
      error: string;
      existingRaw?: string;
    };

/**
 * Initializes a new Campaign v2 save in storage.
 *
 * Invariants:
 * - Pre-validates options and the complete fresh save before ANY storage operation.
 * - Writes ONLY to an absent destination (`getItem(key) === null`).
 * - Empty string ("") is an existing destination key and is rejected.
 * - Refuses to overwrite corrupt or existing data (no destructive force-reset).
 * - Preserves legacy save bytes untouched.
 * - Verifies stored data before reporting success.
 * - Zero automatic execution: must be called by an explicit player action.
 */
export function initializeCampaignV2(
  store: StorageWriter,
  options?: { initialMotion?: boolean; initialMuted?: boolean; now?: string }
): InitializeResult {
  // 1. Validate custom initialization timestamp before any storage operations
  if (options?.now !== undefined && !isValidIsoTimestamp(options.now)) {
    return {
      success: false,
      reason: "validation_failed",
      error: `Invalid ISO timestamp provided for initialization: "${options.now}". Must be a strictly compliant ISO 8601 calendar date.`,
    };
  }

  // 2. Build and validate fresh save
  const now = options?.now ?? new Date().toISOString();
  const freshSave: CharacterWorldsSave = {
    version: 2,
    campaignId: "character_worlds_v2",
    completed: 0,
    currentLevelId: 1,
    best: {},
    motion: options?.initialMotion ?? true,
    muted: options?.initialMuted ?? false,
    createdAt: now,
    updatedAt: now,
  };

  if (!validateCampaignV2Schema(freshSave)) {
    return {
      success: false,
      reason: "validation_failed",
      error: "Fresh save failed schema validation.",
    };
  }

  // 3. Check storage destination
  let existingRaw: string | null = null;
  try {
    existingRaw = store.getItem(CAMPAIGN_V2_SAVE_KEY);
  } catch (err) {
    return {
      success: false,
      reason: "storage_unavailable",
      error: err instanceof Error ? err.message : "Storage access denied",
    };
  }

  // Initialization writes ONLY to an absent destination (null).
  if (existingRaw !== null) {
    return {
      success: false,
      reason: "destination_occupied",
      error:
        existingRaw === ""
          ? "Destination save key already exists with empty content. Initialization writes only to an absent key."
          : "Destination save key already exists. Refusing to overwrite existing data without an approved recovery workflow.",
      existingRaw,
    };
  }

  const payload = JSON.stringify(freshSave);
  if (payload.length > MAX_SAVE_PAYLOAD_BYTES) {
    return {
      success: false,
      reason: "payload_too_large",
      error: `Serialized fresh save payload exceeds ${MAX_SAVE_PAYLOAD_BYTES} bytes limit.`,
    };
  }

  try {
    store.setItem(CAMPAIGN_V2_SAVE_KEY, payload);

    // Read-back verification before reporting success!
    const verified = store.getItem(CAMPAIGN_V2_SAVE_KEY);
    if (verified !== payload) {
      return {
        success: false,
        reason: "verification_failed",
        error: "Persistence verification failed: read-back payload did not match written data.",
      };
    }
  } catch (err) {
    return {
      success: false,
      reason: "storage_unavailable",
      error: err instanceof Error ? err.message : "Failed to write to storage",
    };
  }

  return { success: true, save: freshSave, raw: payload };
}
