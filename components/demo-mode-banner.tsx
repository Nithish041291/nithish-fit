"use client";

import { useDataContext } from "@/lib/data/context";

export function DemoModeBanner() {
  const { mode } = useDataContext();
  if (mode !== "demo") return null;
  return (
    <div className="w-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs text-center py-1.5 px-4">
      Local demo mode — data is stored only in this browser. Connect Supabase to sync across devices.
    </div>
  );
}
