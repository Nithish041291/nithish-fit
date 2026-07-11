import { describe, expect, it } from "vitest";
import { calculateRecipeNutrients } from "@/lib/calc/recipe";

describe("calculateRecipeNutrients", () => {
  it("sums ingredient nutrients (including oil) and divides by servings", () => {
    const chicken = { quantityGrams: 500, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fibrePer100g: 0 };
    const oil = { quantityGrams: 30, caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fibrePer100g: 0 };
    const onion = { quantityGrams: 150, caloriesPer100g: 40, proteinPer100g: 1.1, carbsPer100g: 9.3, fatPer100g: 0.1, fibrePer100g: 1.7 };

    const { total, perServing } = calculateRecipeNutrients([chicken, oil, onion], 4);

    const expectedTotalCalories = Math.round(165 * 5 + 884 * 0.3 + 40 * 1.5);
    expect(total.calories).toBe(expectedTotalCalories);
    expect(perServing.calories).toBe(Math.round(expectedTotalCalories / 4));
    expect(perServing.proteinG).toBeCloseTo((31 * 5 + 0 * 0.3 + 1.1 * 1.5) / 4, 1);
  });

  it("more oil per serving increases calories per serving (oil sensitivity)", () => {
    const chicken = { quantityGrams: 500, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fibrePer100g: 0 };
    const lowOil = calculateRecipeNutrients([chicken, { quantityGrams: 10, caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fibrePer100g: 0 }], 4);
    const highOil = calculateRecipeNutrients([chicken, { quantityGrams: 60, caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fibrePer100g: 0 }], 4);
    expect(highOil.perServing.calories).toBeGreaterThan(lowOil.perServing.calories);
  });
});
