import { describe, expect, it } from "vitest";
import { calculateTDEE, resolveActivityMultiplier } from "@/lib/calc/tdee";

describe("calculateTDEE", () => {
  it("applies the standard multiplier for a given activity level", () => {
    expect(calculateTDEE(1900, "sedentary")).toBe(Math.round(1900 * 1.2));
    expect(calculateTDEE(1900, "moderately_active")).toBe(Math.round(1900 * 1.55));
  });

  it("uses a custom multiplier when activityLevel is custom", () => {
    expect(calculateTDEE(1900, "custom", 1.45)).toBe(Math.round(1900 * 1.45));
  });

  it("throws if custom is selected without a valid multiplier", () => {
    expect(() => resolveActivityMultiplier("custom", null)).toThrow();
    expect(() => resolveActivityMultiplier("custom", 5)).toThrow();
  });
});
