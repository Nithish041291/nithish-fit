import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { clampPercent } from "@/lib/format";

interface MacroRowProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
}

function MacroRow({ label, consumed, target, unit }: MacroRowProps) {
  const percent = target > 0 ? clampPercent((consumed / target) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {Math.round(consumed)} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}

export interface NutritionSummaryCardProps {
  calorieTarget: number;
  caloriesConsumed: number;
  proteinTarget: number;
  proteinConsumed: number;
  carbTarget: number;
  carbConsumed: number;
  fatTarget: number;
  fatConsumed: number;
  fibreTarget: number;
  fibreConsumed: number;
}

export function NutritionSummaryCard(props: NutritionSummaryCardProps) {
  const remaining = Math.round(props.calorieTarget - props.caloriesConsumed);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>Nutrition today</span>
          <span className="text-sm font-normal text-muted-foreground">
            {remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MacroRow label="Calories" consumed={props.caloriesConsumed} target={props.calorieTarget} unit=" kcal" />
        <MacroRow label="Protein" consumed={props.proteinConsumed} target={props.proteinTarget} unit="g" />
        <MacroRow label="Carbohydrates" consumed={props.carbConsumed} target={props.carbTarget} unit="g" />
        <MacroRow label="Fat" consumed={props.fatConsumed} target={props.fatTarget} unit="g" />
        <MacroRow label="Fibre" consumed={props.fibreConsumed} target={props.fibreTarget} unit="g" />
      </CardContent>
    </Card>
  );
}
