import { describe, expect, it } from "vitest";
import { recommendProgression, type ProgressionExerciseContext } from "@/lib/calc/progression";

const dumbbellRestricted: ProgressionExerciseContext = {
  loadBasis: "per_hand",
  involvesRightHand: true,
  perHandOrTotalWeightLimitKg: 25,
  repRangeLow: 8,
  repRangeHigh: 10,
  availableIncrementKg: 2,
  wristLoadCategory: "moderate",
};

const machineExercise: ProgressionExerciseContext = {
  loadBasis: "machine_stack",
  involvesRightHand: false,
  perHandOrTotalWeightLimitKg: null,
  repRangeLow: 8,
  repRangeHigh: 10,
  availableIncrementKg: 5,
  wristLoadCategory: "low",
};

describe("recommendProgression", () => {
  it("returns no_history when the exercise has never been logged", () => {
    const result = recommendProgression({ exercise: machineExercise, lastSessionSets: null, daysSinceLastSession: null, isDeloadActive: false });
    expect(result.action).toBe("no_history");
  });

  it("recommends ~65% of previous weight after a 10+ day break, not a regression", () => {
    const preciseIncrement = { ...machineExercise, availableIncrementKg: 1 };
    const result = recommendProgression({
      exercise: preciseIncrement,
      lastSessionSets: [{ weightKg: 40, reps: 10, rir: 2, painScore: 0, completed: true }],
      daysSinceLastSession: 12,
      isDeloadActive: false,
    });
    expect(result.action).toBe("break_reintroduction");
    expect(result.recommendedWeightKg).toBeCloseTo(40 * 0.65, 0);
  });

  it("increases load by the smallest increment when all sets hit the top of the range with RIR 2+", () => {
    const result = recommendProgression({
      exercise: machineExercise,
      lastSessionSets: [
        { weightKg: 40, reps: 10, rir: 2, painScore: 0, completed: true },
        { weightKg: 40, reps: 10, rir: 2, painScore: 0, completed: true },
        { weightKg: 40, reps: 10, rir: 2, painScore: 0, completed: true },
      ],
      daysSinceLastSession: 5,
      isDeloadActive: false,
    });
    expect(result.action).toBe("increase_load");
    expect(result.recommendedWeightKg).toBe(45);
  });

  it("never recommends more than 25kg per hand even after a successful top-of-range session", () => {
    const result = recommendProgression({
      exercise: dumbbellRestricted,
      lastSessionSets: [
        { weightKg: 25, reps: 10, rir: 2, painScore: 0, completed: true },
        { weightKg: 25, reps: 10, rir: 2, painScore: 0, completed: true },
      ],
      daysSinceLastSession: 5,
      isDeloadActive: false,
    });
    expect(result.action).toBe("increase_reps");
    expect(result.recommendedWeightKg).toBe(25);
    expect(result.cappedBySafetyLimit).toBe(true);
    expect(result.reasonCodes).toContain("weight_cap_reached");
  });

  it("caps a proposed increase that would exceed 25kg per hand", () => {
    const nearCap: ProgressionExerciseContext = { ...dumbbellRestricted, availableIncrementKg: 4 };
    const result = recommendProgression({
      exercise: nearCap,
      lastSessionSets: [
        { weightKg: 24, reps: 10, rir: 3, painScore: 0, completed: true },
        { weightKg: 24, reps: 10, rir: 3, painScore: 0, completed: true },
      ],
      daysSinceLastSession: 3,
      isDeloadActive: false,
    });
    expect(result.recommendedWeightKg).toBeLessThanOrEqual(25);
  });

  it("does not increase load when pain of 4+ was reported, and flags a substitute", () => {
    const result = recommendProgression({
      exercise: dumbbellRestricted,
      lastSessionSets: [
        { weightKg: 20, reps: 10, rir: 3, painScore: 5, completed: true },
        { weightKg: 20, reps: 10, rir: 3, painScore: 5, completed: true },
      ],
      daysSinceLastSession: 3,
      isDeloadActive: false,
    });
    expect(result.action).toBe("reduce_load");
    expect(result.recommendedWeightKg).toBeLessThan(20);
    expect(result.suggestSwitchToMachine).toBe(true);
  });

  it("flags severe pain (7+) distinctly for medical review", () => {
    const result = recommendProgression({
      exercise: dumbbellRestricted,
      lastSessionSets: [{ weightKg: 20, reps: 10, rir: 3, painScore: 8, completed: true }],
      daysSinceLastSession: 3,
      isDeloadActive: false,
    });
    expect(result.reasonCodes).toContain("pain_severe");
  });

  it("maintains load when reps were hit but RIR was 0-1", () => {
    const result = recommendProgression({
      exercise: machineExercise,
      lastSessionSets: [
        { weightKg: 40, reps: 10, rir: 0, painScore: 0, completed: true },
        { weightKg: 40, reps: 10, rir: 1, painScore: 0, completed: true },
      ],
      daysSinceLastSession: 5,
      isDeloadActive: false,
    });
    expect(result.action).toBe("maintain_load");
    expect(result.recommendedWeightKg).toBe(40);
  });

  it("reduces load when reps fall substantially below target or multiple sets are incomplete", () => {
    const result = recommendProgression({
      exercise: machineExercise,
      lastSessionSets: [
        { weightKg: 40, reps: 5, rir: 0, painScore: 0, completed: false },
        { weightKg: 40, reps: 6, rir: 0, painScore: 0, completed: false },
        { weightKg: 40, reps: 8, rir: 1, painScore: 0, completed: true },
      ],
      daysSinceLastSession: 5,
      isDeloadActive: false,
    });
    expect(result.action).toBe("reduce_load");
    expect(result.recommendedWeightKg).toBeLessThan(40);
  });

  it("applies deload rules (reduced load) when a deload is active, regardless of last performance", () => {
    const result = recommendProgression({
      exercise: machineExercise,
      lastSessionSets: [{ weightKg: 40, reps: 10, rir: 2, painScore: 0, completed: true }],
      daysSinceLastSession: 5,
      isDeloadActive: true,
    });
    expect(result.action).toBe("deload");
    expect(result.recommendedWeightKg).toBeLessThan(40);
  });
});
