import { describe, expect, it } from "vitest";
import { calculateBMR } from "@/lib/calc/bmr";

describe("calculateBMR", () => {
  it("computes Mifflin-St Jeor BMR for men", () => {
    // Nithish's seed profile: 92 kg, 185.4 cm, 35 years old.
    const bmr = calculateBMR({ sex: "male", weightKg: 92, heightCm: 185.4, age: 35 });
    // 10*92 + 6.25*185.4 - 5*35 + 5 = 920 + 1158.75 - 175 + 5 = 1908.75 -> rounds to 1909
    expect(bmr).toBe(1909);
  });

  it("computes Mifflin-St Jeor BMR for women", () => {
    const bmr = calculateBMR({ sex: "female", weightKg: 60, heightCm: 165, age: 30 });
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
    expect(bmr).toBe(1320);
  });

  it("decreases with age holding other factors constant", () => {
    const younger = calculateBMR({ sex: "male", weightKg: 80, heightCm: 180, age: 25 });
    const older = calculateBMR({ sex: "male", weightKg: 80, heightCm: 180, age: 45 });
    expect(older).toBeLessThan(younger);
  });
});
