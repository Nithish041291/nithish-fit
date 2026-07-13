import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { demoDataProvider, DEMO_USER_ID } from "@/lib/data/demoProvider";
import { clearDemoData } from "@/lib/data/seedDemo";
import { seedSupabaseUserData } from "@/lib/data/seedSupabaseUser";
import * as localDb from "@/lib/data/localDb";
import { equipmentSeed } from "@/db/seed";

/** Regression test for a real production bug: a user whose profile existed but whose
 * workout programme was never seeded (because the old all-or-nothing guard skipped every
 * other section once a profile was found) got permanently stuck with no workout day, on
 * every login, forever. Uses demoDataProvider as a stand-in DataProvider — the function
 * under test only calls generic DataProvider methods, so this exercises the real logic. */
describe("seedSupabaseUserData", () => {
  beforeEach(async () => {
    await clearDemoData();
    // seedSupabaseUserData assumes the equipment/exercise/food reference catalog is already
    // present (seeded separately via SQL in real Supabase projects) — only equipment is
    // needed for these tests.
    await localDb.putMany("equipment", equipmentSeed);
  });

  afterEach(async () => {
    await clearDemoData();
  });

  it("seeds everything on a genuinely fresh account", async () => {
    const result = await seedSupabaseUserData(demoDataProvider, DEMO_USER_ID);
    expect(result.seeded).toBe(true);

    expect(await demoDataProvider.getProfile()).not.toBeNull();
    expect(await demoDataProvider.getActiveProgramme()).not.toBeNull();
    const programme = await demoDataProvider.getActiveProgramme();
    const days = await demoDataProvider.listWorkoutDays(programme!.id);
    expect(days.length).toBeGreaterThan(0);
  });

  it("backfills only the missing programme when the profile already exists", async () => {
    // First a normal full seed, then simulate the broken production state: everything
    // present except the workout programme (as if the old all-or-nothing guard had skipped
    // it on every prior login once the profile existed).
    await seedSupabaseUserData(demoDataProvider, DEMO_USER_ID);
    await demoDataProvider.updateProfile({ name: "Existing User" });
    await localDb.clearStore("workoutProgrammes");
    await localDb.clearStore("workoutDays");
    await localDb.clearStore("plannedExercises");
    expect(await demoDataProvider.getProfile()).not.toBeNull();
    expect(await demoDataProvider.getActiveProgramme()).toBeNull();

    const result = await seedSupabaseUserData(demoDataProvider, DEMO_USER_ID);
    expect(result.seeded).toBe(true);

    // The existing profile's custom name must not have been overwritten.
    const profile = await demoDataProvider.getProfile();
    expect(profile?.name).toBe("Existing User");

    const programme = await demoDataProvider.getActiveProgramme();
    expect(programme).not.toBeNull();
    const days = await demoDataProvider.listWorkoutDays(programme!.id);
    expect(days.some((d) => d.weekday === "monday" && !d.isRestDay)).toBe(true);
  });

  it("is a no-op (seeded: false) once everything already exists", async () => {
    await seedSupabaseUserData(demoDataProvider, DEMO_USER_ID);
    const result = await seedSupabaseUserData(demoDataProvider, DEMO_USER_ID);
    expect(result.seeded).toBe(false);
  });
});
