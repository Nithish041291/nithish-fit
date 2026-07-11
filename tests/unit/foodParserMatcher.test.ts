import { describe, expect, it } from "vitest";
import { confidenceFromScore, matchFoodQuery } from "@/lib/food-parser/matcher";

const candidates = [
  { id: "roti", name: "Roti (whole wheat)", aliases: ["chapati", "phulka", "roti"] },
  { id: "curd", name: "Curd", aliases: ["yogurt", "dahi", "yoghurt"] },
  { id: "brinjal", name: "Brinjal curry", aliases: ["eggplant curry", "baingan curry"] },
  { id: "bhindi", name: "Bhindi fry", aliases: ["okra fry", "ladyfinger fry"] },
  { id: "chicken_curry", name: "Chicken curry", aliases: ["chicken gravy"] },
  { id: "peanut", name: "Groundnut", aliases: ["peanut"] },
  { id: "rice_plain", name: "Rice, white, cooked", aliases: [] },
  { id: "curd_rice", name: "Curd rice", aliases: [] },
  { id: "lemon_rice", name: "Lemon rice", aliases: [] },
];

describe("matchFoodQuery", () => {
  it("matches exact alias names highly (roti/chapati/phulka)", () => {
    const result = matchFoodQuery("chapati", candidates);
    expect(result[0].id).toBe("roti");
    expect(result[0].score).toBeGreaterThan(0.85);
  });

  it("matches curd/yogurt/dahi regional aliases", () => {
    expect(matchFoodQuery("dahi", candidates)[0].id).toBe("curd");
    expect(matchFoodQuery("yogurt", candidates)[0].id).toBe("curd");
  });

  it("matches brinjal/eggplant naming variation", () => {
    expect(matchFoodQuery("eggplant curry", candidates)[0].id).toBe("brinjal");
  });

  it("matches bhindi/okra/ladyfinger naming variation", () => {
    expect(matchFoodQuery("okra fry", candidates)[0].id).toBe("bhindi");
    expect(matchFoodQuery("ladyfinger fry", candidates)[0].id).toBe("bhindi");
  });

  it("matches groundnut/peanut naming variation", () => {
    expect(matchFoodQuery("peanut", candidates)[0].id).toBe("peanut");
  });

  it("ranks a close but imperfect match as medium/low confidence rather than high", () => {
    const results = matchFoodQuery("chiken curi", candidates); // deliberately misspelled
    expect(results[0].id).toBe("chicken_curry");
    expect(confidenceFromScore(results[0].score)).not.toBe("high");
  });

  it("returns multiple candidates for an ambiguous query, not just one", () => {
    const results = matchFoodQuery("curry", candidates);
    expect(results.length).toBeGreaterThan(1);
  });

  it("prefers a plain match over a longer dish that merely contains the word (rice vs curd rice)", () => {
    const results = matchFoodQuery("rice", candidates);
    expect(results[0].id).toBe("rice_plain");
  });

  it("does not confidently match a completely unrelated query", () => {
    const results = matchFoodQuery("xyzzy quantum widget", candidates);
    const best = results[0];
    if (best) {
      expect(confidenceFromScore(best.score)).toBe("low");
    }
  });
});
