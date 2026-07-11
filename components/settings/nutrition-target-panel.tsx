"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { calculateBMR } from "@/lib/calc/bmr";
import { calculateMacroTargets } from "@/lib/calc/macros";
import type { ActivityLevel } from "@/lib/calc/types";
import { generateId } from "@/lib/calc/id";
import { useDataContext } from "@/lib/data/context";
import type { NutritionTarget, UserPreference, UserProfile } from "@/lib/types";
import { toast } from "sonner";

export function NutritionTargetPanel({
  profile,
  preferences,
  activeTarget,
  onSaved,
}: {
  profile: UserProfile;
  preferences: UserPreference;
  activeTarget: NutritionTarget | null;
  onSaved: () => void;
}) {
  const { provider, user } = useDataContext();
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(preferences.activityLevel);
  const [deficitPercent, setDeficitPercent] = useState(preferences.calorieDeficitPercent);
  const [proteinPerKg, setProteinPerKg] = useState(preferences.proteinGramsPerKg);
  const [fatPerKg, setFatPerKg] = useState(preferences.fatGramsPerKgTarget);
  const [fibreG, setFibreG] = useState((preferences.fibreTargetGramsMin + preferences.fibreTargetGramsMax) / 2);

  const bmr = calculateBMR({ sex: profile.sex, weightKg: profile.currentWeightKg, heightCm: profile.heightCm, age: profile.age });
  const preview = calculateMacroTargets({
    bmrKcal: bmr,
    activityLevel,
    deficitPercent,
    currentWeightKg: profile.currentWeightKg,
    targetWeightKg: profile.targetWeightKg,
    proteinGPerKgCurrentWeight: proteinPerKg,
    fatGPerKgTargetWeight: fatPerKg,
    fibreTargetG: fibreG,
  });

  async function apply() {
    if (!user) return;
    try {
      await provider.updatePreferences({ activityLevel, calorieDeficitPercent: deficitPercent, proteinGramsPerKg: proteinPerKg, fatGramsPerKgTarget: fatPerKg });
      const newTarget: NutritionTarget = {
        id: generateId(),
        userId: user.id,
        effectiveFrom: new Date().toISOString().slice(0, 10),
        bmrKcal: bmr,
        activityLevel,
        activityMultiplier: preview.maintenanceKcal / bmr,
        maintenanceKcal: preview.maintenanceKcal,
        deficitPercent,
        calorieTargetKcal: preview.calorieTargetKcal,
        proteinTargetG: preview.proteinG,
        fatTargetG: preview.fatG,
        carbTargetG: preview.carbG,
        fibreTargetG: preview.fibreG,
        isActive: true,
        isUserOverride: false,
        createdAt: new Date().toISOString(),
      };
      await provider.saveNutritionTarget(newTarget);
      onSaved();
      toast.success("Nutrition targets updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update nutrition targets");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calorie & macro targets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTarget && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Current active target{activeTarget.isUserOverride ? " (manually set)" : ""}</p>
            <p className="text-muted-foreground">
              {activeTarget.calorieTargetKcal} kcal · {activeTarget.proteinTargetG}g P · {activeTarget.carbTargetG}g C · {activeTarget.fatTargetG}g F ·{" "}
              {activeTarget.fibreTargetG}g fibre
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Activity level</Label>
            <Select value={activityLevel} onValueChange={(v) => v && setActivityLevel(v as ActivityLevel)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="lightly_active">Lightly active</SelectItem>
                <SelectItem value="moderately_active">Moderately active</SelectItem>
                <SelectItem value="very_active">Very active</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Deficit (%)</Label>
            <Input type="number" step="0.5" value={deficitPercent} onChange={(e) => setDeficitPercent(Number(e.target.value))} className="h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Protein (g/kg current weight)</Label>
            <Input type="number" step="0.1" value={proteinPerKg} onChange={(e) => setProteinPerKg(Number(e.target.value))} className="h-10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Fat (g/kg target weight)</Label>
            <Input type="number" step="0.1" value={fatPerKg} onChange={(e) => setFatPerKg(Number(e.target.value))} className="h-10" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs text-muted-foreground">Fibre target (g)</Label>
            <Input type="number" value={fibreG} onChange={(e) => setFibreG(Number(e.target.value))} className="h-10" />
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm space-y-1">
          <p className="text-xs text-muted-foreground">
            BMR {bmr} kcal × {(preview.maintenanceKcal / bmr).toFixed(2)} activity = {preview.maintenanceKcal} kcal maintenance
          </p>
          <p className="font-medium">Preview: {preview.calorieTargetKcal} kcal/day</p>
          <p className="text-muted-foreground">
            {preview.proteinG}g protein · {preview.carbG}g carbs · {preview.fatG}g fat · {preview.fibreG}g fibre
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger render={<Button className="w-full h-11">Recalculate & apply</Button>} />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace active nutrition target?</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace your current {activeTarget?.calorieTargetKcal ?? "—"} kcal target with the new {preview.calorieTargetKcal} kcal
                target shown above. Adjust based on how your actual weight trend responds over the next 2-3 weeks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={apply}>Apply</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
