/**
 * Validates every seed data collection against its zod schema. Run with `npm run seed:check`.
 * Exits non-zero (and prints the first failure) if any seed record doesn't match its schema.
 */
import { exerciseSchema } from "@/lib/types/exercise";
import { foodItemSchema } from "@/lib/types/nutrition";
import { userProfileSchema, userPreferenceSchema, medicalRestrictionSchema } from "@/lib/types/profile";
import { equipmentSchema, userEquipmentSchema, availableWeightIncrementSchema } from "@/lib/types/equipment";
import { workoutProgrammeSchema, workoutDaySchema, plannedExerciseSchema } from "@/lib/types/programme";
import { nutritionTargetSchema } from "@/lib/types/nutrition";

import { exerciseSeed, exerciseAliasSeed, exerciseSubstitutionSeed } from "./exercises";
import { foodItemSeed, foodServingSeed, foodAliasSeed } from "./foods";
import { profileSeed, preferencesSeed, medicalRestrictionSeed, nutritionTargetSeed } from "./profile";
import { equipmentSeed, userEquipmentSeed, availableWeightIncrementSeed } from "./equipment";
import { programmeSeed, workoutDaySeed, plannedExerciseSeed } from "./programme";

let failures = 0;

function check<T>(label: string, items: T[], validate: (item: T) => void) {
  let ok = 0;
  for (const item of items) {
    try {
      validate(item);
      ok++;
    } catch (err) {
      failures++;
      const id = (item as { id?: string; slug?: string })?.id ?? (item as { slug?: string })?.slug ?? "?";
      console.error(`FAIL [${label}] id=${id}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`${failures === 0 ? "OK " : "   "}[${label}] ${ok}/${items.length} valid`);
}

// Entities with a full zod schema.
check("exercises", exerciseSeed, (e) => exerciseSchema.parse(e));
check("foodItems", foodItemSeed, (f) => foodItemSchema.parse(f));
check("equipment", equipmentSeed, (e) => equipmentSchema.parse(e));
check("userEquipment", userEquipmentSeed, (e) => userEquipmentSchema.parse(e));
check("availableWeightIncrements", availableWeightIncrementSeed, (e) => availableWeightIncrementSchema.parse(e));
check("workoutProgramme", [programmeSeed], (p) => workoutProgrammeSchema.parse(p));
check("workoutDays", workoutDaySeed, (d) => workoutDaySchema.parse(d));
check("plannedExercises", plannedExerciseSeed, (p) => plannedExerciseSchema.parse(p));
check("profile", [profileSeed], (p) => userProfileSchema.parse(p));
check("preferences", [preferencesSeed], (p) => userPreferenceSchema.parse(p));
check("medicalRestriction", [medicalRestrictionSeed], (m) => medicalRestrictionSchema.parse(m));
check("nutritionTarget", [nutritionTargetSeed], (n) => nutritionTargetSchema.parse(n));

// Cross-reference checks (aliases/servings/planned exercises point at real slugs).
const exerciseSlugs = new Set(exerciseSeed.map((e) => e.slug));
let danglingExerciseRefs = 0;
for (const a of exerciseAliasSeed) if (!exerciseSlugs.has(a.exerciseSlug)) danglingExerciseRefs++;
for (const s of exerciseSubstitutionSeed) if (!exerciseSlugs.has(s.exerciseSlug) || !exerciseSlugs.has(s.substituteSlug)) danglingExerciseRefs++;
for (const p of plannedExerciseSeed) if (!exerciseSlugs.has(p.exerciseSlug)) danglingExerciseRefs++;
if (danglingExerciseRefs > 0) {
  failures += danglingExerciseRefs;
  console.error(`FAIL [exercise cross-references] ${danglingExerciseRefs} dangling slug reference(s)`);
} else {
  console.log(`OK  [exercise cross-references] ${exerciseAliasSeed.length + exerciseSubstitutionSeed.length + plannedExerciseSeed.length} references resolve`);
}

const foodSlugs = new Set(foodItemSeed.map((f) => f.slug));
let danglingFoodRefs = 0;
for (const s of foodServingSeed) if (!foodSlugs.has(s.foodSlug)) danglingFoodRefs++;
for (const a of foodAliasSeed) if (!foodSlugs.has(a.foodSlug)) danglingFoodRefs++;
if (danglingFoodRefs > 0) {
  failures += danglingFoodRefs;
  console.error(`FAIL [food cross-references] ${danglingFoodRefs} dangling slug reference(s)`);
} else {
  console.log(`OK  [food cross-references] ${foodServingSeed.length + foodAliasSeed.length} references resolve`);
}

if (failures > 0) {
  console.error(`\n${failures} seed validation failure(s).`);
  process.exit(1);
} else {
  console.log("\nAll seed data valid.");
}
