"use client";

import { useCallback, useEffect, useState } from "react";
import { toLocalIsoDate } from "@/lib/format";
import { useData, useDataContext } from "./context";
import type { DataProvider } from "./provider";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Fetches data from the active DataProvider on mount and whenever `deps` change.
 * `deps` is serialized to a stable string key instead of spread into a hook dependency
 * array, since callers pass variable-length arrays (incompatible with the array-literal
 * requirement for hook dependency lists). `fn` is intentionally excluded from the effect's
 * dependency array: callers pass a fresh inline closure every render, and re-running the
 * fetch on every render (rather than only when provider/seeding/depsKey actually change)
 * would cause a refetch loop. */
export function useProviderData<T>(fn: (provider: DataProvider) => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const provider = useData();
  const { seeding } = useDataContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    if (seeding) return;
    let cancelled = false;
    // Deferred via microtask rather than called synchronously at the top of the effect
    // body, so the initial "start loading" state update isn't a direct synchronous
    // setState call within the effect.
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      fn(provider)
        .then((result) => {
          if (!cancelled) {
            setData(result);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, seeding, tick, depsKey]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, refetch };
}

export function todayIsoDate(): string {
  return toLocalIsoDate(new Date());
}

export function nowIso(): string {
  return new Date().toISOString();
}
