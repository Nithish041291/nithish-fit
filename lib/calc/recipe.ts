export interface RecipeIngredientInput {
  quantityGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibrePer100g: number;
}

export interface RecipeNutrients {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
}

function sumIngredients(ingredients: RecipeIngredientInput[]): RecipeNutrients {
  return ingredients.reduce(
    (totals, ing) => {
      const factor = ing.quantityGrams / 100;
      return {
        calories: totals.calories + ing.caloriesPer100g * factor,
        proteinG: totals.proteinG + ing.proteinPer100g * factor,
        carbsG: totals.carbsG + ing.carbsPer100g * factor,
        fatG: totals.fatG + ing.fatPer100g * factor,
        fibreG: totals.fibreG + ing.fibrePer100g * factor,
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 }
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Sums nutrients across all recipe ingredients (including cooking oil, passed in as an
 * ingredient with oil's per-100g values) and divides by the declared serving count.
 * Total cooked weight is informational (for display) — division is always by `servings`,
 * matching how the recipe was declared, not by weight.
 */
export function calculateRecipeNutrients(
  ingredients: RecipeIngredientInput[],
  servings: number
): { total: RecipeNutrients; perServing: RecipeNutrients } {
  const rawTotal = sumIngredients(ingredients);
  const total: RecipeNutrients = {
    calories: Math.round(rawTotal.calories),
    proteinG: round1(rawTotal.proteinG),
    carbsG: round1(rawTotal.carbsG),
    fatG: round1(rawTotal.fatG),
    fibreG: round1(rawTotal.fibreG),
  };
  const perServing: RecipeNutrients = {
    calories: Math.round(rawTotal.calories / servings),
    proteinG: round1(rawTotal.proteinG / servings),
    carbsG: round1(rawTotal.carbsG / servings),
    fatG: round1(rawTotal.fatG / servings),
    fibreG: round1(rawTotal.fibreG / servings),
  };
  return { total, perServing };
}
