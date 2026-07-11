import type {
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

export interface DateRange {
  from?: string;
  to?: string;
}

/**
 * Storage-agnostic contract implemented by both the demo (IndexedDB) and Supabase
 * backends. UI code depends only on this interface — see PLAN.md section 2.
 */
export interface DataProvider {
  readonly mode: "demo" | "supabase";

  getProfile(): Promise<UserProfile | null>;
  updateProfile(patch: Partial<UserProfile>): Promise<UserProfile>;

  getPreferences(): Promise<UserPreference | null>;
  updatePreferences(patch: Partial<UserPreference>): Promise<UserPreference>;

  listMedicalRestrictions(): Promise<MedicalRestriction[]>;
  saveMedicalRestriction(restriction: MedicalRestriction): Promise<void>;

  listEquipment(): Promise<Equipment[]>;
  listUserEquipment(): Promise<UserEquipment[]>;
  setUserEquipmentEnabled(equipmentId: string, enabled: boolean): Promise<void>;

  listAvailableWeightIncrements(): Promise<AvailableWeightIncrement[]>;
  upsertAvailableWeightIncrement(entry: AvailableWeightIncrement): Promise<void>;

  listExercises(): Promise<Exercise[]>;
  getExercise(slug: string): Promise<Exercise | null>;
  listExerciseAliases(): Promise<ExerciseAlias[]>;
  listExerciseSubstitutions(): Promise<ExerciseSubstitution[]>;

  getActiveProgramme(): Promise<WorkoutProgramme | null>;
  listProgrammes(): Promise<WorkoutProgramme[]>;
  saveProgramme(programme: WorkoutProgramme): Promise<void>;
  listWorkoutDays(programmeId: string): Promise<WorkoutDay[]>;
  saveWorkoutDay(day: WorkoutDay): Promise<void>;
  listPlannedExercises(workoutDayId: string): Promise<PlannedExercise[]>;
  savePlannedExercise(entry: PlannedExercise): Promise<void>;
  deletePlannedExercise(id: string): Promise<void>;

  listSessions(range?: DateRange): Promise<WorkoutSession[]>;
  getSession(id: string): Promise<WorkoutSession | null>;
  saveSession(session: WorkoutSession): Promise<WorkoutSession>;
  listPerformances(sessionId: string): Promise<ExercisePerformance[]>;
  savePerformance(performance: ExercisePerformance): Promise<ExercisePerformance>;
  listSets(performanceId: string): Promise<ExerciseSet[]>;
  saveSet(set: ExerciseSet): Promise<ExerciseSet>;
  /** All completed sets for a given exercise slug across all sessions, newest first. */
  listSetsForExercise(exerciseSlug: string): Promise<{ session: WorkoutSession; performance: ExercisePerformance; sets: ExerciseSet[] }[]>;

  saveReadinessEntry(entry: ReadinessEntry): Promise<ReadinessEntry>;
  getLatestReadiness(): Promise<ReadinessEntry | null>;

  listBodyMeasurements(range?: DateRange): Promise<BodyMeasurement[]>;
  saveBodyMeasurement(entry: BodyMeasurement): Promise<BodyMeasurement>;
  deleteBodyMeasurement(id: string): Promise<void>;

  getActiveNutritionTarget(): Promise<NutritionTarget | null>;
  listNutritionTargets(): Promise<NutritionTarget[]>;
  saveNutritionTarget(target: NutritionTarget): Promise<NutritionTarget>;

  listFoodItems(): Promise<FoodItem[]>;
  saveFoodItem(item: FoodItem): Promise<FoodItem>;
  listFoodServings(): Promise<FoodServing[]>;
  saveFoodServing(serving: FoodServing): Promise<void>;
  listFoodAliases(): Promise<FoodAlias[]>;
  saveFoodAlias(alias: FoodAlias): Promise<void>;

  listRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe | null>;
  saveRecipe(recipe: Recipe): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  listRecipeIngredients(recipeId: string): Promise<RecipeIngredient[]>;
  saveRecipeIngredient(ingredient: RecipeIngredient): Promise<void>;
  deleteRecipeIngredient(id: string): Promise<void>;

  listFoodLogs(range?: DateRange): Promise<FoodLog[]>;
  saveFoodLog(entry: FoodLog): Promise<FoodLog>;
  deleteFoodLog(id: string): Promise<void>;

  listMealPlans(): Promise<MealPlan[]>;
  getMealPlan(id: string): Promise<MealPlan | null>;
  saveMealPlan(plan: MealPlan): Promise<MealPlan>;
  listMealPlanDays(mealPlanId: string): Promise<MealPlanDay[]>;
  saveMealPlanDay(day: MealPlanDay): Promise<void>;
  listPlannedMeals(mealPlanDayId: string): Promise<PlannedMeal[]>;
  savePlannedMeal(meal: PlannedMeal): Promise<void>;

  listSupplementLogs(range?: DateRange): Promise<SupplementLog[]>;
  saveSupplementLog(entry: SupplementLog): Promise<void>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  /** Full JSON backup of every user-owned record, for export/restore. */
  exportAll(): Promise<Record<string, unknown>>;
  /** Deletes all user data (does not touch global reference data like exercises/foods). */
  deleteAllUserData(): Promise<void>;
}

export function inDateRange(date: string, range?: DateRange): boolean {
  if (!range) return true;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}
