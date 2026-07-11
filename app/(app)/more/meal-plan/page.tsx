"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles } from "lucide-react";
import { useDataContext } from "@/lib/data/context";
import { useProviderData } from "@/lib/data/hooks";
import { generateMealPlan, type FoodIndexItem } from "@/lib/mealplan/generate";
import { defaultMealPlanPreferences } from "@/db/seed/mealPlanPreferences";
import { formatDateLong, titleCase } from "@/lib/format";
import type { MealPlanPreference } from "@/lib/types";
import { toast } from "sonner";

export default function MealPlanPage() {
  const { provider, user } = useDataContext();
  const [preferences, setPreferences] = useState<MealPlanPreference>(defaultMealPlanPreferences);
  const [generating, setGenerating] = useState(false);

  const mealPlansState = useProviderData((p) => p.listMealPlans());
  const latestPlan = (mealPlansState.data ?? [])[0] ?? null;
  const daysState = useProviderData((p) => (latestPlan ? p.listMealPlanDays(latestPlan.id) : Promise.resolve([])), [latestPlan?.id]);
  const foodItemsState = useProviderData((p) => p.listFoodItems());
  const targetState = useProviderData((p) => p.getActiveNutritionTarget());

  const [mealsByDay, setMealsByDay] = useState<Record<string, Awaited<ReturnType<typeof provider.listPlannedMeals>>>>({});

  useEffect(() => {
    const days = daysState.data;
    if (!days || days.length === 0) return;
    let cancelled = false;
    Promise.all(days.map(async (d) => [d.id, await provider.listPlannedMeals(d.id)] as const)).then((entries) => {
      if (!cancelled) setMealsByDay(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [daysState.data, provider]);

  async function regenerate() {
    if (!targetState.data || !user) return;
    setGenerating(true);
    try {
      const foodIndex: Record<string, FoodIndexItem> = {};
      for (const f of foodItemsState.data ?? []) {
        foodIndex[f.slug] = { id: f.id, caloriesPer100g: f.caloriesPer100g, proteinPer100g: f.proteinPer100g, carbsPer100g: f.carbsPer100g, fatPer100g: f.fatPer100g, fibrePer100g: f.fibrePer100g };
      }
      const { mealPlan, days, meals } = generateMealPlan({
        userId: user.id,
        startDate: new Date().toISOString().slice(0, 10),
        preferences,
        targetCalories: targetState.data.calorieTargetKcal,
        targetProteinG: targetState.data.proteinTargetG,
        targetFatG: targetState.data.fatTargetG,
        targetFibreG: targetState.data.fibreTargetG,
        foodIndex,
      });
      await provider.saveMealPlan(mealPlan);
      for (const day of days) await provider.saveMealPlanDay(day);
      for (const meal of meals) await provider.savePlannedMeal(meal);
      setMealsByDay({});
      mealPlansState.refetch();
      toast.success("7-day meal plan generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate meal plan");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Meal plan</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <PrefSelect
              label="Style"
              value={preferences.style}
              options={[
                ["north_indian", "North Indian"],
                ["south_indian", "South Indian"],
                ["mixed_indian", "Mixed"],
              ]}
              onChange={(v) => setPreferences((p) => ({ ...p, style: v as MealPlanPreference["style"] }))}
            />
            <PrefSelect
              label="Cooking time"
              value={preferences.cookingTimeLevel}
              options={[
                ["minimal", "Minimal"],
                ["moderate", "Moderate"],
                ["elaborate", "Elaborate"],
              ]}
              onChange={(v) => setPreferences((p) => ({ ...p, cookingTimeLevel: v as MealPlanPreference["cookingTimeLevel"] }))}
            />
            <PrefSelect
              label="Veg days / week"
              value={String(preferences.vegetarianDaysPerWeek)}
              options={[0, 1, 2, 3].map((n) => [String(n), String(n)] as [string, string])}
              onChange={(v) => setPreferences((p) => ({ ...p, vegetarianDaysPerWeek: Number(v) }))}
            />
            <PrefSelect
              label="Budget"
              value={preferences.budgetLevel}
              options={[
                ["low", "Low"],
                ["medium", "Medium"],
                ["high", "High"],
              ]}
              onChange={(v) => setPreferences((p) => ({ ...p, budgetLevel: v as MealPlanPreference["budgetLevel"] }))}
            />
          </div>
          <Button className="w-full h-12 gap-2" onClick={regenerate} disabled={generating || !targetState.data}>
            <Sparkles className="size-4" /> {latestPlan ? "Regenerate 7-day plan" : "Generate 7-day plan"}
          </Button>
        </CardContent>
      </Card>

      {mealPlansState.loading || daysState.loading ? (
        <Skeleton className="h-64 w-full" />
      ) : latestPlan ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {latestPlan.targetCalories} kcal · {latestPlan.targetProteinG}g protein target per day, starting {formatDateLong(latestPlan.startDate)}
          </p>
          <Accordion>
            {(daysState.data ?? []).map((day) => {
              const meals = mealsByDay[day.id] ?? [];
              const dayTotals = meals.reduce((acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.proteinG }), { calories: 0, protein: 0 });
              return (
                <AccordionItem key={day.id} value={day.id}>
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      Day {day.dayIndex + 1}
                      {day.isVegetarianDay && (
                        <Badge variant="outline" className="text-[10px]">
                          Vegetarian
                        </Badge>
                      )}
                      <span className="text-muted-foreground font-normal">
                        {Math.round(dayTotals.calories)} kcal · {Math.round(dayTotals.protein)}g protein
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    {meals.map((meal) => (
                      <div key={meal.id} className="text-sm border-b pb-2 last:border-0">
                        <p className="font-medium">
                          {titleCase(meal.slot)}: {meal.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{meal.items.map((i) => `${i.displayQuantity} ${i.name}`).join(", ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(meal.calories)} kcal · {meal.proteinG}g P · {meal.carbsG}g C · {meal.fatG}g F · {meal.fibreG}g fibre
                        </p>
                        {meal.preparationGuidance && <p className="text-xs text-muted-foreground italic">{meal.preparationGuidance}</p>}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No meal plan yet. Generate one above.</p>
      )}
    </div>
  );
}

function PrefSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([val, label2]) => (
            <SelectItem key={val} value={val}>
              {label2}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
