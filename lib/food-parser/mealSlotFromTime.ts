import type { MealSlot } from "@/lib/types";

export function inferMealSlotFromTime(date: Date = new Date()): MealSlot {
  const hour = date.getHours();
  if (hour < 7) return "early_morning";
  if (hour < 10) return "breakfast";
  if (hour < 12) return "mid_morning";
  if (hour < 15) return "lunch";
  if (hour < 17) return "pre_workout";
  if (hour < 20) return "post_workout";
  if (hour < 22) return "dinner";
  return "before_bed";
}
