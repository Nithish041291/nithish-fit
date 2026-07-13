import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { demoDataProvider } from "@/lib/data/demoProvider";
import { ensureDemoSeeded, clearDemoData } from "@/lib/data/seedDemo";
import { generateId } from "@/lib/calc/id";
import { repairSessionExercises } from "@/lib/workout/startSession";

/** Regression test for a session that ends up with zero attached exercises (e.g. started
 * before the active programme's workout days had loaded) — verifies the in-app recovery
 * button's underlying logic actually attaches the correct day's exercises in place. */
describe("repairSessionExercises", () => {
  beforeEach(async () => {
    await clearDemoData();
    await ensureDemoSeeded();
  });

  afterEach(async () => {
    await clearDemoData();
  });

  it("attaches Monday's planned exercises to a broken session with no performances", async () => {
    const programme = await demoDataProvider.getActiveProgramme();
    if (!programme) throw new Error("expected active programme");
    const days = await demoDataProvider.listWorkoutDays(programme.id);
    const monday = days.find((d) => d.weekday === "monday");
    if (!monday) throw new Error("expected a monday workout day in the seed");
    const plannedForMonday = await demoDataProvider.listPlannedExercises(monday.id);
    expect(plannedForMonday.length).toBeGreaterThan(0);

    // A broken session: created for a Monday date, but with workoutDayId null (as if the
    // workout day hadn't resolved yet when the session was started) and zero performances.
    const brokenSession = await demoDataProvider.saveSession({
      id: generateId(),
      userId: "demo-user",
      programmeId: programme.id,
      workoutDayId: null,
      label: "Monday",
      date: "2026-07-13", // a Monday
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "in_progress",
      readinessEntryId: null,
      sessionDifficulty: null,
      wristPainScore: null,
      notes: "",
      isDeload: false,
      durationMinutes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const before = await demoDataProvider.listPerformances(brokenSession.id);
    expect(before).toEqual([]);

    const attached = await repairSessionExercises({ provider: demoDataProvider, session: brokenSession });
    expect(attached).toBe(true);

    const after = await demoDataProvider.listPerformances(brokenSession.id);
    expect(after.length).toBe(plannedForMonday.length);
    expect(after.map((p) => p.exerciseSlug).sort()).toEqual(plannedForMonday.map((p) => p.exerciseSlug).sort());

    const fixedSession = await demoDataProvider.getSession(brokenSession.id);
    expect(fixedSession?.workoutDayId).toBe(monday.id);

    // Every planned exercise should have its sets created too.
    for (const performance of after) {
      const sets = await demoDataProvider.listSets(performance.id);
      expect(sets.length).toBeGreaterThan(0);
    }
  });

  it("reopens a session that was marked completed while empty", async () => {
    const programme = await demoDataProvider.getActiveProgramme();
    if (!programme) throw new Error("expected active programme");
    const days = await demoDataProvider.listWorkoutDays(programme.id);
    const monday = days.find((d) => d.weekday === "monday");
    if (!monday) throw new Error("expected a monday workout day in the seed");

    // The user had no other option but to tap "Complete workout" on an empty session.
    const brokenSession = await demoDataProvider.saveSession({
      id: generateId(),
      userId: "demo-user",
      programmeId: programme.id,
      workoutDayId: null,
      label: "Monday",
      date: "2026-07-13",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "completed",
      readinessEntryId: null,
      sessionDifficulty: 5,
      wristPainScore: 0,
      notes: "",
      isDeload: false,
      durationMinutes: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const attached = await repairSessionExercises({ provider: demoDataProvider, session: brokenSession });
    expect(attached).toBe(true);

    const fixedSession = await demoDataProvider.getSession(brokenSession.id);
    expect(fixedSession?.status).toBe("in_progress");
    expect(fixedSession?.completedAt).toBeNull();

    const after = await demoDataProvider.listPerformances(brokenSession.id);
    expect(after.length).toBeGreaterThan(0);
  });

  it("returns false and leaves the session untouched for a genuine rest day", async () => {
    const programme = await demoDataProvider.getActiveProgramme();
    if (!programme) throw new Error("expected active programme");

    const brokenSession = await demoDataProvider.saveSession({
      id: generateId(),
      userId: "demo-user",
      programmeId: programme.id,
      workoutDayId: null,
      label: "Optional session",
      date: "2026-07-16", // a Thursday — scheduled rest day in the seed programme
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: "in_progress",
      readinessEntryId: null,
      sessionDifficulty: null,
      wristPainScore: null,
      notes: "",
      isDeload: false,
      durationMinutes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const attached = await repairSessionExercises({ provider: demoDataProvider, session: brokenSession });
    expect(attached).toBe(false);

    const after = await demoDataProvider.listPerformances(brokenSession.id);
    expect(after).toEqual([]);
  });
});
