import { describe, expect, it } from "vitest";
import { computeDeloadSets, evaluateDeloadNeed } from "@/lib/calc/deload";

describe("evaluateDeloadNeed", () => {
  it("recommends nothing when all signals are normal", () => {
    const result = evaluateDeloadNeed({
      weeksSinceLastDeload: 2,
      consecutiveWeeksPerformanceDecline: 0,
      recentAvgPainScore: 1,
      recentAvgSoreness: 2,
      recentAvgSessionDifficulty: 5,
    });
    expect(result.recommended).toBe(false);
  });

  it("recommends a deload after 6+ hard training weeks", () => {
    const result = evaluateDeloadNeed({
      weeksSinceLastDeload: 7,
      consecutiveWeeksPerformanceDecline: 0,
      recentAvgPainScore: 1,
      recentAvgSoreness: 2,
      recentAvgSessionDifficulty: 5,
    });
    expect(result.recommended).toBe(true);
    expect(result.reasonCodes).toContain("six_to_eight_hard_weeks");
  });

  it("recommends a deload after 2 consecutive weeks of declining performance", () => {
    const result = evaluateDeloadNeed({
      weeksSinceLastDeload: 3,
      consecutiveWeeksPerformanceDecline: 2,
      recentAvgPainScore: 1,
      recentAvgSoreness: 2,
      recentAvgSessionDifficulty: 5,
    });
    expect(result.reasonCodes).toContain("performance_decline_two_weeks");
  });

  it("recommends a deload for elevated pain or soreness", () => {
    const result = evaluateDeloadNeed({
      weeksSinceLastDeload: 3,
      consecutiveWeeksPerformanceDecline: 0,
      recentAvgPainScore: 5,
      recentAvgSoreness: 2,
      recentAvgSessionDifficulty: 5,
    });
    expect(result.reasonCodes).toContain("elevated_pain");
  });
});

describe("computeDeloadSets", () => {
  it("reduces set count by roughly 40%", () => {
    expect(computeDeloadSets(4)).toBe(2);
    expect(computeDeloadSets(3)).toBe(2);
    expect(computeDeloadSets(5)).toBe(3);
  });

  it("never reduces below 1 set", () => {
    expect(computeDeloadSets(1)).toBe(1);
  });
});
