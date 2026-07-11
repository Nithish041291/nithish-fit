"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, ReferenceLine } from "recharts";
import { useProviderData, todayIsoDate } from "@/lib/data/hooks";
import { LogWeightDialog } from "@/components/progress/log-weight-dialog";
import { estimateTargetDate, isLossRateExcessive, sevenDayMovingAverage, weeklyRateOfChange } from "@/lib/calc/movingAverage";
import { formatDateShort, formatKg } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGE_OPTIONS = [
  { label: "7 days", days: 7 },
  { label: "4 weeks", days: 28 },
  { label: "12 weeks", days: 84 },
];

export default function ProgressPage() {
  const date = todayIsoDate();
  const [rangeDays, setRangeDays] = useState(28);

  const profileState = useProviderData((p) => p.getProfile());
  const measurementsState = useProviderData((p) => p.listBodyMeasurements());
  const targetState = useProviderData((p) => p.getActiveNutritionTarget());
  const foodLogsState = useProviderData((p) => p.listFoodLogs());
  const sessionsState = useProviderData((p) => p.listSessions());

  const rangeStart = new Date(date);
  rangeStart.setDate(rangeStart.getDate() - rangeDays);
  const rangeStartIso = rangeStart.toISOString().slice(0, 10);
  const sessionIds = (sessionsState.data ?? []).filter((s) => s.date >= rangeStartIso && s.status === "completed").map((s) => s.id);

  // All hooks must run every render (Rules of Hooks) — this stays above the loading guard below.
  const volumeState = useProviderData(
    async (p) => {
      if (sessionIds.length === 0) return { totalVolume: 0, avgRir: null as number | null };
      const performancesBySession = await Promise.all(sessionIds.map((id) => p.listPerformances(id)));
      const performances = performancesBySession.flat();
      const setsByPerformance = await Promise.all(performances.map((perf) => p.listSets(perf.id)));
      const allSets = setsByPerformance.flat();
      const totalVolume = allSets.filter((s) => s.completed).reduce((sum, s) => sum + (s.actualWeightKg ?? 0) * (s.actualReps ?? 0), 0);
      const ridValues = allSets.filter((s) => s.completed && s.rir !== null).map((s) => s.rir as number);
      const avgRir = ridValues.length > 0 ? ridValues.reduce((a, b) => a + b, 0) / ridValues.length : null;
      return { totalVolume, avgRir };
    },
    [sessionIds.join(",")]
  );

  if (profileState.loading || measurementsState.loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const profile = profileState.data;
  const measurements = measurementsState.data ?? [];
  const weighIns = measurements.map((m) => ({ date: m.date, weightKg: m.weightKg }));

  const currentWeight = measurements.length > 0 ? measurements[measurements.length - 1].weightKg : profile?.currentWeightKg ?? 0;
  const startingWeight = measurements.length > 0 ? measurements[0].weightKg : profile?.currentWeightKg ?? 0;
  const sevenDayAvg = sevenDayMovingAverage(weighIns, date);
  const weeklyRate = weeklyRateOfChange(weighIns, date);
  const excessiveLoss = isLossRateExcessive(weighIns, date, currentWeight);
  const targetDate = profile ? estimateTargetDate(weighIns, date, profile.targetWeightKg) : null;

  const chartData = measurements
    .filter((m) => m.date >= rangeStartIso)
    .map((m) => ({
      date: m.date,
      dateLabel: formatDateShort(m.date),
      weight: m.weightKg,
      avg7: sevenDayMovingAverage(weighIns, m.date),
    }));

  const foodLogs = (foodLogsState.data ?? []).filter((f) => f.date >= rangeStartIso);
  const caloriesByDate = new Map<string, number>();
  for (const log of foodLogs) caloriesByDate.set(log.date, (caloriesByDate.get(log.date) ?? 0) + log.calories);
  const calorieChartData = Array.from(caloriesByDate.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([d, cal]) => ({ dateLabel: formatDateShort(d), calories: Math.round(cal) }));

  const sessions = (sessionsState.data ?? []).filter((s) => s.date >= rangeStartIso && s.status === "completed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Progress</h1>
        <LogWeightDialog defaultWeightKg={currentWeight} onSaved={() => measurementsState.refetch()} />
      </div>

      <div className="flex gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <Button key={opt.days} size="sm" variant={rangeDays === opt.days ? "default" : "outline"} onClick={() => setRangeDays(opt.days)}>
            {opt.label}
          </Button>
        ))}
      </div>

      {excessiveLoss && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Weight loss faster than recommended</AlertTitle>
          <AlertDescription>The recent trend is losing more than ~1% of body weight per week. Consider easing the calorie deficit.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 text-sm">
          <Stat label="Current" value={formatKg(currentWeight)} />
          <Stat label="7-day average" value={formatKg(sevenDayAvg)} />
          <Stat label="Starting" value={formatKg(startingWeight)} />
          <Stat label="Target" value={formatKg(profile?.targetWeightKg)} />
          <Stat label="Total change" value={`${(currentWeight - startingWeight).toFixed(1)} kg`} />
          <Stat label="Weekly rate" value={weeklyRate !== null ? `${weeklyRate > 0 ? "+" : ""}${weeklyRate.toFixed(2)} kg/wk` : "—"} />
          <Stat label="Est. target date" value={targetDate ? formatDateShort(targetDate) : "Not yet estimable"} className="col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight trend</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateLabel" fontSize={11} />
                <YAxis fontSize={11} width={40} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip />
                {profile && <ReferenceLine y={profile.targetWeightKg} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Target", fontSize: 10 }} />}
                <Line type="monotone" dataKey="weight" stroke="#94a3b8" strokeWidth={1} dot={false} name="Daily" />
                <Line type="monotone" dataKey="avg7" stroke="#16a34a" strokeWidth={2} dot={false} name="7-day avg" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Log a few more weigh-ins to see a trend.</p>
          )}
        </CardContent>
      </Card>

      {targetState.data && (
        <Card>
          <CardHeader>
            <CardTitle>Calories vs target</CardTitle>
          </CardHeader>
          <CardContent className="h-48">
            {calorieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calorieChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="dateLabel" fontSize={11} />
                  <YAxis fontSize={11} width={40} />
                  <Tooltip />
                  <ReferenceLine y={targetState.data.calorieTargetKcal} stroke="#16a34a" strokeDasharray="4 4" />
                  <Bar dataKey="calories" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No food logs in this range yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Training consistency</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <Stat label="Sessions completed" value={String(sessions.length)} />
          <Stat label="Total volume" value={`${Math.round(volumeState.data?.totalVolume ?? 0)} kg`} />
          <Stat label="Avg RIR" value={volumeState.data?.avgRir !== null && volumeState.data?.avgRir !== undefined ? volumeState.data.avgRir.toFixed(1) : "—"} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn(className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
