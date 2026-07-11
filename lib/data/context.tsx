"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { demoDataProvider, DEMO_USER_ID } from "./demoProvider";
import type { DataProvider } from "./provider";
import { isSupabaseConfigured, getSupabaseBrowserClient } from "./supabase/client";
import { SupabaseDataProvider } from "./supabaseProvider";
import { ensureDemoSeeded } from "./seedDemo";
import { replayOutbox, withOfflineQueue } from "@/lib/pwa/outbox";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
}

interface DataContextValue {
  provider: DataProvider;
  mode: "demo" | "supabase";
  user: AuthUser | null;
  authLoading: boolean;
  seeding: boolean;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProviderRoot({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(configured ? null : { id: DEMO_USER_ID, name: "Nithish", email: null });
  const [authLoading, setAuthLoading] = useState(configured);
  const [seeding, setSeeding] = useState(!configured);

  const provider = useMemo<DataProvider>(() => {
    if (configured) {
      // Demo mode is IndexedDB-backed and inherently offline; only Supabase mode needs an
      // offline write queue, since network calls can actually fail there.
      return withOfflineQueue(new SupabaseDataProvider(getSupabaseBrowserClient()));
    }
    return demoDataProvider;
  }, [configured]);

  useEffect(() => {
    if (!configured || typeof window === "undefined") return;
    const onOnline = () => {
      replayOutbox(provider).then(({ succeeded, failed }) => {
        if (succeeded > 0) toast.success(`Synced ${succeeded} offline change${succeeded === 1 ? "" : "s"}`);
        if (failed > 0) toast.error(`${failed} offline change${failed === 1 ? "" : "s"} failed to sync`);
      });
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) onOnline();
    return () => window.removeEventListener("online", onOnline);
  }, [configured, provider]);

  useEffect(() => {
    if (!configured) {
      ensureDemoSeeded().finally(() => setSeeding(false));
      return;
    }
    const client = getSupabaseBrowserClient();
    client.auth.getUser().then((result: Awaited<ReturnType<typeof client.auth.getUser>>) => {
      const authUser = result.data.user;
      setUser(authUser ? { id: authUser.id, name: authUser.email ?? "User", email: authUser.email ?? null } : null);
      setAuthLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ? { id: session.user.id, name: session.user.email ?? "User", email: session.user.email ?? null } : null);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const signOut = async () => {
    if (configured) {
      await getSupabaseBrowserClient().auth.signOut();
    }
  };

  return (
    <DataContext.Provider value={{ provider, mode: configured ? "supabase" : "demo", user, authLoading, seeding, signOut }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataContext must be used within DataProviderRoot");
  return ctx;
}

export function useData(): DataProvider {
  return useDataContext().provider;
}
