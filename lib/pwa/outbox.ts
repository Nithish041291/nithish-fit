import { openDB, type IDBPDatabase } from "idb";
import { generateId } from "@/lib/calc/id";
import type { DataProvider } from "@/lib/data/provider";

interface OutboxEntry {
  id: string;
  method: string;
  args: unknown[];
  queuedAt: string;
}

interface OutboxDB {
  outbox: { key: string; value: OutboxEntry };
}

let dbPromise: Promise<IDBPDatabase<OutboxDB>> | null = null;
function getOutboxDb() {
  if (!dbPromise) {
    dbPromise = openDB<OutboxDB>("nithish-fit-outbox", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

/** Methods on DataProvider that mutate data — everything else passes through untouched. */
const WRITE_METHOD_PATTERN = /^(save|update|set|delete|upsert)/i;

export async function enqueueOutboxEntry(method: string, args: unknown[]): Promise<void> {
  const db = await getOutboxDb();
  await db.put("outbox", { id: generateId(), method, args, queuedAt: new Date().toISOString() });
}

export async function listOutboxEntries(): Promise<OutboxEntry[]> {
  const db = await getOutboxDb();
  return db.getAll("outbox");
}

export async function removeOutboxEntry(id: string): Promise<void> {
  const db = await getOutboxDb();
  await db.delete("outbox", id);
}

export async function outboxCount(): Promise<number> {
  const db = await getOutboxDb();
  return db.count("outbox");
}

/** Replays queued mutations against the real provider, in the order they were queued. */
export async function replayOutbox(provider: DataProvider): Promise<{ succeeded: number; failed: number }> {
  const entries = await listOutboxEntries();
  let succeeded = 0;
  let failed = 0;
  for (const entry of entries) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (provider as any)[entry.method](...entry.args);
      await removeOutboxEntry(entry.id);
      succeeded++;
    } catch {
      failed++;
    }
  }
  return { succeeded, failed };
}

/** True for browser network-level failures (fetch couldn't even reach the server) — the
 * only case worth queuing for retry. Deliberately does NOT trust `navigator.onLine`: it's
 * unreliable in installed PWAs (notably iOS Safari standalone mode often reports `false`
 * while genuinely online), so pre-emptively queuing on that flag alone silently dropped
 * writes and returned `undefined` to callers expecting a real record back. */
function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return /fetch|network/i.test(err.message);
  if (err && typeof err === "object" && "message" in err) {
    return /failed to fetch|network|load failed/i.test(String((err as { message: unknown }).message));
  }
  return false;
}

/**
 * Wraps a DataProvider so that write calls that genuinely fail to reach the network are
 * queued in IndexedDB instead of losing the user's data, and get replayed once
 * connectivity returns. Every call either returns the real result or throws — it never
 * silently returns `undefined`, since callers (e.g. session/readiness flows) rely on the
 * returned record. Read calls and successful writes pass straight through unchanged.
 */
export function withOfflineQueue(provider: DataProvider): DataProvider {
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function" || typeof prop !== "string" || !WRITE_METHOD_PATTERN.test(prop)) {
        return value;
      }
      return async (...args: unknown[]) => {
        try {
          return await (value as (...a: unknown[]) => unknown).apply(target, args);
        } catch (err) {
          if (isNetworkError(err)) {
            await enqueueOutboxEntry(prop, args);
          }
          // Always rethrow — the caller must know this write did not durably succeed yet,
          // even though a network-error case has also been queued for later retry.
          throw err;
        }
      };
    },
  });
}
