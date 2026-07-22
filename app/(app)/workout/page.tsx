"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, History } from "lucide-react";
import Link from "next/link";
import { useDataContext } from "@/lib/data/context";
import { useProviderData, todayIsoDate } from "@/lib/data/hooks";
import { resolveTodaysWorkoutDay } from "@/lib/workout/today";
import { weekdayOf, formatWeekdayLabel } from "@/lib/format";
import { estimateWorkoutDurationMinutes } from "@/lib/calc/duration";
import { generateId } from "@/lib/calc/id";
import { ReadinessDialog } from "@/components/workout/readiness-dialog";
import { startWorkoutSession } from "@/lib/workout/startSession";
import { evaluateReadiness, type ReadinessInput } from "@/lib/calc/readiness";
import { readAndClearRotationNotice, type StoredRotationNotice } from "@/lib/workout/rotationNotice";
import { toast } from "sonner";

export default function WorkoutLandingPage() {
  const { provider, user } = useDataContext();
  const router = useRouter();
  const date = todayIsoDate();
  const weekday = weekdayOf(new Date());
  const [starting, setStarting] = useState(false);
  const [showReadiness, setShowReadiness] = useState(false);
  const [rotationNotice, setRotationNotice] = useState<StoredRotationNotice | null>(null);

  useEffect(() => {
    if (!user) return;
    setRotationNotice(readAndClearRotationNotice(user.id));
  }, [user]);

  const profileState = useProviderData((p) => p.getProfile());
  const programmeState = useProviderData((p) => p.getActiveProgramme());
  const workoutDaysState = useProviderData(async (p) => {
    const programme = await p.getActiveProgramme();
    return programme ? p.listWorkoutDays(programme.id) : [];
  }, [programmeState.data?.id]);
  const sessionsState = useProviderData((p) => p.listSessions({ from: date, to: date }));
  const plannedState = useProviderData(
    async (p) => {
      const days = workoutDaysState.data ?? [];
      const day = resolveTodaysWorkoutDay(weekday, days);
      if (!day) return { day: null, planned: [], exercises: [] };
      const planned = await p.listPlannedExercises(day.id);
      const exercises = await Promise.all(planned.map((pe) => p.getExercise(pe.exerciseSlug)));
      return { day, planned, exercises };
    },
    [workoutDaysState.data]
  );

  const loading = profileState.loading || workoutDaysState.loading || sessionsState.loading || plannedState.loading;
  if (loading || !profileState.data || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const profile = profileState.data;
  const todaysSession = (sessionsState.data ?? [])[0];
  const isRestDay = !profile.trainingDays.includes(weekday);
  const { day, planned, exercises } = plannedState.data ?? { day: null, planned: [], exercises: [] };

  if (todaysSession) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{todaysSession.label}</h1>
          <Link href="/workout/history" className="text-muted-foreground flex items-center gap-1 text-sm">
            <History className="size-4" /> History
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">
          {todaysSession.status === "completed" ? "Completed" : "In progress"} · {date}
        </p>
        <RotationNoticeCard notice={rotationNotice} />
        <Button size="lg" className="w-full h-14 text-base" onClick={() => router.push(`/workout/session/${todaysSession.id}`)}>
          {todaysSession.status === "completed" ? "View summary" : "Resume workout"}
        </Button>
      </div>
    );
  }

  async function handleReadinessSubmit(input: ReadinessInput) {
    setShowReadiness(false);
    if (!user) return;
    try {
      const evaluation = evaluateReadiness(input);
      const entry = await provider.saveReadinessEntry({
        id: generateId(),
        userId: user.id,
        date,
        sleepHours: input.sleepHours,
        energyLevel: input.energyLevel,
        muscleSoreness: input.muscleSoreness,
        wristPain: input.wristPain,
        stressLevel: input.stressLevel,
        createdAt: new Date().toISOString(),
      });
      if (evaluation.recommendation === "stop_medical_review") {
        toast.error(evaluation.reasonText, { duration: 8000 });
        return;
      }
      if (evaluation.recommendation !== "proceed_normally") {
        toast(evaluation.reasonText, { duration: 6000 });
      }
      await beginSession(entry.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save readiness check-in");
    }
  }

  async function beginSession(readinessEntryId: string | null) {
    if (!user) return;
    setStarting(true);
    try {
      const label = day?.label ?? (isRestDay ? "Optional session" : formatWeekdayLabel(weekday));
      const sessionId = await startWorkoutSession({ provider, userId: user.id, workoutDay: day, label, date, readinessEntryId });
      router.push(`/workout/session/${sessionId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the workout");
    } finally {
      setStarting(false);
    }
  }

  const estimatedMinutes = estimateWorkoutDurationMinutes({
    exercises: planned.map((p) => ({ sets: p.targetSets, restSeconds: p.restSeconds })),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{day?.label ?? (isRestDay ? "Rest day" : formatWeekdayLabel(weekday))}</h1>
        <Link href="/workout/history" className="text-muted-foreground flex items-center gap-1 text-sm">
          <History className="size-4" /> History
        </Link>
      </div>

      <RotationNoticeCard notice={rotationNotice} />

      {isRestDay && (
        <Card>
          <CardHeader>
            <CardTitle>Recovery guidance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Today is a scheduled rest day. A lifting session is not generated automatically.</p>
            <p>Prioritise sleep, hydration and protein. Light walking is fine.</p>
          </CardContent>
        </Card>
      )}

      {planned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline justify-between">
              <span>Planned exercises</span>
              <span className="text-sm font-normal text-muted-foreground">~{estimatedMinutes} min</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {planned.map((pe, idx) => (
              <div key={pe.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <span>
                  {idx + 1}. {exercises[idx]?.name ?? pe.exerciseSlug.replace(/-/g, " ")}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {pe.targetSets} x {pe.targetRepsLow}-{pe.targetRepsHigh}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-full h-14 text-base" disabled={starting} onClick={() => setShowReadiness(true)}>
        {isRestDay ? "Start optional workout" : "Start workout"}
      </Button>

      <ReadinessDialog open={showReadiness} onSubmit={handleReadinessSubmit} onSkip={() => beginSession(null)} />

      {planned.length === 0 && !isRestDay && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No exercises are planned for today in the active programme. Check{" "}
            <Badge variant="outline" className="align-middle">
              More → Settings
            </Badge>{" "}
            to review your programme.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RotationNoticeCard({ notice }: { notice: StoredRotationNotice | null }) {
  if (!notice || notice.changes.length === 0) return null;
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Sparkles className="size-4" /> Training block refreshed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>To keep training varied, {notice.changes.length} exercise{notice.changes.length === 1 ? "" : "s"} rotated to a fresh alternative:</p>
        {notice.changes.map((c, idx) => (
          <p key={idx}>
            <span className="font-medium text-foreground">{c.dayLabel}:</span> {c.fromName} → {c.toName}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
