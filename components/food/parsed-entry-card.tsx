"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomFoodDialog } from "./custom-food-dialog";
import { FOOD_UNITS } from "@/lib/food-parser/units";
import { titleCase } from "@/lib/format";
import { Check, X } from "lucide-react";
import type { FoodItem } from "@/lib/types";
import type { PendingFoodEntry } from "./types";

const MEAL_SLOTS = ["early_morning", "breakfast", "mid_morning", "lunch", "pre_workout", "post_workout", "dinner", "before_bed"] as const;

export interface ParsedEntryCardProps {
  entry: PendingFoodEntry;
  onChange: (patch: Partial<PendingFoodEntry>) => void;
  onSelectFood: (foodId: string) => void;
  onCustomFoodCreated: (food: FoodItem) => void;
  onConfirm: () => void;
  onDiscard: () => void;
}

export function ParsedEntryCard({ entry, onChange, onSelectFood, onCustomFoodCreated, onConfirm, onDiscard }: ParsedEntryCardProps) {
  const confidenceColor = entry.confidence === "high" ? "default" : entry.confidence === "medium" ? "secondary" : "destructive";

  return (
    <Card data-testid="parsed-entry-card" data-raw-text={entry.rawText}>
      <CardContent className="py-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground italic">&quot;{entry.rawText}&quot;</p>
          <Badge variant={confidenceColor}>{entry.confidence === "unmatched" ? "No match" : `${titleCase(entry.confidence)} confidence`}</Badge>
        </div>

        {entry.matches.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Matched food (tap to change):</p>
            <div className="flex flex-wrap gap-1.5">
              {entry.matches.map((m) => (
                <Button
                  key={m.id}
                  data-testid="match-option"
                  data-selected={m.id === entry.selectedFoodId}
                  size="sm"
                  variant={m.id === entry.selectedFoodId ? "default" : "outline"}
                  onClick={() => onSelectFood(m.id)}
                  className="h-8"
                >
                  {m.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm">No close match found for &quot;{entry.foodQuery}&quot;.</p>
        )}

        {!entry.selectedFoodId && <CustomFoodDialog initialName={entry.foodQuery} onCreated={onCustomFoodCreated} />}

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Quantity</label>
            <Input
              type="number"
              inputMode="decimal"
              className="h-10"
              value={entry.quantityValue}
              onChange={(e) => onChange({ quantityValue: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Unit</label>
            <Select value={entry.unit} onValueChange={(v) => v && onChange({ unit: v as PendingFoodEntry["unit"] })}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOOD_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {titleCase(u)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Meal</label>
            <Select value={entry.mealSlot} onValueChange={(v) => v && onChange({ mealSlot: v as PendingFoodEntry["mealSlot"] })}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_SLOTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {entry.nutrients ? (
          <div className="grid grid-cols-5 gap-1 text-center text-xs rounded-md bg-muted p-2">
            <div>
              <p className="font-semibold">{entry.nutrients.calories}</p>
              <p className="text-muted-foreground">kcal</p>
            </div>
            <div>
              <p className="font-semibold">{entry.nutrients.proteinG}g</p>
              <p className="text-muted-foreground">protein</p>
            </div>
            <div>
              <p className="font-semibold">{entry.nutrients.carbsG}g</p>
              <p className="text-muted-foreground">carbs</p>
            </div>
            <div>
              <p className="font-semibold">{entry.nutrients.fatG}g</p>
              <p className="text-muted-foreground">fat</p>
            </div>
            <div>
              <p className="font-semibold">{entry.nutrients.fibreG}g</p>
              <p className="text-muted-foreground">fibre</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select a food match to see nutrients — nothing is estimated without one.</p>
        )}

        <div className="flex gap-2">
          <Button data-testid="log-this-button" className="flex-1 gap-1.5" disabled={!entry.selectedFoodId} onClick={onConfirm}>
            <Check className="size-4" /> Log this
          </Button>
          <Button variant="ghost" size="icon" onClick={onDiscard} aria-label="Discard">
            <X className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
