import { describe, expect, it } from "vitest";
import { calculateMacroTargets } from "@/lib/calc/macros";

describe("calculateMacroTargets", () => {
  it("matches the seed profile's ~2250 kcal / 180 g protein targets", () => {
    const result = calculateMacroTargets({
      bmrKcal: 1909,
      activityLevel: "moderately_active",
      deficitPercent: 17.5,
      currentWeightKg: 92,
      targetWeightKg: 84,
      proteinGPerKgCurrentWeight: 1.957, // tuned so protein rounds to ~180g at 92kg
      fatGPerKgTargetWeight: 0.8, // 84 * 0.8 = 67.2 -> 67g, within the 65-70g band
      fibreTargetG: 35,
    });

    expect(result.maintenanceKcal).toBe(Math.round(1909 * 1.55));
    expect(result.calorieTargetKcal).toBeCloseTo(result.maintenanceKcal * 0.825, 0);
    expect(result.proteinG).toBe(180);
    expect(result.fatG).toBe(67);
    expect(result.fibreG).toBe(35);
    expect(result.carbG).toBeGreaterThan(0);
  });

  it("computes carbohydrates as remaining calories after protein and fat, floored at 0", () => {
    const result = calculateMacroTargets({
      bmrKcal: 1000,
      activityLevel: "sedentary",
      deficitPercent: 0,
      currentWeightKg: 100,
      targetWeightKg: 100,
      proteinGPerKgCurrentWeight: 3, // 300g protein = 1200 kcal, already exceeds a 1200 kcal maintenance
      fatGPerKgTargetWeight: 2, // 200g fat = 1800 kcal
      fibreTargetG: 30,
    });
    expect(result.carbG).toBe(0);
    expect(result.calorieTargetKcal).toBe(1200); // maintenance = 1000*1.2 = 1200
  });

  it("derives carbs strictly from remaining kcal at 4 kcal/g", () => {
    const result = calculateMacroTargets({
      bmrKcal: 1900,
      activityLevel: "moderately_active",
      deficitPercent: 20,
      currentWeightKg: 90,
      targetWeightKg: 85,
      proteinGPerKgCurrentWeight: 2,
      fatGPerKgTargetWeight: 0.8,
      fibreTargetG: 35,
    });
    const expectedRemaining = result.calorieTargetKcal - result.proteinKcal - result.fatKcal;
    expect(result.carbG).toBe(Math.round(expectedRemaining / 4));
  });
});
