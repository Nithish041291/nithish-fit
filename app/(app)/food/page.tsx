"use client";

import { useState } from "react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trash2, Sparkles, ChefHat } from "lucide-react";
import { useDataContext } from "@/lib/data/context";
import { useProviderData, todayIsoDate } from "@/lib/data/hooks";
import { buildFoodIndex } from "@/lib/food-parser/buildFoodIndex";
import { computeNutrientsForGrams, resolveGramsForToken } from "@/lib/food-parser/parse";
import { parseFoodLogText } from "@/lib/food-parser/parse";
import { inferMealSlotFromTime } from "@/lib/food-parser/mealSlotFromTime";
import { generateId } from "@/lib/calc/id";
import { titleCase } from "@/lib/format";
import { ParsedEntryCard } from "@/components/food/parsed-entry-card";
import type { PendingFoodEntry } from "@/components/food/types";
import type { FoodItem, FoodLog } from "@/lib/types";
import { toast } from "sonner";

const EXAMPLE = "3 eggs bhurji with 2 rotis, 1 cup rice and 1 katori dal";

export default function FoodLogPage() {
  const { provider, user } = useDataContext();
  const date = todayIsoDate();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<PendingFoodEntry[]>([]);

  const foodItemsState = useProviderData((p) => p.listFoodItems());
  const foodServingsState = useProviderData((p) => p.listFoodServings());
  const foodAliasesState = useProviderData((p) => p.listFoodAliases());
  const targetState = useProviderData((p) => p.getActiveNutritionTarget());
  const todaysLogsState = useProviderData((p) => p.listFoodLogs({ from: date, to: date }));

  const indexReady = !foodItemsState.loading && !foodServingsState.loading && !foodAliasesState.loading;
  const foodIndex = indexReady ? buildFoodIndex(foodItemsState.data ?? [], foodServingsState.data ?? [], foodAliasesState.data ?? []) : [];

  function handleParse() {
    if (!text.trim()) return;
    const parsed = parseFoodLogText(text, foodIndex);
    const mealSlot = inferMealSlotFromTime();
    const entries: PendingFoodEntry[] = parsed.map((p) => ({
      localId: generateId(),
      rawText: p.rawText,
      quantityValue: p.quantityValue,
      unit: p.unit,
      foodQuery: p.foodQuery,
      matches: p.matches,
      selectedFoodId: p.bestMatch?.id ?? null,
      originalBestMatchId: p.bestMatch?.id ?? null,
      confidence: p.confidence,
      gramsEquivalent: p.gramsEquivalent,
      nutrients: p.nutrients,
      mealSlot,
    }));
    setPending((prev) => [...entries, ...prev]);
    setText("");
  }

  function recompute(entry: PendingFoodEntry, foodId: string | null, quantityValue: number, unit: PendingFoodEntry["unit"]): PendingFoodEntry {
    if (!foodId) return { ...entry, selectedFoodId: null, gramsEquivalent: null, nutrients: null, quantityValue, unit };
    const food = foodIndex.find((f) => f.id === foodId);
    if (!food) return { ...entry, quantityValue, unit };
    const grams = resolveGramsForToken({ rawText: entry.rawText, quantityValue, unit, foodQuery: entry.foodQuery }, food);
    const nutrients = computeNutrientsForGrams(grams, food);
    return { ...entry, selectedFoodId: foodId, quantityValue, unit, gramsEquivalent: grams, nutrients };
  }

  function updateEntry(localId: string, patch: Partial<PendingFoodEntry>) {
    setPending((prev) =>
      prev.map((e) => {
        if (e.localId !== localId) return e;
        const merged = { ...e, ...patch };
        return recompute(merged, merged.selectedFoodId, merged.quantityValue, merged.unit);
      })
    );
  }

  async function selectFood(entry: PendingFoodEntry, foodId: string) {
    if (!user) return;
    const next = recompute(entry, foodId, entry.quantityValue, entry.unit);
    setPending((prev) => prev.map((e) => (e.localId === entry.localId ? next : e)));
    if (foodId !== entry.originalBestMatchId) {
      try {
        // Save the user's correction as a personal alias so next time this text matches directly.
        await provider.saveFoodAlias({ id: generateId(), foodItemId: foodId, alias: entry.foodQuery, isUserCorrection: true, ownerUserId: user.id });
        foodAliasesState.refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save food alias");
      }
    }
  }

  function customFoodCreated(entry: PendingFoodEntry, food: FoodItem) {
    foodItemsState.refetch();
    const localFood = { id: food.id, name: food.name, aliases: [], caloriesPer100g: food.caloriesPer100g, proteinPer100g: food.proteinPer100g, carbsPer100g: food.carbsPer100g, fatPer100g: food.fatPer100g, fibrePer100g: food.fibrePer100g, servings: [] };
    const grams = resolveGramsForToken({ rawText: entry.rawText, quantityValue: entry.quantityValue, unit: entry.unit, foodQuery: entry.foodQuery }, localFood);
    const nutrients = computeNutrientsForGrams(grams, localFood);
    setPending((prev) =>
      prev.map((e) =>
        e.localId === entry.localId
          ? { ...e, selectedFoodId: food.id, matches: [{ id: food.id, name: food.name, score: 1, matchedOn: food.name }, ...e.matches], gramsEquivalent: grams, nutrients }
          : e
      )
    );
  }

  async function confirmEntry(entry: PendingFoodEntry) {
    if (!entry.selectedFoodId || !entry.nutrients || entry.gramsEquivalent === null || !user) return;
    const log: FoodLog = {
      id: generateId(),
      userId: user.id,
      date,
      loggedAt: new Date().toISOString(),
      rawText: entry.rawText,
      foodItemId: entry.selectedFoodId,
      recipeId: null,
      customName: null,
      quantityGrams: entry.gramsEquivalent,
      unit: entry.unit,
      unitQuantity: entry.quantityValue,
      mealSlot: entry.mealSlot,
      calories: entry.nutrients.calories,
      proteinG: entry.nutrients.proteinG,
      carbsG: entry.nutrients.carbsG,
      fatG: entry.nutrients.fatG,
      fibreG: entry.nutrients.fibreG,
      confidence: entry.confidence === "unmatched" ? "low" : entry.confidence,
      source: entry.selectedFoodId !== entry.originalBestMatchId ? "user-corrected" : "parser",
      wasEdited: entry.selectedFoodId !== entry.originalBestMatchId,
      createdAt: new Date().toISOString(),
    };
    try {
      await provider.saveFoodLog(log);
      setPending((prev) => prev.filter((e) => e.localId !== entry.localId));
      todaysLogsState.refetch();
      toast.success("Logged");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not log food entry");
    }
  }

  async function deleteLog(id: string) {
    try {
      await provider.deleteFoodLog(id);
      todaysLogsState.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete food entry");
    }
  }

  const todaysLogs = todaysLogsState.data ?? [];
  const totals = todaysLogs.reduce(
    (acc, l) => ({ calories: acc.calories + l.calories, protein: acc.protein + l.proteinG, carbs: acc.carbs + l.carbsG, fat: acc.fat + l.fatG, fibre: acc.fibre + l.fibreG }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  );
  const target = targetState.data;
  const foodItemsById = new Map((foodItemsState.data ?? []).map((f) => [f.id, f]));

  const groupedBySlot = todaysLogs.reduce<Record<string, FoodLog[]>>((acc, l) => {
    (acc[l.mealSlot] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Log food</h1>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder={`e.g. "${EXAMPLE}"`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-20"
          />
          <div className="flex gap-2">
            <Button className="flex-1 gap-1.5" onClick={handleParse} disabled={!indexReady}>
              <Sparkles className="size-4" /> Parse
            </Button>
            <Link href="/more/recipes">
              <Button variant="outline" className="gap-1.5">
                <ChefHat className="size-4" /> Recipes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((entry) => (
            <ParsedEntryCard
              key={entry.localId}
              entry={entry}
              onChange={(patch) => updateEntry(entry.localId, patch)}
              onSelectFood={(id) => selectFood(entry, id)}
              onCustomFoodCreated={(food) => customFoodCreated(entry, food)}
              onConfirm={() => confirmEntry(entry)}
              onDiscard={() => setPending((prev) => prev.filter((e) => e.localId !== entry.localId))}
            />
          ))}
        </div>
      )}

      {target && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today&apos;s totals</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-5 gap-1 text-center text-xs">
            <Stat label="kcal" value={Math.round(totals.calories)} target={target.calorieTargetKcal} />
            <Stat label="protein" value={Math.round(totals.protein)} target={target.proteinTargetG} suffix="g" />
            <Stat label="carbs" value={Math.round(totals.carbs)} target={target.carbTargetG} suffix="g" />
            <Stat label="fat" value={Math.round(totals.fat)} target={target.fatTargetG} suffix="g" />
            <Stat label="fibre" value={Math.round(totals.fibre)} target={target.fibreTargetG} suffix="g" />
          </CardContent>
        </Card>
      )}

      {todaysLogsState.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        Object.entries(groupedBySlot).map(([slot, logs]) => (
          <div key={slot} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">{titleCase(slot)}</h2>
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{log.customName ?? foodItemsById.get(log.foodItemId ?? "")?.name ?? log.rawText}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.quantityGrams}g · {Math.round(log.calories)} kcal · {log.proteinG}g protein
                      {log.wasEdited && (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          edited
                        </Badge>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)} aria-label="Delete">
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ))
      )}
      {!todaysLogsState.loading && todaysLogs.length === 0 && pending.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No food logged yet today. Try the example above.</p>
      )}
    </div>
  );
}

function Stat({ label, value, target, suffix = "" }: { label: string; value: number; target: number; suffix?: string }) {
  return (
    <div>
      <p className="font-semibold">
        {value}
        {suffix}
      </p>
      <p className="text-muted-foreground">
        / {target}
        {suffix} {label}
      </p>
    </div>
  );
}
