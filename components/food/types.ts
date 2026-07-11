import type { FoodMatchCandidate } from "@/lib/food-parser/matcher";
import type { FoodUnit } from "@/lib/food-parser/units";
import type { ParsedNutrients } from "@/lib/food-parser/parse";
import type { MealSlot } from "@/lib/types";

export interface PendingFoodEntry {
  localId: string;
  rawText: string;
  quantityValue: number;
  unit: FoodUnit;
  foodQuery: string;
  matches: FoodMatchCandidate[];
  selectedFoodId: string | null;
  originalBestMatchId: string | null;
  confidence: "high" | "medium" | "low" | "unmatched";
  gramsEquivalent: number | null;
  nutrients: ParsedNutrients | null;
  mealSlot: MealSlot;
}
