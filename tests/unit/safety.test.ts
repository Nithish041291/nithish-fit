import { describe, expect, it } from "vitest";
import { applySafetyCap, evaluatePain, GOBLET_SUMO_TOTAL_MAX_KG, RIGHT_HAND_MAX_LOAD_KG } from "@/lib/calc/safety";

describe("applySafetyCap", () => {
  it("caps per-hand dumbbell weight at 25kg for the right hand", () => {
    const result = applySafetyCap({ loadBasis: "per_hand", proposedWeightKg: 28, involvesRightHand: true });
    expect(result.allowedWeightKg).toBe(RIGHT_HAND_MAX_LOAD_KG);
    expect(result.wasCapped).toBe(true);
  });

  it("does not cap the left hand alone below 25kg (only right-hand exercises are restricted)", () => {
    const result = applySafetyCap({ loadBasis: "per_hand", proposedWeightKg: 28, involvesRightHand: false });
    expect(result.allowedWeightKg).toBe(28);
    expect(result.wasCapped).toBe(false);
  });

  it("caps total weight for goblet/sumo squat style holds at 25kg", () => {
    const result = applySafetyCap({ loadBasis: "total", proposedWeightKg: 30, involvesRightHand: true });
    expect(result.allowedWeightKg).toBe(GOBLET_SUMO_TOTAL_MAX_KG);
    expect(result.wasCapped).toBe(true);
  });

  it("passes through weight under the cap unchanged", () => {
    const result = applySafetyCap({ loadBasis: "per_hand", proposedWeightKg: 20, involvesRightHand: true });
    expect(result.allowedWeightKg).toBe(20);
    expect(result.wasCapped).toBe(false);
  });

  it("never allows more than 25kg regardless of how large the proposal is", () => {
    const result = applySafetyCap({ loadBasis: "per_hand", proposedWeightKg: 999, involvesRightHand: true });
    expect(result.allowedWeightKg).toBeLessThanOrEqual(RIGHT_HAND_MAX_LOAD_KG);
  });
});

describe("evaluatePain", () => {
  it("proceeds normally below 4/10", () => {
    expect(evaluatePain(0)).toBe("proceed");
    expect(evaluatePain(3)).toBe("proceed");
  });
  it("warns and suggests a substitute at 4-6", () => {
    expect(evaluatePain(4)).toBe("warn_substitute");
    expect(evaluatePain(6)).toBe("warn_substitute");
  });
  it("stops the session recommendation at 7+", () => {
    expect(evaluatePain(7)).toBe("stop_medical_review");
    expect(evaluatePain(10)).toBe("stop_medical_review");
  });
});
