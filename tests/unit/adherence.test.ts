import { describe, expect, it } from "vitest";
import { calculateWorkoutCompletionPercent } from "@/lib/workout/adherence";
import type { WorkoutSession, Weekday } from "@/lib/types";

const trainingDays: Weekday[] = ["monday", "tuesday", "wednesday", "friday"];

function session(date: string, status: WorkoutSession["status"]): WorkoutSession {
  return {
    id: date + "-" + status,
    userId: "u",
    programmeId: null,
    workoutDayId: null,
    label: "",
    date,
    startedAt: null,
    completedAt: null,
    status,
    readinessEntryId: null,
    sessionDifficulty: null,
    wristPainScore: null,
    notes: "",
    isDeload: false,
    durationMinutes: null,
    createdAt: date,
    updatedAt: date,
  };
}

describe("calculateWorkoutCompletionPercent", () => {
  it("is 100% when every training day so far this week is completed", () => {
    // Monday 2026-07-13 and Tuesday 2026-07-14 are training days; asOf is Tuesday.
    const sessions = [session("2026-07-13", "completed"), session("2026-07-14", "completed")];
    expect(calculateWorkoutCompletionPercent(trainingDays, sessions, "2026-07-14")).toBe(100);
  });

  it("counts a missed training day against the percentage", () => {
    // Monday completed, Tuesday has no session at all.
    const sessions = [session("2026-07-13", "completed")];
    expect(calculateWorkoutCompletionPercent(trainingDays, sessions, "2026-07-14")).toBe(50);
  });

  it("does not penalize a day explicitly marked skipped (excused rest)", () => {
    // Monday completed, Tuesday marked skipped (e.g. sick) instead of missed outright.
    const sessions = [session("2026-07-13", "completed"), session("2026-07-14", "skipped")];
    expect(calculateWorkoutCompletionPercent(trainingDays, sessions, "2026-07-14")).toBe(100);
  });

  it("ignores a skipped session on a day that isn't even a scheduled training day", () => {
    // Thursday isn't in trainingDays, so marking it skipped shouldn't affect the count.
    const sessions = [session("2026-07-13", "completed"), session("2026-07-16", "skipped")];
    // asOf Thursday: expected so far = monday + tuesday + wednesday (3 training days), only monday completed.
    const result = calculateWorkoutCompletionPercent(trainingDays, sessions, "2026-07-16");
    expect(result).toBe(33);
  });

  it("returns 100 for a week with no training days scheduled yet", () => {
    expect(calculateWorkoutCompletionPercent([], [], "2026-07-14")).toBe(100);
  });

  it("returns 100 if every training day so far was excused", () => {
    const sessions = [session("2026-07-13", "skipped"), session("2026-07-14", "skipped")];
    expect(calculateWorkoutCompletionPercent(trainingDays, sessions, "2026-07-14")).toBe(100);
  });
});
