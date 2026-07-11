import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { demoDataProvider } from "@/lib/data/demoProvider";
import { ensureDemoSeeded, clearDemoData } from "@/lib/data/seedDemo";
import { applyExerciseRotation } from "@/lib/workout/rotation";

/** End-to-end check of the rotation feature against the real demo (IndexedDB) provider and
 * seed data, not just the pure calc functions — verifies it actually mutates planned exercises
 * safely and stays idempotent within a training block. */
describe("applyExerciseRotation against demoDataProvider", () => {
  beforeEach(async () => {
    await clearDemoData();
    await ensureDemoSeeded();
  });

  afterEach(async () => {
    await clearDemoData();
  });

  it("makes no changes while still inside the first training block", async () => {
    const programme = await demoDataProvider.getActiveProgramme();
    if (!programme) throw new Error("expected active programme");
    // Pin the block start to today regardless of the seed's fixed date, so this assertion
    // doesn't depend on how much real time has elapsed since the seed data was authored.
    await demoDataProvider.saveProgramme({ ...programme, startedOn: new Date().toISOString().slice(0, 10) });

    const changes = await applyExerciseRotation(demoDataProvider);
    expect(changes).toEqual([]);
  });

  it("rotates planned exercises once the programme has run past cycleWeeks, and only into usable exercises", async () => {
    const programme = await demoDataProvider.getActiveProgramme();
    expect(programme).not.toBeNull();
    if (!programme) throw new Error("expected active programme");

    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
    await demoDataProvider.saveProgramme({ ...programme, startedOn: twelveWeeksAgo.toISOString().slice(0, 10) });

    const allExercises = await demoDataProvider.listExercises();
    const exerciseBySlug = new Map(allExercises.map((e) => [e.slug, e]));
    const userEquipment = await demoDataProvider.listUserEquipment();
    const equipmentCatalog = await demoDataProvider.listEquipment();
    const equipmentTypeById = new Map(equipmentCatalog.map((e) => [e.id, e.type]));
    const enabledEquipment = new Set(
      userEquipment.filter((ue) => ue.enabled).map((ue) => equipmentTypeById.get(ue.equipmentId))
    );

    const changes = await applyExerciseRotation(demoDataProvider);
    expect(changes.length).toBeGreaterThan(0);

    const days = await demoDataProvider.listWorkoutDays(programme.id);
    for (const day of days.filter((d) => !d.isRestDay)) {
      const planned = await demoDataProvider.listPlannedExercises(day.id);
      for (const pe of planned) {
        const exercise = exerciseBySlug.get(pe.exerciseSlug);
        expect(exercise, `planned slug ${pe.exerciseSlug} should exist in the directory`).toBeTruthy();
        if (!exercise) continue;
        expect(exercise.isSelectableByDefault).toBe(true);
        for (const eq of exercise.equipment) {
          expect(enabledEquipment.has(eq)).toBe(true);
        }
      }
    }
  });

  it("is idempotent within the same training block", async () => {
    const programme = await demoDataProvider.getActiveProgramme();
    if (!programme) throw new Error("expected active programme");
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7);
    await demoDataProvider.saveProgramme({ ...programme, startedOn: twelveWeeksAgo.toISOString().slice(0, 10) });

    const firstRun = await applyExerciseRotation(demoDataProvider);
    expect(firstRun.length).toBeGreaterThan(0);

    const secondRun = await applyExerciseRotation(demoDataProvider);
    expect(secondRun).toEqual([]);
  });
});
