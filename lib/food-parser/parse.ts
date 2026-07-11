import { confidenceFromScore, matchFoodQuery, type FoodMatchCandidate } from "./matcher";
import { tokenizeFoodText, type ParsedFoodToken } from "./tokenizer";
import { DEFAULT_UNIT_GRAMS, type FoodUnit } from "./units";

export interface FoodIndexServing {
  unit: FoodUnit;
  gramsEquivalent: number;
}

export interface FoodIndexItem {
  id: string;
  name: string;
  aliases: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibrePer100g: number;
  servings: FoodIndexServing[];
}

export interface ParsedNutrients {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
}

export interface ParsedFoodLogEntry extends ParsedFoodToken {
  matches: FoodMatchCandidate[];
  bestMatch: FoodMatchCandidate | null;
  confidence: "high" | "medium" | "low" | "unmatched";
  gramsEquivalent: number | null;
  nutrients: ParsedNutrients | null;
}

/** Minimum match score required to auto-select a "best" match at all. Below this, the
 * parser reports no confident match rather than guessing. */
const MIN_MATCH_SCORE = 0.4;

export function resolveGramsForToken(token: ParsedFoodToken, food: FoodIndexItem): number {
  const specific = food.servings.find((s) => s.unit === token.unit);
  const gramsPerUnit = specific ? specific.gramsEquivalent : DEFAULT_UNIT_GRAMS[token.unit];
  return Math.round(token.quantityValue * gramsPerUnit * 100) / 100;
}

export function computeNutrientsForGrams(grams: number, food: FoodIndexItem): ParsedNutrients {
  const factor = grams / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    proteinG: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbsG: Math.round(food.carbsPer100g * factor * 10) / 10,
    fatG: Math.round(food.fatPer100g * factor * 10) / 10,
    fibreG: Math.round(food.fibrePer100g * factor * 10) / 10,
  };
}

/**
 * Full deterministic pipeline: split text -> parse quantity/unit per segment -> match
 * against the food index -> resolve grams -> compute nutrients. Nothing here fabricates
 * a nutrition value; every number traces back to a FoodIndexItem entry.
 */
export function parseFoodLogText(text: string, foodIndex: FoodIndexItem[]): ParsedFoodLogEntry[] {
  const tokens = tokenizeFoodText(text);
  const candidates = foodIndex.map((f) => ({ id: f.id, name: f.name, aliases: f.aliases }));

  return tokens.map((token) => {
    const matches = matchFoodQuery(token.foodQuery, candidates).slice(0, 5);
    const bestMatch = matches.length > 0 && matches[0].score >= MIN_MATCH_SCORE ? matches[0] : null;

    if (!bestMatch) {
      return { ...token, matches, bestMatch: null, confidence: "unmatched" as const, gramsEquivalent: null, nutrients: null };
    }

    const food = foodIndex.find((f) => f.id === bestMatch.id)!;
    const gramsEquivalent = resolveGramsForToken(token, food);
    const nutrients = computeNutrientsForGrams(gramsEquivalent, food);

    return {
      ...token,
      matches,
      bestMatch,
      confidence: confidenceFromScore(bestMatch.score),
      gramsEquivalent,
      nutrients,
    };
  });
}
