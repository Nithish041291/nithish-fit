import { parseQuantityToken } from "./numberWords";
import { type FoodUnit, normalizeUnit } from "./units";

export interface ParsedFoodToken {
  rawText: string;
  quantityValue: number;
  unit: FoodUnit;
  foodQuery: string;
}

/** roti/chapati/piece/slice can themselves be the food name ("2 rotis") — only treat them
 * as a pure unit word if there is more text after them ("2 pieces of paneer tikka"). */
const FOOD_SHAPED_UNITS = new Set<FoodUnit>(["roti", "chapati", "piece", "slice"]);

const SPLIT_PATTERN = /\n+|,+|\s+and\s+|\s+with\s+/gi;

/** Splits free-text food-log input into individual food segments. */
export function splitFoodText(text: string): string[] {
  return text
    .split(SPLIT_PATTERN)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Parses a single food segment ("150 g grilled chicken") into quantity + unit + food query. */
export function parseFoodSegment(segment: string): ParsedFoodToken {
  const rawText = segment.trim();
  const words = rawText.split(/\s+/).filter(Boolean);

  let idx = 0;
  let quantityValue = 1;
  let quantityFound = false;

  if (words.length >= 2) {
    const combo = parseQuantityToken(`${words[0]} ${words[1]}`);
    if (combo !== null) {
      quantityValue = combo;
      idx = 2;
      quantityFound = true;
    }
  }
  if (!quantityFound && words.length >= 1) {
    const single = parseQuantityToken(words[0]);
    if (single !== null) {
      quantityValue = single;
      idx = 1;
      quantityFound = true;
    }
  }

  let unit: FoodUnit = quantityFound ? "piece" : "serving";
  if (idx < words.length) {
    const maybeUnit = normalizeUnit(words[idx]);
    if (maybeUnit) {
      const remainderAfter = words.slice(idx + 1);
      const isFoodShaped = FOOD_SHAPED_UNITS.has(maybeUnit);
      if (!isFoodShaped || remainderAfter.length > 0) {
        unit = maybeUnit;
        idx += 1;
        if (words[idx]?.toLowerCase() === "of") idx += 1;
      } else {
        unit = maybeUnit;
        // Leave idx unchanged so the word remains part of the food query.
      }
    }
  }

  let foodQuery = words.slice(idx).join(" ").trim();
  if (foodQuery === "") {
    foodQuery = words.slice(Math.max(0, idx - 1)).join(" ").trim();
  }

  return { rawText, quantityValue, unit, foodQuery };
}

export function tokenizeFoodText(text: string): ParsedFoodToken[] {
  return splitFoodText(text).map(parseFoodSegment);
}
