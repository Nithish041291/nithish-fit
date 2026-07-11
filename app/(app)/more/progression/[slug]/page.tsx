"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useProviderData, todayIsoDate } from "@/lib/data/hooks";
import { summarizeProgression } from "@/lib/workout/progressionSummary";
import { buildSuggestion } from "@/lib/workout/suggestion";
import { formatDateShort, titleCase } from "@/lib/format";

export default function ProgressionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const date = todayIsoDate();

  const exerciseState = useProviderData((p) => p.getExercise(slug), [slug]);
  const historyState = useProviderData((p) => p.listSetsForExercise(slug), [slug]);
  const incrementsState = useProviderData((p) => p.listAvailableWeightIncrements());

  if (exerciseState.loading || historyState.loading || incrementsState.loading || !exerciseState.data) {
    return <Skeleton className="h-96 w-full" />;
  }

  const exercise = exerciseState.data;
  const history = (historyState.data ?? []).map((h) => ({ session: h.session, sets: h.sets }));
  const summary = summarizeProgression(history, date);
  const suggestion = buildSuggestion({
    exercise,
    history: history.filter((h) => h.session.date < date),
    increments: incrementsState.data ?? [],
    asOfDateIso: date,
    isDeloadActive: false,
  });

  function formatSets(entry: typeof summary.previousSession) {
    if (!entry) return "No data";
    const weight = entry.sets[0]?.actualWeightKg ?? "—";
    const reps = entry.sets.map((s) => s.actualReps ?? "-").join(", ");
    return `${weight}kg x ${reps}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/more/progression" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">{exercise.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Last session:</span> {formatSets(summary.previousSession)}
          </p>
          <p>
            <span className="text-muted-foreground">Last week:</span> {formatSets(summary.previousWeek)}
          </p>
          <p>
            <span className="text-muted-foreground">Best weight:</span> {summary.bestWeightKg ?? "—"}kg
            {summary.personalRecordSessionDate && ` (${formatDateShort(summary.personalRecordSessionDate)})`}
          </p>
          <p>
            <span className="text-muted-foreground">Best reps:</span> {summary.bestReps ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4-week volume trend</CardTitle>
        </CardHeader>
        <CardContent className="h-48">
          {summary.fourWeekTrend.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.fourWeekTrend.map((d) => ({ ...d, dateLabel: formatDateShort(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="dateLabel" fontSize={11} />
                <YAxis fontSize={11} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="var(--color-chart-1, #16a34a)" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough history yet for a trend line.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge>{titleCase(suggestion.action)}</Badge>
            {suggestion.cappedBySafetyLimit && <Badge variant="destructive">25kg safety cap</Badge>}
            {suggestion.suggestSwitchToMachine && <Badge variant="outline">Consider machine/cable</Badge>}
          </div>
          <p className="text-lg font-semibold tabular-nums">
            {suggestion.recommendedWeightKg ?? "—"}kg x {suggestion.recommendedRepsLow}-{suggestion.recommendedRepsHigh}
          </p>
          <p className="text-muted-foreground">{suggestion.reasonText}</p>
        </CardContent>
      </Card>
    </div>
  );
}
