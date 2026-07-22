import { generateId } from "@/lib/calc/id";
import {
  profileSeed,
  preferencesSeed,
  medicalRestrictionSeed,
  nutritionTargetSeed,
  equipmentSeed,
  userEquipmentSeed,
  availableWeightIncrementSeed,
  programmeSeed,
  workoutDaySeed,
  plannedExerciseSeed,
} from "@/db/seed";
import type { DataProvider } from "./provider";

/**
 * Sets up a freshly-signed-up Supabase user with Nithish's starter configuration:
 * profile, preferences, medical restriction, nutrition target, equipment, weight
 * increments, and the 4-day workout programme (days + planned exercises). Deliberately
 * does NOT seed fake workout history / food logs / body-weight history the way demo mode
 * does — that's real per-user data that should start empty and build up from actual use.
 *
 * Runs on every app load (see AuthGate), and each section checks its own existence
 * independently rather than one all-or-nothing guard — so if any single section failed to
 * seed previously (or the account existed before a later section was added), it backfills
 * just that piece on the next load instead of silently staying broken forever. Never
 * overwrites data that already exists.
 */
export async function seedSupabaseUserData(provider: DataProvider, userId: string): Promise<{ seeded: boolean }> {
  const now = new Date().toISOString();
  let seededAnything = false;

  const existingProfile = await provider.getProfile();
  if (!existingProfile) {
    await provider.updateProfile({
      name: profileSeed.name,
      sex: profileSeed.sex,
      age: profileSeed.age,
      heightCm: profileSeed.heightCm,
      currentWeightKg: profileSeed.currentWeightKg,
      targetWeightKg: profileSeed.targetWeightKg,
      primaryGoal: profileSeed.primaryGoal,
      trainingExperience: profileSeed.trainingExperience,
      country: profileSeed.country,
      dietaryPattern: profileSeed.dietaryPattern,
      trainingDays: profileSeed.trainingDays,
      restDays: profileSeed.restDays,
      gymType: profileSeed.gymType,
      preferredWorkoutDurationMinMinutes: profileSeed.preferredWorkoutDurationMinMinutes,
      preferredWorkoutDurationMaxMinutes: profileSeed.preferredWorkoutDurationMaxMinutes,
      creatineGramsPerDay: profileSeed.creatineGramsPerDay,
      wheyScoopsPerTrainingDay: profileSeed.wheyScoopsPerTrainingDay,
      createdAt: now,
    });

    await provider.updatePreferences({
      units: preferencesSeed.units,
      theme: preferencesSeed.theme,
      activityLevel: preferencesSeed.activityLevel,
      customActivityMultiplier: preferencesSeed.customActivityMultiplier,
      calorieDeficitPercent: preferencesSeed.calorieDeficitPercent,
      proteinGramsPerKg: preferencesSeed.proteinGramsPerKg,
      fatGramsPerKgTarget: preferencesSeed.fatGramsPerKgTarget,
      fibreTargetGramsMin: preferencesSeed.fibreTargetGramsMin,
      fibreTargetGramsMax: preferencesSeed.fibreTargetGramsMax,
      waterTargetMl: preferencesSeed.waterTargetMl,
    });
    seededAnything = true;
  }

  const existingMedicalRestrictions = await provider.listMedicalRestrictions();
  if (existingMedicalRestrictions.length === 0) {
    await provider.saveMedicalRestriction({ ...medicalRestrictionSeed, id: generateId(), userId, createdAt: now });
    seededAnything = true;
  }

  const existingNutritionTargets = await provider.listNutritionTargets();
  if (existingNutritionTargets.length === 0) {
    await provider.saveNutritionTarget({ ...nutritionTargetSeed, id: generateId(), userId, createdAt: now });
    seededAnything = true;
  }

  // Equipment: match seeded enable/disable + max load by equipment *type* against whatever
  // rows actually exist in this Supabase project's `equipment` table (their ids are
  // generated at insert time by the reference-data SQL, so we can't hardcode them).
  const existingUserEquipment = await provider.listUserEquipment();
  if (existingUserEquipment.length === 0) {
    const equipmentRows = await provider.listEquipment();
    const equipmentIdByType = new Map(equipmentRows.map((e) => [e.type, e.id]));
    for (const ue of userEquipmentSeed) {
      const seedType = equipmentSeed.find((e) => e.id === ue.equipmentId)?.type;
      const realId = seedType ? equipmentIdByType.get(seedType) : undefined;
      if (!realId) continue;
      await provider.setUserEquipmentEnabled(realId, ue.enabled);
    }
    seededAnything = true;
  }

  const existingIncrements = await provider.listAvailableWeightIncrements();
  if (existingIncrements.length === 0) {
    for (const inc of availableWeightIncrementSeed) {
      await provider.upsertAvailableWeightIncrement({ ...inc, id: generateId(), userId });
    }
    seededAnything = true;
  }

  // Workout programme -> days -> planned exercises. Planned exercises reference exercises
  // by slug (already present from the reference-data SQL), so no id lookup is needed there.
  let programme = await provider.getActiveProgramme();
  if (!programme) {
    programme = { ...programmeSeed, id: generateId(), userId, createdAt: now, updatedAt: now };
    await provider.saveProgramme(programme);

    for (const day of workoutDaySeed) {
      await provider.saveWorkoutDay({ ...day, id: generateId(), programmeId: programme.id });
    }
    seededAnything = true;
  }

  // Backfill per workout day independently, rather than only at programme-creation time —
  // if a single exercise slug is missing from the reference `exercises` table (a data-entry
  // gap, not something the user can control) the insert throws and previously aborted the
  // *entire remaining loop*, silently leaving every day after it with zero planned exercises
  // forever, even on days whose own exercises were all valid. Each planned exercise is now
  // inserted independently so one bad slug can't take down unrelated days or exercises.
  const days = await provider.listWorkoutDays(programme.id);
  for (const day of days) {
    if (day.isRestDay) continue;
    const existingPlanned = await provider.listPlannedExercises(day.id);
    if (existingPlanned.length > 0) continue;

    const seedDay = workoutDaySeed.find((d) => d.weekday === day.weekday);
    if (!seedDay) continue;
    const plannedForThisDay = plannedExerciseSeed.filter((pe) => pe.workoutDayId === seedDay.id);

    for (const planned of plannedForThisDay) {
      try {
        await provider.savePlannedExercise({ ...planned, id: generateId(), workoutDayId: day.id });
        seededAnything = true;
      } catch (err) {
        console.error(`Could not seed planned exercise "${planned.exerciseSlug}" for ${day.label}:`, err);
      }
    }
  }

  return { seeded: seededAnything };
}
