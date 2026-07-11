"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useProviderData, todayIsoDate } from "@/lib/data/hooks";
import { NutritionSummaryCard } from "@/components/today/nutrition-summary-card";
import { SupplementChecklist } from "@/components/today/supplement-checklist";
import { WaterTracker } from "@/components/today/water-tracker";
import { WeightSummaryCard } from "@/components/today/weight-summary-card";
import { formatDateLong, formatWeekdayLabel, titleCase, weekdayOf } from "@/lib/format";
import { sevenDayMovingAverage, weeklyRateOfChange, isLossRateExcessive } from "@/lib/calc/movingAverage";
import { calculateNutritionAdherencePercent, calculateWorkoutCompletionPercent } from "@/lib/workout/adherence";
import { resolveTodaysWorkoutDay } from "@/lib/workout/today";
import { AlertTriangle, Dumbbell, Salad, Scale, CalendarDays } from "lucide-react";

export default function TodayPage() {
  const date = todayIsoDate();
  const weekday = weekdayOf(new Date());

  const profileState = useProviderData((p) => p.getProfile());
  const targetState = useProviderData((p) => p.getActiveNutritionTarget());
  const foodLogsWeekState = useProviderData((p) => p.listFoodLogs({ from: date.slice(0, 8) + "01", to: date }));
  const foodLogsTodayState = useProviderData((p) => p.listFoodLogs({ from: date, to: date }));
  const bodyMeasurementsState = useProviderData((p) => p.listBodyMeasurements());
  const sessionsState = useProviderData((p) => p.listSessions());
  const supplementLogsState = useProviderData((p) => p.listSupplementLogs({ from: date, to: date }));
  const programmeState = useProviderData((p) => p.getActiveProgramme());
  const workoutDaysState = useProviderData(async (p) => {
    const programme = await p.getActiveProgramme();
    return programme ? p.listWorkoutDays(programme.id) : [];
  }, [programmeState.data?.id]);
  const waterState = useProviderData((p) => p.getSetting(`water:${date}`));

  const loading =
    profileState.loading || targetState.loading || foodLogsTodayState.loading || bodyMeasurementsState.loading || sessionsState.loading || workoutDaysState.loading;

  if (loading || !profileState.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const profile = profileState.data;
  const target = targetState.data;
  const todaysLogs = foodLogsTodayState.data ?? [];
  const totals = todaysLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.proteinG,
      carbs: acc.carbs + l.carbsG,
      fat: acc.fat + l.fatG,
      fibre: acc.fibre + l.fibreG,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  );

  const measurements = bodyMeasurementsState.data ?? [];
  const weighIns = measurements.map((m) => ({ date: m.date, weightKg: m.weightKg }));
  const currentWeight = measurements.length > 0 ? measurements[measurements.length - 1].weightKg : profile.currentWeightKg;
  const sevenDayAvg = sevenDayMovingAverage(weighIns, date);
  const weeklyRate = weeklyRateOfChange(weighIns, date);
  const excessiveLoss = isLossRateExcessive(weighIns, date, currentWeight);

  const sessions = sessionsState.data ?? [];
  const workoutDays = workoutDaysState.data ?? [];
  const todaysWorkoutDay = resolveTodaysWorkoutDay(weekday, workoutDays);
  const isRestDay = !profile.trainingDays.includes(weekday) || !todaysWorkoutDay || todaysWorkoutDay.isRestDay;
  const todaysSession = sessions.find((s) => s.date === date);

  const workoutCompletionPercent = calculateWorkoutCompletionPercent(profile.trainingDays, sessions, date);
  const nutritionAdherencePercent = calculateNutritionAdherencePercent(foodLogsWeekState.data ?? [], target?.calorieTargetKcal ?? 0, date);

  const latestPainSessions = sessions.filter((s) => s.wristPainScore !== null && s.wristPainScore >= 4).slice(0, 1);
  const severePain = sessions.some((s) => s.wristPainScore !== null && s.wristPainScore >= 7 && s.date >= date);

  const waterConsumed = Number(waterState.data ?? "0");
  const refetchAll = () => {
    supplementLogsState.refetch();
    waterState.refetch();
  };

  const supplements = supplementLogsState.data ?? [];
  const creatineLog = supplements.find((s) => s.type === "creatine") ?? null;
  const wheyLog = supplements.find((s) => s.type === "whey") ?? null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{formatDateLong(date)}</p>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          {isRestDay ? "Rest day" : `Training day — ${todaysWorkoutDay?.label ?? formatWeekdayLabel(weekday)}`}
          {todaysSession?.status === "completed" && (
            <span className="text-xs font-normal rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">
              Completed
            </span>
          )}
        </h1>
      </div>

      {severePain && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Medical review recommended</AlertTitle>
          <AlertDescription>
            A recent session recorded wrist/forearm pain of 7/10 or higher. This app does not replace advice from a qualified doctor,
            physiotherapist, trainer or dietitian — please seek review before continuing to train that area.
          </AlertDescription>
        </Alert>
      )}
      {!severePain && latestPainSessions.length > 0 && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Recent wrist discomfort noted</AlertTitle>
          <AlertDescription>Pain of 4/10 or higher was logged recently. Load has not been increased for the affected exercise.</AlertDescription>
        </Alert>
      )}
      {excessiveLoss && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Weight loss faster than recommended</AlertTitle>
          <AlertDescription>The recent trend is losing more than ~1% of body weight per week. Consider easing the deficit slightly.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/workout">
          <Button className="w-full h-14 text-base gap-2" size="lg">
            <Dumbbell className="size-5" /> {isRestDay ? "Optional workout" : "Start workout"}
          </Button>
        </Link>
        <Link href="/food">
          <Button className="w-full h-14 text-base gap-2" size="lg" variant="secondary">
            <Salad className="size-5" /> Log food
          </Button>
        </Link>
        <Link href="/progress">
          <Button className="w-full h-14 text-base gap-2" size="lg" variant="outline">
            <Scale className="size-5" /> Log weight
          </Button>
        </Link>
        <Link href="/more/meal-plan">
          <Button className="w-full h-14 text-base gap-2" size="lg" variant="outline">
            <CalendarDays className="size-5" /> Meal plan
          </Button>
        </Link>
      </div>

      {isRestDay && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery guidance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Today is a scheduled rest day. Prioritise sleep, hydration and protein intake to support recovery.</p>
            <p>Light walking is fine. A lifting session is not generated automatically — use &quot;Optional workout&quot; above if you want to train anyway.</p>
          </CardContent>
        </Card>
      )}

      {target && (
        <NutritionSummaryCard
          calorieTarget={target.calorieTargetKcal}
          caloriesConsumed={totals.calories}
          proteinTarget={target.proteinTargetG}
          proteinConsumed={totals.protein}
          carbTarget={target.carbTargetG}
          carbConsumed={totals.carbs}
          fatTarget={target.fatTargetG}
          fatConsumed={totals.fat}
          fibreTarget={target.fibreTargetG}
          fibreConsumed={totals.fibre}
        />
      )}

      <WaterTracker date={date} consumedMl={waterConsumed} targetMl={2500} onChange={refetchAll} />

      <SupplementChecklist
        date={date}
        creatineLog={creatineLog}
        wheyLog={wheyLog}
        creatineGrams={profile.creatineGramsPerDay}
        wheyScoops={profile.wheyScoopsPerTrainingDay}
        isTrainingDay={!isRestDay}
        onChange={refetchAll}
      />

      <WeightSummaryCard currentWeightKg={currentWeight} sevenDayAverageKg={sevenDayAvg} weeklyRateKgPerWeek={weeklyRate} targetWeightKg={profile.targetWeightKg} />

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Workout completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">{workoutCompletionPercent}%</p>
            <Progress value={workoutCompletionPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Nutrition adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">{nutritionAdherencePercent}%</p>
            <Progress value={nutritionAdherencePercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        {titleCase(profile.dietaryPattern)} · {profile.gymType}. This app does not replace advice from a qualified doctor, physiotherapist,
        trainer or dietitian.
      </p>
    </div>
  );
}
