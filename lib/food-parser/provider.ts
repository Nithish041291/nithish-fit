import type { FoodIndexItem, ParsedFoodLogEntry } from "./parse";
import { parseFoodLogText } from "./parse";

/**
 * Interface for a natural-language food-parsing provider. `DeterministicFoodParserProvider`
 * (the only implementation wired up today) never calls an external API. A future
 * AI-assisted provider (e.g. an LLM-backed parser) can implement this same interface —
 * it must still resolve to FoodIndexItem ids from the local database rather than
 * fabricating nutrition values, per spec section 13.
 */
export interface FoodParserProvider {
  name: string;
  parse(text: string, foodIndex: FoodIndexItem[]): Promise<ParsedFoodLogEntry[]> | ParsedFoodLogEntry[];
}

export class DeterministicFoodParserProvider implements FoodParserProvider {
  name = "deterministic";
  parse(text: string, foodIndex: FoodIndexItem[]): ParsedFoodLogEntry[] {
    return parseFoodLogText(text, foodIndex);
  }
}

export const defaultFoodParserProvider: FoodParserProvider = new DeterministicFoodParserProvider();
