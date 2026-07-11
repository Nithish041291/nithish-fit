"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { generateId } from "@/lib/calc/id";
import { useData } from "@/lib/data/context";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { SupplementLog } from "@/lib/types";

export interface SupplementChecklistProps {
  date: string;
  creatineLog: SupplementLog | null;
  wheyLog: SupplementLog | null;
  creatineGrams: number;
  wheyScoops: number;
  isTrainingDay: boolean;
  onChange: () => void;
}

export function SupplementChecklist({ date, creatineLog, wheyLog, creatineGrams, wheyScoops, isTrainingDay, onChange }: SupplementChecklistProps) {
  const provider = useData();

  async function toggle(existing: SupplementLog | null, type: "creatine" | "whey", amount: string) {
    const next: SupplementLog = existing
      ? { ...existing, taken: !existing.taken, takenAt: !existing.taken ? new Date().toISOString() : null }
      : { id: generateId(), userId: DEMO_USER_ID, date, type, amount, taken: true, takenAt: new Date().toISOString() };
    await provider.saveSupplementLog(next);
    onChange();
  }

  if (creatineGrams <= 0 && (!isTrainingDay || wheyScoops <= 0)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {creatineGrams > 0 && (
          <div className="flex items-center gap-3">
            <Checkbox
              id="creatine-check"
              checked={creatineLog?.taken ?? false}
              onCheckedChange={() => toggle(creatineLog, "creatine", `${creatineGrams}g`)}
              className="size-6"
            />
            <Label htmlFor="creatine-check" className="text-base font-normal">
              Creatine — {creatineGrams}g
            </Label>
          </div>
        )}
        {isTrainingDay && wheyScoops > 0 && (
          <div className="flex items-center gap-3">
            <Checkbox
              id="whey-check"
              checked={wheyLog?.taken ?? false}
              onCheckedChange={() => toggle(wheyLog, "whey", `${wheyScoops} scoop`)}
              className="size-6"
            />
            <Label htmlFor="whey-check" className="text-base font-normal">
              Whey protein — {wheyScoops} scoop after training
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
