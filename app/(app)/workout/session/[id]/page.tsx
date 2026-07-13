"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExercisePerformanceCard } from "@/components/workout/exercise-performance-card";
import { RestTimer } from "@/components/workout/rest-timer";
import { useData } from "@/lib/data/context";
import { useProviderData } from "@/lib/data/hooks";
import { generateId } from "@/lib/calc/id";
import { calculateVolume } from "@/lib/calc/volume";
import { repairSessionExercises } from "@/lib/workout/startSession";
import type { Exercise, ExercisePerformance, ExerciseSet, PlannedExercise } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, PartyPopper } from "lucide-react";
import Link from "next/link";

export default function WorkoutSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const provider = useData();

  const sessionState = useProviderData((p) => p.getSession(id), [id]);
  const performancesState = useProviderData((p) => p.listPerformances(id), [id]);

  const [setsByPerformance, setSetsByPerformance] = useState<Record<string, ExerciseSet[]>>({});
  const [exercisesBySlug, setExercisesBySlug] = useState<Record<string, Exercise>>({});
  const [plannedBySlug, setPlannedBySlug] = useState<Record<string, PlannedExercise>>({});
  const [history, setHistory] = useState<Record<string, { session: { date: string }; sets: ExerciseSet[] }[]>>({});
  const [restTimerKey, setRestTimerKey] = useState<{ seconds: number; nonce: number } | null>(null);
  const [difficulty, setDifficulty] = useState(5);
  const [wristPain, setWristPain] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadedDetails, setLoadedDetails] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const restTimerNonce = useRef(0);

  const session = sessionState.data;
  const performances = useMemo(() => performancesState.data ?? [], [performancesState.data]);

  useEffect(() => {
    if (!session || performancesState.loading) return;
    let cancelled = false;
    if (performances.length === 0) {
      // Deferred via microtask (not called synchronously in the effect body) so this
      // matches the async-load-then-hydrate pattern used below and doesn't trigger
      // cascading synchronous renders.
      Promise.resolve().then(() => {
        if (cancelled) return;
        setDifficulty(session.sessionDifficulty ?? 5);
        setWristPain(session.wristPainScore ?? 0);
        setNotes(session.notes ?? "");
        setLoadedDetails(true);
      });
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const setsEntries = await Promise.all(performances.map(async (perf) => [perf.id, await provider.listSets(perf.id)] as const));
      const exerciseSlugs = Array.from(new Set(performances.map((p) => p.exerciseSlug)));
      const exerciseEntries = await Promise.all(exerciseSlugs.map(async (slug) => [slug, await provider.getExercise(slug)] as const));
      const planned = session.workoutDayId ? await provider.listPlannedExercises(session.workoutDayId) : [];
      const historyEntries = await Promise.all(
        exerciseSlugs.map(async (slug) => {
          const all = await provider.listSetsForExercise(slug);
          return [slug, all.filter((h) => h.session.id !== session.id && h.session.date <= session.date)] as const;
        })
      );
      if (cancelled) return;
      setSetsByPerformance(Object.fromEntries(setsEntries));
      setExercisesBySlug(Object.fromEntries(exerciseEntries.filter(([, ex]) => ex !== null) as [string, Exercise][]));
      setPlannedBySlug(Object.fromEntries(planned.map((p) => [p.exerciseSlug, p])));
      setHistory(Object.fromEntries(historyEntries.map(([slug, h]) => [slug, h.map((e) => ({ session: e.session, sets: e.sets }))])));
      setDifficulty(session.sessionDifficulty ?? 5);
      setWristPain(session.wristPainScore ?? 0);
      setNotes(session.notes ?? "");
      setLoadedDetails(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, performances, performancesState.loading, provider]);

  if (sessionState.loading || performancesState.loading || !session || !loadedDetails) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isCompleted = session.status === "completed";

  async function saveSetPatch(performanceId: string, setId: string, patch: Partial<ExerciseSet>) {
    setSetsByPerformance((prev) => ({
      ...prev,
      [performanceId]: prev[performanceId].map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }));
    const set = setsByPerformance[performanceId].find((s) => s.id === setId);
    if (set) await provider.saveSet({ ...set, ...patch });
  }

  async function completeSetPatch(performance: ExercisePerformance, setId: string, patch: Partial<ExerciseSet>) {
    await saveSetPatch(performance.id, setId, patch);
    if (patch.completed) {
      const planned = plannedBySlug[performance.exerciseSlug];
      restTimerNonce.current += 1;
      setRestTimerKey({ seconds: planned?.restSeconds ?? 90, nonce: restTimerNonce.current });
      if ((patch.painScore ?? 0) >= 7) {
        toast.error("Pain of 7/10 or higher recorded — stop this exercise and seek medical review.", { duration: 8000 });
      } else if ((patch.painScore ?? 0) >= 4) {
        toast.warning("Pain of 4/10 or higher recorded — load will not be increased for this exercise.");
      }
    }
  }

  async function addSet(performance: ExercisePerformance) {
    const currentSets = setsByPerformance[performance.id] ?? [];
    const newSet: ExerciseSet = {
      id: generateId(),
      performanceId: performance.id,
      setNumber: currentSets.length + 1,
      suggestedWeightKg: currentSets[currentSets.length - 1]?.suggestedWeightKg ?? null,
      actualWeightKg: null,
      suggestedReps: currentSets[currentSets.length - 1]?.suggestedReps ?? null,
      actualReps: null,
      rir: null,
      painScore: null,
      completed: false,
      timestamp: new Date().toISOString(),
    };
    await provider.saveSet(newSet);
    setSetsByPerformance((prev) => ({ ...prev, [performance.id]: [...currentSets, newSet] }));
  }

  async function skipExercise(performance: ExercisePerformance) {
    const next = { ...performance, wasSkipped: !performance.wasSkipped };
    await provider.savePerformance(next);
    performancesState.refetch();
  }

  async function replaceExercise(performance: ExercisePerformance, slug: string) {
    const next = { ...performance, wasReplacedBySlug: slug, exerciseSlug: slug };
    await provider.savePerformance(next);
    performancesState.refetch();
  }

  async function repairExercises() {
    if (!session) return;
    setRepairing(true);
    try {
      const attached = await repairSessionExercises({ provider, session });
      if (attached) {
        toast.success("Today's exercises loaded");
        sessionState.refetch();
        performancesState.refetch();
      } else {
        toast.error("No planned workout day found for this date — check your active programme in Settings.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load exercises");
    } finally {
      setRepairing(false);
    }
  }

  async function completeWorkout() {
    if (!session) return;
    setSaving(true);
    try {
      const allSets = Object.values(setsByPerformance).flat();
      const maxPain = allSets.reduce((m, s) => Math.max(m, s.painScore ?? 0), wristPain);
      const startedAt = session.startedAt ? new Date(session.startedAt) : new Date();
      const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));
      await provider.saveSession({
        ...session,
        status: "completed",
        completedAt: new Date().toISOString(),
        sessionDifficulty: difficulty,
        wristPainScore: maxPain,
        notes,
        durationMinutes,
      });
      toast.success("Workout completed");
      sessionState.refetch();
    } finally {
      setSaving(false);
    }
  }

  function formatPrevious(entry: { session: { date: string }; sets: ExerciseSet[] } | undefined) {
    if (!entry) return null;
    const completedSets = entry.sets.filter((s) => s.completed);
    if (completedSets.length === 0) return null;
    const weight = completedSets[0].actualWeightKg;
    const reps = completedSets.map((s) => s.actualReps ?? 0).join(", ");
    return { label: entry.session.date, text: `${weight}kg x ${reps}` };
  }

  const totalVolume = calculateVolume(
    Object.values(setsByPerformance)
      .flat()
      .map((s) => ({ weightKg: s.actualWeightKg ?? 0, reps: s.actualReps ?? 0, completed: s.completed }))
  );
  const totalSets = Object.values(setsByPerformance).flat().length;
  const completedSets = Object.values(setsByPerformance)
    .flat()
    .filter((s) => s.completed).length;

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center gap-2">
        <Link href="/workout" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">{session.label}</h1>
        {session.isDeload && <Badge variant="outline">Deload</Badge>}
      </div>

      {isCompleted && (
        <Card className="border-emerald-300 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <PartyPopper className="size-5" /> Session complete
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Duration</p>
              <p className="font-medium">{session.durationMinutes ?? "—"} min</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Volume</p>
              <p className="font-medium">{Math.round(totalVolume)} kg</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Sets</p>
              <p className="font-medium">
                {completedSets}/{totalSets}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCompleted && performances.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Warm up — </span>
            5 min light cardio, arm circles, and wrist rotations before your first working set.
          </CardContent>
        </Card>
      )}

      {performances.length === 0 && !isCompleted && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground text-center space-y-3">
            <p>
              No exercises are attached to this session yet — this can happen if it was started before your programme finished loading. Try
              loading today&apos;s planned exercises, or mark it complete if this was intentional.
            </p>
            <Button onClick={repairExercises} disabled={repairing} className="w-full">
              {repairing ? "Loading…" : "Load today's planned exercises"}
            </Button>
          </CardContent>
        </Card>
      )}

      {performances
        .filter((p) => !p.wasSkipped)
        .map((performance) => {
          const exercise = exercisesBySlug[performance.exerciseSlug];
          const sets = setsByPerformance[performance.id] ?? [];
          if (!exercise) return null;
          const planned = plannedBySlug[performance.exerciseSlug];
          const exerciseHistory = history[performance.exerciseSlug] ?? [];
          const previousSession = formatPrevious(exerciseHistory[0]);
          const weekAgoTarget = new Date(session.date);
          weekAgoTarget.setDate(weekAgoTarget.getDate() - 7);
          const previousWeekEntry = exerciseHistory.find((h) => Math.abs(new Date(h.session.date).getTime() - weekAgoTarget.getTime()) < 3 * 86400000);
          const previousWeek = formatPrevious(previousWeekEntry);
          const personalBest = exerciseHistory.reduce<number | null>((best, h) => {
            const maxInSession = h.sets.reduce((m, s) => Math.max(m, s.actualWeightKg ?? 0), 0);
            return best === null ? maxInSession : Math.max(best, maxInSession);
          }, null);

          return (
            <ExercisePerformanceCard
              key={performance.id}
              exercise={exercise}
              performance={performance}
              sets={sets}
              restSeconds={planned?.restSeconds ?? 90}
              previousSession={previousSession}
              previousWeek={previousWeek}
              personalBestKg={personalBest}
              onSaveSet={(setId, patch) => saveSetPatch(performance.id, setId, patch)}
              onCompleteSet={(setId, patch) => completeSetPatch(performance, setId, patch)}
              onAddSet={() => addSet(performance)}
              onSkip={() => skipExercise(performance)}
              onReplace={(slug) => replaceExercise(performance, slug)}
            />
          );
        })}

      {!isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Session notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <Label>Session difficulty</Label>
                <span className="text-muted-foreground">{difficulty}/10</span>
              </div>
              <Slider value={[difficulty]} min={1} max={10} step={1} onValueChange={(v) => setDifficulty(Array.isArray(v) ? v[0] : v)} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <Label>Overall wrist pain</Label>
                <span className={wristPain >= 4 ? "text-destructive font-medium" : "text-muted-foreground"}>{wristPain}/10</span>
              </div>
              <Slider value={[wristPain]} min={0} max={10} step={1} onValueChange={(v) => setWristPain(Array.isArray(v) ? v[0] : v)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did the session feel?" />
            </div>
          </CardContent>
        </Card>
      )}

      {!isCompleted && (
        <Button size="lg" className="w-full h-14 text-base" onClick={completeWorkout} disabled={saving}>
          Complete workout
        </Button>
      )}

      {restTimerKey && <RestTimer key={restTimerKey.nonce} seconds={restTimerKey.seconds} onDismiss={() => setRestTimerKey(null)} />}
    </div>
  );
}
