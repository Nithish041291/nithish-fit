import { generateId } from "@/lib/calc/id";
import type { FoodAlias, FoodServing } from "@/lib/types";
import { availableWeightIncrementSeed, equipmentSeed, userEquipmentSeed } from "./equipment";
import { exerciseAliasSeed, exerciseSeed, exerciseSubstitutionSeed } from "./exercises";
import { foodAliasSeed, foodItemSeed, foodServingSeed } from "./foods";
import { medicalRestrictionSeed, nutritionTargetSeed, preferencesSeed, profileSeed } from "./profile";
import { plannedExerciseSeed, programmeSeed, workoutDaySeed } from "./programme";

export { equipmentSeed, userEquipmentSeed, availableWeightIncrementSeed };
export { exerciseSeed, exerciseAliasSeed, exerciseSubstitutionSeed };
export { foodItemSeed };
export { medicalRestrictionSeed, nutritionTargetSeed, preferencesSeed, profileSeed };
export { plannedExerciseSeed, programmeSeed, workoutDaySeed };

/** foodServingSeed/foodAliasSeed reference foods by `foodSlug`; since id===slug for every
 * seeded food item, resolving to FoodServing/FoodAlias rows is a straight rename. */
export const foodServingRowsSeed: FoodServing[] = foodServingSeed.map((s) => ({
  id: generateId(),
  foodItemId: s.foodSlug,
  unit: s.unit,
  gramsEquivalent: s.gramsEquivalent,
  label: s.label,
  isDefault: s.isDefault ?? false,
}));

export const foodAliasRowsSeed: FoodAlias[] = foodAliasSeed.map((a) => ({
  id: generateId(),
  foodItemId: a.foodSlug,
  alias: a.alias,
  isUserCorrection: false,
  ownerUserId: null,
}));
