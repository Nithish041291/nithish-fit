"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SetRow } from "./set-row";
import { calculateVolume } from "@/lib/calc/volume";
import { titleCase } from "@/lib/format";
import type { Exercise, ExercisePerformance, ExerciseSet } from "@/lib/types";
import { Plus, SkipForward, Replace } from "lucide-react";

export interface PreviousSummary {
  label: string;
  text: string;
}

export interface ExercisePerformanceCardProps {
  exercise: Exercise;
  performance: ExercisePerformance;
  sets: ExerciseSet[];
  restSeconds: number;
  previousSession: PreviousSummary | null;
  previousWeek: PreviousSummary | null;
  personalBestKg: number | null;
  onSaveSet: (setId: string, patch: Partial<ExerciseSet>) => void;
  onCompleteSet: (setId: string, patch: Partial<ExerciseSet>) => void;
  onAddSet: () => void;
  onSkip: () => void;
  onReplace: (slug: string) => void;
}

export function ExercisePerformanceCard(props: ExercisePerformanceCardProps) {
  const { exercise, sets, restSeconds, previousSession, previousWeek, personalBestKg } = props;
  const [showAlternatives, setShowAlternatives] = useState(false);
  const completedVolume = calculateVolume(sets.map((s) => ({ weightKg: s.actualWeightKg ?? 0, reps: s.actualReps ?? 0, completed: s.completed })));

  return (
    <Card className={props.performance.wasSkipped ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{exercise.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {exercise.suggestedRepRangeLow}-{exercise.suggestedRepRangeHigh} reps · rest {restSeconds}s · {titleCase(exercise.wristLoadCategory)} wrist load
            </p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={props.onSkip} aria-label="Skip exercise">
              <SkipForward className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowAlternatives((v) => !v)} aria-label="Replace exercise">
              <Replace className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.performance.note && (
          <p className="text-xs bg-primary/5 border border-primary/20 rounded-md px-2.5 py-2">
            <span className="font-medium">Today&apos;s target: </span>
            <span className="text-muted-foreground">{props.performance.note}</span>
          </p>
        )}

        {showAlternatives && exercise.substituteExerciseSlugs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {exercise.substituteExerciseSlugs.map((slug) => (
              <Button key={slug} size="sm" variant="outline" onClick={() => props.onReplace(slug)}>
                {slug.replace(/-/g, " ")}
              </Button>
            ))}
          </div>
        )}

        {previousSession && (
          <div className="rounded-md bg-muted/50 px-2.5 py-2 text-xs">
            <p className="text-muted-foreground">
              Last time ({previousSession.label}) — beat this today for progressive overload:
            </p>
            <p className="font-medium tabular-nums mt-0.5">{previousSession.text}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 text-xs">
          {previousWeek && <Badge variant="secondary">Last week: {previousWeek.text}</Badge>}
          {personalBestKg !== null && <Badge variant="outline">PB: {personalBestKg}kg</Badge>}
        </div>

        <div className="space-y-2">
          {sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onSave={(patch) => props.onSaveSet(set.id, patch)}
              onComplete={(patch) => props.onCompleteSet(set.id, patch)}
            />
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-1" onClick={props.onAddSet}>
          <Plus className="size-3.5" /> Add set
        </Button>

        <p className="text-xs text-muted-foreground">Volume so far: {Math.round(completedVolume)} kg</p>

        <Accordion>
          <AccordionItem value="details">
            <AccordionTrigger className="text-xs py-2">Instructions & safety notes</AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Setup:</strong> {exercise.setupInstructions}
              </p>
              <p>
                <strong>Execution:</strong> {exercise.executionInstructions}
              </p>
              <p>
                <strong>Breathing:</strong> {exercise.breathingGuidance}
              </p>
              <p>
                <strong>Grip:</strong> {titleCase(exercise.recommendedGrip)} — {exercise.perHandOrTotalNote}
              </p>
              <p>
                <strong>Safety:</strong> {exercise.safetyNote}
              </p>
              {exercise.videoUrl && (
                <a href={exercise.videoUrl} target="_blank" rel="noreferrer" className="underline">
                  Watch demonstration
                </a>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
