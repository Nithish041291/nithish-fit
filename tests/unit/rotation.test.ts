import { describe, expect, it } from "vitest";
import {
  buildCandidatePool,
  computeCycleIndex,
  isExerciseUsable,
  pickRotationCandidate,
  slotKey,
  stableHashIndex,
} from "@/lib/calc/rotation";
import type { Exercise } from "@/lib/types";

function makeExercise(overrides: Partial<Exercise> & Pick<Exercise, "slug" | "name">): Exercise {
  return {
    id: overrides.slug,
    primaryMuscles: ["chest"],
    secondaryMuscles: [],
    movementPattern: "horizontal_push",
    equipment: ["dumbbell"],
    isCompound: true,
    isUnilateral: false,
    loadBasis: "per_hand",
    setupInstructions: "",
    executionInstructions: "",
    breathingGuidance: "",
    commonMistakes: [],
    wristLoadCategory: "moderate",
    recommendedGrip: "neutral",
    perHandOrTotalNote: "Max 25 kg per hand.",
    safetyNote: "",
    contraindications: [],
    perHandWeightLimitKg: 25,
    suggestedRepRangeLow: 8,
    suggestedRepRangeHigh: 10,
    progressionMethod: "",
    substituteExerciseSlugs: [],
    videoUrl: null,
    isSelectableByDefault: true,
    ...overrides,
  };
}

describe("computeCycleIndex", () => {
  it("is cycle 0 for the entire first block", () => {
    expect(computeCycleIndex("2026-06-01", 5, new Date("2026-06-01T00:00:00Z"))).toBe(0);
    expect(computeCycleIndex("2026-06-01", 5, new Date("2026-07-05T00:00:00Z"))).toBe(0);
  });

  it("advances to cycle 1 once cycleWeeks have fully elapsed", () => {
    expect(computeCycleIndex("2026-06-01", 5, new Date("2026-07-07T00:00:00Z"))).toBe(1);
  });

  it("never returns a negative index for a future start date", () => {
    expect(computeCycleIndex("2099-01-01", 5, new Date("2026-07-11T00:00:00Z"))).toBe(0);
  });
});

describe("stableHashIndex", () => {
  it("is deterministic for the same seed", () => {
    const a = stableHashIndex("day-upper-a:0:1", 5);
    const b = stableHashIndex("day-upper-a:0:1", 5);
    expect(a).toBe(b);
  });

  it("stays within bounds", () => {
    for (const seed of ["a", "bb", "ccc", "day-lower-b:6:3"]) {
      const idx = stableHashIndex(seed, 4);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(4);
    }
  });
});

describe("isExerciseUsable", () => {
  it("rejects exercises not flagged selectable by default", () => {
    const ex = makeExercise({ slug: "x", name: "X", isSelectableByDefault: false });
    expect(isExerciseUsable(ex, { enabledEquipment: new Set(["dumbbell"]) })).toBe(false);
  });

  it("rejects exercises requiring equipment the user hasn't enabled", () => {
    const ex = makeExercise({ slug: "x", name: "X", equipment: ["barbell"] });
    expect(isExerciseUsable(ex, { enabledEquipment: new Set(["dumbbell"]) })).toBe(false);
  });

  it("accepts exercises whose equipment is fully covered", () => {
    const ex = makeExercise({ slug: "x", name: "X", equipment: ["dumbbell", "bench"] });
    expect(isExerciseUsable(ex, { enabledEquipment: new Set(["dumbbell", "bench", "cable_stack"]) })).toBe(true);
  });
});

describe("buildCandidatePool", () => {
  const anchor = makeExercise({
    slug: "machine-chest-press",
    name: "Machine Chest Press",
    equipment: ["chest_press_machine"],
    substituteExerciseSlugs: ["incline-dumbbell-press"],
  });
  const curated = makeExercise({
    slug: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    equipment: ["dumbbell", "bench"],
  });
  const broaderMatch = makeExercise({
    slug: "flat-dumbbell-press",
    name: "Flat Dumbbell Press",
    equipment: ["dumbbell", "bench"],
  });
  const wrongPattern = makeExercise({
    slug: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    movementPattern: "isolation_flexion",
    primaryMuscles: ["shoulders"],
    equipment: ["cable_stack"],
  });
  const noEquipment = makeExercise({
    slug: "barbell-bench-press",
    name: "Barbell Bench Press",
    equipment: ["barbell", "bench"],
  });
  const allExercises = [anchor, curated, broaderMatch, wrongPattern, noEquipment];
  const ctx = { enabledEquipment: new Set(["dumbbell", "bench", "chest_press_machine"]) };

  it("includes curated substitutes and same muscle/pattern matches, excludes unusable ones", () => {
    const pool = buildCandidatePool({ anchor, allExercises, recentSlugs: new Set(), ctx });
    const slugs = pool.map((e) => e.slug).sort();
    expect(slugs).toEqual(["flat-dumbbell-press", "incline-dumbbell-press"]);
  });

  it("excludes recently-used slugs when alternatives remain", () => {
    const pool = buildCandidatePool({ anchor, allExercises, recentSlugs: new Set(["incline-dumbbell-press"]), ctx });
    expect(pool.map((e) => e.slug)).toEqual(["flat-dumbbell-press"]);
  });

  it("falls back to the full usable pool when everything was recently used", () => {
    const pool = buildCandidatePool({
      anchor,
      allExercises,
      recentSlugs: new Set(["incline-dumbbell-press", "flat-dumbbell-press"]),
      ctx,
    });
    expect(pool.map((e) => e.slug).sort()).toEqual(["flat-dumbbell-press", "incline-dumbbell-press"]);
  });
});

describe("pickRotationCandidate", () => {
  it("returns null for an empty pool", () => {
    expect(pickRotationCandidate([], "seed")).toBeNull();
  });

  it("deterministically picks the same exercise for the same seed", () => {
    const pool = [makeExercise({ slug: "a", name: "A" }), makeExercise({ slug: "b", name: "B" }), makeExercise({ slug: "c", name: "C" })];
    const first = pickRotationCandidate(pool, "slot:2");
    const second = pickRotationCandidate(pool, "slot:2");
    expect(first?.slug).toBe(second?.slug);
  });
});

describe("slotKey", () => {
  it("combines workout day id and order index", () => {
    expect(slotKey("day-upper-a", 2)).toBe("day-upper-a:2");
  });
});
