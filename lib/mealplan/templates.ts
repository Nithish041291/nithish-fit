import type { MealSlot } from "@/lib/types/mealplan";

/**
 * One line item in a meal template — references a real food slug from
 * `db/seed/foods.ts` (never invent new slugs here).
 */
export interface MealTemplateItem {
  foodSlug: string;
  grams: number;
  displayQuantity: string;
}

export interface MealTemplateTags {
  vegetarian: boolean;
  hasEgg: boolean;
  hasChicken: boolean;
  hasFish: boolean;
  hasMutton: boolean;
  hasDairy: boolean;
}

export interface MealTemplate {
  id: string;
  slot: MealSlot;
  style: "north_indian" | "south_indian" | "mixed_indian";
  title: string;
  items: MealTemplateItem[];
  preparationGuidance: string;
  tags: MealTemplateTags;
}

/**
 * Template bank for the Indian meal-plan generator. At least 6 templates per
 * MealSlot (8 slots), spanning north/south/mixed styles, all built from real
 * food slugs in db/seed/foods.ts with gram quantities chosen so each
 * template's total calories land in a sensible range for its slot.
 */
export const mealTemplates: MealTemplate[] = [
  // ─────────────────────────── EARLY MORNING (~0-150 kcal) ───────────────────────────
  {
    id: "em-black-coffee",
    slot: "early_morning",
    style: "mixed_indian",
    title: "Black coffee",
    items: [{ foodSlug: "black-tea-unsweetened", grams: 150, displayQuantity: "1 cup" }],
    preparationGuidance: "Brew strong, no milk or sugar, sip before training/gym prep.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "em-soaked-almonds",
    slot: "early_morning",
    style: "mixed_indian",
    title: "Soaked almonds",
    items: [{ foodSlug: "almonds", grams: 15, displayQuantity: "10-12 soaked almonds" }],
    preparationGuidance: "Soak overnight in water, peel skins in the morning.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "em-filter-coffee",
    slot: "early_morning",
    style: "south_indian",
    title: "Filter coffee",
    items: [{ foodSlug: "coffee-with-milk-sugar", grams: 100, displayQuantity: "small cup" }],
    preparationGuidance: "Brew decoction, top with hot milk, light sugar.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "em-chai",
    slot: "early_morning",
    style: "north_indian",
    title: "Morning chai",
    items: [{ foodSlug: "tea-with-milk-sugar", grams: 100, displayQuantity: "small cup" }],
    preparationGuidance: "Brew tea with milk, keep sugar light.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "em-almonds-walnuts",
    slot: "early_morning",
    style: "mixed_indian",
    title: "Soaked almonds and walnuts",
    items: [
      { foodSlug: "almonds", grams: 10, displayQuantity: "8 soaked almonds" },
      { foodSlug: "walnuts", grams: 8, displayQuantity: "2 walnut halves" },
    ],
    preparationGuidance: "Soak nuts overnight; eat first thing on an empty stomach.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "em-buttermilk",
    slot: "early_morning",
    style: "south_indian",
    title: "Spiced buttermilk",
    items: [{ foodSlug: "buttermilk-spiced", grams: 200, displayQuantity: "1 small glass" }],
    preparationGuidance: "Whisk chilled curd with water, jeera and curry leaves.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "em-warm-water-lemon",
    slot: "early_morning",
    style: "mixed_indian",
    title: "Black tea, no sugar",
    items: [{ foodSlug: "black-tea-unsweetened", grams: 200, displayQuantity: "1 large cup" }],
    preparationGuidance: "Brew and drink hot, unsweetened.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },

  // ─────────────────────────── BREAKFAST (~350-550 kcal) ───────────────────────────
  {
    id: "bf-egg-multigrain-roti",
    slot: "breakfast",
    style: "north_indian",
    title: "Whole eggs with multigrain roti",
    items: [
      { foodSlug: "egg-boiled", grams: 100, displayQuantity: "2 eggs" },
      { foodSlug: "roti-whole-wheat", grams: 80, displayQuantity: "2 rotis" },
      { foodSlug: "curd-plain", grams: 100, displayQuantity: "1 small katori" },
    ],
    preparationGuidance: "Boil eggs, roast rotis dry on tawa, serve with plain curd.",
    tags: { vegetarian: false, hasEgg: true, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bf-egg-bhurji-roti",
    slot: "breakfast",
    style: "north_indian",
    title: "Egg bhurji with roti",
    items: [
      { foodSlug: "egg-bhurji", grams: 180, displayQuantity: "1.5 katori" },
      { foodSlug: "roti-whole-wheat", grams: 80, displayQuantity: "2 rotis" },
    ],
    preparationGuidance: "Scramble eggs with onion-tomato-spice masala in minimal oil.",
    tags: { vegetarian: false, hasEgg: true, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "bf-oats-banana-whey",
    slot: "breakfast",
    style: "mixed_indian",
    title: "Oats with banana and whey",
    items: [
      { foodSlug: "oats-raw-rolled", grams: 50, displayQuantity: "1/2 cup dry oats" },
      { foodSlug: "milk-toned", grams: 200, displayQuantity: "1 glass" },
      { foodSlug: "banana", grams: 100, displayQuantity: "1 small banana" },
      { foodSlug: "whey-protein-generic", grams: 15, displayQuantity: "1/2 scoop" },
    ],
    preparationGuidance: "Cook oats in milk, stir in whey off heat, top with sliced banana.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bf-dosa-sambar-chutney",
    slot: "breakfast",
    style: "south_indian",
    title: "Dosa with sambar and chutney",
    items: [
      { foodSlug: "dosa-plain", grams: 180, displayQuantity: "2 dosas" },
      { foodSlug: "sambar", grams: 150, displayQuantity: "1 katori" },
      { foodSlug: "coconut-chutney", grams: 30, displayQuantity: "2 tbsp" },
    ],
    preparationGuidance: "Roast dosas on hot tawa with minimal oil, serve hot with sambar and chutney.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "bf-idli-sambar",
    slot: "breakfast",
    style: "south_indian",
    title: "Idli with sambar and chutney",
    items: [
      { foodSlug: "idli", grams: 140, displayQuantity: "4 idlis" },
      { foodSlug: "sambar", grams: 150, displayQuantity: "1 katori" },
      { foodSlug: "peanut-chutney", grams: 20, displayQuantity: "1.5 tbsp" },
    ],
    preparationGuidance: "Steam idlis fresh, serve hot with sambar and chutney.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "bf-upma-peanuts",
    slot: "breakfast",
    style: "south_indian",
    title: "Vegetable upma",
    items: [
      { foodSlug: "upma", grams: 250, displayQuantity: "1.5 bowls" },
      { foodSlug: "curd-plain", grams: 100, displayQuantity: "1 small katori" },
    ],
    preparationGuidance: "Roast semolina, cook with vegetables and light oil tempering, serve with curd.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bf-poha-peanuts",
    slot: "breakfast",
    style: "mixed_indian",
    title: "Poha with peanuts",
    items: [
      { foodSlug: "poha", grams: 220, displayQuantity: "1.5 bowls" },
      { foodSlug: "peanuts", grams: 15, displayQuantity: "1 tbsp roasted peanuts" },
    ],
    preparationGuidance: "Rinse flattened rice, temper with mustard seeds, onion, peanuts and turmeric.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "bf-paneer-bhurji-roti",
    slot: "breakfast",
    style: "north_indian",
    title: "Paneer bhurji with roti",
    items: [
      { foodSlug: "paneer-bhurji", grams: 150, displayQuantity: "1.2 katori" },
      { foodSlug: "roti-whole-wheat", grams: 40, displayQuantity: "1 roti" },
    ],
    preparationGuidance: "Crumble paneer and saute with onion-tomato-spice masala in light oil.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bf-besan-chilla-curd",
    slot: "breakfast",
    style: "north_indian",
    title: "Besan chilla with curd",
    items: [
      { foodSlug: "besan-chilla", grams: 160, displayQuantity: "2 chillas" },
      { foodSlug: "curd-plain", grams: 100, displayQuantity: "1 small katori" },
    ],
    preparationGuidance: "Make thin gram-flour pancakes with chopped vegetables on a hot tawa.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bf-egg-whites-toast",
    slot: "breakfast",
    style: "mixed_indian",
    title: "Egg white omelette with brown bread",
    items: [
      { foodSlug: "egg-white-boiled", grams: 130, displayQuantity: "4 egg whites" },
      { foodSlug: "egg-boiled", grams: 50, displayQuantity: "1 whole egg" },
      { foodSlug: "brown-bread", grams: 60, displayQuantity: "2 slices" },
    ],
    preparationGuidance: "Boil eggs, use 4 whites + 1 whole egg, toast bread lightly.",
    tags: { vegetarian: false, hasEgg: true, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },

  // ─────────────────────────── MID MORNING (~100-250 kcal) ───────────────────────────
  {
    id: "mm-apple",
    slot: "mid_morning",
    style: "mixed_indian",
    title: "Apple",
    items: [{ foodSlug: "apple", grams: 180, displayQuantity: "1 medium apple" }],
    preparationGuidance: "Wash and eat whole, skin on.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "mm-banana-almonds",
    slot: "mid_morning",
    style: "mixed_indian",
    title: "Banana with almonds",
    items: [
      { foodSlug: "banana", grams: 100, displayQuantity: "1 small banana" },
      { foodSlug: "almonds", grams: 15, displayQuantity: "10 almonds" },
    ],
    preparationGuidance: "Simple portable snack, no prep needed.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "mm-papaya-bowl",
    slot: "mid_morning",
    style: "mixed_indian",
    title: "Papaya bowl",
    items: [{ foodSlug: "papaya", grams: 200, displayQuantity: "1.3 bowl chopped" }],
    preparationGuidance: "Chop ripe papaya and eat fresh.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "mm-mixed-nuts",
    slot: "mid_morning",
    style: "mixed_indian",
    title: "Mixed nuts handful",
    items: [
      { foodSlug: "cashews", grams: 12, displayQuantity: "6 cashews" },
      { foodSlug: "walnuts", grams: 12, displayQuantity: "3 walnut halves" },
    ],
    preparationGuidance: "Portion into a small handful, eat as-is.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "mm-orange",
    slot: "mid_morning",
    style: "south_indian",
    title: "Orange",
    items: [{ foodSlug: "orange", grams: 150, displayQuantity: "1 large orange" }],
    preparationGuidance: "Peel and eat whole.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "mm-sprouts-salad",
    slot: "mid_morning",
    style: "mixed_indian",
    title: "Sprouts salad",
    items: [{ foodSlug: "sprouts-salad", grams: 150, displayQuantity: "1.5 katori" }],
    preparationGuidance: "Toss sprouted moong with chopped onion, tomato and lemon.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "mm-pomegranate",
    slot: "mid_morning",
    style: "north_indian",
    title: "Pomegranate bowl",
    items: [{ foodSlug: "pomegranate", grams: 150, displayQuantity: "1.5 small bowl" }],
    preparationGuidance: "De-seed and eat fresh.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },

  // ─────────────────────────── LUNCH (~550-750 kcal) ───────────────────────────
  {
    id: "lu-chicken-curry-rice-dal-salad",
    slot: "lunch",
    style: "south_indian",
    title: "Chicken curry with rice, dal and salad",
    items: [
      { foodSlug: "chicken-curry-home-style", grams: 200, displayQuantity: "1.3 katori" },
      { foodSlug: "rice-white-cooked", grams: 180, displayQuantity: "1.2 cup" },
      { foodSlug: "sambar", grams: 100, displayQuantity: "1 small katori" },
      { foodSlug: "cucumber", grams: 80, displayQuantity: "1 small salad bowl" },
    ],
    preparationGuidance: "Cook chicken curry with onion-tomato masala, serve over rice with sambar and raw salad.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: true, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "lu-roti-dal-sabzi-curd",
    slot: "lunch",
    style: "north_indian",
    title: "Roti, dal, sabzi and curd",
    items: [
      { foodSlug: "roti-whole-wheat", grams: 80, displayQuantity: "2 rotis" },
      { foodSlug: "toor-dal-cooked", grams: 180, displayQuantity: "1.2 katori" },
      { foodSlug: "bhindi-fry", grams: 120, displayQuantity: "1.2 katori" },
      { foodSlug: "curd-plain", grams: 150, displayQuantity: "1 katori" },
    ],
    preparationGuidance: "Roast rotis dry, boil and temper dal, saute bhindi in light oil.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "lu-fish-curry-rice-salad",
    slot: "lunch",
    style: "south_indian",
    title: "Fish curry with rice and salad",
    items: [
      { foodSlug: "fish-curry-rohu", grams: 200, displayQuantity: "1.3 katori" },
      { foodSlug: "rice-white-cooked", grams: 200, displayQuantity: "1.3 cup" },
      { foodSlug: "cabbage-sabzi", grams: 100, displayQuantity: "1 katori" },
    ],
    preparationGuidance: "Simmer fish in tamarind-based curry, serve with rice and a dry vegetable side.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: false, hasFish: true, hasMutton: false, hasDairy: false },
  },
  {
    id: "lu-rajma-rice-salad",
    slot: "lunch",
    style: "north_indian",
    title: "Rajma rice with salad",
    items: [
      { foodSlug: "rajma-curry", grams: 220, displayQuantity: "1.5 katori" },
      { foodSlug: "rice-white-cooked", grams: 180, displayQuantity: "1.2 cup" },
      { foodSlug: "onion-raw", grams: 40, displayQuantity: "sliced onion salad" },
      { foodSlug: "curd-plain", grams: 100, displayQuantity: "1 small katori" },
    ],
    preparationGuidance: "Simmer boiled kidney beans in onion-tomato gravy, serve over rice with curd.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "lu-chicken-biryani-raita",
    slot: "lunch",
    style: "south_indian",
    title: "Chicken biryani with raita",
    items: [
      { foodSlug: "biryani-chicken", grams: 320, displayQuantity: "1.5 plate" },
      { foodSlug: "raita", grams: 100, displayQuantity: "1 katori" },
    ],
    preparationGuidance: "Serve a modest biryani portion with cooling raita on the side.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: true, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "lu-mutton-curry-roti-sabzi",
    slot: "lunch",
    style: "north_indian",
    title: "Mutton curry with roti and sabzi",
    items: [
      { foodSlug: "mutton-curry", grams: 180, displayQuantity: "1.2 katori" },
      { foodSlug: "roti-whole-wheat", grams: 80, displayQuantity: "2 rotis" },
      { foodSlug: "mixed-vegetable-curry", grams: 100, displayQuantity: "1 katori" },
    ],
    preparationGuidance: "Slow-cook mutton in onion-tomato masala, serve with rotis and a light vegetable curry.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: true, hasDairy: false },
  },
  {
    id: "lu-paneer-curry-roti-salad",
    slot: "lunch",
    style: "north_indian",
    title: "Paneer curry with roti and salad",
    items: [
      { foodSlug: "paneer-curry", grams: 180, displayQuantity: "1.2 katori" },
      { foodSlug: "roti-whole-wheat", grams: 80, displayQuantity: "2 rotis" },
      { foodSlug: "cucumber", grams: 80, displayQuantity: "1 small salad bowl" },
      { foodSlug: "curd-plain", grams: 100, displayQuantity: "1 small katori" },
    ],
    preparationGuidance: "Simmer paneer cubes in onion-tomato-cream gravy, serve with rotis and salad.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "lu-curd-rice-chole",
    slot: "lunch",
    style: "south_indian",
    title: "Curd rice with chole",
    items: [
      { foodSlug: "curd-rice", grams: 250, displayQuantity: "1.4 bowl" },
      { foodSlug: "chole-curry", grams: 150, displayQuantity: "1 katori" },
    ],
    preparationGuidance: "Mix cooked rice with curd and temper; serve alongside spiced chickpea curry.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },

  // ─────────────────────────── PRE-WORKOUT (~100-250 kcal, light) ───────────────────────────
  {
    id: "pw-banana",
    slot: "pre_workout",
    style: "mixed_indian",
    title: "Banana",
    items: [{ foodSlug: "banana", grams: 120, displayQuantity: "1 medium banana" }],
    preparationGuidance: "Eat 30-45 minutes before training for quick energy.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "pw-coffee-black",
    slot: "pre_workout",
    style: "mixed_indian",
    title: "Black coffee",
    items: [{ foodSlug: "black-tea-unsweetened", grams: 150, displayQuantity: "1 cup" }],
    preparationGuidance: "Have 20-30 minutes pre-training for a mild energy lift.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "pw-toast-banana",
    slot: "pre_workout",
    style: "mixed_indian",
    title: "Brown bread toast with banana",
    items: [
      { foodSlug: "brown-bread", grams: 30, displayQuantity: "1 slice" },
      { foodSlug: "banana", grams: 80, displayQuantity: "1/2 banana" },
    ],
    preparationGuidance: "Toast lightly, eat with banana ~45 minutes before training.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "pw-dates-free-almonds",
    slot: "pre_workout",
    style: "mixed_indian",
    title: "Almonds handful",
    items: [{ foodSlug: "almonds", grams: 20, displayQuantity: "15 almonds" }],
    preparationGuidance: "Small handful roughly 30 minutes before training.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "pw-buttermilk",
    slot: "pre_workout",
    style: "south_indian",
    title: "Spiced buttermilk",
    items: [{ foodSlug: "buttermilk-spiced", grams: 200, displayQuantity: "1 glass" }],
    preparationGuidance: "Light and hydrating, have ~30 minutes before training.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "pw-apple-peanuts",
    slot: "pre_workout",
    style: "mixed_indian",
    title: "Apple with peanuts",
    items: [
      { foodSlug: "apple", grams: 100, displayQuantity: "1/2 apple" },
      { foodSlug: "peanuts", grams: 10, displayQuantity: "1 tsp roasted peanuts" },
    ],
    preparationGuidance: "Slice apple, pair with a few peanuts, eat 30-40 minutes pre-training.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "pw-orange",
    slot: "pre_workout",
    style: "north_indian",
    title: "Orange segments",
    items: [{ foodSlug: "orange", grams: 130, displayQuantity: "1 medium orange" }],
    preparationGuidance: "Peel and eat 30 minutes before training.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },

  // ─────────────────────────── POST-WORKOUT (~200-350 kcal, protein-forward) ───────────────────────────
  {
    id: "po-whey-banana",
    slot: "post_workout",
    style: "mixed_indian",
    title: "Whey protein shake with banana",
    items: [
      { foodSlug: "whey-protein-generic", grams: 35, displayQuantity: "1 scoop" },
      { foodSlug: "milk-toned", grams: 200, displayQuantity: "1 glass" },
      { foodSlug: "banana", grams: 100, displayQuantity: "1 small banana" },
    ],
    preparationGuidance: "Blend whey with milk, eat banana alongside or blend in.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "po-whey-water",
    slot: "post_workout",
    style: "mixed_indian",
    title: "Whey protein shake with water",
    items: [
      { foodSlug: "whey-protein-generic", grams: 35, displayQuantity: "1 scoop" },
      { foodSlug: "banana", grams: 120, displayQuantity: "1 medium banana" },
    ],
    preparationGuidance: "Shake whey with water, pair with a banana for fast carbs.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "po-boiled-eggs-banana",
    slot: "post_workout",
    style: "mixed_indian",
    title: "Boiled eggs with banana",
    items: [
      { foodSlug: "egg-boiled", grams: 100, displayQuantity: "2 eggs" },
      { foodSlug: "banana", grams: 100, displayQuantity: "1 small banana" },
    ],
    preparationGuidance: "Keep boiled eggs ready in the fridge for a quick post-training bite.",
    tags: { vegetarian: false, hasEgg: true, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "po-greek-yogurt-banana",
    slot: "post_workout",
    style: "mixed_indian",
    title: "Greek yogurt with banana",
    items: [
      { foodSlug: "yogurt-greek", grams: 200, displayQuantity: "1 tub" },
      { foodSlug: "banana", grams: 80, displayQuantity: "1/2 banana" },
    ],
    preparationGuidance: "Mix sliced banana into Greek yogurt, eat immediately post-training.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "po-whey-milk-almonds",
    slot: "post_workout",
    style: "mixed_indian",
    title: "Whey shake with almonds",
    items: [
      { foodSlug: "whey-protein-generic", grams: 30, displayQuantity: "1 scoop" },
      { foodSlug: "milk-toned", grams: 200, displayQuantity: "1 glass" },
      { foodSlug: "almonds", grams: 10, displayQuantity: "8 almonds" },
    ],
    preparationGuidance: "Blend whey with milk, eat almonds alongside.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "po-paneer-bhurji-small",
    slot: "post_workout",
    style: "north_indian",
    title: "Small paneer bhurji",
    items: [{ foodSlug: "paneer-bhurji", grams: 120, displayQuantity: "1 katori" }],
    preparationGuidance: "Quick pan-saute of crumbled paneer with light spices, no heavy gravy.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "po-chicken-soup-egg",
    slot: "post_workout",
    style: "mixed_indian",
    title: "Chicken soup with boiled egg",
    items: [
      { foodSlug: "chicken-soup", grams: 250, displayQuantity: "1.2 bowl" },
      { foodSlug: "egg-boiled", grams: 50, displayQuantity: "1 egg" },
    ],
    preparationGuidance: "Warm clear chicken soup, add a boiled egg for extra protein.",
    tags: { vegetarian: false, hasEgg: true, hasChicken: true, hasFish: false, hasMutton: false, hasDairy: false },
  },

  // ─────────────────────────── DINNER (~450-650 kcal) ───────────────────────────
  {
    id: "di-grilled-chicken-veg-salad",
    slot: "dinner",
    style: "mixed_indian",
    title: "Grilled chicken with sauteed vegetables",
    items: [
      { foodSlug: "chicken-breast-grilled", grams: 180, displayQuantity: "1 large fillet" },
      { foodSlug: "mixed-vegetable-curry", grams: 150, displayQuantity: "1 katori" },
      { foodSlug: "cucumber", grams: 80, displayQuantity: "1 small salad bowl" },
    ],
    preparationGuidance: "Grill chicken breast with minimal oil, saute vegetables lightly, add a raw salad.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: true, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "di-fish-grilled-sabzi",
    slot: "dinner",
    style: "south_indian",
    title: "Grilled fish with vegetables",
    items: [
      { foodSlug: "fish-grilled", grams: 180, displayQuantity: "1 large fillet" },
      { foodSlug: "cabbage-sabzi", grams: 120, displayQuantity: "1 katori" },
      { foodSlug: "roti-whole-wheat", grams: 40, displayQuantity: "1 roti" },
    ],
    preparationGuidance: "Grill fish with light spice marinade, pair with a dry vegetable side and one roti.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: false, hasFish: true, hasMutton: false, hasDairy: false },
  },
  {
    id: "di-egg-curry-roti-sabzi",
    slot: "dinner",
    style: "north_indian",
    title: "Egg curry with roti",
    items: [
      { foodSlug: "egg-curry", grams: 200, displayQuantity: "1.3 katori (3 eggs)" },
      { foodSlug: "roti-whole-wheat", grams: 40, displayQuantity: "1 roti" },
      { foodSlug: "methi-sabzi", grams: 100, displayQuantity: "1 katori" },
    ],
    preparationGuidance: "Simmer boiled eggs in onion-tomato gravy, serve with one roti and a green sabzi.",
    tags: { vegetarian: false, hasEgg: true, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
  {
    id: "di-chicken-tikka-salad",
    slot: "dinner",
    style: "north_indian",
    title: "Chicken tikka with salad",
    items: [
      { foodSlug: "chicken-tikka", grams: 200, displayQuantity: "5 pieces" },
      { foodSlug: "sprouts-salad", grams: 120, displayQuantity: "1.2 katori" },
    ],
    preparationGuidance: "Marinate chicken in yogurt-spice mix, grill or tandoor cook, serve with a sprouts salad.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: true, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "di-paneer-palak-roti",
    slot: "dinner",
    style: "north_indian",
    title: "Palak paneer with roti",
    items: [
      { foodSlug: "palak-paneer", grams: 200, displayQuantity: "1.3 katori" },
      { foodSlug: "roti-whole-wheat", grams: 40, displayQuantity: "1 roti" },
    ],
    preparationGuidance: "Cook pureed spinach gravy with paneer cubes, serve with one roti.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "di-prawns-curry-rice-light",
    slot: "dinner",
    style: "south_indian",
    title: "Prawn curry with a light portion of rice",
    items: [
      { foodSlug: "prawns-curry", grams: 180, displayQuantity: "1.2 katori" },
      { foodSlug: "rice-white-cooked", grams: 120, displayQuantity: "0.8 cup" },
    ],
    preparationGuidance: "Simmer prawns in coconut-tomato masala, serve with a modest rice portion.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: false, hasFish: true, hasMutton: false, hasDairy: false },
  },
  {
    id: "di-tandoori-chicken-veg",
    slot: "dinner",
    style: "north_indian",
    title: "Tandoori chicken with vegetables",
    items: [
      { foodSlug: "chicken-tandoori", grams: 150, displayQuantity: "1 leg piece" },
      { foodSlug: "cauliflower-sabzi", grams: 120, displayQuantity: "1.2 katori" },
    ],
    preparationGuidance: "Roast marinated chicken in a tandoor or oven, serve with a dry vegetable side.",
    tags: { vegetarian: false, hasEgg: false, hasChicken: true, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "di-toor-dal-sabzi-roti",
    slot: "dinner",
    style: "north_indian",
    title: "Toor dal with sabzi and roti",
    items: [
      { foodSlug: "toor-dal-cooked", grams: 200, displayQuantity: "1.3 katori" },
      { foodSlug: "bhindi-fry", grams: 100, displayQuantity: "1 katori" },
      { foodSlug: "roti-whole-wheat", grams: 40, displayQuantity: "1 roti" },
    ],
    preparationGuidance: "Boil and temper dal, saute bhindi with light oil, serve with one roti.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },

  // ─────────────────────────── BEFORE BED (~0-200 kcal, optional) ───────────────────────────
  {
    id: "bb-curd-small",
    slot: "before_bed",
    style: "mixed_indian",
    title: "Small bowl of curd",
    items: [{ foodSlug: "curd-plain", grams: 100, displayQuantity: "1 small katori" }],
    preparationGuidance: "Have a small bowl of plain curd 30-60 minutes before sleep.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bb-warm-milk",
    slot: "before_bed",
    style: "mixed_indian",
    title: "Warm milk",
    items: [{ foodSlug: "milk-toned", grams: 200, displayQuantity: "1 small glass" }],
    preparationGuidance: "Warm gently, drink about 30-45 minutes before sleep.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bb-greek-yogurt-small",
    slot: "before_bed",
    style: "mixed_indian",
    title: "Small Greek yogurt",
    items: [{ foodSlug: "yogurt-greek", grams: 100, displayQuantity: "half tub" }],
    preparationGuidance: "Eat plain, no toppings, as a light casein-rich snack before bed.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bb-milk-almonds",
    slot: "before_bed",
    style: "north_indian",
    title: "Warm milk with almonds",
    items: [
      { foodSlug: "milk-toned", grams: 150, displayQuantity: "1 small glass" },
      { foodSlug: "almonds", grams: 8, displayQuantity: "6 almonds" },
    ],
    preparationGuidance: "Warm milk gently, eat almonds alongside before sleep.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bb-buttermilk-small",
    slot: "before_bed",
    style: "south_indian",
    title: "Small glass of buttermilk",
    items: [{ foodSlug: "buttermilk-spiced", grams: 150, displayQuantity: "1 small glass" }],
    preparationGuidance: "Light and easy on digestion before bed.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bb-cottage-cheese",
    slot: "before_bed",
    style: "north_indian",
    title: "Raw paneer cubes",
    items: [{ foodSlug: "paneer-raw", grams: 40, displayQuantity: "small cube portion" }],
    preparationGuidance: "Eat a few plain paneer cubes as a slow-digesting protein snack.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: true },
  },
  {
    id: "bb-skip-light-tea",
    slot: "before_bed",
    style: "mixed_indian",
    title: "Unsweetened black tea",
    items: [{ foodSlug: "black-tea-unsweetened", grams: 150, displayQuantity: "1 cup" }],
    preparationGuidance: "Optional light, caffeine-free herbal-style cup if not sensitive to tea before bed.",
    tags: { vegetarian: true, hasEgg: false, hasChicken: false, hasFish: false, hasMutton: false, hasDairy: false },
  },
];
