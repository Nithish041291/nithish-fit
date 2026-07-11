import { generateId } from "@/lib/calc/id";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { ExercisePerformance, ExerciseSet, ReadinessEntry, WorkoutSession } from "@/lib/types";
import { plannedExerciseSeed, programmeSeed, workoutDaySeed } from "./programme";

/**
 * Generates ~4 weeks of realistic completed session history ending yesterday, so the
 * Today/Progression screens always have fresh "previous session / previous week" data
 * relative to whenever the app is actually opened (spec section 18).
 *
 * Deliberately includes, per spec: different weights/reps across weeks, one missed
 * target, one exercise capped at the 25kg safety limit, one mild wrist-pain entry.
 */
export function buildSessionHistorySeed(referenceDate: Date = new Date()): {
  sessions: WorkoutSession[];
  performances: ExercisePerformance[];
  sets: ExerciseSet[];
  readiness: ReadinessEntry[];
} {
  const sessions: WorkoutSession[] = [];
  const performances: ExercisePerformance[] = [];
  const sets: ExerciseSet[] = [];
  const readiness: ReadinessEntry[] = [];

  const dayByWeekday = new Map(workoutDaySeed.filter((d) => !d.isRestDay).map((d) => [d.weekday, d]));
  const plannedByDay = new Map<string, typeof plannedExerciseSeed>();
  for (const pe of plannedExerciseSeed) {
    const list = plannedByDay.get(pe.workoutDayId) ?? [];
    list.push(pe);
    plannedByDay.set(pe.workoutDayId, list);
  }

  // Collect the last 4 Monday/Tuesday/Wednesday/Friday dates strictly before referenceDate,
  // oldest first, grouped into 4 week buckets (most recent = week index 3).
  type Occurrence = { date: Date; weekday: string; weekIndex: number };
  const occurrences: Occurrence[] = [];
  const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  let weeksFound = 0;
  const cursor = new Date(referenceDate);
  cursor.setDate(cursor.getDate() - 1); // start from yesterday
  const buckets: Date[][] = [[], [], [], []];
  let bucketIndex = 0;
  let daysWalked = 0;
  while (bucketIndex < 4 && daysWalked < 60) {
    const weekday = weekdayNames[cursor.getDay()];
    if (["monday", "tuesday", "wednesday", "friday"].includes(weekday)) {
      buckets[bucketIndex].push(new Date(cursor));
      if (weekday === "monday") {
        // Monday is the first trained day of a (Mon-Sun) week walking backwards, so once
        // we've collected a Monday for this bucket we move to the next (older) bucket.
        bucketIndex++;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
    daysWalked++;
  }
  // Each bucket was filled walking backwards (Fri, Wed, Tue, Mon) — reverse to chronological.
  for (let w = 0; w < 4; w++) {
    const week = buckets[w].reverse();
    for (const d of week) {
      occurrences.push({ date: d, weekday: weekdayNames[d.getDay()], weekIndex: 3 - w });
    }
  }
  occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());
  weeksFound = 4;
  void weeksFound;

  const weightPlanByExercise: Record<string, number> = {
    "machine-chest-press": 45,
    "lat-pulldown": 50,
    "incline-dumbbell-press": 19,
    "seated-cable-row": 45,
    "shoulder-press-machine": 30,
    "cable-lateral-raise": 8,
    "triceps-rope-pushdown": 20,
    "leg-press": 90,
    "goblet-squat": 19,
    "dumbbell-romanian-deadlift": 19,
    "leg-extension": 35,
    "walking-lunges": 12,
    "standing-calf-raise": 40,
    "single-arm-dumbbell-row": 19,
    "bent-over-dumbbell-rear-delt-fly": 6,
    "hammer-curl": 12,
    "cable-curl": 20,
    "leg-press-wide-stance": 85,
    "dumbbell-sumo-squat": 19,
    "incline-treadmill-walk": 0,
  };
  // Weekly per-exercise weight increment while progressing (kg), applied cumulatively by weekIndex.
  const weeklyIncrement: Record<string, number> = {
    "machine-chest-press": 2.5,
    "lat-pulldown": 2.5,
    "incline-dumbbell-press": 2,
    "seated-cable-row": 2.5,
    "shoulder-press-machine": 2.5,
    "cable-lateral-raise": 0,
    "triceps-rope-pushdown": 2.5,
    "leg-press": 5,
    "goblet-squat": 2,
    "dumbbell-romanian-deadlift": 2,
    "leg-extension": 2.5,
    "walking-lunges": 0,
    "standing-calf-raise": 0,
    "single-arm-dumbbell-row": 2,
    "bent-over-dumbbell-rear-delt-fly": 0,
    "hammer-curl": 0,
    "cable-curl": 2.5,
    "leg-press-wide-stance": 5,
    "dumbbell-sumo-squat": 2,
    "incline-treadmill-walk": 0,
  };

  let wristPainInjected = false;
  let missedTargetInjected = false;

  for (const occ of occurrences) {
    const day = dayByWeekday.get(occ.weekday as "monday" | "tuesday" | "wednesday" | "friday");
    if (!day) continue;
    const planned = (plannedByDay.get(day.id) ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
    if (planned.length === 0) continue;

    const dateIso = occ.date.toISOString().slice(0, 10);
    const isMostRecentWeek = occ.weekIndex === 3;
    const isWednesdayWeek1 = occ.weekday === "wednesday" && occ.weekIndex === 1;
    const isTuesdayWeek2 = occ.weekday === "tuesday" && occ.weekIndex === 2;

    const sessionId = generateId();
    let sessionMaxPain = 0;

    for (const pe of planned) {
      const performanceId = generateId();
      const baseWeight = weightPlanByExercise[pe.exerciseSlug] ?? 20;
      const increment = weeklyIncrement[pe.exerciseSlug] ?? 0;
      let weight = Math.round((baseWeight + increment * occ.weekIndex) * 2) / 2;

      // Safety cap: dumbbell exercises loading the right hand never exceed 25kg (per hand
      // or total, depending on the exercise) — demonstrate the cap being hit in the most
      // recent week for incline dumbbell press.
      const isRightHandDumbbell = [
        "incline-dumbbell-press",
        "dumbbell-romanian-deadlift",
        "single-arm-dumbbell-row",
        "goblet-squat",
        "dumbbell-sumo-squat",
      ].includes(pe.exerciseSlug);
      if (isRightHandDumbbell) weight = Math.min(weight, 25);
      if (pe.exerciseSlug === "incline-dumbbell-press" && isMostRecentWeek) weight = 25;

      performances.push({
        id: performanceId,
        sessionId,
        exerciseSlug: pe.exerciseSlug,
        orderIndex: pe.orderIndex,
        wasSkipped: false,
        wasReplacedBySlug: null,
        wasAddedExtra: false,
      });

      for (let setNumber = 1; setNumber <= pe.targetSets; setNumber++) {
        let reps = pe.targetRepsHigh - (setNumber === pe.targetSets ? 1 : 0);
        let rir = setNumber === pe.targetSets ? 2 : 3;
        let painScore = 0;
        let completed = true;

        // Inject: one mild wrist-pain entry (single-arm dumbbell row, week 1 Wednesday).
        if (!wristPainInjected && isWednesdayWeek1 && pe.exerciseSlug === "single-arm-dumbbell-row" && setNumber === 2) {
          painScore = 4;
          wristPainInjected = true;
        }

        // Inject: one missed target (leg press, week 2 Tuesday, final set well short of target reps).
        if (!missedTargetInjected && isTuesdayWeek2 && pe.exerciseSlug === "leg-press" && setNumber === pe.targetSets) {
          reps = Math.max(1, pe.targetRepsLow - 3);
          rir = 0;
          completed = false;
          missedTargetInjected = true;
        }

        if (pe.exerciseSlug === "incline-treadmill-walk") {
          reps = 18;
          rir = 3;
        }

        sessionMaxPain = Math.max(sessionMaxPain, painScore);

        sets.push({
          id: generateId(),
          performanceId,
          setNumber,
          suggestedWeightKg: weight,
          actualWeightKg: weight,
          suggestedReps: pe.targetRepsHigh,
          actualReps: reps,
          rir,
          painScore,
          completed,
          timestamp: new Date(occ.date.getTime() + setNumber * 5 * 60000).toISOString(),
        });
      }
    }

    const startedAt = new Date(occ.date);
    startedAt.setHours(18, 30, 0, 0);
    const completedAt = new Date(startedAt.getTime() + 65 * 60000);

    sessions.push({
      id: sessionId,
      userId: DEMO_USER_ID,
      programmeId: programmeSeed.id,
      workoutDayId: day.id,
      label: day.label,
      date: dateIso,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      status: "completed",
      readinessEntryId: null,
      sessionDifficulty: sessionMaxPain >= 4 ? 7 : 6,
      wristPainScore: sessionMaxPain,
      notes: "",
      isDeload: false,
      durationMinutes: 65,
      createdAt: completedAt.toISOString(),
      updatedAt: completedAt.toISOString(),
    });

    readiness.push({
      id: generateId(),
      userId: DEMO_USER_ID,
      date: dateIso,
      sleepHours: 7,
      energyLevel: 4,
      muscleSoreness: 2,
      wristPain: sessionMaxPain,
      stressLevel: 2,
      createdAt: startedAt.toISOString(),
    });
  }

  return { sessions, performances, sets, readiness };
}
