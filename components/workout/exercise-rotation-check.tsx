"use client";

import { useEffect, useRef } from "react";
import { useDataContext } from "@/lib/data/context";
import { applyExerciseRotation } from "@/lib/workout/rotation";
import { writeRotationNotice } from "@/lib/workout/rotationNotice";

function storageKeyFor(userId: string): string {
  return `nithish-fit:rotation-checked:${userId}`;
}

/** Silent background check, mounted once in the app shell: once per training block it swaps
 * planned exercises for fresh alternatives (see lib/workout/rotation.ts) and once per day it
 * verifies nothing needs doing. Renders nothing itself — any resulting changes are handed off
 * to the Workout page via rotationNotice so they show as an in-flow card rather than a toast
 * that could float over the readiness dialog's buttons. */
export function ExerciseRotationCheck() {
  const { provider, user, seeding } = useDataContext();
  const ran = useRef(false);

  useEffect(() => {
    if (seeding || !user || ran.current || typeof window === "undefined") return;
    const today = new Date().toISOString().slice(0, 10);
    const key = storageKeyFor(user.id);
    if (window.localStorage.getItem(key) === today) return;
    ran.current = true;

    applyExerciseRotation(provider)
      .then((changes) => {
        window.localStorage.setItem(key, today);
        writeRotationNotice(user.id, changes);
      })
      .catch(() => {
        // Best-effort background maintenance, not a critical path — the localStorage flag is
        // only set on success, so it retries automatically next time the app is opened.
      });
  }, [provider, user, seeding]);

  return null;
}
