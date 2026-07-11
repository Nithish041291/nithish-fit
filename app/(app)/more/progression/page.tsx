"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useProviderData } from "@/lib/data/hooks";

export default function ProgressionListPage() {
  const exercisesState = useProviderData((p) => p.listExercises());
  const performancesAllState = useProviderData(async (p) => {
    const sessions = await p.listSessions();
    const completed = sessions.filter((s) => s.status === "completed");
    const perfsBySession = await Promise.all(completed.map((s) => p.listPerformances(s.id)));
    return perfsBySession.flat();
  });

  if (exercisesState.loading || performancesAllState.loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const trainedSlugs = new Set((performancesAllState.data ?? []).map((p) => p.exerciseSlug));
  const exercises = (exercisesState.data ?? []).filter((e) => trainedSlugs.has(e.slug));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Progression</h1>
      <p className="text-sm text-muted-foreground">Exercises with recorded history. Tap one to see trend, personal bests and the next recommendation.</p>
      <div className="space-y-2">
        {exercises.map((ex) => (
          <Link key={ex.slug} href={`/more/progression/${ex.slug}`}>
            <Card>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.suggestedRepRangeLow}-{ex.suggestedRepRangeHigh} reps
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
        {exercises.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No completed sessions yet. Progression will appear here after your first workout.</p>}
      </div>
    </div>
  );
}
