import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ApplicationSetting,
  AvailableWeightIncrement,
  BodyMeasurement,
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
import { rowToCamel, toSnakeRow } from "./caseConvert";
import type { DataProvider, DateRange } from "./provider";

/**
 * Supabase-backed implementation of DataProvider. Mirrors DemoDataProvider's shape 1:1 so
 * the two can be swapped transparently. Requires an authenticated Supabase session — every
 * write includes user_id = current user, and RLS (supabase/migrations/0011_rls.sql)
 * enforces the same scoping server-side.
 */
export class SupabaseDataProvider implements DataProvider {
  readonly mode = "supabase" as const;
  constructor(private client: SupabaseClient) {}

  private async userId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user) throw new Error("Not authenticated");
    return data.user.id;
  }

  // Supabase's generated query-builder types require a Database schema type we don't have
  // (no live project to generate against — see ASSUMPTIONS.md). These internal helpers
  // intentionally use `any` for the query-chaining step; the public DataProvider surface
  // above stays fully typed via the generic <T>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async selectAll<T>(table: string, filter?: (q: any) => any): Promise<T[]> {
    let query: any = this.client.from(table).select("*"); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (filter) query = filter(query);
    const { data, error } = await query;
    if (error) throw error;
    return ((data as Record<string, unknown>[]) ?? []).map((row) => rowToCamel<T>(row));
  }

  private async upsertRow<T>(table: string, record: Record<string, unknown>): Promise<T> {
    const { data, error } = await (this.client.from(table) as any).upsert(toSnakeRow(record)).select().single(); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (error) throw error;
    return rowToCamel<T>(data as Record<string, unknown>);
  }

  async getProfile(): Promise<UserProfile | null> {
    const uid = await this.userId();
    const rows = await this.selectAll<UserProfile>("user_profiles", (q) => q.eq("user_id", uid) as typeof q);
    return rows[0] ?? null;
  }
  async updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
    const uid = await this.userId();
    return this.upsertRow<UserProfile>("user_profiles", { ...patch, userId: uid, updatedAt: new Date().toISOString() });
  }

  async getPreferences(): Promise<UserPreference | null> {
    const uid = await this.userId();
    const rows = await this.selectAll<UserPreference>("user_preferences", (q) => q.eq("user_id", uid) as typeof q);
    return rows[0] ?? null;
  }
  async updatePreferences(patch: Partial<UserPreference>): Promise<UserPreference> {
    const uid = await this.userId();
    return this.upsertRow<UserPreference>("user_preferences", { ...patch, userId: uid, updatedAt: new Date().toISOString() });
  }

  async listMedicalRestrictions(): Promise<MedicalRestriction[]> {
    const uid = await this.userId();
    return this.selectAll<MedicalRestriction>("medical_restrictions", (q) => q.eq("user_id", uid) as typeof q);
  }
  async saveMedicalRestriction(restriction: MedicalRestriction): Promise<void> {
    await this.upsertRow("medical_restrictions", restriction as unknown as Record<string, unknown>);
  }

  async listEquipment(): Promise<Equipment[]> {
    return this.selectAll<Equipment>("equipment");
  }
  async listUserEquipment(): Promise<UserEquipment[]> {
    const uid = await this.userId();
    return this.selectAll<UserEquipment>("user_equipment", (q) => q.eq("user_id", uid) as typeof q);
  }
  async setUserEquipmentEnabled(equipmentId: string, enabled: boolean): Promise<void> {
    const uid = await this.userId();
    await this.client
      .from("user_equipment")
      .upsert(toSnakeRow({ userId: uid, equipmentId, enabled, updatedAt: new Date().toISOString() }), { onConflict: "user_id,equipment_id" });
  }

  async listAvailableWeightIncrements(): Promise<AvailableWeightIncrement[]> {
    const uid = await this.userId();
    return this.selectAll<AvailableWeightIncrement>("available_weight_increments", (q) => q.eq("user_id", uid) as typeof q);
  }
  async upsertAvailableWeightIncrement(entry: AvailableWeightIncrement): Promise<void> {
    await this.upsertRow("available_weight_increments", entry as unknown as Record<string, unknown>);
  }

  async listExercises(): Promise<Exercise[]> {
    return this.selectAll<Exercise>("exercises");
  }
  async getExercise(slug: string): Promise<Exercise | null> {
    const rows = await this.selectAll<Exercise>("exercises", (q) => q.eq("slug", slug) as typeof q);
    return rows[0] ?? null;
  }
  async listExerciseAliases(): Promise<ExerciseAlias[]> {
    return this.selectAll<ExerciseAlias>("exercise_aliases");
  }
  async listExerciseSubstitutions(): Promise<ExerciseSubstitution[]> {
    return this.selectAll<ExerciseSubstitution>("exercise_substitutions");
  }

  async getActiveProgramme(): Promise<WorkoutProgramme | null> {
    const uid = await this.userId();
    const rows = await this.selectAll<WorkoutProgramme>("workout_programmes", (q) => q.eq("user_id", uid).eq("is_active", true) as typeof q);
    return rows[0] ?? null;
  }
  async listProgrammes(): Promise<WorkoutProgramme[]> {
    const uid = await this.userId();
    return this.selectAll<WorkoutProgramme>("workout_programmes", (q) => q.eq("user_id", uid) as typeof q);
  }
  async saveProgramme(programme: WorkoutProgramme): Promise<void> {
    await this.upsertRow("workout_programmes", programme as unknown as Record<string, unknown>);
  }
  async listWorkoutDays(programmeId: string): Promise<WorkoutDay[]> {
    return this.selectAll<WorkoutDay>("workout_days", (q) => q.eq("programme_id", programmeId).order("order_index") as typeof q);
  }
  async saveWorkoutDay(day: WorkoutDay): Promise<void> {
    await this.upsertRow("workout_days", day as unknown as Record<string, unknown>);
  }
  async listPlannedExercises(workoutDayId: string): Promise<PlannedExercise[]> {
    return this.selectAll<PlannedExercise>("planned_exercises", (q) => q.eq("workout_day_id", workoutDayId).order("order_index") as typeof q);
  }
  async savePlannedExercise(entry: PlannedExercise): Promise<void> {
    await this.upsertRow("planned_exercises", entry as unknown as Record<string, unknown>);
  }
  async deletePlannedExercise(id: string): Promise<void> {
    await this.client.from("planned_exercises").delete().eq("id", id);
  }

  async listSessions(range?: DateRange): Promise<WorkoutSession[]> {
    const uid = await this.userId();
    return this.selectAll<WorkoutSession>("workout_sessions", (q) => {
      let query = q.eq("user_id", uid);
      if (range?.from) query = query.gte("date", range.from);
      if (range?.to) query = query.lte("date", range.to);
      return query.order("date", { ascending: false }) as typeof q;
    });
  }
  async getSession(id: string): Promise<WorkoutSession | null> {
    const rows = await this.selectAll<WorkoutSession>("workout_sessions", (q) => q.eq("id", id) as typeof q);
    return rows[0] ?? null;
  }
  async saveSession(session: WorkoutSession): Promise<WorkoutSession> {
    return this.upsertRow<WorkoutSession>("workout_sessions", { ...session, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>);
  }
  async listPerformances(sessionId: string): Promise<ExercisePerformance[]> {
    return this.selectAll<ExercisePerformance>("exercise_performances", (q) => q.eq("session_id", sessionId).order("order_index") as typeof q);
  }
  async savePerformance(performance: ExercisePerformance): Promise<ExercisePerformance> {
    return this.upsertRow<ExercisePerformance>("exercise_performances", performance as unknown as Record<string, unknown>);
  }
  async listSets(performanceId: string): Promise<ExerciseSet[]> {
    return this.selectAll<ExerciseSet>("exercise_sets", (q) => q.eq("performance_id", performanceId).order("set_number") as typeof q);
  }
  async saveSet(set: ExerciseSet): Promise<ExerciseSet> {
    return this.upsertRow<ExerciseSet>("exercise_sets", set as unknown as Record<string, unknown>);
  }
  async listSetsForExercise(exerciseSlug: string) {
    const uid = await this.userId();
    const sessions = await this.selectAll<WorkoutSession>("workout_sessions", (q) => q.eq("user_id", uid).eq("status", "completed") as typeof q);
    const performances = await this.selectAll<ExercisePerformance>("exercise_performances", (q) => q.eq("exercise_slug", exerciseSlug) as typeof q);
    const sessionById = new Map(sessions.map((s) => [s.id, s]));
    const results: { session: WorkoutSession; performance: ExercisePerformance; sets: ExerciseSet[] }[] = [];
    for (const performance of performances) {
      const session = sessionById.get(performance.sessionId);
      if (!session) continue;
      const sets = await this.listSets(performance.id);
      results.push({ session, performance, sets });
    }
    return results.sort((a, b) => (a.session.date < b.session.date ? 1 : -1));
  }

  async saveReadinessEntry(entry: ReadinessEntry): Promise<ReadinessEntry> {
    return this.upsertRow<ReadinessEntry>("readiness_entries", entry as unknown as Record<string, unknown>);
  }
  async getLatestReadiness(): Promise<ReadinessEntry | null> {
    const uid = await this.userId();
    const rows = await this.selectAll<ReadinessEntry>("readiness_entries", (q) => q.eq("user_id", uid).order("date", { ascending: false }).limit(1) as typeof q);
    return rows[0] ?? null;
  }

  async listBodyMeasurements(range?: DateRange): Promise<BodyMeasurement[]> {
    const uid = await this.userId();
    return this.selectAll<BodyMeasurement>("body_measurements", (q) => {
      let query = q.eq("user_id", uid);
      if (range?.from) query = query.gte("date", range.from);
      if (range?.to) query = query.lte("date", range.to);
      return query.order("date") as typeof q;
    });
  }
  async saveBodyMeasurement(entry: BodyMeasurement): Promise<BodyMeasurement> {
    return this.upsertRow<BodyMeasurement>("body_measurements", entry as unknown as Record<string, unknown>);
  }
  async deleteBodyMeasurement(id: string): Promise<void> {
    await this.client.from("body_measurements").delete().eq("id", id);
  }

  async getActiveNutritionTarget(): Promise<NutritionTarget | null> {
    const uid = await this.userId();
    const rows = await this.selectAll<NutritionTarget>("nutrition_targets", (q) => q.eq("user_id", uid).eq("is_active", true) as typeof q);
    return rows[0] ?? null;
  }
  async listNutritionTargets(): Promise<NutritionTarget[]> {
    const uid = await this.userId();
    return this.selectAll<NutritionTarget>("nutrition_targets", (q) => q.eq("user_id", uid).order("effective_from", { ascending: false }) as typeof q);
  }
  async saveNutritionTarget(target: NutritionTarget): Promise<NutritionTarget> {
    if (target.isActive) {
      const uid = await this.userId();
      await this.client.from("nutrition_targets").update({ is_active: false }).eq("user_id", uid).eq("is_active", true);
    }
    return this.upsertRow<NutritionTarget>("nutrition_targets", target as unknown as Record<string, unknown>);
  }

  async listFoodItems(): Promise<FoodItem[]> {
    return this.selectAll<FoodItem>("food_items");
  }
  async saveFoodItem(item: FoodItem): Promise<FoodItem> {
    return this.upsertRow<FoodItem>("food_items", item as unknown as Record<string, unknown>);
  }
  async listFoodServings(): Promise<FoodServing[]> {
    return this.selectAll<FoodServing>("food_servings");
  }
  async saveFoodServing(serving: FoodServing): Promise<void> {
    await this.upsertRow("food_servings", serving as unknown as Record<string, unknown>);
  }
  async listFoodAliases(): Promise<FoodAlias[]> {
    return this.selectAll<FoodAlias>("food_aliases");
  }
  async saveFoodAlias(alias: FoodAlias): Promise<void> {
    await this.upsertRow("food_aliases", alias as unknown as Record<string, unknown>);
  }

  async listRecipes(): Promise<Recipe[]> {
    const uid = await this.userId();
    return this.selectAll<Recipe>("recipes", (q) => q.eq("user_id", uid) as typeof q);
  }
  async getRecipe(id: string): Promise<Recipe | null> {
    const rows = await this.selectAll<Recipe>("recipes", (q) => q.eq("id", id) as typeof q);
    return rows[0] ?? null;
  }
  async saveRecipe(recipe: Recipe): Promise<Recipe> {
    return this.upsertRow<Recipe>("recipes", { ...recipe, updatedAt: new Date().toISOString() } as unknown as Record<string, unknown>);
  }
  async deleteRecipe(id: string): Promise<void> {
    await this.client.from("recipes").delete().eq("id", id);
  }
  async listRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]> {
    return this.selectAll<RecipeIngredient>("recipe_ingredients", (q) => q.eq("recipe_id", recipeId) as typeof q);
  }
  async saveRecipeIngredient(ingredient: RecipeIngredient): Promise<void> {
    await this.upsertRow("recipe_ingredients", ingredient as unknown as Record<string, unknown>);
  }
  async deleteRecipeIngredient(id: string): Promise<void> {
    await this.client.from("recipe_ingredients").delete().eq("id", id);
  }

  async listFoodLogs(range?: DateRange): Promise<FoodLog[]> {
    const uid = await this.userId();
    return this.selectAll<FoodLog>("food_logs", (q) => {
      let query = q.eq("user_id", uid);
      if (range?.from) query = query.gte("date", range.from);
      if (range?.to) query = query.lte("date", range.to);
      return query.order("logged_at", { ascending: false }) as typeof q;
    });
  }
  async saveFoodLog(entry: FoodLog): Promise<FoodLog> {
    return this.upsertRow<FoodLog>("food_logs", entry as unknown as Record<string, unknown>);
  }
  async deleteFoodLog(id: string): Promise<void> {
    await this.client.from("food_logs").delete().eq("id", id);
  }

  async listMealPlans(): Promise<MealPlan[]> {
    const uid = await this.userId();
    return this.selectAll<MealPlan>("meal_plans", (q) => q.eq("user_id", uid).order("created_at", { ascending: false }) as typeof q);
  }
  async getMealPlan(id: string): Promise<MealPlan | null> {
    const rows = await this.selectAll<MealPlan>("meal_plans", (q) => q.eq("id", id) as typeof q);
    return rows[0] ?? null;
  }
  async saveMealPlan(plan: MealPlan): Promise<MealPlan> {
    return this.upsertRow<MealPlan>("meal_plans", plan as unknown as Record<string, unknown>);
  }
  async listMealPlanDays(mealPlanId: string): Promise<MealPlanDay[]> {
    return this.selectAll<MealPlanDay>("meal_plan_days", (q) => q.eq("meal_plan_id", mealPlanId).order("day_index") as typeof q);
  }
  async saveMealPlanDay(day: MealPlanDay): Promise<void> {
    await this.upsertRow("meal_plan_days", day as unknown as Record<string, unknown>);
  }
  async listPlannedMeals(mealPlanDayId: string): Promise<PlannedMeal[]> {
    return this.selectAll<PlannedMeal>("planned_meals", (q) => q.eq("meal_plan_day_id", mealPlanDayId) as typeof q);
  }
  async savePlannedMeal(meal: PlannedMeal): Promise<void> {
    await this.upsertRow("planned_meals", meal as unknown as Record<string, unknown>);
  }

  async listSupplementLogs(range?: DateRange): Promise<SupplementLog[]> {
    const uid = await this.userId();
    return this.selectAll<SupplementLog>("supplement_logs", (q) => {
      let query = q.eq("user_id", uid);
      if (range?.from) query = query.gte("date", range.from);
      if (range?.to) query = query.lte("date", range.to);
      return query as typeof q;
    });
  }
  async saveSupplementLog(entry: SupplementLog): Promise<void> {
    await this.upsertRow("supplement_logs", entry as unknown as Record<string, unknown>);
  }

  async getSetting(key: string): Promise<string | null> {
    const uid = await this.userId();
    const rows = await this.selectAll<ApplicationSetting>("application_settings", (q) => q.eq("user_id", uid).eq("key", key) as typeof q);
    return rows[0]?.value ?? null;
  }
  async setSetting(key: string, value: string): Promise<void> {
    const uid = await this.userId();
    await this.client.from("application_settings").upsert(toSnakeRow({ userId: uid, key, value, updatedAt: new Date().toISOString() }), { onConflict: "user_id,key" });
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const [
      profile,
      preferences,
      medicalRestrictions,
      sessions,
      bodyMeasurements,
      nutritionTargets,
      recipes,
      foodLogs,
      mealPlans,
      supplementLogs,
    ] = await Promise.all([
      this.getProfile(),
      this.getPreferences(),
      this.listMedicalRestrictions(),
      this.listSessions(),
      this.listBodyMeasurements(),
      this.listNutritionTargets(),
      this.listRecipes(),
      this.listFoodLogs(),
      this.listMealPlans(),
      this.listSupplementLogs(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile,
      preferences,
      medicalRestrictions,
      sessions,
      bodyMeasurements,
      nutritionTargets,
      recipes,
      foodLogs,
      mealPlans,
      supplementLogs,
    };
  }

  async deleteAllUserData(): Promise<void> {
    const uid = await this.userId();
    const tables = [
      "workout_sessions",
      "workout_programmes",
      "body_measurements",
      "nutrition_targets",
      "recipes",
      "food_logs",
      "meal_plans",
      "supplement_logs",
      "readiness_entries",
      "user_equipment",
      "available_weight_increments",
      "medical_restrictions",
      "application_settings",
    ];
    await Promise.all(tables.map((t) => this.client.from(t).delete().eq("user_id", uid)));
  }
}
