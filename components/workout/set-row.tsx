"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseSet } from "@/lib/types";

export interface SetRowProps {
  set: ExerciseSet;
  onSave: (patch: Partial<ExerciseSet>) => void;
  onComplete: (patch: Partial<ExerciseSet>) => void;
}

export function SetRow({ set, onSave, onComplete }: SetRowProps) {
  const [weight, setWeight] = useState(set.actualWeightKg ?? set.suggestedWeightKg ?? 0);
  const [reps, setReps] = useState(set.actualReps ?? set.suggestedReps ?? 0);
  const [rir, setRir] = useState(set.rir ?? 2);
  const [pain, setPain] = useState(set.painScore ?? 0);

  const highPain = pain >= 4;

  return (
    <div data-testid="set-row" className={cn("rounded-lg border p-3 space-y-2", set.completed && "bg-muted/50 border-emerald-300 dark:border-emerald-800")}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Set {set.setNumber}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Suggested: {set.suggestedWeightKg ?? "—"}kg x {set.suggestedReps ?? "—"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">Weight (kg)</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.5"
            className="h-11 text-base tabular-nums"
            value={weight}
            onChange={(e) => {
              const v = Number(e.target.value);
              setWeight(v);
              onSave({ actualWeightKg: v });
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">Reps</span>
          <Input
            type="number"
            inputMode="numeric"
            className="h-11 text-base tabular-nums"
            value={reps}
            onChange={(e) => {
              const v = Number(e.target.value);
              setReps(v);
              onSave({ actualReps: v });
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">RIR</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            className="h-11 text-base tabular-nums"
            value={rir}
            onChange={(e) => {
              const v = Number(e.target.value);
              setRir(v);
              onSave({ rir: v });
            }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={cn("text-[11px]", highPain ? "text-destructive font-medium" : "text-muted-foreground")}>Pain 0-10</span>
          <Input
            data-testid="set-pain-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            className={cn("h-11 text-base tabular-nums", highPain && "border-destructive text-destructive")}
            value={pain}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPain(v);
              onSave({ painScore: v });
            }}
          />
        </label>
      </div>
      {highPain && (
        <p className="text-xs text-destructive">
          {pain >= 7 ? "Pain 7+/10 — stop this exercise and seek medical review." : "Pain 4+/10 — consider a substitute. Load will not be increased."}
        </p>
      )}
      <Button
        className="w-full h-11 gap-2"
        variant={set.completed ? "secondary" : "default"}
        onClick={() => onComplete({ actualWeightKg: weight, actualReps: reps, rir, painScore: pain, completed: !set.completed })}
      >
        <Check className="size-4" />
        {set.completed ? "Completed" : "Mark set complete"}
      </Button>
    </div>
  );
}
