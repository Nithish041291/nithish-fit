import { describe, expect, it } from "vitest";
import { foodItemSeed, foodServingRowsSeed, foodAliasRowsSeed } from "@/db/seed";
import { buildFoodIndex } from "@/lib/food-parser/buildFoodIndex";
import { matchFoodQuery, confidenceFromScore } from "@/lib/food-parser/matcher";
import { parseFoodLogText } from "@/lib/food-parser/parse";

/** Regression test for the reported gap: South Indian (Kerala/Tamil Nadu) dishes like
 * "pazham pori" weren't in the food database, so the natural-language parser on the Food
 * page couldn't recognise them at all. Builds the real food index from the actual seed data
 * (not a hand-built fixture) so this exercises exactly what the live app does. */
describe("expanded South Indian / Mumbai food database", () => {
  const index = buildFoodIndex(foodItemSeed, foodServingRowsSeed, foodAliasRowsSeed);

  it("recognises pazham pori (and its regional spellings) with high confidence", () => {
    for (const query of ["pazham pori", "pazhampori", "ethakka appam", "banana fritter"]) {
      const [top] = matchFoodQuery(query, index);
      expect(top, `no match at all for "${query}"`).toBeDefined();
      expect(top.id).toBe("pazham-pori");
      expect(confidenceFromScore(top.score)).not.toBe("low");
    }
  });

  it("recognises a spread of new Kerala, Tamil Nadu, and Mumbai dishes", () => {
    const expectations: [query: string, expectedId: string][] = [
      ["appam", "appam"],
      ["puttu", "puttu"],
      ["idiyappam", "idiyappam"],
      ["unniyappam", "unniyappam"],
      ["banana chips", "banana-chips-kerala"],
      ["malabar parotta", "malabar-parotta"],
      ["egg roast", "egg-roast-kerala"],
      ["kadala curry", "kadala-curry"],
      ["kerala fish curry", "meen-curry-kerala"],
      ["fish moilee", "fish-moilee"],
      ["beef fry", "beef-fry-kerala"],
      ["kappa", "kappa"],
      ["ada pradhaman", "ada-pradhaman"],
      ["avial", "avial"],
      ["thoran", "thoran"],
      ["olan", "olan"],
      ["erissery", "erissery"],
      ["ven pongal", "pongal-ven"],
      ["sakkarai pongal", "pongal-sakkarai"],
      ["medu vada", "medu-vada"],
      ["uttapam", "uttapam"],
      ["rava dosa", "rava-dosa"],
      ["adai", "adai"],
      ["paniyaram", "paniyaram"],
      ["murukku", "murukku"],
      ["sundal", "sundal"],
      ["chicken chettinad", "chicken-chettinad"],
      ["mutton chukka", "mutton-chukka"],
      ["meen varuval", "meen-varuval"],
      ["prawn masala", "prawn-masala-tamil"],
      ["poriyal", "poriyal"],
      ["kootu", "kootu"],
      ["vatha kuzhambu", "vatha-kuzhambu"],
      ["mor kuzhambu", "mor-kuzhambu"],
      ["bisi bele bath", "bisi-bele-bath"],
      ["semiya payasam", "payasam-semiya"],
      ["vada pav", "vada-pav"],
      ["pav bhaji", "pav-bhaji"],
      ["misal pav", "misal-pav"],
      ["sabudana khichdi", "sabudana-khichdi"],
      ["bhel puri", "bhel-puri"],
      ["pani puri", "pani-puri"],
    ];
    for (const [query, expectedId] of expectations) {
      const [top] = matchFoodQuery(query, index);
      expect(top, `no match at all for "${query}"`).toBeDefined();
      expect(top.id, `wrong match for "${query}"`).toBe(expectedId);
    }
  });

  it("parses a natural-language log line containing a South Indian dish end to end", () => {
    const parsed = parseFoodLogText("1 pazham pori and 2 idli", index);
    const slugs = parsed.map((p) => p.bestMatch?.id);
    expect(slugs).toContain("pazham-pori");
    expect(slugs).toContain("idli");
  });

  it("every new food item has at least a default serving size defined", () => {
    const newSlugs = [
      "pazham-pori", "appam", "puttu", "idiyappam", "unniyappam", "banana-chips-kerala", "malabar-parotta",
      "egg-roast-kerala", "avial", "thoran", "olan", "erissery", "kadala-curry", "meen-curry-kerala", "fish-moilee",
      "beef-fry-kerala", "kappa", "payasam-paal", "ada-pradhaman", "pongal-ven", "pongal-sakkarai", "medu-vada",
      "uttapam", "rava-dosa", "adai", "paniyaram", "murukku", "sundal", "chicken-chettinad", "mutton-chukka",
      "meen-varuval", "prawn-masala-tamil", "poriyal", "kootu", "vatha-kuzhambu", "mor-kuzhambu", "bisi-bele-bath",
      "payasam-semiya", "vada-pav", "pav-bhaji", "misal-pav", "sabudana-khichdi", "bhel-puri", "pani-puri",
    ];
    for (const slug of newSlugs) {
      const item = index.find((i) => i.id === slug);
      expect(item, `missing food item for slug "${slug}"`).toBeDefined();
      expect(item!.servings.length, `no serving size defined for "${slug}"`).toBeGreaterThan(0);
    }
  });
});
