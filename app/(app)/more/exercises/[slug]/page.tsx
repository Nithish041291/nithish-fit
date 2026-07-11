"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviderData } from "@/lib/data/hooks";
import { titleCase } from "@/lib/format";

export default function ExerciseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const exerciseState = useProviderData((p) => p.getExercise(slug), [slug]);
  const allExercisesState = useProviderData((p) => p.listExercises());

  if (exerciseState.loading || !exerciseState.data) {
    return <Skeleton className="h-96 w-full" />;
  }
  const e = exerciseState.data;
  const substitutes = (allExercisesState.data ?? []).filter((x) => e.substituteExerciseSlugs.includes(x.slug));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/more/exercises" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-semibold flex-1">{e.name}</h1>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{titleCase(e.movementPattern)}</Badge>
        <Badge variant="secondary">{e.isCompound ? "Compound" : "Isolation"}</Badge>
        <Badge variant="secondary">{e.isUnilateral ? "Unilateral" : "Bilateral"}</Badge>
        <Badge variant={e.wristLoadCategory === "high" ? "destructive" : "outline"}>{titleCase(e.wristLoadCategory)} wrist load</Badge>
        {!e.isSelectableByDefault && <Badge variant="outline">Not in default plan</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Muscles & equipment</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Primary:</span> {e.primaryMuscles.map(titleCase).join(", ")}
          </p>
          {e.secondaryMuscles.length > 0 && (
            <p>
              <span className="text-muted-foreground">Secondary:</span> {e.secondaryMuscles.map(titleCase).join(", ")}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Equipment:</span> {e.equipment.map(titleCase).join(", ")}
          </p>
          <p>
            <span className="text-muted-foreground">Rep range:</span> {e.suggestedRepRangeLow}-{e.suggestedRepRangeHigh}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to perform it</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>Setup:</strong> {e.setupInstructions}
          </p>
          <p>
            <strong>Execution:</strong> {e.executionInstructions}
          </p>
          <p>
            <strong>Breathing:</strong> {e.breathingGuidance}
          </p>
          {e.commonMistakes.length > 0 && (
            <div>
              <strong>Common mistakes:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                {e.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <p>
            <strong>Progression:</strong> {e.progressionMethod}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety — right forearm restriction</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <span className="text-muted-foreground">Grip:</span> {titleCase(e.recommendedGrip)} ({e.perHandOrTotalNote})
          </p>
          {e.perHandWeightLimitKg !== null && (
            <p>
              <span className="text-muted-foreground">Per-hand / total limit:</span> {e.perHandWeightLimitKg}kg
            </p>
          )}
          <p>{e.safetyNote}</p>
          {e.contraindications.length > 0 && (
            <div>
              <strong>Contraindications:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                {e.contraindications.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {substitutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Substitutes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {substitutes.map((s) => (
              <Link key={s.slug} href={`/more/exercises/${s.slug}`} className="block text-sm underline">
                {s.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {e.videoUrl && (
        <a href={e.videoUrl} target="_blank" rel="noreferrer" className="text-sm underline block text-center">
          Watch demonstration
        </a>
      )}
    </div>
  );
}
