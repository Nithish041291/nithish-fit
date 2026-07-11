import { generateId } from "@/lib/calc/id";
import { computeNutrientsForGrams, type FoodIndexItem } from "@/lib/food-parser/parse";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { FoodLog } from "@/lib/types";
import { foodItemSeed } from "./foods";

const foodBySlug = new Map(foodItemSeed.map((f) => [f.slug, f]));

function toIndexItem(slug: string): FoodIndexItem {
  const f = foodBySlug.get(slug);
  if (!f) throw new Error(`Seed food log references unknown slug: ${slug}`);
  return {
    id: f.id,
    name: f.name,
    aliases: [],
    caloriesPer100g: f.caloriesPer100g,
    proteinPer100g: f.proteinPer100g,
    carbsPer100g: f.carbsPer100g,
    fatPer100g: f.fatPer100g,
    fibrePer100g: f.fibrePer100g,
    servings: [],
  };
}

interface LogSpec {
  daysAgo: number;
  mealSlot: FoodLog["mealSlot"];
  rawText: string;
  slug: string;
  grams: number;
}

const LOG_SPECS: LogSpec[] = [
  { daysAgo: 1, mealSlot: "breakfast", rawText: "3 eggs bhurji with 2 rotis", slug: "egg-bhurji", grams: 165 },
  { daysAgo: 1, mealSlot: "breakfast", rawText: "2 rotis", slug: "roti-whole-wheat", grams: 80 },
  { daysAgo: 1, mealSlot: "lunch", rawText: "150 g grilled chicken, 1 katori dal and 1 cup rice", slug: "chicken-curry-home-style", grams: 200 },
  { daysAgo: 1, mealSlot: "lunch", rawText: "1 katori dal", slug: "toor-dal-cooked", grams: 150 },
  { daysAgo: 1, mealSlot: "lunch", rawText: "1 cup rice", slug: "rice-white-cooked", grams: 200 },
  { daysAgo: 1, mealSlot: "post_workout", rawText: "One banana and one scoop whey", slug: "whey-protein-generic", grams: 30 },
  { daysAgo: 1, mealSlot: "post_workout", rawText: "one banana", slug: "banana", grams: 120 },
  { daysAgo: 1, mealSlot: "dinner", rawText: "200 g fish curry with 2 chapati", slug: "fish-curry-rohu", grams: 200 },
  { daysAgo: 1, mealSlot: "dinner", rawText: "2 chapati", slug: "chapati-plain", grams: 80 },

  { daysAgo: 2, mealSlot: "breakfast", rawText: "2 idli with sambar", slug: "idli", grams: 70 },
  { daysAgo: 2, mealSlot: "breakfast", rawText: "sambar", slug: "sambar", grams: 150 },
  { daysAgo: 2, mealSlot: "lunch", rawText: "1 cup chicken biryani and 100 g raita", slug: "biryani-chicken", grams: 300 },
  { daysAgo: 2, mealSlot: "lunch", rawText: "100 g raita", slug: "raita", grams: 100 },
  { daysAgo: 2, mealSlot: "dinner", rawText: "paneer curry with a roti", slug: "paneer-curry", grams: 200 },
  { daysAgo: 2, mealSlot: "dinner", rawText: "1 roti", slug: "roti-whole-wheat", grams: 40 },

  { daysAgo: 3, mealSlot: "breakfast", rawText: "oats with banana", slug: "oats-cooked-plain", grams: 250 },
  { daysAgo: 3, mealSlot: "breakfast", rawText: "banana", slug: "banana", grams: 120 },
  { daysAgo: 3, mealSlot: "lunch", rawText: "rice, rajma and cabbage sabzi", slug: "rice-white-cooked", grams: 200 },
  { daysAgo: 3, mealSlot: "lunch", rawText: "rajma curry", slug: "rajma-curry", grams: 150 },
  { daysAgo: 3, mealSlot: "post_workout", rawText: "one scoop whey", slug: "whey-protein-generic", grams: 30 },
  { daysAgo: 3, mealSlot: "dinner", rawText: "tandoori chicken with mixed vegetable curry", slug: "chicken-tandoori", grams: 200 },
  { daysAgo: 3, mealSlot: "dinner", rawText: "mixed vegetable curry", slug: "mixed-vegetable-curry", grams: 150 },

  { daysAgo: 4, mealSlot: "breakfast", rawText: "2 dosa with coconut chutney", slug: "dosa-plain", grams: 120 },
  { daysAgo: 4, mealSlot: "breakfast", rawText: "coconut chutney", slug: "coconut-chutney", grams: 40 },
  { daysAgo: 4, mealSlot: "lunch", rawText: "rice, sambar and bhindi fry", slug: "rice-white-cooked", grams: 200 },
  { daysAgo: 4, mealSlot: "lunch", rawText: "bhindi fry", slug: "bhindi-fry", grams: 100 },
  { daysAgo: 4, mealSlot: "dinner", rawText: "egg curry with chapati", slug: "egg-curry", grams: 200 },
  { daysAgo: 4, mealSlot: "dinner", rawText: "chapati", slug: "chapati-plain", grams: 80 },

  { daysAgo: 5, mealSlot: "breakfast", rawText: "poha", slug: "poha", grams: 200 },
  { daysAgo: 5, mealSlot: "lunch", rawText: "rice, chole and curd", slug: "rice-white-cooked", grams: 180 },
  { daysAgo: 5, mealSlot: "lunch", rawText: "chole curry", slug: "chole-curry", grams: 150 },
  { daysAgo: 5, mealSlot: "lunch", rawText: "curd", slug: "curd-plain", grams: 100 },
  { daysAgo: 5, mealSlot: "dinner", rawText: "grilled fish with sauteed vegetables", slug: "fish-grilled", grams: 200 },

  { daysAgo: 6, mealSlot: "breakfast", rawText: "upma", slug: "upma", grams: 200 },
  { daysAgo: 6, mealSlot: "lunch", rawText: "brown rice, chicken curry and palak paneer", slug: "rice-brown-cooked", grams: 180 },
  { daysAgo: 6, mealSlot: "lunch", rawText: "chicken curry", slug: "chicken-curry-home-style", grams: 200 },
  { daysAgo: 6, mealSlot: "dinner", rawText: "mutton curry with roti", slug: "mutton-curry", grams: 180 },
  { daysAgo: 6, mealSlot: "dinner", rawText: "roti", slug: "roti-whole-wheat", grams: 80 },
];

export function buildFoodLogSeed(referenceDate: Date = new Date()): FoodLog[] {
  return LOG_SPECS.map((spec) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - spec.daysAgo);
    const dateIso = date.toISOString().slice(0, 10);
    const food = toIndexItem(spec.slug);
    const nutrients = computeNutrientsForGrams(spec.grams, food);
    return {
      id: generateId(),
      userId: DEMO_USER_ID,
      date: dateIso,
      loggedAt: date.toISOString(),
      rawText: spec.rawText,
      foodItemId: food.id,
      recipeId: null,
      customName: null,
      quantityGrams: spec.grams,
      unit: "gram",
      unitQuantity: spec.grams,
      mealSlot: spec.mealSlot,
      calories: nutrients.calories,
      proteinG: nutrients.proteinG,
      carbsG: nutrients.carbsG,
      fatG: nutrients.fatG,
      fibreG: nutrients.fibreG,
      confidence: "high",
      source: "seed",
      wasEdited: false,
      createdAt: date.toISOString(),
    } satisfies FoodLog;
  });
}
