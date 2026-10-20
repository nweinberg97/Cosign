// Browser-local persistence with a graceful in-memory fallback.

import { STATE_VERSION, STORAGE_KEY } from "./constants";
import { createSeedState } from "./seed";
import type { AppState } from "./types";

const memory = new Map<string, string>();
let storageAvailable: boolean | null = null;

function hasLocalStorage(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const probe = "__cosign_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function isPersistent(): boolean {
  return typeof window !== "undefined" && hasLocalStorage();
}

function read(key: string): string | null {
  if (typeof window !== "undefined" && hasLocalStorage()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      /* fall through to memory */
    }
  }
  return memory.get(key) ?? null;
}

function write(key: string, value: string) {
  memory.set(key, value);
  if (typeof window !== "undefined" && hasLocalStorage()) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota or privacy mode: memory copy remains */
    }
  }
}

function remove(key: string) {
  memory.delete(key);
  if (typeof window !== "undefined" && hasLocalStorage()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Light structural validation; anything unexpected falls back to the seed. */
function isValidState(v: unknown): v is AppState {
  if (!isObj(v)) return false;
  return (
    v.version === STATE_VERSION &&
    typeof v.currentUserId === "string" &&
    typeof v.entered === "boolean" &&
    typeof v.idCounter === "number" &&
    isObj(v.users) &&
    isObj(v.prefs) &&
    isObj(v.memberships) &&
    isObj(v.feedback) &&
    isObj(v.votes) &&
    isObj(v.rsvps) &&
    isObj(v.seenReplies) &&
    Array.isArray(v.sessions) &&
    Array.isArray(v.bookings) &&
    Array.isArray(v.questions) &&
    Array.isArray(v.replies) &&
    isObj((v.users as Record<string, unknown>)[v.currentUserId as string])
  );
}

export function loadState(): { state: AppState; recovered: boolean } {
  const raw = read(STORAGE_KEY);
  if (!raw) return { state: createSeedState(), recovered: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    // Each new visit starts on the landing page; saved activity is kept.
    if (isValidState(parsed)) return { state: { ...parsed, entered: enteredThisVisit() }, recovered: false };
  } catch {
    /* malformed JSON */
  }
  remove(STORAGE_KEY);
  return { state: createSeedState(), recovered: true };
}

const SESSION_KEY = "cosign:entered";

/** Whether the visitor already passed the landing page in this browser tab session. */
function enteredThisVisit(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveState(state: AppState) {
  try {
    if (typeof window !== "undefined") {
      if (state.entered) window.sessionStorage.setItem(SESSION_KEY, "1");
      else window.sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* sessionStorage unavailable: the landing page will simply show again */
  }
  try {
    write(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* serialization should never fail, but never crash the app over it */
  }
}

export function clearState() {
  remove(STORAGE_KEY);
}
