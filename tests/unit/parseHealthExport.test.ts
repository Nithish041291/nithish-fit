import { describe, expect, it } from "vitest";
import { summarizeDailyEnergy, type HealthExportPayload } from "@/lib/health/parseHealthExport";

describe("summarizeDailyEnergy", () => {
  it("sums hourly active-energy samples into a single daily total", () => {
    const payload: HealthExportPayload = {
      data: {
        metrics: [
          {
            name: "active_energy",
            units: "kcal",
            data: [
              { date: "2026-07-11 08:00:00 +0000", qty: 45.2 },
              { date: "2026-07-11 12:00:00 +0000", qty: 120.7 },
              { date: "2026-07-11 18:30:00 +0000", qty: 30.1 },
            ],
          },
        ],
      },
    };
    const result = summarizeDailyEnergy(payload);
    expect(result).toEqual([{ date: "2026-07-11", activeEnergyKcal: 196, restingEnergyKcal: null }]);
  });

  it("merges active and resting energy for the same day", () => {
    const payload: HealthExportPayload = {
      data: {
        metrics: [
          { name: "active_energy", data: [{ date: "2026-07-11", qty: 300 }] },
          { name: "basal_energy_burned", data: [{ date: "2026-07-11", qty: 1650.4 }] },
        ],
      },
    };
    const result = summarizeDailyEnergy(payload);
    expect(result).toEqual([{ date: "2026-07-11", activeEnergyKcal: 300, restingEnergyKcal: 1650 }]);
  });

  it("splits samples across multiple days and sorts by date", () => {
    const payload: HealthExportPayload = {
      data: {
        metrics: [
          {
            name: "active_energy",
            data: [
              { date: "2026-07-12 09:00:00 +0000", qty: 100 },
              { date: "2026-07-10 09:00:00 +0000", qty: 200 },
              { date: "2026-07-11 09:00:00 +0000", qty: 150 },
            ],
          },
        ],
      },
    };
    const result = summarizeDailyEnergy(payload);
    expect(result.map((r) => r.date)).toEqual(["2026-07-10", "2026-07-11", "2026-07-12"]);
  });

  it("returns an empty array for a payload with no recognised metrics", () => {
    expect(summarizeDailyEnergy({ data: { metrics: [{ name: "step_count", data: [{ date: "2026-07-11", qty: 8000 }] }] } })).toEqual([]);
    expect(summarizeDailyEnergy({})).toEqual([]);
  });

  it("ignores malformed samples instead of throwing", () => {
    const payload = {
      data: {
        metrics: [
          {
            name: "active_energy",
            data: [
              { date: "2026-07-11", qty: 50 },
              { date: "2026-07-11", qty: Number.NaN },
              { date: 12345, qty: 10 },
              { qty: 10 },
            ],
          },
        ],
      },
    } as unknown as HealthExportPayload;
    expect(summarizeDailyEnergy(payload)).toEqual([{ date: "2026-07-11", activeEnergyKcal: 50, restingEnergyKcal: null }]);
  });
});
