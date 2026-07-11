"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { generateId } from "@/lib/calc/id";
import { useDataContext } from "@/lib/data/context";
import type { SupplementLog } from "@/lib/types";
import { toast } from "sonner";

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
  const { provider, user } = useDataContext();

  async function toggle(existing: SupplementLog | null, type: "creatine" | "whey", amount: string) {
    if (!user) return;
    const next: SupplementLog = existing
      ? { ...existing, taken: !existing.taken, takenAt: !existing.taken ? new Date().toISOString() : null }
      : { id: generateId(), userId: user.id, date, type, amount, taken: true, takenAt: new Date().toISOString() };
    try {
      await provider.saveSupplementLog(next);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save supplement log");
    }
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
