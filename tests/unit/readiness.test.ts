import { describe, expect, it } from "vitest";
import { evaluateReadiness } from "@/lib/calc/readiness";

describe("evaluateReadiness", () => {
  it("proceeds normally when all signals are good", () => {
    const result = evaluateReadiness({ sleepHours: 7.5, energyLevel: 4, muscleSoreness: 2, wristPain: 0, stressLevel: 2 });
    expect(result.recommendation).toBe("proceed_normally");
  });

  it("does not overreact to a single low signal", () => {
    const result = evaluateReadiness({ sleepHours: 7.5, energyLevel: 1, muscleSoreness: 2, wristPain: 0, stressLevel: 2 });
    expect(result.recommendation).toBe("keep_same_load");
  });

  it("suggests dropping a set when two signals are low", () => {
    const result = evaluateReadiness({ sleepHours: 4.5, energyLevel: 1, muscleSoreness: 2, wristPain: 0, stressLevel: 2 });
    expect(result.recommendation).toBe("reduce_one_set_per_exercise");
  });

  it("suggests a recovery session when three or more signals are low", () => {
    const result = evaluateReadiness({ sleepHours: 4, energyLevel: 1, muscleSoreness: 5, wristPain: 0, stressLevel: 5 });
    expect(result.recommendation).toBe("recovery_session");
  });

  it("reduces load when wrist pain is 4-6", () => {
    const result = evaluateReadiness({ sleepHours: 7, energyLevel: 4, muscleSoreness: 2, wristPain: 5, stressLevel: 2 });
    expect(result.recommendation).toBe("reduce_load_5_10_percent");
  });

  it("recommends stopping and seeking medical review when wrist pain is 7+", () => {
    const result = evaluateReadiness({ sleepHours: 7, energyLevel: 4, muscleSoreness: 2, wristPain: 7, stressLevel: 2 });
    expect(result.recommendation).toBe("stop_medical_review");
  });
});
