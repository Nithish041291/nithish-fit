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
  const existingProgramme = await provider.getActiveProgramme();
  if (!existingProgramme) {
    const programmeId = generateId();
    await provider.saveProgramme({ ...programmeSeed, id: programmeId, userId, createdAt: now, updatedAt: now });

    const dayIdByOldId = new Map<string, string>();
    for (const day of workoutDaySeed) {
      const newDayId = generateId();
      dayIdByOldId.set(day.id, newDayId);
      await provider.saveWorkoutDay({ ...day, id: newDayId, programmeId });
    }

    for (const planned of plannedExerciseSeed) {
      const newDayId = dayIdByOldId.get(planned.workoutDayId);
      if (!newDayId) continue;
      await provider.savePlannedExercise({ ...planned, id: generateId(), workoutDayId: newDayId });
    }
    seededAnything = true;
  }

  return { seeded: seededAnything };
}
