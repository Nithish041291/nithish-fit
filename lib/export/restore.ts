import * as localDb from "@/lib/data/localDb";
import type { StoreName } from "@/lib/data/localDb";

/** Maps a JSON backup's top-level keys (from DataProvider.exportAll()) to IndexedDB store names. */
const KEY_TO_STORE: Partial<Record<string, StoreName>> = {
  userProfiles: "userProfiles",
  userPreferences: "userPreferences",
  medicalRestrictions: "medicalRestrictions",
  userEquipment: "userEquipment",
  availableWeightIncrements: "availableWeightIncrements",
  workoutProgrammes: "workoutProgrammes",
  workoutDays: "workoutDays",
  plannedExercises: "plannedExercises",
  workoutSessions: "workoutSessions",
  exercisePerformances: "exercisePerformances",
  exerciseSets: "exerciseSets",
  readinessEntries: "readinessEntries",
  bodyMeasurements: "bodyMeasurements",
  nutritionTargets: "nutritionTargets",
  recipes: "recipes",
  recipeIngredients: "recipeIngredients",
  foodLogs: "foodLogs",
  mealPlans: "mealPlans",
  mealPlanDays: "mealPlanDays",
  plannedMeals: "plannedMeals",
  supplementLogs: "supplementLogs",
  customFoodItems: "foodItems",
};

export interface RestoreResult {
  restoredStores: string[];
  skippedKeys: string[];
}

/** Validates a parsed backup object has the expected shape, then writes recognised
 * collections back into IndexedDB (demo mode). Unknown keys are reported, not silently
 * dropped, so the user knows if something wasn't restored. */
export async function restoreJsonBackup(data: unknown): Promise<RestoreResult> {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid backup file: expected a JSON object.");
  }
  const record = data as Record<string, unknown>;
  const restoredStores: string[] = [];
  const skippedKeys: string[] = [];

  for (const [key, value] of Object.entries(record)) {
    if (key === "exportedAt") continue;
    const store = KEY_TO_STORE[key];
    if (!store || !Array.isArray(value)) {
      skippedKeys.push(key);
      continue;
    }
    await localDb.putMany(store, value);
    restoredStores.push(store);
  }

  return { restoredStores, skippedKeys };
}
