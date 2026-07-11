import { generateId } from "@/lib/calc/id";
import * as localDb from "./localDb";
import { DEMO_USER_ID } from "./demoProvider";
import {
  availableWeightIncrementSeed,
  equipmentSeed,
  exerciseAliasSeed,
  exerciseSeed,
  exerciseSubstitutionSeed,
  foodAliasRowsSeed,
  foodItemSeed,
  foodServingRowsSeed,
  medicalRestrictionSeed,
  nutritionTargetSeed,
  plannedExerciseSeed,
  preferencesSeed,
  profileSeed,
  programmeSeed,
  userEquipmentSeed,
  workoutDaySeed,
} from "@/db/seed";
import { buildBodyAndSupplementSeed } from "@/db/seed/bodyAndSupplementLogs";
import { buildFoodLogSeed } from "@/db/seed/foodLogs";
import { buildSessionHistorySeed } from "@/db/seed/sessionHistory";
import { mealPlanDaysSeed, mealPlanSeed, plannedMealsSeed } from "@/db/seed/mealPlan";

const SEEDED_FLAG_KEY = "demo:seeded";

/** Seeds IndexedDB with the full demo dataset on first load. Safe to call repeatedly —
 * it no-ops once the `demo:seeded` application setting is present. */
export async function ensureDemoSeeded(): Promise<void> {
  const existingFlag = await localDb.getAll("applicationSettings");
  if (existingFlag.some((s) => s.key === SEEDED_FLAG_KEY)) return;

  await localDb.put("userProfiles", profileSeed);
  await localDb.put("userPreferences", preferencesSeed);
  await localDb.put("medicalRestrictions", medicalRestrictionSeed);
  await localDb.put("nutritionTargets", nutritionTargetSeed);

  await localDb.putMany("equipment", equipmentSeed);
  await localDb.putMany("userEquipment", userEquipmentSeed);
  await localDb.putMany("availableWeightIncrements", availableWeightIncrementSeed);

  await localDb.putMany("exercises", exerciseSeed);
  await localDb.putMany(
    "exerciseAliases",
    exerciseAliasSeed.map((a) => ({ id: generateId(), ...a }))
  );
  await localDb.putMany(
    "exerciseSubstitutions",
    exerciseSubstitutionSeed.map((s) => ({ id: generateId(), ...s }))
  );

  await localDb.put("workoutProgrammes", programmeSeed);
  await localDb.putMany("workoutDays", workoutDaySeed);
  await localDb.putMany("plannedExercises", plannedExerciseSeed);

  await localDb.putMany("foodItems", foodItemSeed);
  await localDb.putMany("foodServings", foodServingRowsSeed);
  await localDb.putMany("foodAliases", foodAliasRowsSeed);

  const referenceDate = new Date();
  const { sessions, performances, sets, readiness } = buildSessionHistorySeed(referenceDate);
  await localDb.putMany("workoutSessions", sessions);
  await localDb.putMany("exercisePerformances", performances);
  await localDb.putMany("exerciseSets", sets);
  await localDb.putMany("readinessEntries", readiness);

  const { bodyMeasurements, supplementLogs } = buildBodyAndSupplementSeed(referenceDate);
  await localDb.putMany("bodyMeasurements", bodyMeasurements);
  await localDb.putMany("supplementLogs", supplementLogs);

  await localDb.putMany("foodLogs", buildFoodLogSeed(referenceDate));

  await localDb.put("mealPlans", mealPlanSeed);
  await localDb.putMany("mealPlanDays", mealPlanDaysSeed);
  await localDb.putMany("plannedMeals", plannedMealsSeed);

  await localDb.put("applicationSettings", {
    id: generateId(),
    userId: DEMO_USER_ID,
    key: SEEDED_FLAG_KEY,
    value: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/** Wipes all seeded/sample data and re-marks the app as unseeded (spec section 18: "provide
 * a button to remove it"). Does not reseed automatically — the next load will reseed. */
export async function clearDemoData(): Promise<void> {
  await localDb.clearAllStores();
}
