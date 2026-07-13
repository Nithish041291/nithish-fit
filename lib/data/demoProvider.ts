import { generateId } from "@/lib/calc/id";
import type {
  ApplicationSetting,
  AvailableWeightIncrement,
  BodyMeasurement,
  DailyEnergyLog,
  Equipment,
  Exercise,
  ExerciseAlias,
  ExercisePerformance,
  ExerciseSet,
  ExerciseSubstitution,
  FoodAlias,
  FoodItem,
  FoodLog,
  FoodServing,
  MealPlan,
  MealPlanDay,
  MedicalRestriction,
  NutritionTarget,
  PlannedExercise,
  PlannedMeal,
  ReadinessEntry,
  Recipe,
  RecipeIngredient,
  SupplementLog,
  UserEquipment,
  UserPreference,
  UserProfile,
  WorkoutDay,
  WorkoutProgramme,
  WorkoutSession,
} from "@/lib/types";
import * as db from "./localDb";
import type { DataProvider, DateRange } from "./provider";
import { inDateRange } from "./provider";

export const DEMO_USER_ID = "demo-user";

async function firstOrNull<T>(items: T[]): Promise<T | null> {
  return items[0] ?? null;
}

export class DemoDataProvider implements DataProvider {
  readonly mode = "demo" as const;

  async getProfile(): Promise<UserProfile | null> {
    return firstOrNull(await db.getAll("userProfiles"));
  }
  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.getProfile();
    const now = new Date().toISOString();
    const next: UserProfile = { ...(existing as UserProfile), ...patch, id: existing?.id ?? patch.id ?? generateId(), updatedAt: now };
    await db.put("userProfiles", next);
    return next;
  }

  async getPreferences(): Promise<UserPreference | null> {
    return firstOrNull(await db.getAll("userPreferences"));
  }
  async updatePreferences(patch: Partial<UserPreference>): Promise<UserPreference> {
    const existing = await this.getPreferences();
    const next: UserPreference = {
      ...(existing as UserPreference),
      ...patch,
      id: existing?.id ?? patch.id ?? generateId(),
      updatedAt: new Date().toISOString(),
    };
    await db.put("userPreferences", next);
    return next;
  }

  async listMedicalRestrictions(): Promise<MedicalRestriction[]> {
    return db.getAll("medicalRestrictions");
  }
  async saveMedicalRestriction(restriction: MedicalRestriction): Promise<void> {
    await db.put("medicalRestrictions", restriction);
  }

  async listEquipment(): Promise<Equipment[]> {
    return db.getAll("equipment");
  }
  async listUserEquipment(): Promise<UserEquipment[]> {
    return db.getAll("userEquipment");
  }
  async setUserEquipmentEnabled(equipmentId: string, enabled: boolean): Promise<void> {
    const all = await db.getAll("userEquipment");
    const existing = all.find((e) => e.equipmentId === equipmentId);
    if (existing) {
      await db.put("userEquipment", { ...existing, enabled, updatedAt: new Date().toISOString() });
    } else {
      await db.put("userEquipment", {
        id: generateId(),
        userId: DEMO_USER_ID,
        equipmentId,
        enabled,
        maxLoadKg: null,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async listAvailableWeightIncrements(): Promise<AvailableWeightIncrement[]> {
    return db.getAll("availableWeightIncrements");
  }
  async upsertAvailableWeightIncrement(entry: AvailableWeightIncrement): Promise<void> {
    await db.put("availableWeightIncrements", entry);
  }

  async listExercises(): Promise<Exercise[]> {
    return db.getAll("exercises");
  }
  async getExercise(slug: string): Promise<Exercise | null> {
    const all = await db.getAll("exercises");
    return all.find((e) => e.slug === slug) ?? null;
  }
  async listExerciseAliases(): Promise<ExerciseAlias[]> {
    return db.getAll("exerciseAliases");
  }
  async listExerciseSubstitutions(): Promise<ExerciseSubstitution[]> {
    return db.getAll("exerciseSubstitutions");
  }

  async getActiveProgramme(): Promise<WorkoutProgramme | null> {
    const all = await db.getAll("workoutProgrammes");
    return all.find((p) => p.isActive) ?? null;
  }
  async listProgrammes(): Promise<WorkoutProgramme[]> {
    return db.getAll("workoutProgrammes");
  }
  async saveProgramme(programme: WorkoutProgramme): Promise<void> {
    await db.put("workoutProgrammes", programme);
  }
  async listWorkoutDays(programmeId: string): Promise<WorkoutDay[]> {
    const all = await db.getAll("workoutDays");
    return all.filter((d) => d.programmeId === programmeId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async saveWorkoutDay(day: WorkoutDay): Promise<void> {
    await db.put("workoutDays", day);
  }
  async listPlannedExercises(workoutDayId: string): Promise<PlannedExercise[]> {
    const all = await db.getAll("plannedExercises");
    return all.filter((e) => e.workoutDayId === workoutDayId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async savePlannedExercise(entry: PlannedExercise): Promise<void> {
    await db.put("plannedExercises", entry);
  }
  async deletePlannedExercise(id: string): Promise<void> {
    await db.remove("plannedExercises", id);
  }

  async listSessions(range?: DateRange): Promise<WorkoutSession[]> {
    const all = await db.getAll("workoutSessions");
    return all.filter((s) => inDateRange(s.date, range)).sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  async getSession(id: string): Promise<WorkoutSession | null> {
    return (await db.getById("workoutSessions", id)) ?? null;
  }
  async saveSession(session: WorkoutSession): Promise<WorkoutSession> {
    const next = { ...session, updatedAt: new Date().toISOString() };
    await db.put("workoutSessions", next);
    return next;
  }
  async listPerformances(sessionId: string): Promise<ExercisePerformance[]> {
    const all = await db.getAll("exercisePerformances");
    return all.filter((p) => p.sessionId === sessionId).sort((a, b) => a.orderIndex - b.orderIndex);
  }
  async savePerformance(performance: ExercisePerformance): Promise<ExercisePerformance> {
    await db.put("exercisePerformances", performance);
    return performance;
  }
  async listSets(performanceId: string): Promise<ExerciseSet[]> {
    const all = await db.getAll("exerciseSets");
    return all.filter((s) => s.performanceId === performanceId).sort((a, b) => a.setNumber - b.setNumber);
  }
  async saveSet(set: ExerciseSet): Promise<ExerciseSet> {
    await db.put("exerciseSets", set);
    return set;
  }
  async listSetsForExercise(exerciseSlug: string) {
    const [sessions, performances, sets] = await Promise.all([
      db.getAll("workoutSessions"),
      db.getAll("exercisePerformances"),
      db.getAll("exerciseSets"),
    ]);
    const sessionById = new Map(sessions.map((s) => [s.id, s]));
    const matchingPerformances = performances.filter((p) => p.exerciseSlug === exerciseSlug);

    const results = matchingPerformances
      .map((performance) => {
        const session = sessionById.get(performance.sessionId);
        if (!session || session.status !== "completed") return null;
        const performanceSets = sets.filter((s) => s.performanceId === performance.id).sort((a, b) => a.setNumber - b.setNumber);
        return { session, performance, sets: performanceSets };
      })
      .filter((r): r is { session: WorkoutSession; performance: ExercisePerformance; sets: ExerciseSet[] } => r !== null);

    return results.sort((a, b) => (a.session.date < b.session.date ? 1 : -1));
  }

  async saveReadinessEntry(entry: ReadinessEntry): Promise<ReadinessEntry> {
    await db.put("readinessEntries", entry);
    return entry;
  }
  async getLatestReadiness(): Promise<ReadinessEntry | null> {
    const all = await db.getAll("readinessEntries");
    if (all.length === 0) return null;
    return all.sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  }

  async listBodyMeasurements(range?: DateRange): Promise<BodyMeasurement[]> {
    const all = await db.getAll("bodyMeasurements");
    return all.filter((m) => inDateRange(m.date, range)).sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  async saveBodyMeasurement(entry: BodyMeasurement): Promise<BodyMeasurement> {
    await db.put("bodyMeasurements", entry);
    return entry;
  }
  async deleteBodyMeasurement(id: string): Promise<void> {
    await db.remove("bodyMeasurements", id);
  }

  async getActiveNutritionTarget(): Promise<NutritionTarget | null> {
    const all = await db.getAll("nutritionTargets");
    return all.find((t) => t.isActive) ?? null;
  }
  async listNutritionTargets(): Promise<NutritionTarget[]> {
    const all = await db.getAll("nutritionTargets");
    return all.sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  }
  async saveNutritionTarget(target: NutritionTarget): Promise<NutritionTarget> {
    if (target.isActive) {
      const all = await db.getAll("nutritionTargets");
      await Promise.all(
        all.filter((t) => t.isActive && t.id !== target.id).map((t) => db.put("nutritionTargets", { ...t, isActive: false }))
      );
    }
    await db.put("nutritionTargets", target);
    return target;
  }

  async listFoodItems(): Promise<FoodItem[]> {
    return db.getAll("foodItems");
  }
  async saveFoodItem(item: FoodItem): Promise<FoodItem> {
    await db.put("foodItems", item);
    return item;
  }
  async listFoodServings(): Promise<FoodServing[]> {
    return db.getAll("foodServings");
  }
  async saveFoodServing(serving: FoodServing): Promise<void> {
    await db.put("foodServings", serving);
  }
  async listFoodAliases(): Promise<FoodAlias[]> {
    return db.getAll("foodAliases");
  }
  async saveFoodAlias(alias: FoodAlias): Promise<void> {
    await db.put("foodAliases", alias);
  }

  async listRecipes(): Promise<Recipe[]> {
    return db.getAll("recipes");
  }
  async getRecipe(id: string): Promise<Recipe | null> {
    return (await db.getById("recipes", id)) ?? null;
  }
  async saveRecipe(recipe: Recipe): Promise<Recipe> {
    const next = { ...recipe, updatedAt: new Date().toISOString() };
    await db.put("recipes", next);
    return next;
  }
  async deleteRecipe(id: string): Promise<void> {
    await db.remove("recipes", id);
  }
  async listRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]> {
    const all = await db.getAll("recipeIngredients");
    return all.filter((i) => i.recipeId === recipeId);
  }
  async saveRecipeIngredient(ingredient: RecipeIngredient): Promise<void> {
    await db.put("recipeIngredients", ingredient);
  }
  async deleteRecipeIngredient(id: string): Promise<void> {
    await db.remove("recipeIngredients", id);
  }

  async listFoodLogs(range?: DateRange): Promise<FoodLog[]> {
    const all = await db.getAll("foodLogs");
    return all.filter((f) => inDateRange(f.date, range)).sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : -1));
  }
  async saveFoodLog(entry: FoodLog): Promise<FoodLog> {
    await db.put("foodLogs", entry);
    return entry;
  }
  async deleteFoodLog(id: string): Promise<void> {
    await db.remove("foodLogs", id);
  }

  async listMealPlans(): Promise<MealPlan[]> {
    const all = await db.getAll("mealPlans");
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  async getMealPlan(id: string): Promise<MealPlan | null> {
    return (await db.getById("mealPlans", id)) ?? null;
  }
  async saveMealPlan(plan: MealPlan): Promise<MealPlan> {
    await db.put("mealPlans", plan);
    return plan;
  }
  async listMealPlanDays(mealPlanId: string): Promise<MealPlanDay[]> {
    const all = await db.getAll("mealPlanDays");
    return all.filter((d) => d.mealPlanId === mealPlanId).sort((a, b) => a.dayIndex - b.dayIndex);
  }
  async saveMealPlanDay(day: MealPlanDay): Promise<void> {
    await db.put("mealPlanDays", day);
  }
  async listPlannedMeals(mealPlanDayId: string): Promise<PlannedMeal[]> {
    const all = await db.getAll("plannedMeals");
    return all.filter((m) => m.mealPlanDayId === mealPlanDayId);
  }
  async savePlannedMeal(meal: PlannedMeal): Promise<void> {
    await db.put("plannedMeals", meal);
  }

  async listSupplementLogs(range?: DateRange): Promise<SupplementLog[]> {
    const all = await db.getAll("supplementLogs");
    return all.filter((s) => inDateRange(s.date, range));
  }
  async saveSupplementLog(entry: SupplementLog): Promise<void> {
    await db.put("supplementLogs", entry);
  }

  async listDailyEnergyLogs(range?: DateRange): Promise<DailyEnergyLog[]> {
    const all = await db.getAll("dailyEnergyLogs");
    return all.filter((e) => inDateRange(e.date, range)).sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  async getSetting(key: string): Promise<string | null> {
    const all = await db.getAll("applicationSettings");
    return all.find((s) => s.key === key)?.value ?? null;
  }
  async setSetting(key: string, value: string): Promise<void> {
    const all = await db.getAll("applicationSettings");
    const existing = all.find((s) => s.key === key);
    const now = new Date().toISOString();
    await db.put("applicationSettings", existing ? { ...existing, value, updatedAt: now } : { id: generateId(), userId: DEMO_USER_ID, key, value, updatedAt: now } as ApplicationSetting);
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const [
      userProfiles,
      userPreferences,
      medicalRestrictions,
      userEquipment,
      availableWeightIncrements,
      workoutProgrammes,
      workoutDays,
      plannedExercises,
      workoutSessions,
      exercisePerformances,
      exerciseSets,
      readinessEntries,
      bodyMeasurements,
      nutritionTargets,
      recipes,
      recipeIngredients,
      foodLogs,
      mealPlans,
      mealPlanDays,
      plannedMeals,
      supplementLogs,
      customFoodItems,
      dailyEnergyLogs,
    ] = await Promise.all([
      db.getAll("userProfiles"),
      db.getAll("userPreferences"),
      db.getAll("medicalRestrictions"),
      db.getAll("userEquipment"),
      db.getAll("availableWeightIncrements"),
      db.getAll("workoutProgrammes"),
      db.getAll("workoutDays"),
      db.getAll("plannedExercises"),
      db.getAll("workoutSessions"),
      db.getAll("exercisePerformances"),
      db.getAll("exerciseSets"),
      db.getAll("readinessEntries"),
      db.getAll("bodyMeasurements"),
      db.getAll("nutritionTargets"),
      db.getAll("recipes"),
      db.getAll("recipeIngredients"),
      db.getAll("foodLogs"),
      db.getAll("mealPlans"),
      db.getAll("mealPlanDays"),
      db.getAll("plannedMeals"),
      db.getAll("supplementLogs"),
      db.getAll("foodItems").then((items) => items.filter((i) => i.isCustom)),
      db.getAll("dailyEnergyLogs"),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      userProfiles,
      userPreferences,
      medicalRestrictions,
      userEquipment,
      availableWeightIncrements,
      workoutProgrammes,
      workoutDays,
      plannedExercises,
      workoutSessions,
      exercisePerformances,
      exerciseSets,
      readinessEntries,
      bodyMeasurements,
      nutritionTargets,
      recipes,
      recipeIngredients,
      foodLogs,
      mealPlans,
      mealPlanDays,
      plannedMeals,
      supplementLogs,
      customFoodItems,
      dailyEnergyLogs,
    };
  }

  async deleteAllUserData(): Promise<void> {
    const userStores = [
      "userProfiles",
      "userPreferences",
      "medicalRestrictions",
      "userEquipment",
      "availableWeightIncrements",
      "workoutProgrammes",
      "workoutDays",
      "plannedExercises",
      "workoutSessions",
      "exercisePerformances",
      "exerciseSets",
      "readinessEntries",
      "bodyMeasurements",
      "nutritionTargets",
      "recipes",
      "recipeIngredients",
      "foodLogs",
      "mealPlans",
      "mealPlanDays",
      "plannedMeals",
      "supplementLogs",
      "dailyEnergyLogs",
      "applicationSettings",
    ] as const;
    await Promise.all(userStores.map((s) => db.clearStore(s)));
  }
}

export const demoDataProvider = new DemoDataProvider();
