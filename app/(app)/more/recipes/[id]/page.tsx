"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataContext } from "@/lib/data/context";
import { useProviderData } from "@/lib/data/hooks";
import { generateId } from "@/lib/calc/id";
import { calculateRecipeNutrients } from "@/lib/calc/recipe";
import type { FoodItem, FoodLog, Recipe, RecipeIngredient } from "@/lib/types";
import { toast } from "sonner";
import { inferMealSlotFromTime } from "@/lib/food-parser/mealSlotFromTime";
import { todayIsoDate } from "@/lib/data/hooks";

interface IngredientRow {
  localId: string;
  foodItemId: string | null;
  foodQuery: string;
  quantityGrams: number;
  existingId?: string;
}

export default function RecipeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const { provider, user } = useDataContext();
  const router = useRouter();

  const foodItemsState = useProviderData((p) => p.listFoodItems());
  const recipeState = useProviderData((p) => (isNew ? Promise.resolve(null) : p.getRecipe(id)), [id]);
  const existingIngredientsState = useProviderData((p) => (isNew ? Promise.resolve([]) : p.listRecipeIngredients(id)), [id]);

  const [name, setName] = useState("");
  const [servings, setServings] = useState(4);
  const [cookingOilGrams, setCookingOilGrams] = useState(20);
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([{ localId: generateId(), foodItemId: null, foodQuery: "", quantityGrams: 100 }]);
  const [initialized, setInitialized] = useState(isNew);

  useEffect(() => {
    if (isNew || initialized) return;
    if (!recipeState.data || !existingIngredientsState.data) return;
    let cancelled = false;
    // Deferred via microtask so the initial form hydration from loaded data isn't a
    // synchronous setState call inside the effect body.
    Promise.resolve().then(() => {
      if (cancelled || !recipeState.data || !existingIngredientsState.data) return;
      setName(recipeState.data.name);
      setServings(recipeState.data.servings);
      setCookingOilGrams(recipeState.data.cookingOilGrams);
      setInstructions(recipeState.data.instructions ?? "");
      const foodById = new Map((foodItemsState.data ?? []).map((f) => [f.id, f]));
      setIngredients(
        existingIngredientsState.data.length > 0
          ? existingIngredientsState.data.map((ing) => ({
              localId: generateId(),
              foodItemId: ing.foodItemId,
              foodQuery: foodById.get(ing.foodItemId)?.name ?? "",
              quantityGrams: ing.quantityGrams,
              existingId: ing.id,
            }))
          : [{ localId: generateId(), foodItemId: null, foodQuery: "", quantityGrams: 100 }]
      );
      setInitialized(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isNew, initialized, recipeState.data, existingIngredientsState.data, foodItemsState.data]);

  if ((!isNew && (recipeState.loading || existingIngredientsState.loading || !initialized)) || foodItemsState.loading || !user) {
    return <Skeleton className="h-96 w-full" />;
  }

  const foodItems = foodItemsState.data ?? [];

  function updateIngredient(localId: string, patch: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((row) => (row.localId === localId ? { ...row, ...patch } : row)));
  }
  function removeIngredient(localId: string) {
    setIngredients((prev) => prev.filter((row) => row.localId !== localId));
  }
  function addIngredient() {
    setIngredients((prev) => [...prev, { localId: generateId(), foodItemId: null, foodQuery: "", quantityGrams: 100 }]);
  }

  function matchesFor(query: string): FoodItem[] {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return foodItems.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 5);
  }

  const resolvedIngredients = ingredients
    .map((row) => ({ row, food: foodItems.find((f) => f.id === row.foodItemId) }))
    .filter((x): x is { row: IngredientRow; food: FoodItem } => !!x.food);

  const oilFood: FoodItem | undefined = foodItems.find((f) => f.slug === "sunflower-oil");
  const nutrientInputs = [
    ...resolvedIngredients.map(({ row, food }) => ({
      quantityGrams: row.quantityGrams,
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
      fibrePer100g: food.fibrePer100g,
    })),
    ...(cookingOilGrams > 0 && oilFood
      ? [{ quantityGrams: cookingOilGrams, caloriesPer100g: oilFood.caloriesPer100g, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: oilFood.fatPer100g, fibrePer100g: 0 }]
      : []),
  ];
  const { total, perServing } = calculateRecipeNutrients(nutrientInputs, Math.max(1, servings));
  const totalWeight = resolvedIngredients.reduce((sum, { row }) => sum + row.quantityGrams, 0) + cookingOilGrams;

  async function save() {
    if (!name.trim() || resolvedIngredients.length === 0) {
      toast.error("Add a name and at least one matched ingredient.");
      return;
    }
    if (!user) return;
    const recipeId = isNew ? generateId() : id;
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: recipeId,
      userId: user.id,
      name,
      cuisineTag: "home",
      totalCookedWeightGrams: totalWeight,
      servings,
      cookingOilGrams,
      instructions,
      createdAt: recipeState.data?.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await provider.saveRecipe(recipe);

      if (!isNew) {
        for (const existing of existingIngredientsState.data ?? []) {
          if (!ingredients.some((row) => row.existingId === existing.id)) {
            await provider.deleteRecipeIngredient(existing.id);
          }
        }
      }
      for (const { row, food } of resolvedIngredients) {
        const ingredient: RecipeIngredient = {
          id: row.existingId ?? generateId(),
          recipeId,
          foodItemId: food.id,
          quantityGrams: row.quantityGrams,
        };
        await provider.saveRecipeIngredient(ingredient);
      }
      toast.success("Recipe saved");
      router.push(`/more/recipes/${recipeId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save recipe");
    }
  }

  async function remove() {
    if (isNew) return;
    await provider.deleteRecipe(id);
    router.push("/more/recipes");
  }

  async function logOneServing() {
    if (isNew || !user) return;
    const perServingGrams = Math.round(totalWeight / Math.max(1, servings));
    const log: FoodLog = {
      id: generateId(),
      userId: user.id,
      date: todayIsoDate(),
      loggedAt: new Date().toISOString(),
      rawText: `1 serving ${name}`,
      foodItemId: null,
      recipeId: id,
      customName: name,
      quantityGrams: perServingGrams,
      unit: "serving",
      unitQuantity: 1,
      mealSlot: inferMealSlotFromTime(),
      calories: perServing.calories,
      proteinG: perServing.proteinG,
      carbsG: perServing.carbsG,
      fatG: perServing.fatG,
      fibreG: perServing.fibreG,
      confidence: "high",
      source: "recipe",
      wasEdited: false,
      createdAt: new Date().toISOString(),
    };
    try {
      await provider.saveFoodLog(log);
      toast.success("Logged 1 serving to today's food log");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log this recipe");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/more/recipes" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">{isNew ? "New recipe" : name || "Recipe"}</h1>
        {!isNew && (
          <Button variant="ghost" size="icon" onClick={remove} aria-label="Delete recipe">
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1">
            <Label>Recipe name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Home chicken curry" className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Servings</Label>
              <Input type="number" inputMode="numeric" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="h-11" />
            </div>
            <div className="space-y-1">
              <Label>Cooking oil (g)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={cookingOilGrams}
                onChange={(e) => setCookingOilGrams(Number(e.target.value))}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredients.map((row) => (
            <div key={row.localId} className="space-y-1.5 border-b pb-3 last:border-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Search ingredient..."
                  value={row.foodQuery}
                  onChange={(e) => updateIngredient(row.localId, { foodQuery: e.target.value, foodItemId: null })}
                  className="h-10 flex-1"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  value={row.quantityGrams}
                  onChange={(e) => updateIngredient(row.localId, { quantityGrams: Number(e.target.value) })}
                  className="h-10 w-24"
                />
                <Button variant="ghost" size="icon" onClick={() => removeIngredient(row.localId)} aria-label="Remove ingredient">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {!row.foodItemId && row.foodQuery && (
                <div className="flex flex-wrap gap-1.5">
                  {matchesFor(row.foodQuery).map((f) => (
                    <Button key={f.id} size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateIngredient(row.localId, { foodItemId: f.id, foodQuery: f.name })}>
                      {f.name}
                    </Button>
                  ))}
                </div>
              )}
              {row.foodItemId && <p className="text-xs text-emerald-600 dark:text-emerald-400">Matched</p>}
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addIngredient}>
            <Plus className="size-4" /> Add ingredient
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrients</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Total ({totalWeight}g)</p>
            <p>{total.calories} kcal</p>
            <p>
              {total.proteinG}g P · {total.carbsG}g C · {total.fatG}g F · {total.fibreG}g fibre
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Per serving</p>
            <p>{perServing.calories} kcal</p>
            <p>
              {perServing.proteinG}g P · {perServing.carbsG}g C · {perServing.fatG}g F · {perServing.fibreG}g fibre
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="lg" className="flex-1 h-14 text-base" onClick={save}>
          Save recipe
        </Button>
        {!isNew && (
          <Button size="lg" variant="outline" className="h-14 text-base" onClick={logOneServing}>
            Log 1 serving
          </Button>
        )}
      </div>
    </div>
  );
}
