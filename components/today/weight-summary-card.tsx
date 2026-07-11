import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKg } from "@/lib/format";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export interface WeightSummaryCardProps {
  currentWeightKg: number | null;
  sevenDayAverageKg: number | null;
  weeklyRateKgPerWeek: number | null;
  targetWeightKg: number;
}

export function WeightSummaryCard({ currentWeightKg, sevenDayAverageKg, weeklyRateKgPerWeek, targetWeightKg }: WeightSummaryCardProps) {
  const Icon = !weeklyRateKgPerWeek ? Minus : weeklyRateKgPerWeek < 0 ? TrendingDown : TrendingUp;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Body weight</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{formatKg(currentWeightKg)}</p>
          <p className="text-xs text-muted-foreground">7-day avg {formatKg(sevenDayAverageKg)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <Icon className="size-4" />
          <span className="tabular-nums">{weeklyRateKgPerWeek !== null ? `${weeklyRateKgPerWeek > 0 ? "+" : ""}${weeklyRateKgPerWeek.toFixed(2)} kg/wk` : "—"}</span>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Target
          <br />
          <span className="text-sm font-medium text-foreground">{formatKg(targetWeightKg)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
