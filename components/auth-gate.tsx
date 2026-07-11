"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useData, useDataContext } from "@/lib/data/context";
import { seedSupabaseUserData } from "@/lib/data/seedSupabaseUser";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/** In Supabase mode: redirects to /login when there's no authenticated session, and runs
 * the one-time starter-data setup the first time a signed-in user has no profile yet.
 * Demo mode always has a (fake, local) user and renders through immediately. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { mode, user, authLoading } = useDataContext();
  const provider = useData();
  const router = useRouter();
  const [checkedProfile, setCheckedProfile] = useState(false);

  useEffect(() => {
    if (mode === "supabase" && !authLoading && !user) {
      router.replace("/login");
    }
  }, [mode, user, authLoading, router]);

  useEffect(() => {
    if (mode !== "supabase" || !user) return;
    let cancelled = false;
    // Deferred via microtask so the effect body has no synchronous setState call.
    Promise.resolve().then(async () => {
      try {
        const result = await seedSupabaseUserData(provider, user.id);
        if (cancelled) return;
        if (result.seeded) toast.success("Your profile and workout programme are set up.");
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Could not set up your starter data");
      } finally {
        if (!cancelled) setCheckedProfile(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mode, user, provider]);

  if (mode === "supabase" && (authLoading || !user || !checkedProfile)) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
