import { generateId } from "@/lib/calc/id";
import { DEMO_USER_ID } from "@/lib/data/demoProvider";
import type { PlannedExercise, WorkoutDay, WorkoutProgramme } from "@/lib/types";

const NOW = new Date().toISOString();

export const programmeSeed: WorkoutProgramme = {
  id: "programme-upper-lower-4day",
  userId: DEMO_USER_ID,
  name: "4-Day Upper/Lower",
  description: "Society-gym-friendly Upper/Lower split respecting the 25kg right-hand safety cap. Run for 4-6 weeks before rotating exercises.",
  isActive: true,
  startedOn: "2026-06-01",
  cycleWeeks: 5,
  createdAt: NOW,
  updatedAt: NOW,
};

interface DaySpec {
  id: string;
  label: string;
  weekday: WorkoutDay["weekday"];
  isRestDay: boolean;
  orderIndex: number;
  exercises?: { slug: string; sets: number; repsLow: number; repsHigh: number; rest: number; notes?: string }[];
}

const dayCatalog: DaySpec[] = [
  {
    id: "day-upper-a",
    label: "Upper A",
    weekday: "monday",
    isRestDay: false,
    orderIndex: 0,
    exercises: [
      { slug: "machine-chest-press", sets: 4, repsLow: 8, repsHigh: 10, rest: 90 },
      { slug: "lat-pulldown", sets: 4, repsLow: 8, repsHigh: 10, rest: 90 },
      { slug: "incline-dumbbell-press", sets: 3, repsLow: 8, repsHigh: 10, rest: 90, notes: "Max 25 kg per hand (right-forearm restriction)." },
      { slug: "seated-cable-row", sets: 3, repsLow: 10, repsHigh: 12, rest: 75 },
      { slug: "shoulder-press-machine", sets: 3, repsLow: 8, repsHigh: 10, rest: 75 },
      { slug: "cable-lateral-raise", sets: 3, repsLow: 12, repsHigh: 15, rest: 60 },
      { slug: "triceps-rope-pushdown", sets: 3, repsLow: 10, repsHigh: 12, rest: 60 },
    ],
  },
  {
    id: "day-lower-a",
    label: "Lower A",
    weekday: "tuesday",
    isRestDay: false,
    orderIndex: 1,
    exercises: [
      { slug: "leg-press", sets: 4, repsLow: 8, repsHigh: 10, rest: 90 },
      { slug: "goblet-squat", sets: 3, repsLow: 8, repsHigh: 10, rest: 90, notes: "One dumbbell, both hands. Max 25 kg total." },
      { slug: "dumbbell-romanian-deadlift", sets: 3, repsLow: 10, repsHigh: 12, rest: 90, notes: "Max 25 kg per hand." },
      { slug: "leg-extension", sets: 3, repsLow: 10, repsHigh: 12, rest: 60 },
      { slug: "walking-lunges", sets: 3, repsLow: 10, repsHigh: 12, rest: 75, notes: "Reps per leg." },
      { slug: "standing-calf-raise", sets: 4, repsLow: 12, repsHigh: 15, rest: 45 },
    ],
  },
  { id: "day-rest-thu", label: "Rest", weekday: "thursday", isRestDay: true, orderIndex: 2 },
  {
    id: "day-upper-b",
    label: "Upper B",
    weekday: "wednesday",
    isRestDay: false,
    orderIndex: 3,
    exercises: [
      { slug: "lat-pulldown", sets: 4, repsLow: 8, repsHigh: 10, rest: 90 },
      { slug: "seated-cable-row", sets: 4, repsLow: 8, repsHigh: 10, rest: 90 },
      { slug: "single-arm-dumbbell-row", sets: 3, repsLow: 8, repsHigh: 10, rest: 75, notes: "Per side. Max 25 kg in the right hand." },
      { slug: "bent-over-dumbbell-rear-delt-fly", sets: 3, repsLow: 12, repsHigh: 15, rest: 60, notes: "Light weight — technique over load." },
      { slug: "hammer-curl", sets: 3, repsLow: 10, repsHigh: 12, rest: 60 },
      { slug: "cable-curl", sets: 3, repsLow: 10, repsHigh: 12, rest: 60 },
    ],
  },
  {
    id: "day-lower-b",
    label: "Lower B",
    weekday: "friday",
    isRestDay: false,
    orderIndex: 4,
    exercises: [
      { slug: "leg-press-wide-stance", sets: 4, repsLow: 8, repsHigh: 10, rest: 90 },
      { slug: "dumbbell-sumo-squat", sets: 3, repsLow: 8, repsHigh: 10, rest: 90, notes: "One dumbbell, both hands. Max 25 kg total." },
      { slug: "dumbbell-romanian-deadlift", sets: 3, repsLow: 10, repsHigh: 12, rest: 90 },
      { slug: "leg-extension", sets: 3, repsLow: 10, repsHigh: 12, rest: 60 },
      { slug: "walking-lunges", sets: 3, repsLow: 10, repsHigh: 12, rest: 75, notes: "Reps per leg." },
      { slug: "standing-calf-raise", sets: 4, repsLow: 12, repsHigh: 15, rest: 45 },
      { slug: "incline-treadmill-walk", sets: 1, repsLow: 15, repsHigh: 20, rest: 15, notes: "Duration in minutes, not reps — 15 to 20 minutes." },
    ],
  },
  { id: "day-rest-sat", label: "Rest", weekday: "saturday", isRestDay: true, orderIndex: 5 },
  { id: "day-rest-sun", label: "Rest", weekday: "sunday", isRestDay: true, orderIndex: 6 },
];

export const workoutDaySeed: WorkoutDay[] = dayCatalog.map((d) => ({
  id: d.id,
  programmeId: programmeSeed.id,
  label: d.label,
  weekday: d.weekday,
  isRestDay: d.isRestDay,
  orderIndex: d.orderIndex,
}));

export const plannedExerciseSeed: PlannedExercise[] = dayCatalog.flatMap((d) =>
  (d.exercises ?? []).map((ex, idx) => ({
    id: generateId(),
    workoutDayId: d.id,
    exerciseSlug: ex.slug,
    orderIndex: idx,
    targetSets: ex.sets,
    targetRepsLow: ex.repsLow,
    targetRepsHigh: ex.repsHigh,
    restSeconds: ex.rest,
    notes: ex.notes,
  }))
);
