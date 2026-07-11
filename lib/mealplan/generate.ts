import { generateId } from "@/lib/calc/id";
import type { MealPlan, MealPlanDay, MealPlanPreference, MealSlot, PlannedMeal } from "@/lib/types/mealplan";
import { mealTemplates, type MealTemplate } from "./templates";

export interface FoodIndexItem {
  id: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibrePer100g: number;
}

export interface GenerateMealPlanParams {
  userId: string;
  startDate: string; // YYYY-MM-DD
  preferences: MealPlanPreference;
  targetCalories: number;
  targetProteinG: number;
  targetFatG: number;
  targetFibreG: number;
  foodIndex: Record<string, FoodIndexItem>;
}

export interface GenerateMealPlanResult {
  mealPlan: MealPlan;
  days: MealPlanDay[];
  meals: PlannedMeal[];
}

/** Ordered slot list used to build a day; a subset is chosen per day (6-7 of 8). */
const ALL_SLOTS: MealSlot[] = [
  "early_morning",
  "breakfast",
  "mid_morning",
  "lunch",
  "pre_workout",
  "post_workout",
  "dinner",
  "before_bed",
];

/** Slots that are always included when building a day (core structure). */
const CORE_SLOTS: MealSlot[] = ["breakfast", "lunch", "pre_workout", "post_workout", "dinner"];

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function templateConflictsWithPreferences(template: MealTemplate, preferences: MealPlanPreference): boolean {
  if (preferences.eggPreference === "exclude" && template.tags.hasEgg) return true;
  if (preferences.chickenPreference === "exclude" && template.tags.hasChicken) return true;
  if (preferences.fishPreference === "exclude" && template.tags.hasFish) return true;
  if (preferences.muttonPreference === "exclude" && template.tags.hasMutton) return true;
  if (preferences.dairyPreference === "exclude" && template.tags.hasDairy) return true;
  return false;
}

function templateMatchesStyle(template: MealTemplate, style: "north_indian" | "south_indian"): boolean {
  return template.style === style || template.style === "mixed_indian";
}

function computeMealTotals(template: MealTemplate, foodIndex: Record<string, FoodIndexItem>) {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fibreG = 0;
  const items: PlannedMeal["items"] = [];

  for (const item of template.items) {
    const food = foodIndex[item.foodSlug];
    if (!food) {
      // Skip items whose slug isn't in the food index rather than crashing.
      continue;
    }
    const factor = item.grams / 100;
    calories += food.caloriesPer100g * factor;
    proteinG += food.proteinPer100g * factor;
    carbsG += food.carbsPer100g * factor;
    fatG += food.fatPer100g * factor;
    fibreG += food.fibrePer100g * factor;

    items.push({
      foodItemId: item.foodSlug,
      recipeId: null,
      name: titleCase(item.foodSlug),
      quantityGrams: item.grams,
      displayQuantity: item.displayQuantity,
    });
  }

  return {
    items,
    calories: Math.round(calories),
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    fibreG: Math.round(fibreG * 10) / 10,
  };
}

/** Picks vegetarian day indices (0-6) spread across the week, avoiding consecutive days where possible. */
function pickVegetarianDayIndices(count: number): Set<number> {
  const result = new Set<number>();
  if (count <= 0) return result;
  if (count >= 7) {
    for (let i = 0; i < 7; i++) result.add(i);
    return result;
  }
  // Spread evenly across 7 days using a stride, then nudge to avoid adjacency.
  const stride = 7 / count;
  const candidates: number[] = [];
  for (let i = 0; i < count; i++) {
    candidates.push(Math.round(i * stride) % 7);
  }
  // De-duplicate and resolve collisions by shifting forward to the next free day.
  for (const c of candidates) {
    let day = c;
    let attempts = 0;
    while (result.has(day) && attempts < 7) {
      day = (day + 1) % 7;
      attempts++;
    }
    result.add(day);
  }
  // Best-effort de-clump: if two chosen days are adjacent and a non-adjacent free day exists, swap.
  const sorted = Array.from(result).sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      for (let candidate = 0; candidate < 7; candidate++) {
        if (result.has(candidate)) continue;
        const prevOk = !result.has(candidate - 1) && !result.has(candidate + 1);
        if (prevOk) {
          result.delete(sorted[i]);
          result.add(candidate);
          break;
        }
      }
    }
  }
  return result;
}

function pickTemplateForSlot(params: {
  slot: MealSlot;
  dayStyle: "north_indian" | "south_indian";
  isVegetarianDay: boolean;
  preferences: MealPlanPreference;
  lastUsedBySlot: Map<MealSlot, string>;
}): MealTemplate | null {
  const { slot, dayStyle, isVegetarianDay, preferences, lastUsedBySlot } = params;

  let candidates = mealTemplates.filter(
    (t) => t.slot === slot && templateMatchesStyle(t, dayStyle) && !templateConflictsWithPreferences(t, preferences)
  );

  if (isVegetarianDay) {
    candidates = candidates.filter((t) => t.tags.vegetarian);
  }

  if (candidates.length === 0) {
    // Relax style filter if nothing matches (still respect vegetarian/preference filters).
    candidates = mealTemplates.filter((t) => t.slot === slot && !templateConflictsWithPreferences(t, preferences));
    if (isVegetarianDay) {
      candidates = candidates.filter((t) => t.tags.vegetarian);
    }
  }

  if (candidates.length === 0) return null;

  const lastUsed = lastUsedBySlot.get(slot);
  const nonRepeat = candidates.filter((t) => t.id !== lastUsed);
  const pool = nonRepeat.length > 0 ? nonRepeat : candidates;

  // Deterministic-ish rotation: pick based on a simple hash of slot+lastUsed to vary selection.
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function generateMealPlan(params: GenerateMealPlanParams): GenerateMealPlanResult {
  const { userId, startDate, preferences, targetCalories, targetProteinG, targetFatG, targetFibreG, foodIndex } =
    params;

  const mealPlanId = generateId();
  const now = new Date().toISOString();

  const vegetarianDayIndices = pickVegetarianDayIndices(preferences.vegetarianDaysPerWeek);

  const days: MealPlanDay[] = [];
  const meals: PlannedMeal[] = [];

  const lastUsedBySlot: Map<MealSlot, string> = new Map();

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const isVegetarianDay = vegetarianDayIndices.has(dayIndex);

    // Determine the day's cuisine style.
    let dayStyle: "north_indian" | "south_indian";
    if (preferences.style === "north_indian") {
      dayStyle = "north_indian";
    } else if (preferences.style === "south_indian") {
      dayStyle = "south_indian";
    } else {
      // mixed_indian: alternate north/south day to day for variety.
      dayStyle = dayIndex % 2 === 0 ? "north_indian" : "south_indian";
    }

    // Build the slot list for this day: core slots always, optional slots rotated in.
    const slotsForDay: MealSlot[] = [...CORE_SLOTS];
    // Rotate which optional slots are included so days don't feel identical.
    // Include early_morning most days, and alternate mid_morning/before_bed.
    slotsForDay.push("early_morning");
    if (dayIndex % 2 === 0) {
      slotsForDay.push("mid_morning");
    } else {
      slotsForDay.push("before_bed");
    }
    // Preserve canonical slot ordering.
    const orderedSlots = ALL_SLOTS.filter((s) => slotsForDay.includes(s));

    const dayId = generateId();
    const date = addDays(startDate, dayIndex);

    days.push({
      id: dayId,
      mealPlanId,
      dayIndex,
      date,
      isVegetarianDay,
    });

    type Attempt = { slot: MealSlot; template: MealTemplate };
    const dayMeals: Attempt[] = [];

    // Initial selection pass.
    for (const slot of orderedSlots) {
      const template = pickTemplateForSlot({ slot, dayStyle, isVegetarianDay, preferences, lastUsedBySlot });
      if (template) {
        dayMeals.push({ slot, template });
      }
    }

    // Try repeatedly to nudge the day's totals within +/-15% of targetCalories
    // and avoid drastically undershooting targetProteinG. Each attempt swaps
    // whichever single meal most reduces the remaining gap to target.
    const maxAttempts = 12;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let dayCalories = 0;
      let dayProtein = 0;
      for (const m of dayMeals) {
        const totals = computeMealTotals(m.template, foodIndex);
        dayCalories += totals.calories;
        dayProtein += totals.proteinG;
      }

      const lowerBound = targetCalories * 0.85;
      const upperBound = targetCalories * 1.15;
      const proteinFloor = targetProteinG * 0.7;

      const withinCalories = dayCalories >= lowerBound && dayCalories <= upperBound;
      const proteinOk = dayProtein >= proteinFloor;

      if (withinCalories && proteinOk) break;

      // If under target, we want a swap that raises calories (and ideally protein)
      // as close as possible to closing the gap without wildly overshooting.
      // If over target, we want a swap that lowers calories similarly.
      const wantHigher = dayCalories < lowerBound || !proteinOk;
      const calorieGap = wantHigher ? lowerBound - dayCalories : dayCalories - upperBound;

      let bestSwapIndex = -1;
      let bestSwapTemplate: MealTemplate | null = null;
      let bestDelta = -Infinity;

      for (let i = 0; i < dayMeals.length; i++) {
        const { slot } = dayMeals[i];
        const currentTotals = computeMealTotals(dayMeals[i].template, foodIndex);
        const alternatives = mealTemplates.filter(
          (t) =>
            t.slot === slot &&
            templateMatchesStyle(t, dayStyle) &&
            !templateConflictsWithPreferences(t, preferences) &&
            (!isVegetarianDay || t.tags.vegetarian) &&
            t.id !== dayMeals[i].template.id
        );
        for (const alt of alternatives) {
          const altTotals = computeMealTotals(alt, foodIndex);
          const calorieDiff = altTotals.calories - currentTotals.calories;
          const proteinDiff = altTotals.proteinG - currentTotals.proteinG;

          // Score: how much this swap moves calories in the desired direction,
          // penalized if it overshoots the gap by a lot (avoid huge single-slot jumps),
          // with a small bonus for also helping protein when protein is a concern.
          const directionalCalorieMove = wantHigher ? calorieDiff : -calorieDiff;
          if (directionalCalorieMove <= 0) continue;
          const overshootPenalty = Math.max(0, directionalCalorieMove - calorieGap) * 0.5;
          const proteinBonus = !proteinOk ? proteinDiff * 2 : 0;
          const delta = directionalCalorieMove - overshootPenalty + proteinBonus;

          if (delta > bestDelta) {
            bestDelta = delta;
            bestSwapIndex = i;
            bestSwapTemplate = alt;
          }
        }
      }

      if (bestSwapIndex >= 0 && bestSwapTemplate) {
        dayMeals[bestSwapIndex] = { slot: dayMeals[bestSwapIndex].slot, template: bestSwapTemplate };
      } else {
        // No better swap available; accept the closest result we have.
        break;
      }
    }

    // Finalize meals for this day, updating lastUsedBySlot and pushing PlannedMeal rows.
    for (const { slot, template } of dayMeals) {
      lastUsedBySlot.set(slot, template.id);

      const totals = computeMealTotals(template, foodIndex);

      const swapOptions = mealTemplates
        .filter(
          (t) =>
            t.slot === slot &&
            t.id !== template.id &&
            templateMatchesStyle(t, dayStyle) &&
            !templateConflictsWithPreferences(t, preferences) &&
            (!isVegetarianDay || t.tags.vegetarian)
        )
        .slice(0, 2)
        .map((t) => t.title);

      meals.push({
        id: generateId(),
        mealPlanDayId: dayId,
        slot,
        title: template.title,
        items: totals.items,
        calories: totals.calories,
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
        fibreG: totals.fibreG,
        preparationGuidance: template.preparationGuidance,
        swapOptions,
      });
    }
  }

  const mealPlan: MealPlan = {
    id: mealPlanId,
    userId,
    name: `7-day plan starting ${startDate}`,
    startDate,
    preferences,
    targetCalories,
    targetProteinG,
    targetFatG,
    targetFibreG,
    createdAt: now,
  };

  return { mealPlan, days, meals };
}
