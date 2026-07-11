import { type DBSchema, type IDBPDatabase, type StoreNames, openDB } from "idb";
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

export interface NithishFitDB extends DBSchema {
  userProfiles: { key: string; value: UserProfile };
  userPreferences: { key: string; value: UserPreference };
  medicalRestrictions: { key: string; value: MedicalRestriction };
  applicationSettings: { key: string; value: ApplicationSetting };
  equipment: { key: string; value: Equipment };
  userEquipment: { key: string; value: UserEquipment };
  availableWeightIncrements: { key: string; value: AvailableWeightIncrement };
  exercises: { key: string; value: Exercise };
  exerciseAliases: { key: string; value: ExerciseAlias };
  exerciseSubstitutions: { key: string; value: ExerciseSubstitution };
  workoutProgrammes: { key: string; value: WorkoutProgramme };
  workoutDays: { key: string; value: WorkoutDay };
  plannedExercises: { key: string; value: PlannedExercise };
  workoutSessions: { key: string; value: WorkoutSession };
  exercisePerformances: { key: string; value: ExercisePerformance };
  exerciseSets: { key: string; value: ExerciseSet };
  readinessEntries: { key: string; value: ReadinessEntry };
  bodyMeasurements: { key: string; value: BodyMeasurement };
  nutritionTargets: { key: string; value: NutritionTarget };
  foodItems: { key: string; value: FoodItem };
  foodServings: { key: string; value: FoodServing };
  foodAliases: { key: string; value: FoodAlias };
  recipes: { key: string; value: Recipe };
  recipeIngredients: { key: string; value: RecipeIngredient };
  foodLogs: { key: string; value: FoodLog };
  mealPlans: { key: string; value: MealPlan };
  mealPlanDays: { key: string; value: MealPlanDay };
  plannedMeals: { key: string; value: PlannedMeal };
  supplementLogs: { key: string; value: SupplementLog };
}

export type StoreName = StoreNames<NithishFitDB>;

const STORE_NAMES: StoreName[] = [
  "userProfiles",
  "userPreferences",
  "medicalRestrictions",
  "applicationSettings",
  "equipment",
  "userEquipment",
  "availableWeightIncrements",
  "exercises",
  "exerciseAliases",
  "exerciseSubstitutions",
  "workoutProgrammes",
  "workoutDays",
  "plannedExercises",
  "workoutSessions",
  "exercisePerformances",
  "exerciseSets",
  "readinessEntries",
  "bodyMeasurements",
  "nutritionTargets",
  "foodItems",
  "foodServings",
  "foodAliases",
  "recipes",
  "recipeIngredients",
  "foodLogs",
  "mealPlans",
  "mealPlanDays",
  "plannedMeals",
  "supplementLogs",
];

const DB_NAME = "nithish-fit";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NithishFitDB>> | null = null;

export function getLocalDb(): Promise<IDBPDatabase<NithishFitDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NithishFitDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of STORE_NAMES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: "id" });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getAll<S extends StoreName>(store: S): Promise<NithishFitDB[S]["value"][]> {
  const db = await getLocalDb();
  return db.getAll(store);
}

export async function getById<S extends StoreName>(store: S, id: string): Promise<NithishFitDB[S]["value"] | undefined> {
  const db = await getLocalDb();
  return db.get(store, id);
}

export async function put<S extends StoreName>(store: S, value: NithishFitDB[S]["value"]): Promise<void> {
  const db = await getLocalDb();
  await db.put(store, value);
}

export async function putMany<S extends StoreName>(store: S, values: NithishFitDB[S]["value"][]): Promise<void> {
  const db = await getLocalDb();
  const tx = db.transaction(store, "readwrite");
  await Promise.all([...values.map((v) => tx.store.put(v)), tx.done]);
}

export async function remove<S extends StoreName>(store: S, id: string): Promise<void> {
  const db = await getLocalDb();
  await db.delete(store, id);
}

export async function clearStore<S extends StoreName>(store: S): Promise<void> {
  const db = await getLocalDb();
  await db.clear(store);
}

export async function countAll<S extends StoreName>(store: S): Promise<number> {
  const db = await getLocalDb();
  return db.count(store);
}

export async function clearAllStores(): Promise<void> {
  const db = await getLocalDb();
  await Promise.all(STORE_NAMES.map((name) => db.clear(name)));
}
