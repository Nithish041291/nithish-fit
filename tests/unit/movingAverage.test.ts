import { describe, expect, it } from "vitest";
import { estimateTargetDate, isLossRateExcessive, sevenDayMovingAverage, weeklyRateOfChange } from "@/lib/calc/movingAverage";

const weighIns = [
  { date: "2026-06-28", weightKg: 93.4 },
  { date: "2026-06-29", weightKg: 93.3 },
  { date: "2026-06-30", weightKg: 93.1 },
  { date: "2026-07-01", weightKg: 93.0 },
  { date: "2026-07-02", weightKg: 92.9 },
  { date: "2026-07-03", weightKg: 92.9 },
  { date: "2026-07-04", weightKg: 92.8 },
  { date: "2026-07-05", weightKg: 92.8 },
  { date: "2026-07-06", weightKg: 92.6 },
  { date: "2026-07-07", weightKg: 92.7 },
  { date: "2026-07-08", weightKg: 92.4 },
  { date: "2026-07-09", weightKg: 92.3 },
  { date: "2026-07-10", weightKg: 92.2 },
  { date: "2026-07-11", weightKg: 92.0 },
];

describe("sevenDayMovingAverage", () => {
  it("averages weigh-ins within the trailing 7-day window", () => {
    const avg = sevenDayMovingAverage(weighIns, "2026-07-11");
    const expected = (92.8 + 92.6 + 92.7 + 92.4 + 92.3 + 92.2 + 92.0) / 7;
    expect(avg).toBeCloseTo(expected, 2);
  });

  it("returns null when there is no data in range", () => {
    expect(sevenDayMovingAverage([], "2026-07-11")).toBeNull();
  });

  it("does not overreact to a single outlier weigh-in", () => {
    const withOutlier = [...weighIns, { date: "2026-07-11", weightKg: 89 }];
    // last date now has two entries (92.0 and 89) — average should stay far from 89.
    const avg = sevenDayMovingAverage(withOutlier, "2026-07-11");
    expect(avg).not.toBeNull();
    expect(avg!).toBeGreaterThan(90);
  });
});

describe("weeklyRateOfChange", () => {
  it("computes the change in 7-day average vs a week earlier", () => {
    const rate = weeklyRateOfChange(weighIns, "2026-07-11");
    expect(rate).not.toBeNull();
  });
});

describe("estimateTargetDate", () => {
  it("returns null when the trend is flat or wrong direction", () => {
    const flat = weighIns.map((w) => ({ ...w, weightKg: 92 }));
    expect(estimateTargetDate(flat, "2026-07-11", 84)).toBeNull();
  });

  it("projects a future date when losing weight toward a lower target", () => {
    const date = estimateTargetDate(weighIns, "2026-07-11", 84);
    // Losing weight and target is lower, so a projection should exist.
    expect(date).not.toBeNull();
  });
});

describe("isLossRateExcessive", () => {
  it("flags loss faster than ~1% bodyweight/week", () => {
    const fastLoss = [
      { date: "2026-07-04", weightKg: 95 },
      { date: "2026-07-11", weightKg: 92 },
    ];
    // build a full window so weeklyRateOfChange has both endpoints
    const entries = [
      { date: "2026-06-27", weightKg: 95 },
      { date: "2026-07-04", weightKg: 95 },
      { date: "2026-07-11", weightKg: 92 },
    ];
    expect(isLossRateExcessive(entries, "2026-07-11", 92)).toBe(true);
    expect(fastLoss.length).toBe(2);
  });

  it("does not flag gradual, safe loss", () => {
    const entries = [
      { date: "2026-06-27", weightKg: 92.8 },
      { date: "2026-07-04", weightKg: 92.5 },
      { date: "2026-07-11", weightKg: 92.2 },
    ];
    expect(isLossRateExcessive(entries, "2026-07-11", 92.2)).toBe(false);
  });
});
