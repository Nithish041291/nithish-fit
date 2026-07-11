import type { FoodAlias, FoodItem, FoodServing } from "@/lib/types";
import type { FoodIndexItem } from "./parse";

export function buildFoodIndex(items: FoodItem[], servings: FoodServing[], aliases: FoodAlias[]): FoodIndexItem[] {
  const servingsByFood = new Map<string, FoodServing[]>();
  for (const s of servings) {
    const list = servingsByFood.get(s.foodItemId) ?? [];
    list.push(s);
    servingsByFood.set(s.foodItemId, list);
  }
  const aliasesByFood = new Map<string, string[]>();
  for (const a of aliases) {
    const list = aliasesByFood.get(a.foodItemId) ?? [];
    list.push(a.alias);
    aliasesByFood.set(a.foodItemId, list);
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    aliases: aliasesByFood.get(item.id) ?? [],
    caloriesPer100g: item.caloriesPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
    fibrePer100g: item.fibrePer100g,
    servings: (servingsByFood.get(item.id) ?? []).map((s) => ({ unit: s.unit as FoodIndexItem["servings"][number]["unit"], gramsEquivalent: s.gramsEquivalent })),
  }));
}
