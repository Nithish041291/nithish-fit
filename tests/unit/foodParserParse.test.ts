import { describe, expect, it } from "vitest";
import { parseFoodLogText, type FoodIndexItem } from "@/lib/food-parser/parse";

const foodIndex: FoodIndexItem[] = [
  {
    id: "egg_bhurji",
    name: "Egg bhurji",
    aliases: ["eggs bhurji", "anda bhurji", "egg burji"],
    caloriesPer100g: 172,
    proteinPer100g: 12,
    carbsPer100g: 3,
    fatPer100g: 13,
    fibrePer100g: 0.5,
    servings: [{ unit: "piece", gramsEquivalent: 55 }],
  },
  {
    id: "roti",
    name: "Roti (whole wheat)",
    aliases: ["chapati", "phulka", "rotis"],
    caloriesPer100g: 297,
    proteinPer100g: 11,
    carbsPer100g: 58,
    fatPer100g: 4,
    fibrePer100g: 10,
    servings: [{ unit: "roti", gramsEquivalent: 40 }],
  },
  {
    id: "chicken_biryani",
    name: "Chicken biryani",
    aliases: [],
    caloriesPer100g: 165,
    proteinPer100g: 8,
    carbsPer100g: 18,
    fatPer100g: 6.5,
    fibrePer100g: 1.2,
    servings: [{ unit: "cup", gramsEquivalent: 200 }],
  },
  {
    id: "raita",
    name: "Raita",
    aliases: [],
    caloriesPer100g: 60,
    proteinPer100g: 3,
    carbsPer100g: 4,
    fatPer100g: 3,
    fibrePer100g: 0.3,
    servings: [],
  },
];

describe("parseFoodLogText", () => {
  it("parses '3 eggs bhurji with 2 rotis' into two matched entries with nutrients", () => {
    const entries = parseFoodLogText("3 eggs bhurji with 2 rotis", foodIndex);
    expect(entries).toHaveLength(2);

    const [eggs, rotis] = entries;
    expect(eggs.bestMatch?.id).toBe("egg_bhurji");
    expect(eggs.gramsEquivalent).toBe(3 * 55);
    expect(eggs.nutrients?.calories).toBe(Math.round(172 * (165 / 100)));

    expect(rotis.bestMatch?.id).toBe("roti");
    expect(rotis.gramsEquivalent).toBe(80);
    expect(rotis.nutrients?.calories).toBe(Math.round(297 * 0.8));
  });

  it("parses '1 cup chicken biryani and 100 g raita'", () => {
    const entries = parseFoodLogText("1 cup chicken biryani and 100 g raita", foodIndex);
    expect(entries[0].bestMatch?.id).toBe("chicken_biryani");
    expect(entries[0].gramsEquivalent).toBe(200);
    expect(entries[1].bestMatch?.id).toBe("raita");
    expect(entries[1].gramsEquivalent).toBe(100);
    expect(entries[1].nutrients?.calories).toBe(60);
  });

  it("never fabricates nutrients for an unmatched food", () => {
    const entries = parseFoodLogText("500 g unobtainium powder", foodIndex);
    expect(entries[0].confidence).toBe("unmatched");
    expect(entries[0].nutrients).toBeNull();
    expect(entries[0].bestMatch).toBeNull();
  });

  it("surfaces low-confidence matches as candidates rather than auto-selecting", () => {
    const entries = parseFoodLogText("egg burji", foodIndex);
    expect(entries[0].matches.length).toBeGreaterThan(0);
  });
});
