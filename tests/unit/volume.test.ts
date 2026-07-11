import { describe, expect, it } from "vitest";
import { calculateVolume, calculateWeeklyVolume } from "@/lib/calc/volume";

describe("calculateVolume", () => {
  it("sums weight x reps across completed sets only", () => {
    const volume = calculateVolume([
      { weightKg: 20, reps: 10, completed: true },
      { weightKg: 20, reps: 10, completed: true },
      { weightKg: 20, reps: 9, completed: true },
    ]);
    expect(volume).toBe(20 * 10 + 20 * 10 + 20 * 9);
  });

  it("excludes incomplete sets from volume", () => {
    const volume = calculateVolume([
      { weightKg: 20, reps: 10, completed: true },
      { weightKg: 20, reps: 4, completed: false },
    ]);
    expect(volume).toBe(200);
  });

  it("returns 0 for no sets", () => {
    expect(calculateVolume([])).toBe(0);
  });
});

describe("calculateWeeklyVolume", () => {
  it("sums volume across multiple sessions", () => {
    const total = calculateWeeklyVolume([
      { date: "2026-07-06", sets: [{ weightKg: 20, reps: 10, completed: true }] },
      { date: "2026-07-08", sets: [{ weightKg: 22, reps: 8, completed: true }] },
    ]);
    expect(total).toBe(200 + 176);
  });
});
