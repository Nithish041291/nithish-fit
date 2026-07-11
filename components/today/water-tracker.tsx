"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Minus, Plus } from "lucide-react";
import { useData } from "@/lib/data/context";
import { clampPercent } from "@/lib/format";

const STEP_ML = 250;

export interface WaterTrackerProps {
  date: string;
  consumedMl: number;
  targetMl: number;
  onChange: () => void;
}

export function WaterTracker({ date, consumedMl, targetMl, onChange }: WaterTrackerProps) {
  const provider = useData();

  async function adjust(deltaMl: number) {
    const next = Math.max(0, consumedMl + deltaMl);
    await provider.setSetting(`water:${date}`, String(next));
    onChange();
  }

  const percent = targetMl > 0 ? clampPercent((consumedMl / targetMl) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Water</span>
          <span className="text-sm font-normal text-muted-foreground">
            {(consumedMl / 1000).toFixed(2)} / {(targetMl / 1000).toFixed(1)} L
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent} className="h-2" />
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" className="size-11" onClick={() => adjust(-STEP_ML)} aria-label="Remove 250ml">
            <Minus />
          </Button>
          <span className="text-sm text-muted-foreground w-24 text-center">+/- {STEP_ML}ml</span>
          <Button variant="outline" size="icon" className="size-11" onClick={() => adjust(STEP_ML)} aria-label="Add 250ml">
            <Plus />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
