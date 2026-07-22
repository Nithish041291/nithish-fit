"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataContext } from "@/lib/data/context";
import { useProviderData, todayIsoDate } from "@/lib/data/hooks";
import { toLocalIsoDate, weekdayOf, formatDateShort } from "@/lib/format";
import { generateId } from "@/lib/calc/id";
import type { WorkoutSession } from "@/lib/types";
import { toast } from "sonner";

/** How many days back the history list shows — at least a month, with headroom. */
const HISTORY_DAYS = 60;

function addDays(dateIso: string, delta: number): string {
  return toLocalIsoDate(new Date(new Date(dateIso + "T00:00:00").getTime() + delta * 86400000));
}

export default function WorkoutHistoryPage() {
  const { provider, user } = useDataContext();
  const today = todayIsoDate();
  const [restDate, setRestDate] = useState(today);
  const [restReason, setRestReason] = useState("");
  const [savingRest, setSavingRest] = useState(false);

  const rangeStart = addDays(today, -(HISTORY_DAYS - 1));
  const profileState = useProviderData((p) => p.getProfile());
  const sessionsState = useProviderData((p) => p.listSessions({ from: rangeStart, to: today }));

  const loading = profileState.loading || sessionsState.loading;
  if (loading || !profileState.data || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const profile = profileState.data;
  const sessionsByDate = new Map((sessionsState.data ?? []).map((s) => [s.date, s]));
  const days: string[] = Array.from({ length: HISTORY_DAYS }, (_, i) => addDays(today, -i));

  async function markAsRest() {
    if (!user) return;
    if (sessionsByDate.has(restDate)) {
      toast.error("A session already exists for that date — view it below instead of marking it as rest.");
      return;
    }
    setSavingRest(true);
    try {
      await provider.saveSession({
        id: generateId(),
        userId: user.id,
        programmeId: null,
        workoutDayId: null,
        label: "Rest (marked)",
        date: restDate,
        startedAt: null,
        completedAt: new Date().toISOString(),
        status: "skipped",
        readinessEntryId: null,
        sessionDifficulty: null,
        wristPainScore: null,
        notes: restReason,
        isDeload: false,
        durationMinutes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Marked ${restDate} as rest — it won't count as a missed session.`);
      setRestReason("");
      sessionsState.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark this day as rest");
    } finally {
      setSavingRest(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/workout" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">Workout history</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mark a day as rest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            For a day you couldn&apos;t train — illness, travel, etc. — so it doesn&apos;t count as a missed session in your weekly
            completion percentage.
          </p>
          <div className="space-y-1">
            <Label htmlFor="rest-date">Date</Label>
            <Input id="rest-date" type="date" max={today} value={restDate} onChange={(e) => setRestDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rest-reason">Reason — optional</Label>
            <Textarea id="rest-reason" value={restReason} onChange={(e) => setRestReason(e.target.value)} placeholder="e.g. cough and fever" />
          </div>
          <Button onClick={markAsRest} disabled={savingRest} className="w-full h-11">
            {savingRest ? "Saving…" : "Mark this day as rest"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        {days.map((date) => (
          <HistoryRow
            key={date}
            date={date}
            session={sessionsByDate.get(date)}
            isTrainingDay={profile.trainingDays.includes(weekdayOf(new Date(date + "T00:00:00")))}
          />
        ))}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<WorkoutSession["status"], string> = {
  completed: "Completed",
  in_progress: "In progress",
  skipped: "Rest",
  planned: "Planned",
};

function HistoryRow({ date, session, isTrainingDay }: { date: string; session: WorkoutSession | undefined; isTrainingDay: boolean }) {
  const row = (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
      <div>
        <p className="font-medium">{formatDateShort(date)}</p>
        {session?.notes && <p className="text-xs text-muted-foreground">{session.notes}</p>}
      </div>
      {session ? (
        <Badge variant={session.status === "completed" ? "secondary" : "outline"}>{STATUS_LABEL[session.status]}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">{isTrainingDay ? "No workout logged" : "Rest day"}</span>
      )}
    </div>
  );

  if (!session) return row;
  return (
    <Link href={`/workout/session/${session.id}`} className="block">
      {row}
    </Link>
  );
}
