import type { RotationChange } from "./rotation";

const NOTICE_KEY_PREFIX = "nithish-fit:rotation-notice:";

export interface StoredRotationNotice {
  changes: RotationChange[];
  createdAt: string;
}

/** Persists a rotation result for the Workout page to pick up on its next mount. Deliberately
 * not a toast: a floating notification can render on top of the readiness dialog's Continue/Skip
 * buttons and intercept clicks (see the iOS "stuck dialog" bug this app already shipped once).
 * An in-flow card on the Workout page can never overlap anything. */
export function writeRotationNotice(userId: string, changes: RotationChange[]): void {
  if (typeof window === "undefined" || changes.length === 0) return;
  window.localStorage.setItem(NOTICE_KEY_PREFIX + userId, JSON.stringify({ changes, createdAt: new Date().toISOString() }));
}

/** Reads and clears the pending notice so it's shown exactly once. */
export function readAndClearRotationNotice(userId: string): StoredRotationNotice | null {
  if (typeof window === "undefined") return null;
  const key = NOTICE_KEY_PREFIX + userId;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  window.localStorage.removeItem(key);
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && "changes" in parsed ? (parsed as StoredRotationNotice) : null;
  } catch {
    return null;
  }
}
