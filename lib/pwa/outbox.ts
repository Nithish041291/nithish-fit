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

/**
 * Wraps a DataProvider so that write calls made while offline are queued in IndexedDB
 * instead of failing outright, and can be replayed once connectivity returns. Read calls
 * and online writes pass straight through to the underlying provider.
 */
export function withOfflineQueue(provider: DataProvider): DataProvider {
  return new Proxy(provider, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function" || typeof prop !== "string" || !WRITE_METHOD_PATTERN.test(prop)) {
        return value;
      }
      return async (...args: unknown[]) => {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await enqueueOutboxEntry(prop, args);
          return undefined;
        }
        try {
          return await (value as (...a: unknown[]) => unknown).apply(target, args);
        } catch (err) {
          // Treat a failed write as possibly-offline (e.g. request timed out) and queue it
          // rather than losing the user's workout/food log entry.
          await enqueueOutboxEntry(prop, args);
          throw err;
        }
      };
    },
  });
}
