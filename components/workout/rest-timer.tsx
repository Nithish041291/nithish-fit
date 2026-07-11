"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer, X } from "lucide-react";

/** Callers remount this via `key={nonce}` for every new rest period, so `seconds` only
 * needs to seed the initial state — no effect is needed to resync it. */
export function RestTimer({ seconds, onDismiss }: { seconds: number; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className="fixed bottom-20 inset-x-4 z-40 rounded-xl border bg-card shadow-lg p-3 flex items-center justify-between max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Timer className="size-5 text-primary" />
        <span className="text-lg font-semibold tabular-nums">
          {mm}:{ss.toString().padStart(2, "0")}
        </span>
        <span className="text-sm text-muted-foreground">rest</span>
      </div>
      <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss timer">
        <X className="size-4" />
      </Button>
    </div>
  );
}
